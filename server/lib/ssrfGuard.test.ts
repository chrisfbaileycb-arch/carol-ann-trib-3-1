import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:dns/promises', () => ({
  default: {
    lookup: vi.fn(),
  },
}));

import dns from 'node:dns/promises';
import { assertUrlSafe, createHostAllowCheck, isBlockedIp, SsrfError } from './ssrfGuard.js';

const mockedLookup = dns.lookup as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockedLookup.mockReset();
});

describe('isBlockedIp', () => {
  it.each([
    '127.0.0.1',
    '127.45.67.89',
    '10.0.0.1',
    '172.16.5.4',
    '192.168.1.1',
    '100.64.0.1', // carrier-grade NAT
    '169.254.169.254', // cloud metadata endpoint
    '169.254.10.20', // link-local
    '224.0.0.1', // multicast
    '240.0.0.1', // reserved
    '192.0.2.1', // TEST-NET-1 documentation
    '198.51.100.7', // TEST-NET-2 documentation
    '203.0.113.9', // TEST-NET-3 documentation
    '::1', // IPv6 loopback
    'fe80::1', // IPv6 link-local
    'fc00::1', // IPv6 unique local
    'ff02::1', // IPv6 multicast
    '2001:db8::1', // IPv6 documentation
    '::ffff:127.0.0.1', // IPv4-mapped loopback
    '::ffff:10.1.2.3', // IPv4-mapped private
  ])('blocks restricted address %s', (ip) => {
    expect(isBlockedIp(ip)).toBe(true);
  });

  it.each(['8.8.8.8', '1.1.1.1', '93.184.216.34', '2606:2800:220:1:248:1893:25c8:1946'])(
    'allows public address %s',
    (ip) => {
      expect(isBlockedIp(ip)).toBe(false);
    },
  );
});

describe('assertUrlSafe', () => {
  it('rejects non-http(s) schemes', async () => {
    for (const url of ['ftp://example.com/x', 'file:///etc/passwd', 'javascript:alert(1)', 'data:text/plain,hi']) {
      await expect(assertUrlSafe(url)).rejects.toBeInstanceOf(SsrfError);
    }
  });

  it('rejects URLs with embedded credentials', async () => {
    await expect(assertUrlSafe('https://user:pass@example.com/')).rejects.toThrow(/credentials/i);
  });

  it('rejects localhost and metadata hostnames', async () => {
    for (const url of [
      'http://localhost/',
      'http://localhost:3000/x',
      'https://metadata.google.internal/',
      'http://metadata.google/',
      'http://sub.localhost/',
    ]) {
      await expect(assertUrlSafe(url)).rejects.toBeInstanceOf(SsrfError);
    }
  });

  it('rejects literal restricted IPs', async () => {
    for (const url of [
      'http://127.0.0.1/',
      'http://10.1.2.3/admin',
      'http://192.168.0.1/',
      'http://169.254.169.254/latest/meta-data/',
      'http://[::1]/',
    ]) {
      await expect(assertUrlSafe(url)).rejects.toBeInstanceOf(SsrfError);
    }
  });

  it('rejects hostnames that resolve to restricted addresses', async () => {
    mockedLookup.mockResolvedValue([{ address: '10.9.9.9', family: 4 }]);
    await expect(assertUrlSafe('https://internal.example.com/')).rejects.toThrow(/restricted address/i);
  });

  it('rejects hostnames that fail to resolve', async () => {
    mockedLookup.mockRejectedValue(new Error('ENOTFOUND'));
    await expect(assertUrlSafe('https://no-such-host.invalid/')).rejects.toThrow(/resolve/i);
  });

  it('accepts a public URL whose hostname resolves to a public IP', async () => {
    mockedLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    const check = await assertUrlSafe('https://example.com/page');
    expect(check.hostname).toBe('example.com');
    expect(check.normalizedUrl).toContain('https://example.com/');
  });

  it('returns the validated addresses for a literal public IP', async () => {
    const check = await assertUrlSafe('http://93.184.216.34/admin');
    expect(check.addresses).toEqual(['93.184.216.34']);
    expect(mockedLookup).not.toHaveBeenCalled();
  });

  it('returns every validated address for a resolvable hostname', async () => {
    mockedLookup.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 },
    ]);
    const check = await assertUrlSafe('https://example.com/');
    expect(check.addresses).toEqual(['93.184.216.34', '2606:2800:220:1:248:1893:25c8:1946']);
  });

  it('rejects empty and malformed URLs', async () => {
    await expect(assertUrlSafe('')).rejects.toBeInstanceOf(SsrfError);
    await expect(assertUrlSafe('not a url')).rejects.toBeInstanceOf(SsrfError);
  });
});

describe('createHostAllowCheck', () => {
  it('denies localhost and metadata hosts without DNS', async () => {
    const check = createHostAllowCheck();
    expect(await check('localhost')).toBe(false);
    expect(await check('metadata.google.internal')).toBe(false);
    expect(mockedLookup).not.toHaveBeenCalled();
  });

  it('denies hosts resolving to private IPs and allows public ones', async () => {
    mockedLookup.mockImplementation(async (host: string) => {
      if (host === 'private.example.com') return [{ address: '192.168.9.9', family: 4 }];
      return [{ address: '93.184.216.34', family: 4 }];
    });
    const check = createHostAllowCheck();
    expect(await check('private.example.com')).toBe(false);
    expect(await check('public.example.com')).toBe(true);
  });

  it('denies hosts that fail to resolve', async () => {
    mockedLookup.mockRejectedValue(new Error('ENOTFOUND'));
    const check = createHostAllowCheck();
    expect(await check('missing.example.com')).toBe(false);
  });
});
