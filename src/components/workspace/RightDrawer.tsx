import React, { useState } from 'react';
import {
  ListOrdered, Terminal, FileText, ShieldAlert, CheckCircle2,
  Clock, Trash2, Check, Copy, ExternalLink, ChevronRight,
  Sparkles, CheckSquare, Calendar, AlertTriangle,
  Cpu, ArrowRight, Eye, ShieldCheck, Lock, ShoppingCart
} from 'lucide-react';
import type { ErrandTask, HydrateFormAction, UserProfile } from '@/data/schemas';
import { isLightTheme } from '@/data/intake';

interface RightDrawerProps {
  errands: ErrandTask[];
  onUpdateErrand: (errand: ErrandTask) => void;
  onDeleteErrand: (id: string) => void;
  onAddErrand: (errand: Partial<ErrandTask>) => void;
  actions: HydrateFormAction[];
  onConfirmAction: (action: HydrateFormAction) => void;
  scratchpad: string;
  onChangeScratchpad: (text: string) => void;
  onClose: () => void;
  profile?: UserProfile;
}

export type BrowserEngine = 'gemini-flash' | 'claude-browser' | 'gpt-tools';

export const RightDrawer: React.FC<RightDrawerProps> = ({
  errands,
  onUpdateErrand,
  onDeleteErrand,
  onAddErrand,
  actions,
  onConfirmAction,
  scratchpad,
  onChangeScratchpad,
  onClose,
  profile,
}) => {
  const isLight = profile ? isLightTheme(profile) : false;
  const [activeTab, setActiveTab] = useState<'errands' | 'functions' | 'scratchpad' | 'confirmations'>('errands');
  const [engine, setEngine] = useState<BrowserEngine>('gemini-flash');
  const [copied, setCopied] = useState(false);

  const pendingActions = actions.filter((a) => a.status === 'pending_confirmation');

  const handleCopyScratchpad = () => {
    navigator.clipboard.writeText(scratchpad);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex h-full flex-col backdrop-blur-md select-none border-l transition-colors ${
      isLight ? 'bg-white/75 text-slate-800 border-rose-200/60' : 'bg-zinc-950/80 text-white border-white/8'
    }`}>
      {/* Engine Switcher Header Bar */}
      <div className={`flex shrink-0 items-center justify-between border-b px-3.5 py-2.5 backdrop-blur-md ${
        isLight ? 'border-rose-200/60 bg-white/70' : 'border-white/8 bg-zinc-950/60'
      }`}>
        <div className="flex items-center gap-1.5">
          <Terminal className="h-4 w-4 text-sky-500" />
          <span className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Execution Co-Pilot</span>
        </div>

        {/* Engine Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] uppercase font-mono font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Engine:</span>
          <select
            value={engine}
            onChange={(e) => setEngine(e.target.value as BrowserEngine)}
            className={`rounded-md border px-2 py-0.5 text-xs font-medium outline-none cursor-pointer ${
              isLight
                ? 'border-rose-200 bg-white text-sky-700 shadow-xs'
                : 'border-white/15 bg-black/60 text-sky-300'
            }`}
          >
            <option value="gemini-flash">⚡ Gemini 2.0 (Native)</option>
            <option value="claude-browser">🧠 Claude 3.7 (Browser)</option>
            <option value="gpt-tools">🤖 GPT-4o (Tools)</option>
          </select>
        </div>
      </div>

      {/* Drawer Header Tabs */}
      <div className={`flex shrink-0 items-center justify-between border-b px-2 py-1.5 overflow-x-auto backdrop-blur-md ${
        isLight ? 'border-rose-200/60 bg-white/60' : 'border-white/8 bg-zinc-950/40'
      }`}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('errands')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'errands'
                ? isLight
                  ? 'bg-white text-slate-900 font-semibold shadow-xs border border-rose-200'
                  : 'bg-white/15 text-white font-semibold shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-white/65 hover:text-white'
            }`}
          >
            <ListOrdered className="h-3.5 w-3.5 text-sky-500" />
            <span>Errands ({errands.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('functions')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'functions'
                ? isLight
                  ? 'bg-white text-slate-900 font-semibold shadow-xs border border-rose-200'
                  : 'bg-white/15 text-white font-semibold shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-white/65 hover:text-white'
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-emerald-500" />
            <span>Tools ({actions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('scratchpad')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'scratchpad'
                ? isLight
                  ? 'bg-white text-slate-900 font-semibold shadow-xs border border-rose-200'
                  : 'bg-white/15 text-white font-semibold shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-white/65 hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-amber-500" />
            <span>Notes</span>
          </button>

          {pendingActions.length > 0 && (
            <button
              onClick={() => setActiveTab('confirmations')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition whitespace-nowrap ${
                activeTab === 'confirmations'
                  ? isLight
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-amber-500/25 text-amber-200 border border-amber-500/50'
                  : 'text-amber-500 hover:text-amber-700 animate-pulse'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Confirm ({pendingActions.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Drawer Content Body */}
      <div className="m-scroll flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tab 1: Active Errand Queues */}
        {activeTab === 'errands' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                Live Automation Queues
              </span>
              <button
                onClick={() =>
                  onAddErrand({
                    target: 'custom',
                    title: 'New Staged Errand',
                    items: ['Item 1'],
                    status: 'draft',
                  })
                }
                className={`rounded border px-2 py-0.5 text-[10px] transition ${
                  isLight
                    ? 'border-rose-200 bg-white/80 text-slate-700 hover:bg-white'
                    : 'border-white/10 bg-white/[0.04] text-white/60 hover:text-white'
                }`}
              >
                + Add Errand
              </button>
            </div>

            {errands.map((errand) => (
              <div
                key={errand.id}
                className={`rounded-xl border p-3.5 transition ${
                  isLight
                    ? 'border-rose-200/80 bg-white/80 text-slate-800 shadow-xs hover:border-rose-300'
                    : 'border-white/8 bg-white/[0.03] hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {errand.target === 'whole-foods' ? (
                      <ShoppingCart className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Calendar className="h-4 w-4 text-sky-500" />
                    )}
                    <span className={`text-[12.5px] font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{errand.title}</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9.5px] font-medium uppercase tracking-wider ${
                      errand.status === 'completed'
                        ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : errand.status === 'queued'
                        ? 'border border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-300'
                        : isLight
                        ? 'border border-slate-200 bg-slate-100 text-slate-600'
                        : 'border border-white/10 bg-white/[0.04] text-white/50'
                    }`}
                  >
                    {errand.status}
                  </span>
                </div>

                {errand.scheduled_time && (
                  <p className={`mt-1 text-[10.5px] flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
                    <Clock className="h-3 w-3" /> {errand.scheduled_time}
                  </p>
                )}

                <div className="mt-2.5 space-y-1">
                  {errand.items.map((item, idx) => (
                    <div key={idx} className={`flex items-center gap-2 text-[11.5px] ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isLight ? 'bg-rose-300' : 'bg-white/20'}`} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className={`mt-3.5 flex items-center justify-between border-t pt-2 text-[10px] ${isLight ? 'border-rose-100' : 'border-white/6'}`}>
                  <span className={`font-mono uppercase ${isLight ? 'text-slate-400' : 'text-white/35'}`}>Domain: {errand.target}</span>
                  <div className="flex items-center gap-2">
                    {errand.status !== 'completed' && (
                      <button
                        onClick={() =>
                          onUpdateErrand({
                            ...errand,
                            status: errand.status === 'draft' ? 'queued' : 'completed',
                          })
                        }
                        className="rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/25 transition"
                      >
                        {errand.status === 'draft' ? 'Dispatch' : 'Mark Done'}
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteErrand(errand.id)}
                      className={`p-0.5 transition ${isLight ? 'text-slate-400 hover:text-rose-600' : 'text-white/30 hover:text-rose-400'}`}
                      title="Delete errand"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Real-time Function Outputs */}
        {activeTab === 'functions' && (
          <div className="space-y-3">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
              Tool Calling Stream (hydrate_form_or_errand)
            </span>

            {actions.length === 0 ? (
              <div className={`rounded-xl border p-6 text-center text-[11px] ${
                isLight ? 'border-rose-200 bg-white/75 text-slate-500' : 'border-white/8 bg-white/[0.02] text-white/40'
              }`}>
                No function tool calls yet. Ask Carol Ann to book an appointment or stage an errand.
              </div>
            ) : (
              actions.map((act) => (
                <div
                  key={act.id}
                  className={`rounded-xl border p-3 text-[11px] font-mono ${
                    isLight ? 'border-rose-200/80 bg-white/80 text-slate-800 shadow-xs' : 'border-white/8 bg-black/40'
                  }`}
                >
                  <div className={`flex items-center justify-between pb-1.5 border-b ${isLight ? 'border-rose-100' : 'border-white/8'}`}>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{act.action_name}</span>
                    <span
                      className={`text-[9.5px] uppercase ${
                        act.status === 'executed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>
                  <pre className={`mt-2 text-[10px] overflow-x-auto p-1.5 rounded ${
                    isLight ? 'bg-rose-50/50 text-slate-700 border border-rose-100' : 'bg-white/[0.02] text-white/70'
                  }`}>
                    {JSON.stringify(act.form_payload, null, 2)}
                  </pre>
                  <div className={`mt-2 flex items-center justify-between text-[9px] ${isLight ? 'text-slate-400' : 'text-white/35'}`}>
                    <span>Category: {act.category}</span>
                    <span>{new Date(act.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Live Scratchpad State */}
        {activeTab === 'scratchpad' && (
          <div className="flex h-full flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                Live Markdown Scratchpad
              </span>
              <button
                onClick={handleCopyScratchpad}
                className={`flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] transition ${
                  isLight
                    ? 'border-rose-200 bg-white text-slate-700 hover:bg-rose-50'
                    : 'border-white/10 bg-white/[0.04] text-white/60 hover:text-white'
                }`}
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <textarea
              value={scratchpad}
              onChange={(e) => onChangeScratchpad(e.target.value)}
              placeholder="Live scratchpad synced across your sovereign workspace..."
              className={`m-scroll w-full flex-1 resize-none rounded-xl border p-3 text-[12px] outline-none font-mono leading-relaxed focus:border-[var(--m-accent)]/50 min-h-[260px] ${
                isLight
                  ? 'border-rose-200/80 bg-white/80 text-slate-800 placeholder:text-slate-400 shadow-xs'
                  : 'border-white/10 bg-white/[0.02] text-white/90 placeholder:text-white/25'
              }`}
            />
          </div>
        )}

        {/* Tab 4: Pending Confirmations */}
        {activeTab === 'confirmations' && (
          <div className="space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300">
              Affirmative Confirmations Required
            </span>

            {pendingActions.map((act) => (
              <div
                key={act.id}
                className={`rounded-xl border p-3.5 space-y-2 ${
                  isLight
                    ? 'border-amber-300 bg-amber-50/90 text-slate-800 shadow-xs'
                    : 'border-amber-500/30 bg-amber-500/10'
                }`}
              >
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-300 text-[12px] font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{act.action_name}</span>
                </div>
                <p className={`text-[11.5px] ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                  Target Domain: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{act.category}</strong>
                </p>
                <div className={`rounded p-2 text-[10.5px] font-mono ${
                  isLight ? 'bg-white border border-amber-200 text-slate-800' : 'bg-black/30 text-white/70'
                }`}>
                  {act.form_payload.title}
                  {act.form_payload.items && (
                    <ul className="mt-1 list-disc list-inside">
                      {act.form_payload.items.map((it, idx) => (
                        <li key={idx}>{it}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => onConfirmAction(act)}
                    className="flex items-center gap-1.5 rounded-lg m-gradient-bg px-3 py-1.5 text-[11px] font-semibold text-white shadow-md hover:brightness-110"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Authorize & Stage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RightDrawer;

