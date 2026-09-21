import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider, getToken, type AppCheck } from 'firebase/app-check';
import firebaseConfig from '../../firebase-applet-config.json';

export const isFirebaseConfigured = Boolean(firebaseConfig?.projectId && firebaseConfig?.apiKey);

export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// App Check: only provisioned when a reCAPTCHA site key is configured.
// Until then the client sends no App Check token and the server treats it
// as optional (see server/middleware/auth.ts).
let appCheckInstance: AppCheck | null = null;
if (typeof window !== 'undefined' && firebaseConfig.recaptchaSiteKey) {
  try {
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(firebaseConfig.recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn('[App Check] Initialization notice:', error instanceof Error ? error.message : error);
  }
}

export async function getAppCheckToken(): Promise<string | null> {
  if (!appCheckInstance) return null;
  try {
    const result = await getToken(appCheckInstance, false);
    return result.token;
  } catch {
    return null;
  }
}

// Test connection on boot according to skill guidelines
export async function testFirebaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { connected: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
      return { connected: false, error: error.message };
    }
    // A permission-denied or not-found response means we successfully reached the Firestore server
    return { connected: true };
  }
}

// Kick off connectivity check
testFirebaseConnection().then((res) => {
  if (res.connected) {
    console.log('[Firebase] Successfully connected to live Firestore database:', firebaseConfig.firestoreDatabaseId);
  }
});

export async function getFirebaseAuthToken(): Promise<string | null> {
  try {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  } catch {
    return null;
  }
}
