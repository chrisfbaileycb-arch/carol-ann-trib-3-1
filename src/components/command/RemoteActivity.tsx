import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshCw, Trash2, Play, Loader2, Radio, Smartphone, Monitor, ShieldAlert, Inbox, CloudOff,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchBusActivity, deleteBusEvent, clearBusActivity, groupByDay, summarizePayload,
  commandText, formatTime, EVENT_TYPE_META, EVENT_TYPES, RERUNNABLE,
  type BusActivityRow,
} from '@/lib/busActivity';
import type { BusEventType } from '@/lib/realtimeBus';
import { publishBus, pullBusNow, subscribeBus } from '@/lib/realtimeBus';
import { parseIntent } from '@/lib/browserAgent';
import { startRun, pushLog } from '@/lib/agentRunner';

interface Props {
  onOpenAgent: () => void;
  onSignIn: () => void;
}

const RemoteActivity: React.FC<Props> = ({ onOpenAgent, onSignIn }) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<BusActivityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filters, setFilters] = useState<BusEventType[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(
    async (quiet = false) => {
      if (!user) {
        setRows([]);
        return;
      }
      if (!quiet) setLoading(true);
      const { rows: next, error: err } = await fetchBusActivity(user.id);
      setRows(next);
      setError(err);
      setLoading(false);
    },
    [user],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Any live event (local or relayed) refreshes the ledger view.
  useEffect(() => subscribeBus(() => { void load(true); }), [load]);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3800);
  };

  const toggleFilter = (t: BusEventType) =>
    setFilters((f) => (f.includes(t) ? f.filter((x) => x !== t) : [...f, t]));

  const visible = useMemo(
    () => (filters.length ? rows.filter((r) => filters.includes(r.type)) : rows),
    [rows, filters],
  );
  const days = useMemo(() => groupByDay(visible), [visible]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    rows.forEach((r) => { c[r.type] = (c[r.type] ?? 0) + 1; });
    return c;
  }, [rows]);

  const mobileCount = rows.filter((r) => r.source === 'mobile').length;

  const handleRefresh = async () => {
    await pullBusNow();
    await load();
    flash('Relay ledger refreshed.');
  };

  const handleRerun = (row: BusActivityRow) => {
    const text = commandText(row) || summarizePayload(row);
    const intent = parseIntent(text);
    if (!intent) {
      pushLog(`No dispatch chain matched “${text.slice(0, 60)}” — re-run skipped.`, 'warn');
      flash('No matching dispatch chain for that command.');
      onOpenAgent();
      return;
    }
    pushLog(`Replaying relay event → ${intent.title}`, 'action');
    startRun(intent.key);
    // Persist the replay so every device sees it in the shared ledger.
    publishBus('command', { text, replayOf: row.id, origin: 'remote-activity' }, 'desktop');
    onOpenAgent();
    void load(true);
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    const err = await deleteBusEvent(id);
    setBusyId(null);
    if (err) { setError(err); return; }
    setRows((r) => r.filter((x) => x.id !== id));
    flash('Event removed from your relay ledger.');
  };

  const handleClear = async () => {
    if (!user) return;
    setClearing(true);
    const err = await clearBusActivity(user.id);
    setClearing(false);
    if (err) { setError(err); return; }
    setRows([]);
    flash('Relay ledger cleared.');
  };

  if (!user) {
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <div className="max-w-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5">
            <ShieldAlert className="h-5 w-5 text-[var(--m-accent)]" />
          </span>
          <h3 className="mt-4 font-display text-lg font-semibold text-white">Remote activity is private</h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-white/45">
            Relay events are row-level-secured to your account. Sign in to review every command your
            phone pushed into the workspace.
          </p>
          <button
            onClick={onSignIn}
            className="mt-4 rounded-lg m-gradient-bg px-4 py-2 text-[12px] font-semibold text-white"
          >
            Sign in to view
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="m-scroll h-full overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-white">
              <Radio className="h-4 w-4 text-[var(--m-accent)]" /> Remote activity

            </h2>
            <p className="mt-1 text-[12px] text-white/45">
              Every event relayed through your private <code className="text-white/60">bus_events</code> ledger —
              {' '}{rows.length} total, {mobileCount} from a phone.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-[11px] font-medium text-white/65 transition hover:border-white/30 hover:text-white"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh
            </button>
            <button
              onClick={handleClear}
              disabled={clearing || !rows.length}
              className="flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-[11px] font-medium text-white/50 transition hover:border-rose-400/40 hover:text-rose-300 disabled:opacity-35"
            >
              {clearing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Clear all
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilters([])}
            className={`rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition ${filters.length === 0 ? 'border-[var(--m-accent)]/50 bg-[var(--m-accent)]/15 text-white' : 'border-white/12 text-white/45 hover:text-white'}`}
          >
            All ({rows.length})
          </button>
          {EVENT_TYPES.map((t) => {
            const on = filters.includes(t);
            const meta = EVENT_TYPE_META[t];
            return (
              <button
                key={t}
                onClick={() => toggleFilter(t)}
                className={`rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition ${on ? meta.tint : 'border-white/12 text-white/45 hover:text-white'}`}
              >
                {meta.label} ({counts[t] ?? 0})
              </button>
            );
          })}
        </div>

        {notice && (
          <p className="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-400/8 px-3 py-2 text-[11px] text-emerald-200">
            {notice}
          </p>
        )}
        {error && (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg border border-amber-400/25 bg-amber-400/8 px-3 py-2 text-[11px] text-amber-200">
            <CloudOff className="h-3.5 w-3.5" /> {error}
          </p>
        )}

        {/* Day groups */}
        {loading && !rows.length ? (
          <div className="mt-10 flex items-center justify-center gap-2 text-[12px] text-white/40">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading relay ledger…
          </div>
        ) : !visible.length ? (
          <div className="mt-10 rounded-2xl border border-dashed border-white/12 p-8 text-center">
            <Inbox className="mx-auto h-6 w-6 text-white/25" />
            <p className="mt-2 text-[12.5px] font-medium text-white/70">
              {rows.length ? 'No events match those filters.' : 'No relay events yet.'}
            </p>
            <p className="mt-1 text-[11.5px] text-white/40">
              Open the phone remote and send a command — it will land here within a few seconds.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            {days.map((day) => (
              <section key={day.key}>
                <div className="flex items-center gap-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">{day.label}</h3>
                  <span className="text-[10.5px] text-white/25">{day.events.length} events</span>
                  <span className="h-px flex-1 bg-white/8" />
                </div>

                <ul className="mt-2.5 space-y-2">
                  {day.events.map((row) => {
                    const meta = EVENT_TYPE_META[row.type];
                    const canRerun = RERUNNABLE.includes(row.type) && !!commandText(row);
                    const SourceIcon = row.source === 'mobile' ? Smartphone : Monitor;
                    return (
                      <li
                        key={row.id}
                        className="group flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3 transition hover:border-white/16"
                      >
                        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-full border px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide ${meta.tint}`}>
                              {meta.label}
                            </span>
                            <span className="flex items-center gap-1 text-[10.5px] font-medium text-white/45">
                              <SourceIcon className="h-3 w-3" /> {row.source}
                            </span>
                            <span className="text-[10.5px] text-white/30">· {formatTime(row.createdAt)}</span>
                            {typeof row.payload.replayOf === 'string' && (
                              <span className="rounded-full border border-white/12 px-1.5 py-0.5 text-[9.5px] text-white/40">replay</span>
                            )}
                          </div>
                          <p className="mt-1 break-words text-[12.5px] leading-relaxed text-white/80">
                            {summarizePayload(row)}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {canRerun && (
                            <button
                              onClick={() => handleRerun(row)}
                              title="Re-dispatch this command into the cloud browser runner"
                              className="flex items-center gap-1 rounded-lg border border-white/12 px-2 py-1 text-[10.5px] font-semibold text-white/65 transition hover:border-[var(--m-accent)]/50 hover:text-white"
                            >
                              <Play className="h-3 w-3" /> Re-run
                            </button>
                          )}
                          <button
                            onClick={() => void handleDelete(row.id)}
                            disabled={busyId === row.id}
                            title="Delete this event from your ledger"
                            className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-white/40 transition hover:border-rose-400/40 hover:text-rose-300 disabled:opacity-40"
                          >
                            {busyId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RemoteActivity;
