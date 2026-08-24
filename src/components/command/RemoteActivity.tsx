import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RefreshCw, Trash2, Play, Loader2, Radio, Smartphone, Monitor, ShieldAlert, Inbox, CloudOff,
  Search, CalendarRange, ChevronDown, Bookmark, X, CloudCog,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import {
  fetchBusActivity, fetchTypeCounts, deleteBusEvent, clearBusActivity, groupByDay,
  summarizePayload, commandText, formatTime, EVENT_TYPE_META, EVENT_TYPES, RERUNNABLE,
  ACTIVITY_PAGE, type BusActivityRow,
} from '@/lib/busActivity';
import type { BusEventType } from '@/lib/realtimeBus';
import { publishBus, pullBusNow, subscribeBus } from '@/lib/realtimeBus';
import { parseIntent } from '@/lib/browserAgent';
import { startRun, pushLog } from '@/lib/agentRunner';
import { saveCommand, shortcutLabel } from '@/lib/savedCommands';

interface Props {
  onOpenAgent: () => void;
  onSignIn: () => void;
}

const RemoteActivity: React.FC<Props> = ({ onOpenAgent, onSignIn }) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<BusActivityRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filters, setFilters] = useState<BusEventType[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  // search + date range (all applied server-side)
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rangeOpen, setRangeOpen] = useState(false);

  const offsetRef = useRef(0);

  // Debounce the keyword box so we don't hammer PostgREST on every keystroke.
  useEffect(() => {
    const t = window.setTimeout(() => setKeyword(keywordInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [keywordInput]);

  const load = useCallback(
    async (quiet = false) => {
      if (!user) { setRows([]); return; }
      if (!quiet) setLoading(true);
      offsetRef.current = 0;
      const res = await fetchBusActivity(user.id, {
        keyword, from: from || undefined, to: to || undefined,
        types: filters.length ? filters : undefined,
        offset: 0, limit: ACTIVITY_PAGE,
      });
      setRows(res.rows);
      setHasMore(res.hasMore);
      setError(res.error);
      setLoading(false);
      const c = await fetchTypeCounts(user.id, { keyword, from: from || undefined, to: to || undefined });
      setCounts(c);
    },
    [user, keyword, from, to, filters],
  );

  useEffect(() => { void load(); }, [load]);

  // Any live event (local or relayed) refreshes the ledger view.
  useEffect(() => subscribeBus(() => { void load(true); }), [load]);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3800);
  };

  const toggleFilter = (t: BusEventType) =>
    setFilters((f) => (f.includes(t) ? f.filter((x) => x !== t) : [...f, t]));

  const days = useMemo(() => groupByDay(rows), [rows]);
  const mobileCount = rows.filter((r) => r.source === 'mobile').length;
  const totalKnown = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts],
  );
  const filtersActive = !!keyword || !!from || !!to || filters.length > 0;

  const loadOlder = async () => {
    if (!user) return;
    setLoadingMore(true);
    const nextOffset = offsetRef.current + ACTIVITY_PAGE;
    const res = await fetchBusActivity(user.id, {
      keyword, from: from || undefined, to: to || undefined,
      types: filters.length ? filters : undefined,
      offset: nextOffset, limit: ACTIVITY_PAGE,
    });
    setLoadingMore(false);
    if (res.error) { setError(res.error); return; }
    offsetRef.current = nextOffset;
    setRows((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      return [...prev, ...res.rows.filter((r) => !seen.has(r.id))];
    });
    setHasMore(res.hasMore);
    if (!res.rows.length) flash('No older events in this window.');
  };

  const handleRefresh = async () => {
    await pullBusNow();
    await load();
    flash('Relay ledger refreshed.');
  };

  const resetFilters = () => {
    setKeywordInput('');
    setKeyword('');
    setFrom('');
    setTo('');
    setFilters([]);
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
    publishBus('command', { text, replayOf: row.id, origin: 'remote-activity' }, 'desktop');
    onOpenAgent();
    void load(true);
  };

  const handleSaveShortcut = async (row: BusActivityRow) => {
    if (!user) return;
    const text = commandText(row) || summarizePayload(row);
    setSavingId(row.id);
    const { error: err } = await saveCommand(user.id, text, shortcutLabel(text));
    setSavingId(null);
    if (err) { setError(err); return; }
    flash(`Saved “${shortcutLabel(text)}” — it now appears on the phone remote and Copilot.`);
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
    setCounts({});
    setHasMore(false);
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
              {' '}showing {rows.length}{hasMore ? '+' : ''}, {mobileCount} from a phone.
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

        {/* Search + date range */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-white/12 bg-black/25 px-3 py-2 focus-within:border-[var(--m-accent)]">
            <Search className="h-3.5 w-3.5 shrink-0 text-white/30" />
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Search payload text, labels, type or source…"
              className="min-w-0 flex-1 bg-transparent text-[12.5px] text-white placeholder:text-white/25 outline-none"
            />
            {keywordInput && (
              <button onClick={() => setKeywordInput('')} className="text-white/30 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setRangeOpen((v) => !v)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11.5px] font-medium transition ${from || to ? 'border-[var(--m-accent)]/50 bg-[var(--m-accent)]/12 text-white' : 'border-white/12 text-white/55 hover:text-white'}`}
          >
            <CalendarRange className="h-3.5 w-3.5" />
            {from || to ? `${from || 'start'} → ${to || 'now'}` : 'Date range'}
            <ChevronDown className={`h-3.5 w-3.5 transition ${rangeOpen ? 'rotate-180' : ''}`} />
          </button>
          {filtersActive && (
            <button
              onClick={resetFilters}
              className="rounded-xl border border-white/12 px-3 py-2 text-[11.5px] text-white/45 transition hover:text-white"
            >
              Reset
            </button>
          )}
        </div>

        {rangeOpen && (
          <div className="mt-2 flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <label className="text-[10px] uppercase tracking-wider text-white/40">
              From
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 block rounded-lg border border-white/12 bg-black/35 px-2.5 py-1.5 text-[12px] text-white outline-none focus:border-[var(--m-accent)]"
              />
            </label>
            <label className="text-[10px] uppercase tracking-wider text-white/40">
              To
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 block rounded-lg border border-white/12 bg-black/35 px-2.5 py-1.5 text-[12px] text-white outline-none focus:border-[var(--m-accent)]"
              />
            </label>
            <div className="flex gap-1.5">
              {[
                { label: 'Last 7 days', days: 7 },
                { label: 'Last 30 days', days: 30 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - p.days);
                    setFrom(start.toISOString().slice(0, 10));
                    setTo(end.toISOString().slice(0, 10));
                  }}
                  className="rounded-lg border border-white/12 px-2.5 py-1.5 text-[11px] text-white/55 transition hover:text-white"
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => { setFrom(''); setTo(''); }}
                className="rounded-lg border border-white/12 px-2.5 py-1.5 text-[11px] text-white/45 transition hover:text-white"
              >
                Clear dates
              </button>
            </div>
          </div>
        )}

        {/* Type filters */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilters([])}
            className={`rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition ${filters.length === 0 ? 'border-[var(--m-accent)]/50 bg-[var(--m-accent)]/15 text-white' : 'border-white/12 text-white/45 hover:text-white'}`}
          >
            All ({totalKnown})
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
        ) : !rows.length ? (
          <div className="mt-10 rounded-2xl border border-dashed border-white/12 p-8 text-center">
            <Inbox className="mx-auto h-6 w-6 text-white/25" />
            <p className="mt-2 text-[12.5px] font-medium text-white/70">
              {filtersActive ? 'No events match this search window.' : 'No relay events yet.'}
            </p>
            <p className="mt-1 text-[11.5px] text-white/40">
              {filtersActive
                ? 'Widen the date range or clear the keyword to see more.'
                : 'Open the phone remote and send a command — it will land here within a few seconds.'}
            </p>
          </div>
        ) : (
          <>
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
                      const text = commandText(row);
                      const canRerun = RERUNNABLE.includes(row.type) && !!text;
                      const SourceIcon = row.source === 'mobile' ? Smartphone : row.source === 'cloud' ? CloudCog : Monitor;

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
                              <>
                                <button
                                  onClick={() => handleRerun(row)}
                                  title="Re-dispatch this command into the cloud browser runner"
                                  className="flex items-center gap-1 rounded-lg border border-white/12 px-2 py-1 text-[10.5px] font-semibold text-white/65 transition hover:border-[var(--m-accent)]/50 hover:text-white"
                                >
                                  <Play className="h-3 w-3" /> Re-run
                                </button>
                                <button
                                  onClick={() => void handleSaveShortcut(row)}
                                  disabled={savingId === row.id}
                                  title="Save as a one-tap shortcut on the phone remote and Copilot"
                                  className="flex items-center gap-1 rounded-lg border border-white/12 px-2 py-1 text-[10.5px] font-semibold text-white/55 transition hover:border-emerald-400/45 hover:text-emerald-200 disabled:opacity-40"
                                >
                                  {savingId === row.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bookmark className="h-3 w-3" />}
                                  Save
                                </button>
                              </>
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

            <div className="mt-6 flex justify-center pb-4">
              {hasMore ? (
                <button
                  onClick={() => void loadOlder()}
                  disabled={loadingMore}
                  className="flex items-center gap-2 rounded-xl border border-white/14 px-4 py-2 text-[12px] font-semibold text-white/70 transition hover:border-[var(--m-accent)]/50 hover:text-white disabled:opacity-50"
                >
                  {loadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  Load older events
                </button>
              ) : (
                <p className="text-[11px] text-white/25">End of the relay ledger for this window.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RemoteActivity;
