import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

const verifyIdToken = vi.fn();
const verifyAppCheckToken = vi.fn();
let backend: { auth: { verifyIdToken: typeof verifyIdToken }; app: object } | null = null;

vi.mock('../lib/firebaseAdmin.js', () => ({
  getAdminBackend: () => backend,
}));

vi.mock('firebase-admin/app-check', () => ({
  getAppCheck: () => ({ verifyToken: verifyAppCheckToken }),
}));

import { requireFirebaseAuth, verifyAppCheck } from './auth.js';

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  } as unknown as Response & { statusCode: number; body: unknown };
  return res;
}

function mockReq(headers: Record<string, string> = {}) {
  return { headers } as unknown as Request;
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.APP_CHECK_ENFORCED;
  backend = { auth: { verifyIdToken }, app: {} };
});

describe('requireFirebaseAuth', () => {
  it('rejects requests with no bearer token (401)', async () => {
    const res = mockRes();
    let nexted = false;
    await requireFirebaseAuth(mockReq(), res, () => {
      nexted = true;
    });
    expect(res.statusCode).toBe(401);
    expect(nexted).toBe(false);
  });

  it('rejects malformed authorization headers (401)', async () => {
    const res = mockRes();
    let nexted = false;
    await requireFirebaseAuth(mockReq({ authorization: 'Token abc' }), res, () => {
      nexted = true;
    });
    expect(res.statusCode).toBe(401);
    expect(nexted).toBe(false);
  });

  it('fails closed with 503 when the auth backend is unavailable', async () => {
    backend = null;
    const res = mockRes();
    let nexted = false;
    await requireFirebaseAuth(mockReq({ authorization: 'Bearer abc' }), res, () => {
      nexted = true;
    });
    expect(res.statusCode).toBe(503);
    expect(nexted).toBe(false);
  });

  it('rejects invalid tokens (401) and never calls next', async () => {
    verifyIdToken.mockRejectedValue(new Error('bad token'));
    const res = mockRes();
    let nexted = false;
    await requireFirebaseAuth(mockReq({ authorization: 'Bearer bad' }), res, () => {
      nexted = true;
    });
    expect(res.statusCode).toBe(401);
    expect(nexted).toBe(false);
  });

  it('attaches the decoded user and calls next for valid tokens', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'user-123' });
    const res = mockRes();
    const req = mockReq({ authorization: 'Bearer good' });
    let nexted = false;
    await requireFirebaseAuth(req, res, () => {
      nexted = true;
    });
    expect(nexted).toBe(true);
    expect((req as unknown as { firebaseUser: { uid: string } }).firebaseUser.uid).toBe('user-123');
  });
});

describe('verifyAppCheck', () => {
  it('allows missing tokens when enforcement is off', async () => {
    const res = mockRes();
    let nexted = false;
    await verifyAppCheck(mockReq(), res, () => {
      nexted = true;
    });
    expect(nexted).toBe(true);
  });

  it('rejects missing tokens when APP_CHECK_ENFORCED=true', async () => {
    process.env.APP_CHECK_ENFORCED = 'true';
    const res = mockRes();
    let nexted = false;
    await verifyAppCheck(mockReq(), res, () => {
      nexted = true;
    });
    expect(res.statusCode).toBe(401);
    expect(nexted).toBe(false);
  });

  it('fails closed with 503 when a token is supplied but the backend is down', async () => {
    backend = null;
    const res = mockRes();
    let nexted = false;
    await verifyAppCheck(mockReq({ 'x-firebase-appcheck': 'tok' }), res, () => {
      nexted = true;
    });
    expect(res.statusCode).toBe(503);
    expect(nexted).toBe(false);
  });

  it('rejects invalid App Check tokens (401)', async () => {
    verifyAppCheckToken.mockRejectedValue(new Error('bad appcheck'));
    const res = mockRes();
    let nexted = false;
    await verifyAppCheck(mockReq({ 'x-firebase-appcheck': 'bad' }), res, () => {
      nexted = true;
    });
    expect(res.statusCode).toBe(401);
    expect(nexted).toBe(false);
  });

  it('accepts valid App Check tokens', async () => {
    verifyAppCheckToken.mockResolvedValue({ appId: 'app-1' });
    const res = mockRes();
    const req = mockReq({ 'x-firebase-appcheck': 'good' });
    let nexted = false;
    await verifyAppCheck(req, res, () => {
      nexted = true;
    });
    expect(nexted).toBe(true);
    expect((req as unknown as { appCheckValid: boolean }).appCheckValid).toBe(true);
  });
});
