import React, { useState } from 'react';
import {
  X, Loader2, User, Mail, Lock, ShieldCheck, Trash2, AlertTriangle, Database, LogOut,
  Download, FileJson, FileSpreadsheet,
} from 'lucide-react';
import { useAuth, LEDGER_TABLES } from '@/contexts/AuthContext';
import { clearLocalLedger } from '@/lib/memoryStore';
import {
  runDataExport, downloadExportFiles, EXPORT_TABLES, type ExportProgress,
} from '@/lib/dataExport';

export const AccountSettings: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { user, updateAccount, updatePassword, deleteLedger, signOut } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [alsoWipeLocal, setAlsoWipeLocal] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Data export state
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [exportSummary, setExportSummary] = useState<string>('');

  if (!open || !user) return null;

  const runExport = async () => {
    setError('');
    setNotice('');
    setExportSummary('');
    setExporting(true);
    setProgress({ table: EXPORT_TABLES[0], index: 0, total: EXPORT_TABLES.length, rows: 0, done: false });

    const res = await runDataExport(user.id, user.email, (p) => setProgress(p));
    downloadExportFiles(res.files);
    setExporting(false);

    const rows = Object.values(res.counts).reduce((a, b) => a + b, 0);
    setExportSummary(
      `${rows} rows across ${EXPORT_TABLES.length} tables · ${res.files.length} files (1 JSON + ${res.files.length - 1} CSV).`,
    );
    if (res.errors.length) setError(`Some tables could not be read: ${res.errors.join(' | ')}`);
    else setNotice('Export complete — check your downloads folder.');
  };


  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setSavingProfile(true);
    const res = await updateAccount({ name: name.trim(), email: email.trim() });
    setSavingProfile(false);
    if (res.error) setError(res.error);
    else setNotice(res.notice ?? 'Account details saved.');
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (password.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    setSavingPassword(true);
    const res = await updatePassword(password);
    setSavingPassword(false);
    if (res.error) setError(res.error);
    else {
      setPassword('');
      setNotice('Password changed. Other sessions will need the new one.');
    }
  };

  const runDelete = async () => {
    setError('');
    setNotice('');
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      setError('Type DELETE to confirm the wipe.');
      return;
    }
    setDeleting(true);
    const res = await deleteLedger();
    if (alsoWipeLocal) clearLocalLedger();
    setDeleting(false);
    if (res.error) {
      setError(`Partial wipe: ${res.error}`);
      return;
    }
    setNotice(`Cloud ledger erased across ${res.deleted} tables. Signing you out…`);
    setConfirmText('');
    window.setTimeout(async () => {
      await signOut();
      window.location.href = '/';
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="m-scroll relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/12 bg-[#15161C] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-white/8 bg-[#15161C] px-5 py-4">
          <div>
            <p className="font-display text-lg font-semibold text-white">Account settings</p>
            <p className="text-[11px] text-white/40">Identity, credentials, and cloud data control.</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-white/40 transition hover:bg-white/8 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          {error && <p className="rounded-lg border border-rose-400/30 bg-rose-400/8 px-3 py-2 text-[11px] text-rose-300">{error}</p>}
          {notice && <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/8 px-3 py-2 text-[11px] text-emerald-300">{notice}</p>}

          {/* Profile */}
          <form onSubmit={saveProfile} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/55">
              <User className="h-3.5 w-3.5" /> Profile
            </p>
            <label className="block text-[10px] uppercase tracking-wider text-white/40">
              Display name
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/12 bg-black/30 px-3 py-2.5 focus-within:border-[var(--m-accent)]">
                <User className="h-3.5 w-3.5 text-white/25" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 bg-transparent text-sm normal-case text-white placeholder:text-white/20 outline-none"
                />
              </div>
            </label>
            <label className="block text-[10px] uppercase tracking-wider text-white/40">
              Email address
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/12 bg-black/30 px-3 py-2.5 focus-within:border-[var(--m-accent)]">
                <Mail className="h-3.5 w-3.5 text-white/25" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent text-sm normal-case text-white placeholder:text-white/20 outline-none"
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center justify-center gap-2 rounded-lg m-gradient-bg px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-60"
            >
              {savingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save details
            </button>
          </form>

          {/* Password */}
          <form onSubmit={savePassword} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/55">
              <Lock className="h-3.5 w-3.5" /> Password
            </p>
            <label className="block text-[10px] uppercase tracking-wider text-white/40">
              New password
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/12 bg-black/30 px-3 py-2.5 focus-within:border-[var(--m-accent)]">
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
            <button
              type="submit"
              disabled={savingPassword}
              className="flex items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-[12px] font-semibold text-white/75 transition hover:border-white/35 hover:text-white disabled:opacity-60"
            >
              {savingPassword && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Change password
            </button>
          </form>
          {/* Data export */}
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/55">
              <Download className="h-3.5 w-3.5" /> Export my data
            </p>
            <p className="text-[11.5px] leading-relaxed text-white/50">
              Pull every row you own across the ledger and relay tables. You get one combined JSON
              bundle plus a CSV per table.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EXPORT_TABLES.map((t) => (
                <span key={t} className="flex items-center gap-1 rounded-md bg-black/40 px-2 py-1 font-mono text-[10px] text-white/45">
                  <Database className="h-3 w-3" /> {t}
                </span>
              ))}
            </div>

            {exporting && progress && (
              <div>
                <div className="flex items-center justify-between text-[10.5px] text-white/50">
                  <span className="font-mono">{progress.table}</span>
                  <span>{progress.index}/{progress.total}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full m-gradient-bg transition-all duration-300"
                    style={{ width: `${Math.round((progress.index / progress.total) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {exportSummary && (
              <p className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-white/60">
                <FileJson className="h-3.5 w-3.5 text-[var(--m-accent)]" /> {exportSummary}
              </p>
            )}

            <button
              onClick={() => void runExport()}
              disabled={exporting}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 py-2.5 text-[12.5px] font-semibold text-white/80 transition hover:border-[var(--m-accent)]/55 hover:text-white disabled:opacity-60"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              {exporting ? 'Exporting…' : 'Download JSON + CSV export'}
            </button>
          </div>


          {/* Danger zone */}
          <div className="space-y-3 rounded-xl border border-rose-400/25 bg-rose-500/[0.06] p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-rose-300">
              <AlertTriangle className="h-3.5 w-3.5" /> Danger zone
            </p>
            <p className="text-[11.5px] leading-relaxed text-white/50">
              Permanently erase every row you own across the ledger tables:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {LEDGER_TABLES.map((t) => (
                <span key={t} className="flex items-center gap-1 rounded-md bg-black/40 px-2 py-1 font-mono text-[10px] text-white/45">
                  <Database className="h-3 w-3" /> {t}
                </span>
              ))}
            </div>
            <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-relaxed text-white/50">
              <input
                type="checkbox"
                checked={alsoWipeLocal}
                onChange={(e) => setAlsoWipeLocal(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/25 bg-black/30 accent-rose-500"
              />
              <span>Also wipe this device&apos;s local cache (journal, check-ins, errands, memories).</span>
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full rounded-xl border border-rose-400/25 bg-black/35 px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-rose-400"
            />
            <button
              onClick={runDelete}
              disabled={deleting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/90 py-2.5 text-[12.5px] font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete my ledger &amp; cloud data
            </button>
          </div>

          <div className="flex items-center justify-between pb-1">
            <span className="flex items-center gap-1.5 text-[10.5px] text-emerald-300/70">
              <ShieldCheck className="h-3.5 w-3.5" /> RLS scopes every row to {user.email}
            </span>
            <button
              onClick={async () => { onClose(); await signOut(); }}
              className="flex items-center gap-1.5 text-[11px] font-medium text-white/45 transition hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
