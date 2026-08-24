import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, ShieldQuestion, Check, X, Bot, Smartphone, Monitor, Trash2, Cloud } from 'lucide-react';
import {
  subscribeCopilot, getCopilotState, sendToCopilot, approveStep, denyStep,
  pendingStep, selectTask, clearCopilotThread, cancelTask,
  type CopilotSurface, type CopilotTask,
} from '@/lib/copilotSession';

/**
 * The browser co-pilot's own chat interface. The exact same thread renders on
 * the desktop sandbox rail and on the phone, and every step of a booking waits
 * here for an explicit Allow / Deny from whichever surface the operator holds.
 */
const CopilotChat: React.FC<{ surface?: CopilotSurface; className?: string }> = ({
  surface = 'desktop',
  className = '',
}) => {
  const [, force] = useState(0);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeCopilot(() => force((n) => n + 1)), []);

  const { messages, tasks, activeTaskId } = getCopilotState();
  const task: CopilotTask | null = useMemo(
    () => tasks.find((t) => t.id === activeTaskId) ?? tasks[0] ?? null,
    [tasks, activeTaskId],
  );
  const gate = pendingStep(task);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, task?.updatedAt]);

  const submit = () => {
    if (!input.trim()) return;
    sendToCopilot(input, surface);
    setInput('');
  };

  const stepIndex = task && gate ? task.steps.findIndex((s) => s.id === gate.id) : -1;

  return (
    <div className={`flex h-full min-h-0 flex-col ${className}`}>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-3 py-2">
        <span className="flex items-center gap-1.5 text-[10.5px] font-semibold text-white/60">
          <Bot className="h-3.5 w-3.5 text-[var(--m-accent-soft)]" /> Co-pilot chat
          <span className="ml-1 flex items-center gap-1 rounded-full border border-white/12 px-1.5 py-0.5 text-[9px] text-white/40">
            {surface === 'mobile' ? <Smartphone className="h-2.5 w-2.5" /> : <Monitor className="h-2.5 w-2.5" />}
            mirrored to {surface === 'mobile' ? 'desktop' : 'phone'}
          </span>
        </span>
        <button
          onClick={clearCopilotThread}
          title="Clear this thread — it is yours to delete"
          className="rounded-lg border border-white/12 p-1 text-white/35 transition hover:text-white"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Task tabs */}
      {tasks.length > 1 && (
        <div className="m-scroll flex shrink-0 gap-1.5 overflow-x-auto border-b border-white/8 px-3 py-1.5">
          {tasks.map((t) => (
            <button
              key={t.id}
              onClick={() => selectTask(t.id)}
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] transition ${
                t.id === task?.id ? 'border-[var(--m-accent)]/55 bg-[var(--m-accent)]/12 text-white' : 'border-white/10 text-white/40'
              }`}
            >
              {t.title.slice(0, 22)} · {t.status}
            </button>
          ))}
        </div>
      )}

      {/* Thread */}
      <div className="m-scroll min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[86%] rounded-2xl border px-3 py-2 text-[12px] leading-relaxed ${
                m.role === 'user'
                  ? 'border-[var(--m-accent)]/35 bg-[var(--m-accent)]/12 text-white'
                  : m.role === 'system'
                    ? 'border-white/10 bg-white/[0.03] text-white/50'
                    : 'border-white/10 bg-white/[0.04] text-white/80'
              }`}
            >
              {m.agentName && m.role === 'copilot' && (
                <span className="mb-0.5 block text-[9.5px] uppercase tracking-wider text-white/35">via {m.agentName}</span>
              )}
              {m.text}
              <span className="mt-1 flex items-center gap-1 text-[9px] text-white/25">
                {m.from === 'mobile' ? <Smartphone className="h-2.5 w-2.5" /> : m.from === 'cloud' ? <Cloud className="h-2.5 w-2.5" /> : <Monitor className="h-2.5 w-2.5" />}
                {new Date(m.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Permission gate — the co-pilot cannot pass this without you */}
      {task && gate && (
        <div className="shrink-0 border-t border-[var(--m-accent)]/30 bg-[var(--m-accent)]/[0.07] px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--m-accent-soft)]">
            <ShieldQuestion className="h-3.5 w-3.5" /> Permission needed · step {stepIndex + 1} of {task.steps.length}
          </p>
          <p className="mt-1 text-[12px] font-medium text-white">{gate.label}</p>
          <p className="font-mono text-[10px] text-white/40">{gate.command}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => approveStep(task.id, surface)}
              className="flex items-center gap-1.5 rounded-lg m-gradient-bg px-3 py-1.5 text-[11px] font-semibold text-white"
            >
              <Check className="h-3.5 w-3.5" /> Allow this step
            </button>
            <button
              onClick={() => denyStep(task.id, surface)}
              className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-[11px] font-medium text-white/60 transition hover:border-rose-400/50 hover:text-rose-300"
            >
              <X className="h-3.5 w-3.5" /> Not now
            </button>
            <button
              onClick={() => cancelTask(task.id, surface)}
              className="rounded-lg border border-white/12 px-2.5 py-1.5 text-[11px] text-white/40 transition hover:text-white"
            >
              Cancel job
            </button>
          </div>
          <p className="mt-1.5 text-[9.5px] text-white/35">
            Answer from this screen or your other device — both stay in sync. Nothing is submitted without a tap.
          </p>
        </div>
      )}

      {/* Plan strip */}
      {task && (
        <div className="m-scroll shrink-0 border-t border-white/8 px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {task.steps.map((s, i) => (
              <span
                key={s.id}
                title={s.label}
                className={`rounded-full border px-1.5 py-0.5 text-[9px] ${
                  s.status === 'done'
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                    : s.status === 'awaiting'
                      ? 'border-[var(--m-accent)]/50 bg-[var(--m-accent)]/12 text-white'
                      : s.status === 'denied'
                        ? 'border-rose-400/30 text-rose-300'
                        : 'border-white/10 text-white/30'
                }`}
              >
                {i + 1}. {s.label.slice(0, 18)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="flex shrink-0 items-center gap-2 border-t border-white/8 px-3 py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Ask the co-pilot to book something…"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white placeholder:text-white/25 outline-none focus:border-[var(--m-accent)]/60"
        />
        <button onClick={submit} className="grid h-8 w-8 shrink-0 place-items-center rounded-xl m-gradient-bg">
          <Send className="h-3.5 w-3.5 text-white" />
        </button>
      </div>
    </div>
  );
};

export default CopilotChat;
