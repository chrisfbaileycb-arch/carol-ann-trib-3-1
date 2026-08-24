import React, { useEffect, useState } from 'react';
import { Lock, Loader2, ShieldCheck, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * /reset — landing target for the password-recovery email.
 * The recovery link carries a session (hash or code), so once it is exchanged
 * we can simply call auth.updateUser({ password }).
 */
export const ResetPassword: React.FC = () => {
  const { updatePassword } = useAuth();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;

    const boot = async () => {
      // Newer recovery links use ?code=..., older ones drop tokens in the hash.
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (code && typeof supabase.auth.exchangeCodeForSession === 'function') {
          await supabase.auth.exchangeCodeForSession(code).catch(() => undefined);
        }
      } catch {
        /* fall through to session check */
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setHasSession(!!data?.session);
      } catch {
        if (active) setHasSession(false);
      } finally {
        if (active) setReady(true);
      }
    };

    void boot();
    return () => {
      active = false;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Both passwords must match.');
      return;
    }
    setBusy(true);
    const res = await updatePassword(password);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setDone(true);
    window.setTimeout(() => {
      window.location.href = '/';
    }, 1600);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[#0E0F14] p-5 text-white">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/12 bg-[#15161C] shadow-2xl">
        <div className="flex items-center gap-2.5 border-b border-white/8 px-5 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          <div>
            <p className="font-display text-lg font-semibold">Set a new password</p>
            <p className="text-[11px] text-white/40">Maggie · Sovereign Executive OS</p>
          </div>
        </div>

        {!ready ? (
          <div className="flex items-center gap-2 px-5 py-8 text-sm text-white/45">
            <Loader2 className="h-4 w-4 animate-spin" /> Verifying your recovery link…
          </div>
        ) : done ? (
          <div className="space-y-3 px-5 py-8">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
              <ShieldCheck className="h-4 w-4" /> Password updated.
            </p>
            <p className="text-[12px] leading-relaxed text-white/45">
              Returning you to the command center…
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3 px-5 py-4">
            {!hasSession && (
              <p className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/8 px-3 py-2 text-[11px] leading-relaxed text-amber-200">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                No active recovery session detected. Open the most recent reset link from your email on this device, then
                try again.
              </p>
            )}

            <label className="block text-[10px] uppercase tracking-wider text-white/40">
              New password
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/12 bg-black/30 px-3 py-2.5 focus-within:border-amber-400">
                <Lock className="h-3.5 w-3.5 text-white/25" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  className="flex-1 bg-transparent text-sm normal-case text-white placeholder:text-white/20 outline-none"
                />
              </div>
            </label>

            <label className="block text-[10px] uppercase tracking-wider text-white/40">
              Confirm password
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/12 bg-black/30 px-3 py-2.5 focus-within:border-amber-400">
                <Lock className="h-3.5 w-3.5 text-white/25" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Repeat it"
                  className="flex-1 bg-transparent text-sm normal-case text-white placeholder:text-white/20 outline-none"
                />
              </div>
            </label>

            {error && (
              <p className="rounded-lg border border-rose-400/30 bg-rose-400/8 px-3 py-2 text-[11px] text-rose-300">{error}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Save new password
            </button>

            <a
              href="/"
              className="flex items-center justify-center gap-1 pt-1 text-[11px] text-white/45 underline-offset-2 transition hover:text-white hover:underline"
            >
              Back to the workspace <ArrowRight className="h-3 w-3" />
            </a>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
