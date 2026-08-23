import React, { useEffect, useMemo, useState } from 'react';
import {
  Globe, Play, Square, RotateCcw, Check, ChevronRight, Lock, Cloud,
  CircleDot, CheckCircle2, Loader2, Terminal, Trash2,
} from 'lucide-react';
import { CHAIN_LIST } from '@/lib/browserAgent';
import {
  subscribeRunner, getRunnerState, startRun, abortRun, confirmRun, selectRun, clearLog,
} from '@/lib/agentRunner';
import type { AgentRun } from '@/data/schemas';

const StatusDot: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'running') return <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--m-accent-soft)]" />;
  if (status === 'done') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
  if (status === 'failed') return <Square className="h-3.5 w-3.5 text-rose-400" />;
  return <CircleDot className="h-3.5 w-3.5 text-white/20" />;
};

export const BrowserViewport: React.FC = () => {
  const [, force] = useState(0);
  useEffect(() => subscribeRunner(() => force((n) => n + 1)), []);

  const { runs, activeRunId, log } = getRunnerState();
  const active: AgentRun | null = useMemo(
    () => runs.find((r) => r.id === activeRunId) ?? runs[0] ?? null,
    [runs, activeRunId],
  );

  const progress = active ? Math.round((active.actions.filter((a) => a.status === 'done').length / active.actions.length) * 100) : 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#101118]">
      {/* Chrome / URL bar */}
      <div className="shrink-0 border-b border-white/8 bg-[#16171F] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 pr-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-[#0D0E14] px-3 py-1.5">
            <Lock className="h-3 w-3 text-emerald-400/80" />
            <span className="truncate font-mono text-[11px] text-white/60">
              {active?.url ?? 'about:blank — cloud runner idle'}
            </span>
            {active?.status === 'running' && (
              <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-[var(--m-accent-soft)]">
                <Loader2 className="h-3 w-3 animate-spin" /> executing
              </span>
            )}
          </div>
          <span className="hidden items-center gap-1 rounded-md border border-emerald-400/25 bg-emerald-400/8 px-2 py-1 text-[10px] font-semibold text-emerald-300 sm:flex">
            <Cloud className="h-3 w-3" /> us-west-2
          </span>
        </div>
      </div>

      {/* Chain launcher */}
      <div className="m-scroll shrink-0 flex gap-2 overflow-x-auto border-b border-white/8 bg-[#13141B] px-3 py-2.5">
        {CHAIN_LIST.map((c) => (
          <button
            key={c.key}
            onClick={() => startRun(c.key)}
            className="group shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-left transition hover:border-[var(--m-accent)]/50 hover:bg-[var(--m-accent)]/10"
          >
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/75 group-hover:text-white">
              <Play className="h-3 w-3" /> {c.title}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-white/30">{c.provider}</span>
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto] lg:grid-cols-[1fr_320px] lg:grid-rows-1">
        {/* Viewport / DOM inspector */}
        <div className="m-scroll min-h-0 overflow-y-auto p-4">
          {!active ? (
            <div className="grid h-full place-items-center rounded-xl border border-dashed border-white/10 p-10 text-center">
              <div>
                <Globe className="mx-auto h-8 w-8 text-white/20" />
                <p className="mt-3 font-display text-lg text-white/70">Cloud browser is warm and idle</p>
                <p className="mt-1 text-xs text-white/35">Launch a chain above, or say an errand out loud in the rail.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Simulated page render */}
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0B0C11]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[var(--m-accent-soft)]/50 m-scanline" />
                <div className="border-b border-white/8 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-white/35">
                  Remote viewport · {active.title}
                </div>
                <div className="space-y-2 p-4 font-mono text-[11px]">
                  {active.actions.map((a, i) => (
                    <div
                      key={a.id}
                      className={`rounded-md border px-3 py-2 transition ${
                        a.status === 'running'
                          ? 'border-[var(--m-accent)]/50 bg-[var(--m-accent)]/10'
                          : a.status === 'done'
                            ? 'border-emerald-400/20 bg-emerald-400/[0.04]'
                            : 'border-white/6 bg-white/[0.015] opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-white/25">{String(i + 1).padStart(2, '0')}</span>
                        <StatusDot status={a.status} />
                        <span className="truncate text-white/70">{a.command}</span>
                      </div>
                      {a.status === 'done' && (
                        <p className="mt-1 pl-8 text-[10px] text-emerald-300/80">→ {a.output}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* DOM step inspector */}
              <div className="rounded-xl border border-white/10 bg-[#14151C]">
                <div className="flex items-center justify-between border-b border-white/8 px-4 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">DOM step inspector</span>
                  <span className="text-[10px] text-white/35">{progress}% complete</span>
                </div>
                <div className="h-1 w-full bg-white/5">
                  <div className="h-full m-gradient-bg transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <ul className="divide-y divide-white/5">
                  {active.actions.map((a) => (
                    <li key={a.id} className="flex items-start gap-3 px-4 py-2.5">
                      <StatusDot status={a.status} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-white/80">{a.step}</p>
                        <p className="truncate text-[10px] text-white/35">{a.output || 'awaiting execution…'}</p>
                      </div>
                      <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-white/15" />
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2 border-t border-white/8 px-4 py-3">
                  <button
                    onClick={() => confirmRun(active.id)}
                    disabled={active.status !== 'done'}
                    className="flex items-center gap-1.5 rounded-lg m-gradient-bg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-30"
                  >
                    <Check className="h-3.5 w-3.5" /> Confirm & submit
                  </button>
                  <button
                    onClick={() => abortRun(active.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-rose-400/40 hover:text-rose-300"
                  >
                    <Square className="h-3.5 w-3.5" /> Abort
                  </button>
                  <button
                    onClick={() => startRun(active.chainKey)}
                    className="flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-white/30 hover:text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Re-run chain
                  </button>
                </div>
              </div>

              {/* Run history */}
              {runs.length > 1 && (
                <div className="rounded-xl border border-white/10 bg-[#14151C] p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Session runs</p>
                  <div className="flex flex-wrap gap-2">
                    {runs.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => selectRun(r.id)}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] transition ${
                          r.id === active.id ? 'border-[var(--m-accent)]/50 bg-[var(--m-accent)]/12 text-white' : 'border-white/10 text-white/45 hover:text-white'
                        }`}
                      >
                        {r.title} · {r.status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action log */}
        <div className="flex min-h-0 flex-col border-t border-white/8 lg:border-l lg:border-t-0">
          <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-3 py-2">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              <Terminal className="h-3 w-3" /> Action log
            </span>
            <button onClick={clearLog} className="text-white/30 transition hover:text-white/70">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <div className="m-scroll max-h-56 min-h-0 flex-1 space-y-1 overflow-y-auto p-3 font-mono text-[10.5px] lg:max-h-none">
            {log.map((l) => (
              <div
                key={l.id}
                className={`m-log-entry flex gap-2 ${
                  l.level === 'success' ? 'text-emerald-300/85'
                    : l.level === 'action' ? 'text-[var(--m-accent-soft)]'
                      : l.level === 'warn' ? 'text-amber-300/85'
                        : 'text-white/40'
                }`}
              >
                <span className="shrink-0 text-white/20">{new Date(l.ts).toLocaleTimeString([], { hour12: false })}</span>
                <span className="min-w-0 break-words">{l.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserViewport;
