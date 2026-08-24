import React, { useCallback, useEffect, useState } from 'react';
import { Bookmark, Loader2, Trash2, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchSavedCommands, deleteSavedCommand, type SavedCommand,
} from '@/lib/savedCommands';
import { subscribeBus } from '@/lib/realtimeBus';

interface Props {
  /** Fire the shortcut — the host decides what dispatching means. */
  onDispatch: (cmd: SavedCommand) => void;
  /** Compact = phone remote pill row, panel = Copilot sidebar list. */
  variant?: 'pills' | 'list';
  title?: string;
  className?: string;
}

/**
 * One-tap saved command shortcuts, shared by the phone remote and the
 * Copilot dispatcher so both surfaces read the same `saved_commands` rows.
 */
export const SavedShortcuts: React.FC<Props> = ({
  onDispatch, variant = 'pills', title = 'Saved shortcuts', className = '',
}) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<SavedCommand[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) { setRows([]); return; }
    setLoading(true);
    const { rows: next } = await fetchSavedCommands(user.id);
    setRows(next);
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);
  // A shortcut saved on the desktop should appear on the phone shortly after.
  useEffect(() => subscribeBus(() => { void load(); }), [load]);

  const remove = async (id: string) => {
    setBusyId(id);
    const err = await deleteSavedCommand(id);
    setBusyId(null);
    if (!err) setRows((r) => r.filter((x) => x.id !== id));
  };

  if (!user) return null;

  return (
    <div className={className}>
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-white/30">
        <Bookmark className="h-3 w-3" /> {title}
        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
      </p>

      {!loading && !rows.length && (
        <p className="mt-2 text-[11px] text-white/30">
          Save a command from Remote activity to pin it here.
        </p>
      )}

      {variant === 'pills' ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {rows.map((c) => (
            <span key={c.id} className="flex items-center overflow-hidden rounded-full border border-[var(--m-accent)]/35 bg-[var(--m-accent)]/10">
              <button
                onClick={() => onDispatch(c)}
                className="flex items-center gap-1.5 py-2 pl-3 pr-2 text-[11px] font-semibold text-white"
              >
                <Zap className="h-3 w-3 text-[var(--m-accent)]" /> {c.label}
              </button>
              <button
                onClick={() => void remove(c.id)}
                className="border-l border-white/10 px-2 py-2 text-white/35"
                aria-label={`Remove ${c.label}`}
              >
                {busyId === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              </button>
            </span>
          ))}
        </div>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {rows.map((c) => (
            <li key={c.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
              <Zap className="h-3.5 w-3.5 shrink-0 text-[var(--m-accent)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-white/85">{c.label}</p>
                <p className="truncate text-[10px] text-white/35">
                  {c.chainKey ? `chain: ${c.chainKey}` : 'free-form command'}
                </p>
              </div>
              <button
                onClick={() => onDispatch(c)}
                className="shrink-0 rounded-lg m-gradient-bg px-2.5 py-1 text-[10.5px] font-semibold text-white"
              >
                Run
              </button>
              <button
                onClick={() => void remove(c.id)}
                className="shrink-0 text-white/25 transition hover:text-rose-300"
                aria-label={`Remove ${c.label}`}
              >
                {busyId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SavedShortcuts;
