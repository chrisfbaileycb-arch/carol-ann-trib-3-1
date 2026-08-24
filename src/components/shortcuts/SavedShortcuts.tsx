import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark, Loader2, Trash2, Zap, ChevronDown, Pencil, GripVertical, Check, X, CalendarClock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchSavedCommands, deleteSavedCommand, updateSavedCommand, reorderSavedCommands,
  groupShortcuts, GROUP_SUGGESTIONS, DEFAULT_GROUP, type SavedCommand,
} from '@/lib/savedCommands';
import { subscribeBus } from '@/lib/realtimeBus';

interface Props {
  /** Fire the shortcut — the host decides what dispatching means. */
  onDispatch: (cmd: SavedCommand) => void;
  /** Turn a shortcut into a recurring schedule (Copilot list variant only). */
  onSchedule?: (cmd: SavedCommand) => void;
  /** Compact = phone remote pill row, panel = Copilot sidebar list. */
  variant?: 'pills' | 'list';
  title?: string;
  className?: string;
}

/**
 * One-tap saved command shortcuts, shared by the phone remote and the
 * Copilot dispatcher so both surfaces read the same `saved_commands` rows.
 * Pills group under collapsible headings; the list supports rename +
 * drag-to-reorder and can hand a shortcut to the scheduler.
 */
export const SavedShortcuts: React.FC<Props> = ({
  onDispatch, onSchedule, variant = 'pills', title = 'Saved shortcuts', className = '',
}) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<SavedCommand[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editGroup, setEditGroup] = useState(DEFAULT_GROUP);
  const dragId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

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

  const groups = useMemo(() => groupShortcuts(rows), [rows]);

  const remove = async (id: string) => {
    setBusyId(id);
    const err = await deleteSavedCommand(id);
    setBusyId(null);
    if (!err) setRows((r) => r.filter((x) => x.id !== id));
  };

  const beginEdit = (c: SavedCommand) => {
    setEditId(c.id);
    setEditLabel(c.label);
    setEditGroup(c.groupName);
  };

  const commitEdit = async () => {
    if (!editId) return;
    const id = editId;
    const label = editLabel.trim() || 'Shortcut';
    const groupName = editGroup.trim() || DEFAULT_GROUP;
    setRows((r) => r.map((x) => (x.id === id ? { ...x, label, groupName } : x)));
    setEditId(null);
    await updateSavedCommand(id, { label, groupName });
  };

  /** Drop `dragId` in front of `targetId`, then persist positions. */
  const handleDrop = async (targetId: string) => {
    const from = dragId.current;
    dragId.current = null;
    setDragOverId(null);
    if (!from || from === targetId) return;
    const fromIdx = rows.findIndex((r) => r.id === from);
    const toIdx = rows.findIndex((r) => r.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...rows];
    const [moved] = next.splice(fromIdx, 1);
    // A drag also adopts the target's group heading.
    next.splice(toIdx, 0, { ...moved, groupName: rows[toIdx].groupName });
    const ordered = next.map((r, i) => ({ ...r, position: i }));
    setRows(ordered);
    await reorderSavedCommands(ordered);
    if (moved.groupName !== rows[toIdx].groupName) {
      await updateSavedCommand(moved.id, { groupName: rows[toIdx].groupName });
    }
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
        <div className="mt-2 space-y-2">
          {groups.map((g) => {
            const isOpen = !collapsed[g.name];
            return (
              <div key={g.name} className="rounded-2xl border border-white/10 bg-white/[0.03]">
                <button
                  onClick={() => setCollapsed((c) => ({ ...c, [g.name]: isOpen }))}
                  className="flex w-full items-center justify-between px-3 py-2.5"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
                    {g.name}
                    <span className="rounded-full bg-white/10 px-1.5 text-[10px] text-white/45">{g.items.length}</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 text-white/35 transition ${isOpen ? '' : '-rotate-90'}`} />
                </button>
                {isOpen && (
                  <div className="flex flex-wrap gap-2 px-3 pb-3">
                    {g.items.map((c) => (
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
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-2 space-y-3">
          {groups.map((g) => (
            <div key={g.name}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">{g.name}</p>
              <ul className="space-y-1.5">
                {g.items.map((c) => (
                  <li
                    key={c.id}
                    draggable={editId !== c.id}
                    onDragStart={() => { dragId.current = c.id; }}
                    onDragOver={(e) => { e.preventDefault(); setDragOverId(c.id); }}
                    onDragLeave={() => setDragOverId((d) => (d === c.id ? null : d))}
                    onDrop={(e) => { e.preventDefault(); void handleDrop(c.id); }}
                    className={`rounded-lg border bg-black/25 px-2 py-2 transition ${dragOverId === c.id ? 'border-[var(--m-accent)]/70' : 'border-white/10'}`}
                  >
                    {editId === c.id ? (
                      <div className="space-y-1.5">
                        <input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && void commitEdit()}
                          autoFocus
                          placeholder="Shortcut name"
                          className="w-full rounded-md border border-white/12 bg-black/40 px-2 py-1 text-[12px] text-white outline-none focus:border-[var(--m-accent)]"
                        />
                        <div className="flex items-center gap-1.5">
                          <input
                            value={editGroup}
                            onChange={(e) => setEditGroup(e.target.value)}
                            list="shortcut-groups"
                            placeholder="Group"
                            className="min-w-0 flex-1 rounded-md border border-white/12 bg-black/40 px-2 py-1 text-[11px] text-white outline-none focus:border-[var(--m-accent)]"
                          />
                          <datalist id="shortcut-groups">
                            {GROUP_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                          </datalist>
                          <button onClick={() => void commitEdit()} className="rounded-md bg-emerald-500/20 p-1.5 text-emerald-300" aria-label="Save">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setEditId(null)} className="rounded-md bg-white/8 p-1.5 text-white/50" aria-label="Cancel">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-white/20" />
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
                        {onSchedule && (
                          <button
                            onClick={() => onSchedule(c)}
                            className="shrink-0 text-white/30 transition hover:text-[var(--m-accent)]"
                            aria-label={`Schedule ${c.label}`}
                            title="Schedule this shortcut"
                          >
                            <CalendarClock className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => beginEdit(c)}
                          className="shrink-0 text-white/30 transition hover:text-white"
                          aria-label={`Rename ${c.label}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => void remove(c.id)}
                          className="shrink-0 text-white/25 transition hover:text-rose-300"
                          aria-label={`Remove ${c.label}`}
                        >
                          {busyId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {rows.length > 1 && (
            <p className="text-[10px] text-white/25">Drag a row to reorder — dropping onto another group moves it there.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedShortcuts;
