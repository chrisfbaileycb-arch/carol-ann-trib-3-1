import { getFirebaseAuthToken, getAppCheckToken } from './firebase';

export interface ApiFetchOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * List of publicly accessible routes that do not require an active session token.
 * All other /api/* routes are secure routes that require authentication.
 */
function isPublicEndpoint(url: string): boolean {
  if (url === '/api/health' || url.startsWith('/api/health?')) return true;
  if (url === '/api/gemini/chat' || url.startsWith('/api/gemini/chat?')) return true;
  if (url === '/api/gemini/chat/stream' || url.startsWith('/api/gemini/chat/stream?')) return true;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      if (parsed.pathname === '/api/health' || parsed.pathname === '/api/gemini/chat') return true;
      if (!parsed.pathname.startsWith('/api/')) return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Authenticated fetch wrapper for the Carol Ann API.
 *
 * Strict Systems Integrity Invariants:
 * 1. Appends the active session token on every secure request:
 *    `headers: { 'Authorization': `Bearer ${token}` }`
 * 2. Fail-Closed Guard: If an active session token is missing for a secure route,
 *    fails-closed immediately with a local 401 Response rather than sending
 *    unauthenticated network packets over the wire.
 * 3. Never swap authenticated fetch abstractions for bare fetch() calls.
 * 4. Appends X-Firebase-AppCheck token when provisioned.
 */
export async function apiFetch(input: string, init: ApiFetchOptions = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const isSecure = !isPublicEndpoint(input) && init.requireAuth !== false;

  let idToken: string | null = null;
  try {
    idToken = await getFirebaseAuthToken();
  } catch (err) {
    console.warn('[apiFetch] Could not retrieve session token:', err);
    idToken = null;
  }

  // If a valid ID token is available, always set the Authorization Bearer header
  if (idToken) {
    headers.set('Authorization', `Bearer ${idToken}`);
  } else if (headers.has('Authorization')) {
    const existing = headers.get('Authorization') || '';
    if (existing.startsWith('Bearer ') && existing.slice(7).trim()) {
      idToken = existing.slice(7).trim();
    }
  }

  // Local 401 Fail-Closed Guard:
  // If this is a secure route and there is no active session token, fail-closed
  // immediately without sending an unauthenticated network request over the wire.
  if (isSecure && !idToken) {
    console.warn(`[apiFetch] Local 401 Guard: Active session token missing for secure route "${input}". Request blocked before dispatch.`);
    return new Response(
      JSON.stringify({
        error: 'Authentication required. Active session token missing (local 401 guard).',
        isMock: false,
        status: 401,
      }),
      {
        status: 401,
        statusText: 'Unauthorized',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const appCheckToken = await getAppCheckToken();
    if (appCheckToken && !headers.has('X-Firebase-AppCheck')) {
      headers.set('X-Firebase-AppCheck', appCheckToken);
    }
  } catch {
    // App Check optional unless enforced
  }

  return fetch(input, { ...init, headers });
}
