import type { Express } from 'express';
import { getAdminBackend } from '../lib/firebaseAdmin.js';
import { requireFirebaseAuth, verifyAppCheck, type AuthenticatedRequest } from '../middleware/auth.js';
import firebaseConfig from '../../firebase-applet-config.json';

// In-memory workspace cache fallback used when Firestore is unreachable
const localWorkspaceCache = new Map<string, Record<string, unknown>>();

export function registerCloudStateRoutes(app: Express) {
app.get('/api/cloud/state', requireFirebaseAuth, verifyAppCheck, async (req, res) => {
  try {
    const authUser = (req as AuthenticatedRequest).firebaseUser;
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const cleanId = authUser.uid.replace(/[^a-zA-Z0-9_-]/g, '_');
    let state: Record<string, unknown> | null = null;
    let backendUsed = 'local_resilient_cache';

    const backend = getAdminBackend();
    if (backend?.db) {
      try {
        const docSnap = await backend.db.collection('workspaces').doc(cleanId).get();
        if (docSnap.exists) {
          state = (docSnap.data() as Record<string, unknown>) || null;
          backendUsed = 'firebase_admin_firestore';
        }
      } catch (err) {
        console.warn('[Cloud State] Firestore admin read fallback:', err instanceof Error ? err.message : err);
      }
    }

    if (!state) {
      state = localWorkspaceCache.get(cleanId) || null;
    }

    if (state && typeof state === 'object') {
      if (Array.isArray(state.memories)) {
        state.memories = (state.memories as Array<Record<string, unknown>>).filter((m) => {
          const content = String(m?.content || '').toLowerCase();
          const tags = Array.isArray(m?.tags) ? (m.tags as string[]).join(' ').toLowerCase() : '';
          const id = String(m?.id || '').toLowerCase();
          return (
            !id.includes('seed') &&
            !id.includes('fake') &&
            !content.includes('volleyball') &&
            !content.includes('whey') &&
            !tags.includes('volleyball') &&
            !tags.includes('whey')
          );
        });
      }
      if (Array.isArray(state.messages)) {
        state.messages = (state.messages as Array<Record<string, unknown>>).filter((m) => {
          const id = String(m?.id || '').toLowerCase();
          return !id.includes('seed') && !id.includes('fake') && id !== 'msg_init_1' && id !== 'msg_init_2';
        });
      }
    }

    res.json({
      status: 'ok',
      cloudNative: true,
      backend: backendUsed,
      databaseId: firebaseConfig.firestoreDatabaseId,
      state,
      authenticated: true,
    });
  } catch (err: unknown) {
    console.error('[Cloud State Error]', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'State read failure' });
  }
});

// Cloud state sync endpoint backed by Firestore Admin with resilient fallback.
// Requires Firebase Authentication; writes are scoped to the token's UID.
app.post('/api/cloud/sync', requireFirebaseAuth, verifyAppCheck, async (req, res) => {
  try {
    const { state } = req.body;
    if (!state) {
      return res.status(400).json({ error: 'State payload is required.' });
    }

    const authUser = (req as AuthenticatedRequest).firebaseUser;
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const cleanId = authUser.uid.replace(/[^a-zA-Z0-9_-]/g, '_');
    const payload: Record<string, unknown> = {
      ...state,
      userId: cleanId,
      lastSyncedAt: new Date().toISOString(),
    };

    localWorkspaceCache.set(cleanId, payload);
    let backendUsed = 'local_resilient_cache';

    const backend = getAdminBackend();
    if (backend?.db) {
      try {
        const docRef = backend.db.collection('workspaces').doc(cleanId);
        await docRef.set(payload, { merge: true });
        backendUsed = 'firebase_admin_firestore';
      } catch (err) {
        console.warn('[Cloud Sync] Firestore admin write fallback:', err instanceof Error ? err.message : err);
      }
    }

    res.json({
      status: 'ok',
      cloudNative: true,
      backend: backendUsed,
      databaseId: firebaseConfig.firestoreDatabaseId,
      lastSyncedAt: payload.lastSyncedAt,
      authenticated: true,
      recordsCount: {
        memories: Array.isArray(payload.memories) ? payload.memories.length : 0,
        errands: Array.isArray(payload.errands) ? payload.errands.length : 0,
        checkIns: Array.isArray(payload.checkIns) ? payload.checkIns.length : 0,
      },
    });
  } catch (err: unknown) {
    console.error('[Cloud Sync Error]', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Sync write failure' });
  }
});

}
