import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, type Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const isFirebaseConfigured = Boolean(firebaseConfig?.projectId && firebaseConfig?.apiKey);

export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

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
