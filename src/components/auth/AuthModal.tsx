import React, { useState } from 'react';
import { X, Loader2, Mail, Lock, User, Phone, ShieldCheck, Sparkles, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import GoogleButton from '@/components/auth/GoogleButton';

type Mode = 'signin' | 'signup' | 'forgot';

export const AuthModal: React.FC<{ open: boolean; onClose: () => void; initialMode?: Mode }> = ({
  open,
  onClose,
  initialMode = 'signin',
}) => {
  const { signIn, signUp, signInWithGoogle, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  if (!open) return null;

  const swap = (next: Mode) => {
    setMode(next);
    setError('');
    setNotice('');
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleGoogle = async () => {
    setError('');
    setNotice('');
    setGoogleBusy(true);
    const res = await signInWithGoogle();
    setGoogleBusy(false);
    if (res.error) setError(res.error);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!emailValid) {
      setError('Enter a valid email address.');
      return;
    }

    if (mode === 'forgot') {
      setBusy(true);
      const res = await requestPasswordReset(email);
      setBusy(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      setNotice('Reset link sent. Open it on this device to set a new password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    const res =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password, { name, phone, smsOptIn });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setNotice(mode === 'signup' ? 'Account created. Your ledger is now private to you.' : 'Signed in.');
    window.setTimeout(onClose, 700);
  };

  const heading =
    mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Claim your ledger' : 'Reset your password';
  const sub =
    mode === 'signin'
      ? 'Sign in to sync this canvas across devices.'
      : mode === 'signup'
        ? 'Create an account so only you can read your archive.'
        : 'We will email a secure link back to this workspace.';

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/12 bg-[#15161C] shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/8 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl m-gradient-bg">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-white">{heading}</p>
              <p className="text-[11px] text-white/40">{sub}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-white/40 transition hover:bg-white/8 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3 px-5 py-4">
          {mode !== 'forgot' && (
            <>
              <GoogleButton onClick={handleGoogle} busy={googleBusy} />
              <div className="flex items-center gap-3 py-0.5">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] uppercase tracking-wider text-white/25">or use email</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
            </>
          )}

          {mode === 'signup' && (
            <label className="block text-[10px] uppercase tracking-wider text-white/40">
              Name
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/12 bg-black/30 px-3 py-2.5 focus-within:border-[var(--m-accent)]">
                <User className="h-3.5 w-3.5 text-white/25" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah"
                  className="flex-1 bg-transparent text-sm normal-case text-white placeholder:text-white/20 outline-none"
                />
              </div>
            </label>
          )}

          <label className="block text-[10px] uppercase tracking-wider text-white/40">
            Email
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/12 bg-black/30 px-3 py-2.5 focus-within:border-[var(--m-accent)]">
              <Mail className="h-3.5 w-3.5 text-white/25" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                autoComplete="email"
                className="flex-1 bg-transparent text-sm normal-case text-white placeholder:text-white/20 outline-none"
              />
            </div>
          </label>

          {mode !== 'forgot' && (
            <label className="block text-[10px] uppercase tracking-wider text-white/40">
              Password
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/12 bg-black/30 px-3 py-2.5 focus-within:border-[var(--m-accent)]">
                <Lock className="h-3.5 w-3.5 text-white/25" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="flex-1 bg-transparent text-sm normal-case text-white placeholder:text-white/20 outline-none"
                />
              </div>
            </label>
          )}

          {mode === 'signin' && (
            <button
              type="button"
              onClick={() => swap('forgot')}
              className="text-[11px] font-medium text-[var(--m-accent-soft)] underline-offset-2 transition hover:underline"
            >
              Forgot password?
            </button>
          )}

          {mode === 'signup' && (
            <>
              <label className="block text-[10px] uppercase tracking-wider text-white/40">
                Phone number (optional)
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/12 bg-black/30 px-3 py-2.5 focus-within:border-[var(--m-accent)]">
                  <Phone className="h-3.5 w-3.5 text-white/25" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 010 4477"
                    className="flex-1 bg-transparent text-sm normal-case text-white placeholder:text-white/20 outline-none"
                  />
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-2.5 text-[11px] leading-relaxed text-white/45">
                <input
                  type="checkbox"
                  checked={smsOptIn}
                  onChange={(e) => setSmsOptIn(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-white/25 bg-black/30 accent-[var(--m-accent)]"
                />
                <span>Text me updates. Msg &amp; data rates may apply. Reply STOP to unsubscribe.</span>
              </label>
            </>
          )}

          {error && <p className="rounded-lg border border-rose-400/30 bg-rose-400/8 px-3 py-2 text-[11px] text-rose-300">{error}</p>}
          {notice && <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/8 px-3 py-2 text-[11px] text-emerald-300">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl m-gradient-bg py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Email me a reset link'}
          </button>

          <div className="flex items-center justify-between pt-1">
            {mode === 'forgot' ? (
              <button
                type="button"
                onClick={() => swap('signin')}
                className="flex items-center gap-1 text-[11px] text-white/45 underline-offset-2 transition hover:text-white hover:underline"
              >
                <ArrowLeft className="h-3 w-3" /> Back to sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => swap(mode === 'signin' ? 'signup' : 'signin')}
                className="text-[11px] text-white/45 underline-offset-2 transition hover:text-white hover:underline"
              >
                {mode === 'signin' ? 'No account yet? Create one' : 'Already have an account? Sign in'}
              </button>
            )}
            <span className="flex items-center gap-1 text-[10px] text-emerald-300/70">
              <ShieldCheck className="h-3 w-3" /> Row-level private
            </span>
          </div>
        </form>

        <p className="border-t border-white/8 px-5 py-3 text-[10.5px] leading-relaxed text-white/30">
          Maggie stays local-first. Signing in only enables encrypted cloud sync — your journal, check-ins, and memory
          ledger are readable by your account alone.
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
