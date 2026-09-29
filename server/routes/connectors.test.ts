import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const verifyIdToken = vi.fn();

vi.mock('../lib/firebaseAdmin.js', () => ({
  getAdminBackend: () => ({ auth: { verifyIdToken }, app: {} }),
}));

vi.mock('node:dns/promises', () => ({
  default: {
    lookup: vi.fn().mockImplementation((host: string) => {
      if (host === '127.0.0.1' || host.includes('localhost')) {
        return Promise.resolve([{ address: '127.0.0.1', family: 4 }]);
      }
      return Promise.resolve([{ address: '93.184.216.34', family: 4 }]);
    }),
  },
}));

import { registerConnectorRoutes } from './connectors.js';

function buildApp() {
  const app = express();
  app.use(express.json());
  registerConnectorRoutes(app);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
  verifyIdToken.mockResolvedValue({ uid: 'user-123' });
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ status: 'active', data: { echo: true } }),
    })
  );
});

describe('connector routes (live)', () => {
  it('requires Firebase authentication', async () => {
    const res = await request(buildApp()).post('/api/connectors/ping').send({});
    expect(res.status).toBe(401);
  });

  it('ping performs live connector verification and reports connected/verified', async () => {
    const res = await request(buildApp())
      .post('/api/connectors/ping')
      .set('Authorization', 'Bearer good-token')
      .send({ connectorId: 'github', capabilities: ['repo_query'] });

    expect(res.status).toBe(200);
    expect(res.body.connected).toBe(true);
    expect(res.body.verified).toBe(true);
    expect(res.body.status).toBe('connected');
    expect(res.body.protocol).toBe('mcp-2024-11-05');
    expect(typeof res.body.latencyMs).toBe('number');
  });

  it('ping blocks SSRF attempts against private or local networks', async () => {
    const res = await request(buildApp())
      .post('/api/connectors/ping')
      .set('Authorization', 'Bearer good-token')
      .send({ connectorId: 'custom', endpointUrl: 'http://127.0.0.1:8080/admin' });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error?.code).toBe('SSRF_BLOCKED');
  });

  it('execute executes action and returns verified receipt', async () => {
    const res = await request(buildApp())
      .post('/api/connectors/execute')
      .set('Authorization', 'Bearer good-token')
      .send({ connectorId: 'slack', action: 'send_message', params: { channel: '#general', text: 'Hello' } });

    expect(res.status).toBe(200);
    expect(res.body.executed).toBe(true);
    expect(res.body.status).toBe('executed');
    expect(res.body.result.success).toBe(true);
    expect(res.body.receiptId).toMatch(/^EXEC-SLACK-/);
  });

  it('execute handles external endpoint failure with structured error details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 500,
        ok: false,
        json: async () => ({ error: 'Internal Server Error on Vendor API' }),
      })
    );

    const res = await request(buildApp())
      .post('/api/connectors/execute')
      .set('Authorization', 'Bearer good-token')
      .send({ connectorId: 'salesforce', action: 'query_leads' });

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.status).toBe('failed');
    expect(res.body.result.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('EXTERNAL_CALL_FAILED');
  });
});
