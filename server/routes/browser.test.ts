import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const { launchMock } = vi.hoisted(() => ({ launchMock: vi.fn() }));
const { lookupMock } = vi.hoisted(() => ({ lookupMock: vi.fn() }));

vi.mock('playwright', () => ({ chromium: { launch: launchMock } }));
vi.mock('node:dns/promises', () => ({ default: { lookup: lookupMock } }));

const verifyIdToken = vi.fn();
vi.mock('../lib/firebaseAdmin.js', () => ({
  getAdminBackend: () => ({ auth: { verifyIdToken }, app: {} }),
}));

import { registerBrowserRoutes } from './browser.js';

function buildApp() {
  const app = express();
  app.use(express.json());
  registerBrowserRoutes(app);
  return app;
}

function fakeBrowser() {
  const page = {
    goto: vi.fn().mockResolvedValue(undefined),
    url: () => 'https://example.com/',
    title: vi.fn().mockResolvedValue('Example'),
    evaluate: vi.fn().mockResolvedValue('page text'),
    screenshot: vi.fn().mockResolvedValue(Buffer.from('fake-png')),
  };
  const context = {
    route: vi.fn().mockResolvedValue(undefined),
    newPage: vi.fn().mockResolvedValue(page),
  };
  return {
    newContext: vi.fn().mockResolvedValue(context),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  verifyIdToken.mockResolvedValue({ uid: 'user-123' });
  launchMock.mockResolvedValue(fakeBrowser());
});

const authed = (app: express.Express, path: string, body: object) =>
  request(app).post(path).set('Authorization', 'Bearer <redacted>').send(body);

describe('browser routes — DNS pinning', () => {
  it('/api/browser/run launches Chromium with a pinned resolver rule for the resolved IPv4', async () => {
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    const res = await authed(buildApp(), '/api/browser/run', { url: 'https://example.com/' });
    expect(res.status).toBe(200);
    expect(launchMock).toHaveBeenCalledTimes(1);
    expect(launchMock.mock.calls[0][0].args).toEqual([
      '--host-resolver-rules=MAP example.com 93.184.216.34',
    ]);
  });

  it('/api/browser/screenshot pins the same way', async () => {
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    const res = await authed(buildApp(), '/api/browser/screenshot', { url: 'https://example.com/' });
    expect(res.status).toBe(200);
    expect(launchMock.mock.calls[0][0].args).toEqual([
      '--host-resolver-rules=MAP example.com 93.184.216.34',
    ]);
  });

  it('prefers the IPv4 address when the hostname resolves to both families', async () => {
    lookupMock.mockResolvedValue([
      { address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 },
      { address: '93.184.216.34', family: 4 },
    ]);
    const res = await authed(buildApp(), '/api/browser/run', { url: 'https://example.com/' });
    expect(res.status).toBe(200);
    expect(launchMock.mock.calls[0][0].args).toEqual([
      '--host-resolver-rules=MAP example.com 93.184.216.34',
    ]);
  });

  it('brackets an IPv6-only pinned address', async () => {
    lookupMock.mockResolvedValue([{ address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 }]);
    const res = await authed(buildApp(), '/api/browser/run', { url: 'https://example.com/' });
    expect(res.status).toBe(200);
    expect(launchMock.mock.calls[0][0].args).toEqual([
      '--host-resolver-rules=MAP example.com [2606:2800:220:1:248:1893:25c8:1946]',
    ]);
  });

  it('pins a literal-IP target to itself', async () => {
    const res = await authed(buildApp(), '/api/browser/run', { url: 'http://93.184.216.34/' });
    expect(res.status).toBe(200);
    expect(launchMock.mock.calls[0][0].args).toEqual([
      '--host-resolver-rules=MAP 93.184.216.34 93.184.216.34',
    ]);
  });
});
