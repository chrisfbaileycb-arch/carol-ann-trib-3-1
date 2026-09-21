import type { Request, Response, NextFunction } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAppCheck } from 'firebase-admin/app-check';
import { getAdminBackend } from '../lib/firebaseAdmin.js';

export interface AuthenticatedRequest extends Request {
  firebaseUser?: DecodedIdToken | null;
  appCheckValid?: boolean;
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  return token || null;
}

/**
 * Strict Firebase Authentication middleware (fail-closed).
 *
 * - No token            -> 401
 * - Invalid/expired     -> 401
 * - Admin backend down  -> 503 (cannot verify, so deny rather than allow)
 *
 * Apply to every route that spends API quota, touches user data, drives a
 * browser, or claims a connector action.
 */
export async function requireFirebaseAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Sign in and retry.' });
    return;
  }

  const backend = getAdminBackend();
  if (!backend?.auth) {
    res.status(503).json({ error: 'Authentication service unavailable. Try again shortly.' });
    return;
  }

  try {
    authReq.firebaseUser = await backend.auth.verifyIdToken(token);
    next();
  } catch {
    authReq.firebaseUser = null;
    res.status(401).json({ error: 'Invalid or expired session. Sign in again.' });
  }
}

/**
 * Legacy optional-auth middleware. Attaches the decoded user when a valid
 * token is present, but never rejects. Kept for the public /api/health
 * endpoint only — everything else uses requireFirebaseAuth.
 */
export async function optionalFirebaseAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const token = extractBearerToken(req);
  if (!token) {
    authReq.firebaseUser = null;
    next();
    return;
  }
  const backend = getAdminBackend();
  if (backend?.auth) {
    try {
      authReq.firebaseUser = await backend.auth.verifyIdToken(token);
      next();
      return;
    } catch (err: unknown) {
      console.warn('[Firebase Auth] Verification notice:', err instanceof Error ? err.message : err);
    }
  }
  authReq.firebaseUser = null;
  next();
}

/**
 * Firebase App Check verification, wired into the request path.
 *
 * Behavior:
 * - Token present   -> verified via Admin SDK; invalid token -> 401.
 * - Token absent    -> allowed, UNLESS APP_CHECK_ENFORCED=true, then 401.
 *
 * Strict enforcement stays opt-in via env because the web client can only
 * mint tokens once a reCAPTCHA site key is provisioned in
 * firebase-applet-config.json (recaptchaSiteKey is currently empty).
 * Enabling enforcement without that key would lock out the real client.
 */
export async function verifyAppCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const raw = req.headers['x-firebase-appcheck'];
  const token = Array.isArray(raw) ? raw[0] : raw;

  if (!token) {
    authReq.appCheckValid = false;
    if (process.env.APP_CHECK_ENFORCED === 'true') {
      res.status(401).json({ error: 'App Check token required.' });
      return;
    }
    next();
    return;
  }

  const backend = getAdminBackend();
  if (!backend?.app) {
    res.status(503).json({ error: 'App Check service unavailable. Try again shortly.' });
    return;
  }

  try {
    await getAppCheck(backend.app).verifyToken(token);
    authReq.appCheckValid = true;
    next();
  } catch {
    authReq.appCheckValid = false;
    res.status(401).json({ error: 'Invalid App Check token.' });
  }
}
