import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, ShieldQuestion, Check, X, Bot, Smartphone, Monitor, Trash2, Cloud } from 'lucide-react';
import {
  subscribeCopilot, getCopilotState, sendToCopilot, approveStep, denyStep,
  pendingStep, selectTask, clearCopilotThread, cancelTask,
  type CopilotSurface, type CopilotTask,
} from '@/lib/copilotSession';
import { useCarol } from '@/contexts/CarolContext';
import { isLightTheme } from '@/data/intake';

/**
 * The browser co-pilot's own chat interface. The exact same thread renders on
 * the desktop sandbox rail and on the phone, and every step of a booking waits
 * here for an explicit Allow / Deny from whichever surface the operator holds.
 */
interface CopilotChatProps {
  surface?: CopilotSurface;
  className?: string;
  isLight?: boolean;
}

const CopilotChat: React.FC<CopilotChatProps> = ({
  surface = 'desktop',
  className = '',
  isLight,
}) => {
  const { profile } = useCarol();
  const light = isLight !== undefined ? isLight : isLightTheme(profile);

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
    <div className={`flex h-full min-h-0 flex-col ${light ? 'bg-white text-slate-900' : 'bg-transparent text-white'} ${className}`}>
      {/* Header */}
      <div className={`flex shrink-0 items-center justify-between border-b px-3.5 py-2.5 ${light ? 'border-slate-200 bg-slate-50/80' : 'border-white/10'}`}>
        <span className={`flex items-center gap-1.5 text-xs font-bold ${light ? 'text-slate-800' : 'text-white/80'}`}>
          <Bot className="h-4 w-4 text-[var(--m-accent)]" />
          <span className="font-extrabold">Carol Ann OS</span>
          <span className="text-[10px] uppercase font-bold text-[var(--m-accent)]">Co-pilot</span>
          <span className={`ml-1 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
            light ? 'border-slate-300 bg-white text-slate-700' : 'border-white/15 bg-white/5 text-white/70'
          }`}>
            {surface === 'mobile' ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
            mirrored to {surface === 'mobile' ? 'desktop' : 'phone'}
          </span>
        </span>
        <button
          onClick={clearCopilotThread}
          title="Clear this thread — it is yours to delete"
          className={`rounded-lg border p-1.5 transition ${
            light ? 'border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'border-white/15 text-white/40 hover:text-white'
          }`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Task tabs */}
      {tasks.length > 1 && (
        <div className={`m-scroll flex shrink-0 gap-1.5 overflow-x-auto border-b px-3.5 py-2 ${light ? 'border-slate-200 bg-slate-50/50' : 'border-white/10'}`}>
          {tasks.map((t) => (
            <button
              key={t.id}
              onClick={() => selectTask(t.id)}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                t.id === task?.id
                  ? light
                    ? 'border-[var(--m-accent)] bg-[var(--m-accent)]/10 text-slate-900 shadow-sm'
                    : 'border-[var(--m-accent)]/60 bg-[var(--m-accent)]/20 text-white'
                  : light
                    ? 'border-slate-200 bg-white text-slate-700'
                    : 'border-white/10 text-white/60'
              }`}
            >
              {t.title.slice(0, 22)} · {t.status}
            </button>
          ))}
        </div>
      )}

      {/* Thread */}
      <div className="m-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[86%] rounded-2xl border px-3.5 py-2.5 text-xs leading-relaxed font-medium ${
                m.role === 'user'
                  ? light
                    ? 'border-[var(--m-accent)]/40 bg-[var(--m-accent)]/15 text-slate-950 shadow-sm'
                    : 'border-[var(--m-accent)]/40 bg-[var(--m-accent)]/20 text-white'
                  : m.role === 'system'
                    ? light
                      ? 'border-slate-200 bg-slate-50 text-slate-600'
                      : 'border-white/10 bg-white/[0.04] text-white/70'
                    : light
                      ? 'border-slate-200/90 bg-white text-slate-900 shadow-sm'
                      : 'border-white/15 bg-zinc-900/80 text-white/90'
              }`}
            >
              {m.agentName && m.role === 'copilot' && (
                <span className={`mb-1 block text-[10px] font-bold uppercase tracking-wider ${light ? 'text-slate-500' : 'text-white/50'}`}>via {m.agentName}</span>
              )}
              {m.text}
              <span className={`mt-1 flex items-center gap-1 text-[10px] ${light ? 'text-slate-400' : 'text-white/40'}`}>
                {m.from === 'mobile' ? <Smartphone className="h-3 w-3" /> : m.from === 'cloud' ? <Cloud className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                {new Date(m.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Permission gate — the co-pilot cannot pass this without you */}
      {task && gate && (
        <div className={`shrink-0 border-t px-3.5 py-3 ${light ? 'border-amber-200 bg-amber-50 text-slate-900' : 'border-[var(--m-accent)]/30 bg-[var(--m-accent)]/[0.08] text-white'}`}>
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--m-accent)]">
            <ShieldQuestion className="h-4 w-4" /> Permission needed · step {stepIndex + 1} of {task.steps.length}
          </p>
          <p className={`mt-1 text-xs font-bold ${light ? 'text-slate-950' : 'text-white'}`}>{gate.label}</p>
          <p className={`font-mono text-[11px] ${light ? 'text-slate-600' : 'text-white/60'}`}>{gate.command}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              onClick={() => approveStep(task.id, surface)}
              className="flex items-center gap-1.5 rounded-lg m-gradient-bg px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:brightness-110 active:scale-95 transition"
            >
              <Check className="h-3.5 w-3.5" /> Allow this step
            </button>
            <button
              onClick={() => denyStep(task.id, surface)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                light ? 'border-slate-300 bg-white text-slate-700 hover:border-rose-400 hover:text-rose-600' : 'border-white/20 text-white/80 hover:border-rose-400/50 hover:text-rose-300'
              }`}
            >
              <X className="h-3.5 w-3.5" /> Not now
            </button>
            <button
              onClick={() => cancelTask(task.id, surface)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                light ? 'border-slate-300 text-slate-600 hover:text-slate-950' : 'border-white/15 text-white/60 hover:text-white'
              }`}
            >
              Cancel job
            </button>
          </div>
          <p className={`mt-1.5 text-[10px] ${light ? 'text-slate-500' : 'text-white/50'}`}>
            Answer from this screen or your other device — both stay in sync. Nothing is submitted without a tap.
          </p>
        </div>
      )}

      {/* Plan strip */}
      {task && (
        <div className={`m-scroll shrink-0 border-t px-3.5 py-2 ${light ? 'border-slate-200 bg-slate-50/50' : 'border-white/10'}`}>
          <div className="flex flex-wrap gap-1.5">
            {task.steps.map((s, i) => (
              <span
                key={s.id}
                title={s.label}
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  s.status === 'done'
                    ? light
                      ? 'border-emerald-600/40 bg-emerald-50 text-emerald-900'
                      : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                    : s.status === 'awaiting'
                      ? light
                        ? 'border-[var(--m-accent)] bg-[var(--m-accent)]/10 text-slate-900'
                        : 'border-[var(--m-accent)]/50 bg-[var(--m-accent)]/15 text-white'
                      : s.status === 'denied'
                        ? 'border-rose-400/40 text-rose-600'
                        : light
                          ? 'border-slate-200 bg-white text-slate-500'
                          : 'border-white/10 text-white/40'
                }`}
              >
                {i + 1}. {s.label.slice(0, 18)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      <div className={`flex shrink-0 items-center gap-2 border-t px-3.5 py-2.5 ${light ? 'border-slate-200 bg-slate-50/80' : 'border-white/10'}`}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Ask the co-pilot to book something…"
          className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-xs font-medium outline-none transition ${
            light
              ? 'border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus:border-[var(--m-accent)]'
              : 'border-white/15 bg-white/[0.05] text-white placeholder:text-white/50 focus:border-[var(--m-accent)]/70'
          }`}
        />
        <button onClick={submit} className="grid h-8 w-8 shrink-0 place-items-center rounded-xl m-gradient-bg text-white shadow-sm hover:brightness-110 active:scale-95 transition">
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default CopilotChat;
