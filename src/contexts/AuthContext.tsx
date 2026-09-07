import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { setBusUser } from '@/lib/realtimeBus';

export interface AuthUser {
  id: string;
  email: string | null;
  name: string;
  photoURL?: string | null;
}

export const LEDGER_COLLECTIONS = [
  'messages',
  'checkins',
  'memories',
  'errands',
  'connectors',
  'scheduled_commands',
] as const;

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    extras?: { name?: string; phone?: string; smsOptIn?: boolean },
  ) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  updateAccount: (patch: { name?: string; email?: string }) => Promise<{ error: string | null; notice?: string }>;
  deleteLedger: () => Promise<{ error: string | null; deleted: number }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const toUser = (u: FirebaseUser | null): AuthUser | null =>
  u
    ? {
        id: u.uid,
        email: u.email ?? null,
        name: u.displayName || u.email?.split('@')[0] || 'Operator',
        photoURL: u.photoURL,
      }
    : null;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const mapped = toUser(firebaseUser);
        setUser(mapped);
        // Ensure user document exists in Firestore
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          await setDoc(
            userRef,
            {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || mapped?.name || '',
              photoURL: firebaseUser.photoURL || '',
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (e) {
          console.warn('[Firebase Auth] User profile sync warning:', e);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Attach the account to the cross-device event relay
  useEffect(() => {
    setBusUser(user?.id ?? null);
  }, [user?.id]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to sign in.' };
    }
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      extras?: { name?: string; phone?: string; smsOptIn?: boolean },
    ) => {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (extras?.name && cred.user) {
          await updateProfile(cred.user, { displayName: extras.name });
          const userRef = doc(db, 'users', cred.user.uid);
          await setDoc(userRef, {
            id: cred.user.uid,
            email: cred.user.email || '',
            displayName: extras.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        return { error: null };
      } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : 'Failed to register account.' };
      }
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      return { error: null };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'Google sign-in is unavailable right now.' };
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'Could not send the reset link.' };
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    try {
      if (!auth.currentUser) return { error: 'Not authenticated.' };
      await firebaseUpdatePassword(auth.currentUser, password);
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to update password.' };
    }
  }, []);

  const updateAccount = useCallback(
    async (patch: { name?: string; email?: string }) => {
      if (!auth.currentUser) return { error: 'Not authenticated.' };
      try {
        if (patch.name) {
          await updateProfile(auth.currentUser, { displayName: patch.name });
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await setDoc(userRef, { displayName: patch.name, updatedAt: new Date().toISOString() }, { merge: true });
        }
        setUser(toUser(auth.currentUser));
        return { error: null, notice: 'Account details saved.' };
      } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : 'Failed to update account.' };
      }
    },
    [],
  );

  const deleteLedger = useCallback(async () => {
    if (!user) return { error: 'You must be signed in.', deleted: 0 };
    let deleted = 0;
    let failure: string | null = null;

    try {
      const batch = writeBatch(db);

      for (const collName of LEDGER_COLLECTIONS) {
        const collRef = collection(db, 'users', user.id, collName);
        const snap = await getDocs(collRef);
        snap.forEach((d) => {
          batch.delete(d.ref);
          deleted++;
        });
      }

      // Delete workspace document
      const wsRef = doc(db, 'workspaces', user.id);
      batch.delete(wsRef);

      // Delete user document
      const userRef = doc(db, 'users', user.id);
      batch.delete(userRef);

      await batch.commit();
    } catch (e: unknown) {
      failure = e instanceof Error ? e.message : 'Could not clear cloud ledger.';
    }

    return { error: failure, deleted };
  }, [user]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setBusUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      requestPasswordReset,
      updatePassword,
      updateAccount,
      deleteLedger,
      signOut,
    }),
    [user, loading, signIn, signUp, signInWithGoogle, requestPasswordReset, updatePassword, updateAccount, deleteLedger, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
