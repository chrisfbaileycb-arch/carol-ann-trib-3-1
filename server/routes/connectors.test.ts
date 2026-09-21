import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const verifyIdToken = vi.fn();

vi.mock('../lib/firebaseAdmin.js', () => ({
  getAdminBackend: () => ({ auth: { verifyIdToken }, app: {} }),
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
});

describe('connector routes (simulated)', () => {
  it('requires Firebase authentication', async () => {
    const res = await request(buildApp()).post('/api/connectors/ping').send({});
    expect(res.status).toBe(401);
  });

  it('ping is explicitly simulated and never connected or verified', async () => {
    const res = await request(buildApp())
      .post('/api/connectors/ping')
      .set('Authorization', 'Bearer good-token')
      .send({ connectorId: 'zapier', authState: 'AUTHENTICATED', capabilities: ['x'] });

    expect(res.status).toBe(200);
    expect(res.body.simulated).toBe(true);
    expect(res.body.demo).toBe(true);
    expect(res.body.connected).toBe(false);
    expect(res.body.verified).toBe(false);
    // The server must not echo a client's claim of being authenticated.
    expect(res.body.auth_state).not.toBe('AUTHENTICATED');
    expect(String(res.body.note)).toMatch(/no live service was contacted/i);
  });

  it('execute never claims execution', async () => {
    const res = await request(buildApp())
      .post('/api/connectors/execute')
      .set('Authorization', 'Bearer good-token')
      .send({ connectorId: 'zapier', action: 'sync', params: { a: 1 } });

    expect(res.status).toBe(200);
    expect(res.body.simulated).toBe(true);
    expect(res.body.demo).toBe(true);
    expect(res.body.executed).toBe(false);
    expect(res.body.result.success).toBe(false);
    expect(String(res.body.result.message)).toMatch(/no live service was contacted/i);
  });
});
