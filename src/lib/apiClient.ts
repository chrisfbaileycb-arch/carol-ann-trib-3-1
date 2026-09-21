import { getFirebaseAuthToken, getAppCheckToken } from './firebase';

/**
 * Authenticated fetch wrapper for the Carol Ann API.
 *
 * Attaches the signed-in user's Firebase ID token (Bearer) and, when the
 * client has App Check provisioned, the X-Firebase-AppCheck token — so the
 * server's requireFirebaseAuth / verifyAppCheck middleware can verify the
 * caller. Unauthenticated callers simply send no token and receive 401s.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});

  try {
    const idToken = await getFirebaseAuthToken();
    if (idToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${idToken}`);
    }
  } catch {
    // No signed-in user — the request goes out unauthenticated.
  }

  try {
    const appCheckToken = await getAppCheckToken();
    if (appCheckToken && !headers.has('X-Firebase-AppCheck')) {
      headers.set('X-Firebase-AppCheck', appCheckToken);
    }
  } catch {
    // App Check not provisioned — server treats the token as optional
    // unless APP_CHECK_ENFORCED is set.
  }

  return fetch(input, { ...init, headers });
}
