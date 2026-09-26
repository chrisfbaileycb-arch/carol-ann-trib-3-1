import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockGetFirebaseAuthToken = vi.fn();
const mockGetAppCheckToken = vi.fn();

vi.mock('./firebase', () => ({
  getFirebaseAuthToken: () => mockGetFirebaseAuthToken(),
  getAppCheckToken: () => mockGetAppCheckToken(),
}));

import { apiFetch } from './apiClient';

describe('apiClient Authentication & Network Integrity', () => {
  const originalFetch = globalThis.fetch;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('fails closed immediately with local 401 guard when session token is missing on secure route', async () => {
    mockGetFirebaseAuthToken.mockResolvedValue(null);

    const res = await apiFetch('/api/workflow/execute', {
      method: 'POST',
      body: JSON.stringify({ category: 'errand' }),
    });

    // Request must fail locally with 401
    expect(res.status).toBe(401);
    expect(res.statusText).toBe('Unauthorized');

    const body = await res.json();
    expect(body.error).toMatch(/Authentication required/i);
    expect(body.isMock).toBe(false);

    // CRITICAL: Must NOT dispatch unauthenticated network request over the wire
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('appends Bearer session token to Authorization header for authenticated requests', async () => {
    mockGetFirebaseAuthToken.mockResolvedValue('mock-session-jwt-token-999');

    const res = await apiFetch('/api/workflow/execute', {
      method: 'POST',
      body: JSON.stringify({ category: 'errand' }),
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe('/api/workflow/execute');

    const headers = calledInit.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer mock-session-jwt-token-999');
    expect(res.status).toBe(200);
  });

  it('allows public health endpoint without requiring an active session token', async () => {
    mockGetFirebaseAuthToken.mockResolvedValue(null);

    const res = await apiFetch('/api/health');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe('/api/health');
    expect(res.status).toBe(200);
  });

  it('appends X-Firebase-AppCheck header when provisioned', async () => {
    mockGetFirebaseAuthToken.mockResolvedValue('token-123');
    mockGetAppCheckToken.mockResolvedValue('app-check-token-456');

    await apiFetch('/api/gemini/chat', { method: 'POST' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, calledInit] = fetchSpy.mock.calls[0];
    const headers = calledInit.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer token-123');
    expect(headers.get('X-Firebase-AppCheck')).toBe('app-check-token-456');
  });
});
