import React, { useCallback, useEffect, useState } from 'react';
import {
  CalendarClock, Loader2, Trash2, Pause, Play, RefreshCw, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchSchedules, createSchedule, deleteSchedule, setScheduleActive, runScheduleSweep,
  CRON_PRESETS, describeCron, formatNextRun, isValidCron,
  type ScheduledCommand,
} from '@/lib/scheduledCommands';
import type { SavedCommand } from '@/lib/savedCommands';

interface Props {
  /** Shortcut queued for scheduling (set when the user taps the clock icon). */
  draft: SavedCommand | null;
  onClearDraft: () => void;
  className?: string;
}

/**
 * Recurring schedules for saved shortcuts. Rows live in `scheduled_commands`;
 * the hourly `run-scheduled-commands` edge function dispatches due rows into
 * `bus_events` so the desktop workspace executes them even when the tab is shut.
 */
export const ScheduleManager: React.FC<Props> = ({ draft, onClearDraft, className = '' }) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ScheduledCommand[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [expr, setExpr] = useState(CRON_PRESETS[1].expression);
  const [note, setNote] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async () => {
    if (!user) { setRows([]); return; }
    setLoading(true);
    const { rows: next, error } = await fetchSchedules(user.id);
    setRows(next);
    if (error) setNote({ ok: false, msg: error });
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    if (!user || !draft) return;
    if (!isValidCron(expr)) { setNote({ ok: false, msg: 'That cron expression is not valid.' }); return; }
    setSaving(true);
    const { row, error } = await createSchedule(user.id, {
      label: draft.label,
      text: draft.text,
      chainKey: draft.chainKey,
      cronExpression: expr,
    });
    setSaving(false);
    if (error || !row) { setNote({ ok: false, msg: error ?? 'Could not create schedule.' }); return; }
    setRows((r) => [row, ...r].sort((a, b) => a.nextRunAt.localeCompare(b.nextRunAt)));
    setNote({ ok: true, msg: `“${row.label}” scheduled — next run ${formatNextRun(row.nextRunAt)}.` });
    onClearDraft();
  };

  const toggle = async (row: ScheduledCommand) => {
    setBusyId(row.id);
    const err = await setScheduleActive(row.id, !row.active);
    setBusyId(null);
    if (!err) setRows((r) => r.map((x) => (x.id === row.id ? { ...x, active: !row.active } : x)));
  };

  const remove = async (id: string) => {
    setBusyId(id);
    const err = await deleteSchedule(id);
    setBusyId(null);
    if (!err) setRows((r) => r.filter((x) => x.id !== id));
  };

  const sweep = async () => {
    setSweeping(true);
    const err = await runScheduleSweep();
    setSweeping(false);
    setNote(err ? { ok: false, msg: err } : { ok: true, msg: 'Cloud sweep executed — due commands dispatched.' });
    await load();
  };

  if (!user) {
    return (
      <div className={`rounded-xl border border-white/10 bg-white/[0.03] p-3 ${className}`}>
        <p className="text-[11px] text-white/40">Sign in to schedule recurring commands.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-white/10 bg-white/[0.03] p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-white/30">
          <CalendarClock className="h-3 w-3" /> Recurring schedules
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
        </p>
        <button
          onClick={() => void sweep()}
          className="flex items-center gap-1 rounded-md border border-white/12 px-2 py-1 text-[10px] text-white/50 transition hover:text-white"
        >
          {sweeping ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Run sweep
        </button>
      </div>

      {/* Draft editor — appears when a shortcut is sent here from the list */}
      {draft && (
        <div className="mt-2.5 rounded-lg border border-[var(--m-accent)]/35 bg-[var(--m-accent)]/8 p-2.5">
          <p className="truncate text-[12px] font-semibold text-white">{draft.label}</p>
          <p className="truncate text-[10px] text-white/45">{draft.text}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CRON_PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => setExpr(p.expression)}
                className={`rounded-full border px-2 py-1 text-[10px] transition ${expr === p.expression ? 'border-[var(--m-accent)] bg-[var(--m-accent)]/20 text-white' : 'border-white/12 text-white/50 hover:text-white'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <input
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
              spellCheck={false}
              placeholder="0 13 * * *"
              className="min-w-0 flex-1 rounded-md border border-white/12 bg-black/40 px-2 py-1 font-mono text-[11px] text-white outline-none focus:border-[var(--m-accent)]"
            />
            <button
              onClick={() => void submit()}
              disabled={saving}
              className="shrink-0 rounded-md m-gradient-bg px-2.5 py-1.5 text-[10.5px] font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Schedule'}
            </button>
            <button onClick={onClearDraft} className="shrink-0 rounded-md border border-white/12 px-2 py-1.5 text-[10.5px] text-white/50">
              Cancel
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-white/40">{describeCron(expr)}</p>
        </div>
      )}

      {!draft && !rows.length && !loading && (
        <p className="mt-2 text-[11px] text-white/30">
          Tap the clock icon on a saved shortcut to turn it into a recurring command.
        </p>
      )}

      <ul className="mt-2 space-y-1.5">
        {rows.map((s) => (
          <li key={s.id} className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.active ? 'bg-emerald-400' : 'bg-white/25'}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-white/85">{s.label}</p>
                <p className="truncate text-[10px] text-white/35">{describeCron(s.cronExpression)}</p>
              </div>
              <button
                onClick={() => void toggle(s)}
                className="shrink-0 text-white/35 transition hover:text-white"
                aria-label={s.active ? `Pause ${s.label}` : `Resume ${s.label}`}
              >
                {busyId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : s.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => void remove(s.id)}
                className="shrink-0 text-white/25 transition hover:text-rose-300"
                aria-label={`Delete ${s.label}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-[10px] text-white/30">
              {s.active ? `Next ${formatNextRun(s.nextRunAt)}` : 'Paused'}
              {s.runCount > 0 && ` · ${s.runCount} run${s.runCount === 1 ? '' : 's'}`}
              {s.lastRunAt && ` · last ${formatNextRun(s.lastRunAt)}`}
            </p>
          </li>
        ))}
      </ul>

      {note && (
        <div className={`mt-2 flex items-start gap-1.5 rounded-lg border p-2 text-[10.5px] ${note.ok ? 'border-emerald-400/25 bg-emerald-400/8 text-emerald-300' : 'border-rose-400/25 bg-rose-400/8 text-rose-300'}`}>
          {note.ok ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />}
          <span className="break-words">{note.msg}</span>
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;
