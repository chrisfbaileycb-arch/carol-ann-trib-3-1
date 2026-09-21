import type { Express } from 'express';
import net from 'node:net';
import { chromium } from 'playwright';
import { requireFirebaseAuth, verifyAppCheck } from '../middleware/auth.js';
import { assertUrlSafe, createHostAllowCheck, SsrfError } from '../lib/ssrfGuard.js';

/**
 * Pin Chromium's DNS resolution for the guarded top-level hostname to the IP
 * addresses the SSRF guard already vetted. Without this, Chromium would
 * resolve the hostname independently and a DNS-rebinding record (public IP to
 * the guard, restricted IP to Chromium) or a short-TTL flip could bypass the
 * guard. The URL, Host header, and TLS SNI are unchanged — only resolution is
 * remapped — so HTTPS certificate validation still works.
 *
 * Known residual: this pins only the attacker-controlled top-level URL.
 * Subresource hosts a page loads (<img>, fetch, etc.) are still re-resolved
 * by Chromium and screened (not pinned) by the route interception below.
 * Fully closing that needs per-host pinning of every subresource
 * (fetch-and-fulfill in the route handler, or a controlled forward proxy) —
 * tracked as follow-up work, not claimed as solved here.
 */
function buildPinnedLaunchArgs(hostname: string, addresses: string[]): string[] {
  const pinned = addresses.find((a) => net.isIP(a) === 4) ?? addresses[0];
  const pinRepl = net.isIP(pinned) === 6 ? `[${pinned}]` : pinned;
  return [`--host-resolver-rules=MAP ${hostname} ${pinRepl}`];
}

export function registerBrowserRoutes(app: Express) {
// Browser automation: run a navigation / DOM task.
// Requires Firebase Authentication. Target URLs are screened by the SSRF
// guard: only public http(s) hosts, redirect chains re-validated, and every
// request (including subresources) intercepted and checked.
app.post('/api/browser/run', requireFirebaseAuth, verifyAppCheck, async (req, res) => {
  const { url, waitFor } = req.body as { url?: string; waitFor?: string };
  if (!url) {
    return res.status(400).json({ error: 'URL is required.' });
  }

  let safeUrl: string;
  let launchArgs: string[];
  try {
    const check = await assertUrlSafe(url);
    safeUrl = check.normalizedUrl;
    launchArgs = buildPinnedLaunchArgs(check.hostname, check.addresses);
  } catch (err) {
    return res
      .status(err instanceof SsrfError ? err.statusCode : 400)
      .json({ error: err instanceof Error ? err.message : 'URL rejected.' });
  }

  const isHostAllowed = createHostAllowCheck();
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: launchArgs });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.route('**/*', async (route) => {
      try {
        const target = new URL(route.request().url());
        if (await isHostAllowed(target.hostname)) {
          await route.continue();
        } else {
          await route.abort('blockedbyclient');
        }
      } catch {
        await route.abort('blockedbyclient');
      }
    });
    const page = await context.newPage();
    await page.goto(safeUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Re-validate the final URL — catches redirect chains into restricted hosts.
    try {
      await assertUrlSafe(page.url());
    } catch (err) {
      await browser.close();
      return res
        .status(err instanceof SsrfError ? err.statusCode : 400)
        .json({ error: 'Navigation redirected to a restricted address.' });
    }

    if (waitFor) {
      await page.waitForSelector(waitFor, { timeout: 15000 }).catch(() => undefined);
    }

    const title = await page.title().catch(() => '');
    const text = await page.evaluate(() => document.body?.innerText?.slice(0, 4000) || '');
    const pageUrl = page.url();

    await browser.close();
    return res.json({
      ok: true,
      url: pageUrl,
      title,
      text,
      source: 'playwright',
    });
  } catch (error) {
    if (browser) await browser.close().catch(() => undefined);
    console.error('Error in /api/browser/run:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Browser run failed',
    });
  }
});

// Browser automation: capture a screenshot.
// Requires Firebase Authentication; same SSRF screening as /api/browser/run.
app.post('/api/browser/screenshot', requireFirebaseAuth, verifyAppCheck, async (req, res) => {
  const { url, fullPage } = req.body as { url?: string; fullPage?: boolean };
  if (!url) {
    return res.status(400).json({ error: 'URL is required.' });
  }

  let safeUrl: string;
  let launchArgs: string[];
  try {
    const check = await assertUrlSafe(url);
    safeUrl = check.normalizedUrl;
    launchArgs = buildPinnedLaunchArgs(check.hostname, check.addresses);
  } catch (err) {
    return res
      .status(err instanceof SsrfError ? err.statusCode : 400)
      .json({ error: err instanceof Error ? err.message : 'URL rejected.' });
  }

  const isHostAllowed = createHostAllowCheck();
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: launchArgs });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.route('**/*', async (route) => {
      try {
        const target = new URL(route.request().url());
        if (await isHostAllowed(target.hostname)) {
          await route.continue();
        } else {
          await route.abort('blockedbyclient');
        }
      } catch {
        await route.abort('blockedbyclient');
      }
    });
    const page = await context.newPage();
    await page.goto(safeUrl, { waitUntil: 'networkidle', timeout: 30000 });

    try {
      await assertUrlSafe(page.url());
    } catch (err) {
      await browser.close();
      return res
        .status(err instanceof SsrfError ? err.statusCode : 400)
        .json({ error: 'Navigation redirected to a restricted address.' });
    }
    const screenshot = await page.screenshot({ fullPage: Boolean(fullPage), type: 'png' });
    await browser.close();
    return res.json({
      ok: true,
      url: page.url(),
      image: screenshot.toString('base64'),
      mimeType: 'image/png',
      source: 'playwright',
    });
  } catch (error) {
    if (browser) await browser.close().catch(() => undefined);
    console.error('Error in /api/browser/screenshot:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Screenshot failed',
    });
  }
});

}
