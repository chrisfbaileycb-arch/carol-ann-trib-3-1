import React, { useEffect, useState } from 'react';
import { Bot, ShieldAlert, Check, X, Sparkles, ArrowRight, ExternalLink, Play, ShoppingCart, Scissors, Dumbbell, Plane } from 'lucide-react';
import {
  subscribeCopilot, getActiveTask, pendingStep, approveStep, denyStep,
  delegateToCopilot, type CopilotTask, type CopilotStep,
} from '@/lib/copilotSession';

interface Props {
  className?: string;
  isLight?: boolean;
  onOpenFullSheet: () => void;
}

export const BrowserCopilotSpotlight: React.FC<Props> = ({
  className = '',
  isLight = false,
  onOpenFullSheet,
}) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    return subscribeCopilot(() => {
      setTick((t) => t + 1);
    });
  }, []);

  const task: CopilotTask | null = getActiveTask();
  const gate: CopilotStep | null = pendingStep(task);
  const stepIndex = task && gate ? task.steps.findIndex((s) => s.id === gate.id) : -1;

  const quickStarters = [
    { label: 'Whole Foods delivery', icon: ShoppingCart, prompt: 'Order Whole Foods grocery essentials delivery' },
    { label: 'Reserve hair salon', icon: Scissors, prompt: 'Book hair salon blowout appointment' },
    { label: 'Schedule gym session', icon: Dumbbell, prompt: 'Book fitness club training class' },
    { label: 'Flight check-in', icon: Plane, prompt: 'Check upcoming flight status and terminal' },
  ];

  const handleLaunch = (prompt: string) => {
    delegateToCopilot(prompt, { from: 'mobile' });
    onOpenFullSheet();
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-4 sm:p-5 transition-all duration-300 shadow-lg ${
        gate
          ? isLight
            ? 'border-amber-400 bg-amber-50/95 ring-4 ring-amber-400/25 text-slate-900 shadow-amber-500/15'
            : 'border-amber-400/80 bg-gradient-to-br from-amber-500/20 via-zinc-900/90 to-black ring-4 ring-amber-400/20 text-white shadow-amber-500/20'
          : isLight
            ? 'border-[var(--m-accent)]/40 bg-gradient-to-br from-white via-slate-50 to-[var(--m-accent)]/5 text-slate-900 ring-2 ring-[var(--m-accent)]/20 shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
            : 'border-[var(--m-accent)]/60 bg-gradient-to-br from-[var(--m-accent)]/20 via-zinc-900/90 to-black text-white ring-2 ring-[var(--m-accent)]/30 shadow-[0_0_30px_rgba(139,95,191,0.22)]'
      } ${className}`}
    >
      {/* Lit-up ambient neon glow effect */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-2xl opacity-60 transition-opacity"
        style={{
          background: gate ? '#F59E0B' : 'var(--m-accent, #8B5FBF)',
        }}
      />

      {/* Top row: Status header */}
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                gate ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${
                gate ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </span>

          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
              gate
                ? isLight
                  ? 'border-amber-300 bg-amber-100 text-amber-900'
                  : 'border-amber-400/50 bg-amber-400/20 text-amber-300'
                : isLight
                  ? 'border-[var(--m-accent)]/30 bg-[var(--m-accent)]/10 text-[var(--m-accent)]'
                  : 'border-[var(--m-accent)]/50 bg-[var(--m-accent)]/20 text-white'
            }`}
          >
            Carol Ann OS
          </span>

          <span className={`text-[11px] font-bold ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
            Browser Agent Co-pilot
          </span>
        </div>

        <button
          onClick={onOpenFullSheet}
          className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition shadow-sm ${
            isLight
              ? 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <span>Open Console</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Main Title & Description */}
      <div className="relative mt-3 flex items-start gap-3">
        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border shadow-md transition ${
            gate
              ? 'border-amber-400/60 bg-amber-500/20 text-amber-500 animate-pulse'
              : 'border-[var(--m-accent)]/60 bg-[var(--m-accent)]/20 text-[var(--m-accent)]'
          }`}
        >
          <Bot className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className={`text-base font-black tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
              {task ? task.title : 'Autonomous Web Automation'}
            </h3>
            <Sparkles className="h-4 w-4 text-[var(--m-accent)] animate-pulse" />
          </div>
          <p className={`mt-0.5 text-xs leading-relaxed font-medium ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
            {task
              ? `Status: ${task.status.toUpperCase()} · Step ${(task.cursor ?? 0) + 1} of ${task.steps.length} on ${task.provider || 'remote browser'}`
              : 'Step-by-step browser bookings and web errands. Zero actions advance without your explicit tap.'}
          </p>
        </div>
      </div>

      {/* Active Permission Gate Banner — LIT UP ALERT */}
      {task && gate && (
        <div
          className={`relative mt-3.5 rounded-2xl border p-3.5 shadow-md ${
            isLight
              ? 'border-amber-300 bg-amber-100/90 text-slate-900'
              : 'border-amber-400/60 bg-amber-950/40 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Permission Requested · Step {stepIndex + 1} of {task.steps.length}
            </span>
          </div>

          <p className={`mt-1 text-xs font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>
            {gate.label}
          </p>
          <p className={`mt-0.5 font-mono text-[11px] ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            {gate.command}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => approveStep(task.id, 'mobile')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl m-gradient-bg px-3.5 py-2 text-xs font-black text-white shadow-md hover:brightness-110 active:scale-95 transition"
            >
              <Check className="h-4 w-4" /> Allow this step
            </button>
            <button
              onClick={() => denyStep(task.id, 'mobile')}
              className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                isLight
                  ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  : 'border-white/20 bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              <X className="h-4 w-4" /> Deny
            </button>
          </div>
        </div>
      )}

      {/* Quick Launch Starters (When idle or wanting to run a new automation) */}
      {!gate && (
        <div className="relative mt-3.5 pt-3 border-t border-slate-200/50 dark:border-white/10">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/50'} mb-2 flex items-center gap-1`}>
            <Play className="h-2.5 w-2.5 text-[var(--m-accent)]" /> 1-Tap Browser Automation Starters:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickStarters.map((s) => (
              <button
                key={s.label}
                onClick={() => handleLaunch(s.prompt)}
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs font-bold transition shadow-sm ${
                  isLight
                    ? 'border-slate-200 bg-white/90 text-slate-900 hover:border-[var(--m-accent)]/50 hover:bg-white'
                    : 'border-white/12 bg-white/[0.06] text-white hover:bg-white/12'
                }`}
              >
                <s.icon className="h-3.5 w-3.5 text-[var(--m-accent)] shrink-0" />
                <span className="truncate">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowserCopilotSpotlight;
