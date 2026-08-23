import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface AuthUser {
  id: string;
  email: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    extras?: { name?: string; phone?: string; smsOptIn?: boolean },
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const CRM_SUBSCRIBE = 'https://famous.ai/api/crm/6a8ac654ac78a18463513f96/subscribe';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        const s = data?.session;
        setUser(s?.user ? { id: s.user.id, email: s.user.email ?? null } : null);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? null } : null);
      setLoading(false);
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      extras?: { name?: string; phone?: string; smsOptIn?: boolean },
    ) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: extras?.name ?? '' } },
      });
      if (error) return { error: error.message };

      // Every email captured in this app is registered with the CRM contact list.
      try {
        await fetch(CRM_SUBSCRIBE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name: extras?.name || undefined,
            phone: extras?.phone?.trim() ? extras.phone.trim() : undefined,
            sms_opt_in: extras?.smsOptIn === true,
            source: 'account-signup',
            tags: ['maggie', 'sovereign-os', 'account'],
          }),
        });
      } catch {
        /* signup still succeeds if the CRM is unreachable */
      }

      // Some projects require email confirmation; attempt an immediate session.
      await supabase.auth.signInWithPassword({ email, password }).catch(() => undefined);
      return { error: null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signUp, signOut }),
    [user, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
