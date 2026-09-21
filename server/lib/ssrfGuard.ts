import dns from 'node:dns/promises';
import net from 'node:net';

/**
 * SSRF guard for the browser-automation routes.
 *
 * A target URL is allowed only when:
 *  - it uses http or https,
 *  - it carries no embedded credentials,
 *  - its hostname is not a known-local name, and
 *  - every IP the hostname resolves to is a public, routable address.
 *
 * This blocks the classic SSRF targets: loopback, RFC-1918 private ranges,
 * link-local (incl. the 169.254.169.254 cloud metadata endpoint), multicast,
 * reserved / documentation ranges, and the GCP metadata hostnames.
 */

export class SsrfError extends Error {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'SsrfError';
  }
}

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata.google.internal', 'metadata.google']);

function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, '');
  if (BLOCKED_HOSTNAMES.has(h)) return true;
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  return false;
}

// IPv4 CIDRs that must never be fetched server-side.
const BLOCKED_V4: Array<[number, number]> = [
  '0.0.0.0/8',
  '10.0.0.0/8',
  '100.64.0.0/10',
  '127.0.0.0/8',
  '169.254.0.0/16', // link-local incl. cloud metadata endpoints
  '172.16.0.0/12',
  '192.0.0.0/24',
  '192.0.2.0/24', // TEST-NET-1 (documentation)
  '192.88.99.0/24', // 6to4 relay (deprecated)
  '192.168.0.0/16',
  '198.18.0.0/15', // benchmark testing
  '198.51.100.0/24', // TEST-NET-2
  '203.0.113.0/24', // TEST-NET-3
  '224.0.0.0/4', // multicast
  '240.0.0.0/4', // reserved
].map((cidr) => {
  const [addr, bits] = cidr.split('/');
  const ip = addr.split('.').reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0;
  const mask = bits === '0' ? 0 : (~0 << (32 - Number(bits))) >>> 0;
  return [ip & mask, mask] as [number, number];
});

function ipv4ToInt(ip: string): number | null {
  if (net.isIP(ip) !== 4) return null;
  return ip.split('.').reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0;
}

function isBlockedV4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n === null) return true;
  return BLOCKED_V4.some(([netAddr, mask]) => (n & mask) === netAddr);
}

// IPv6 prefixes that must never be fetched server-side.
const BLOCKED_V6: Array<[bigint, number]> = (
  [
    '::1/128', // loopback
    '::/128', // unspecified
    '64:ff9b::/96', // IPv4/IPv6 translation
    '100::/64', // discard
    '2001::/23', // special purpose (incl. TEREDO 2001::/32)
    '2001:db8::/32', // documentation
    'fc00::/7', // unique local
    'fe80::/10', // link-local
    'ff00::/8', // multicast
  ] as const
).map((cidr) => {
  const [addr, bits] = cidr.split('/');
  return [expandV6(addr), Number(bits)] as [bigint, number];
});

function expandV6(ip: string): bigint {
  // Expand any :: shorthand, then fold 8 hextets into a 128-bit int.
  const halves = ip.split('::');
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves[1] ? halves[1].split(':') : [];
  // Handle embedded IPv4 (e.g. ::ffff:192.0.2.1)
  const normalize = (parts: string[]): string[] => {
    const out: string[] = [];
    for (const p of parts) {
      if (p.includes('.')) {
        const n = ipv4ToInt(p);
        if (n === null) throw new Error('bad ipv6');
        out.push(((n >>> 16) & 0xffff).toString(16), (n & 0xffff).toString(16));
      } else {
        out.push(p);
      }
    }
    return out;
  };
  const h = normalize(head);
  const t = normalize(tail);
  const zeros = new Array(8 - h.length - t.length).fill('0');
  const full = [...h, ...zeros, ...t];
  return full.reduce((acc, hextet) => (acc << 16n) + BigInt(parseInt(hextet || '0', 16)), 0n);
}

function isBlockedV6(ip: string): boolean {
  const addr = ip.toLowerCase();
  // IPv4-mapped IPv6 (::ffff:a.b.c.d) — judge by the embedded IPv4 address.
  const mapped = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedV4(mapped[1]);
  let n: bigint;
  try {
    n = expandV6(addr);
  } catch {
    return true;
  }
  return BLOCKED_V6.some(([prefix, bits]) => {
    if (bits === 0) return true;
    const shift = 128n - BigInt(bits);
    return (n >> shift) === (prefix >> shift);
  });
}

/** True when the literal IP address must never be fetched server-side. */
export function isBlockedIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return isBlockedV4(ip);
  if (version === 6) return isBlockedV6(ip);
  return true; // not an IP at all -> block
}

export interface UrlCheck {
  normalizedUrl: string;
  hostname: string;
  /** Exact IPs validated by the guard — callers must pin connections to these. */
  addresses: string[];
}

/**
 * Validate a user-supplied URL for server-side fetching.
 * Returns the normalized URL, or throws SsrfError.
 */
export async function assertUrlSafe(rawUrl: string): Promise<UrlCheck> {
  const input = String(rawUrl || '').trim();
  if (!input) throw new SsrfError('URL is required.');
  if (input.length > 2048) throw new SsrfError('URL is too long.');

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new SsrfError('Invalid URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SsrfError('Only http and https URLs are allowed.');
  }
  if (url.username || url.password) {
    throw new SsrfError('URLs with embedded credentials are not allowed.');
  }
  const hostname = url.hostname
    .toLowerCase()
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .replace(/\.$/, '');
  if (!hostname) throw new SsrfError('URL must include a hostname.');
  if (isBlockedHostname(hostname)) {
    throw new SsrfError('That host is not allowed.');
  }
  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) throw new SsrfError('That address is not allowed.');
    return { normalizedUrl: url.toString(), hostname, addresses: [hostname] };
  }

  let addresses: dns.LookupAddress[];
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    throw new SsrfError('Could not resolve that hostname.');
  }
  if (addresses.length === 0) throw new SsrfError('Could not resolve that hostname.');
  for (const a of addresses) {
    if (isBlockedIp(a.address)) {
      throw new SsrfError('That host resolves to a restricted address.');
    }
  }
  return { normalizedUrl: url.toString(), hostname, addresses: addresses.map((a) => a.address) };
}

/**
 * Build an async per-hostname allow-check for Playwright request
 * interception, so redirect chains and subresource loads are screened too.
 * Results are cached per hostname (bounded).
 */
export function createHostAllowCheck(): (hostname: string) => Promise<boolean> {
  const cache = new Map<string, boolean>();
  return async (hostname: string): Promise<boolean> => {
    const key = hostname.toLowerCase().replace(/^\[/, '').replace(/\]$/, '');
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    let ok = false;
    if (!isBlockedHostname(key)) {
      if (net.isIP(key)) {
        ok = !isBlockedIp(key);
      } else {
        try {
          const addresses = await dns.lookup(key, { all: true });
          ok = addresses.length > 0 && addresses.every((a) => !isBlockedIp(a.address));
        } catch {
          ok = false;
        }
      }
    }
    if (cache.size > 1000) cache.clear();
    cache.set(key, ok);
    return ok;
  };
}
