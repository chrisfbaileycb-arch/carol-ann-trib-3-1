import { initializeApp, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export interface AdminBackend {
  app: App;
  db: Firestore;
  auth: Auth;
}

// Lazy Firebase Admin SDK initialization.
// Returns null when the project is not configured — callers must treat
// a null backend as "authentication unavailable" and fail closed.
let adminAppInstance: App | null = null;
let adminFirestoreInstance: Firestore | null = null;
let adminAuthInstance: Auth | null = null;
let adminInitAttempted = false;

export function getAdminBackend(): AdminBackend | null {
  if (adminInitAttempted) {
    if (adminAppInstance && adminFirestoreInstance && adminAuthInstance) {
      return { app: adminAppInstance, db: adminFirestoreInstance, auth: adminAuthInstance };
    }
    return null;
  }
  adminInitAttempted = true;
  try {
    const existingApps = getApps();
    if (existingApps.length > 0 && existingApps[0]) {
      adminAppInstance = existingApps[0];
    } else if (firebaseConfig.projectId) {
      adminAppInstance = initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
    if (adminAppInstance) {
      adminFirestoreInstance =
        firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
          ? getFirestore(adminAppInstance, firebaseConfig.firestoreDatabaseId)
          : getFirestore(adminAppInstance);
      adminAuthInstance = getAuth(adminAppInstance);
      return { app: adminAppInstance, db: adminFirestoreInstance, auth: adminAuthInstance };
    }
  } catch (err) {
    console.warn(
      '[Firebase Admin] Initialization notice (authentication unavailable):',
      err instanceof Error ? err.message : err,
    );
  }
  return null;
}

/** Test-only reset for the lazy singleton. */
export function __resetAdminBackendForTests(): void {
  adminAppInstance = null;
  adminFirestoreInstance = null;
  adminAuthInstance = null;
  adminInitAttempted = false;
}
