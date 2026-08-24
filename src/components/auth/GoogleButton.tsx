import React from 'react';
import { Loader2 } from 'lucide-react';

const GoogleGlyph: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.4c-.5 2.9-2.1 5.4-4.5 7l7.1 5.5c4.2-3.8 6.6-9.5 6.6-16.8z" />
    <path fill="#FBBC05" d="M10.4 28.7a14.5 14.5 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1z" />
    <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.6l-7.1-5.5c-2 1.4-4.6 2.2-8.1 2.2-6.4 0-11.7-3.7-13.6-9l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

export const GoogleButton: React.FC<{ onClick: () => void; busy?: boolean; label?: string }> = ({
  onClick,
  busy = false,
  label = 'Continue with Google',
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy}
    className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.06] py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.12] disabled:opacity-60"
  >
    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleGlyph />}
    {label}
  </button>
);

export default GoogleButton;
