import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { setBusUser } from '@/lib/realtimeBus';

export interface AuthUser {
  id: string;
  email: string | null;
  name: string;
}

/** Every table that carries per-user rows for this ledger. */
export const LEDGER_TABLES = [
  'conversation_messages',
  'check_ins',
  'memories',
  'errand_tasks',
  'my_day_sessions',
  'maggie_users',
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

const CRM_SUBSCRIBE = 'https://famous.ai/api/crm/6a8ac654ac78a18463513f96/subscribe';

const toUser = (u: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null | undefined): AuthUser | null =>
  u
    ? {
        id: u.id,
        email: u.email ?? null,
        name: typeof u.user_metadata?.name === 'string' ? (u.user_metadata.name as string) : '',
      }
    : null;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setUser(toUser(data?.session?.user));
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toUser(session?.user));
      setLoading(false);
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  // Attach the account to the cross-device event relay.
  useEffect(() => {
    setBusUser(user?.id ?? null);
  }, [user?.id]);

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

  const signInWithGoogle = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      });
      return { error: error ? error.message : null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Google sign-in is unavailable right now.' };
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset`,
      });
      return { error: error ? error.message : null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Could not send the reset link.' };
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? error.message : null };
  }, []);

  const updateAccount = useCallback(
    async (patch: { name?: string; email?: string }) => {
      const payload: { email?: string; data?: Record<string, unknown> } = {};
      if (typeof patch.name === 'string') payload.data = { name: patch.name };
      const emailChanged = !!patch.email && patch.email !== user?.email;
      if (emailChanged) payload.email = patch.email;

      const { data, error } = await supabase.auth.updateUser(payload);
      if (error) return { error: error.message };
      if (data?.user) setUser(toUser(data.user));

      // Keep the mirrored profile row in step with the account record.
      if (user) {
        try {
          await supabase
            .from('maggie_users')
            .update({ name: patch.name ?? user.name, email: patch.email ?? user.email })
            .eq('user_id', user.id);
        } catch {
          /* profile mirror is best-effort */
        }
      }

      return {
        error: null,
        notice: emailChanged
          ? 'Check your new inbox to confirm the address change.'
          : 'Account details saved.',
      };
    },
    [user],
  );

  const deleteLedger = useCallback(async () => {
    if (!user) return { error: 'You must be signed in.', deleted: 0 };
    let deleted = 0;
    let failure: string | null = null;

    for (const table of LEDGER_TABLES) {
      try {
        const { error } = await supabase.from(table).delete().eq('user_id', user.id);
        if (error) failure = error.message;
        else deleted += 1;
      } catch (e) {
        failure = e instanceof Error ? e.message : `Could not clear ${table}.`;
      }
    }

    // The relay ledger and saved shortcuts are part of the cloud footprint too.
    try {
      await supabase.from('bus_events').delete().eq('user_id', user.id);
      await supabase.from('saved_commands').delete().eq('user_id', user.id);
    } catch {
      /* best-effort */
    }


    return { error: failure, deleted };
  }, [user]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
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
