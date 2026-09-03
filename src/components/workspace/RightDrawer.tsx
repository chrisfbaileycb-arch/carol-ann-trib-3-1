import React, { useState } from 'react';
import {
  ListOrdered, Terminal, FileText, ShieldAlert, CheckCircle2,
  Clock, Play, Trash2, Check, Copy, ExternalLink, ChevronRight,
  Sparkles, RefreshCw, ShoppingCart, Calendar, AlertTriangle,
  Globe, Monitor, Cpu, ArrowRight, Eye, PlayCircle, ShieldCheck
} from 'lucide-react';
import type { ErrandTask, HydrateFormAction } from '@/data/schemas';

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
}) => {
  const [activeTab, setActiveTab] = useState<'browser' | 'errands' | 'functions' | 'scratchpad' | 'confirmations'>('browser');
  const [engine, setEngine] = useState<BrowserEngine>('gemini-flash');
  const [copied, setCopied] = useState(false);
  const [simulatingStep, setSimulatingStep] = useState<number | null>(null);
  const [browserUrl, setBrowserUrl] = useState<string>('https://wholefoods.amazon.com/cart');
  const [domLogs, setDomLogs] = useState<string[]>([
    '[INIT] Browser Engine ready: Gemini 2.0 Flash Native Tool Runner',
    '[BRIDGE] DOM inspector listening on window.sovereignBridge',
    '[STATUS] Zero external cloud telemetry. Sandboxed in browser container.'
  ]);

  const pendingActions = actions.filter((a) => a.status === 'pending_confirmation');

  const handleCopyScratchpad = () => {
    navigator.clipboard.writeText(scratchpad);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunBrowserSimulation = (taskName: string, targetUrl: string) => {
    setBrowserUrl(targetUrl);
    setSimulatingStep(1);
    setDomLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] Navigating to ${targetUrl}...`,
      ...prev
    ]);

    setTimeout(() => {
      setSimulatingStep(2);
      setDomLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] Querying selectors: input[name="search"], .cart-item-slot`,
        `[${new Date().toLocaleTimeString()}] Hydrating items via ${engine} tool schema...`,
        ...prev
      ]);
    }, 1000);

    setTimeout(() => {
      setSimulatingStep(3);
      setDomLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] Verification successful. Awaiting operator confirmation to finalize.`,
        ...prev
      ]);
    }, 2200);

    setTimeout(() => {
      setSimulatingStep(null);
    }, 3500);
  };

  return (
    <div className="flex h-full flex-col bg-[#13141F] text-white select-none border-l border-white/8">
      {/* Engine Switcher Header Bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-3 py-2 bg-[#0E0F17]">
        <div className="flex items-center gap-1.5">
          <Monitor className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-[11px] font-semibold text-white/80">Browser Co-Pilot</span>
        </div>

        {/* Engine Dropdown */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-white/40 uppercase font-mono">Engine:</span>
          <select
            value={engine}
            onChange={(e) => {
              const newEng = e.target.value as BrowserEngine;
              setEngine(newEng);
              setDomLogs((prev) => [
                `[ENGINE] Switched to ${newEng === 'gemini-flash' ? 'Gemini 2.0 Flash (Native)' : newEng === 'claude-browser' ? 'Claude 3.7 Sonnet' : 'GPT-4o'}`,
                ...prev
              ]);
            }}
            className="rounded-md border border-white/12 bg-black/50 px-2 py-0.5 text-[10.5px] font-medium text-sky-300 outline-none cursor-pointer"
          >
            <option value="gemini-flash">⚡ Gemini 2.0 (Native)</option>
            <option value="claude-browser">🧠 Claude 3.7 (Browser)</option>
            <option value="gpt-tools">🤖 GPT-4o (Tools)</option>
          </select>
        </div>
      </div>

      {/* Drawer Header Tabs */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-2 py-1.5 bg-[#0C0D14] overflow-x-auto">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('browser')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition whitespace-nowrap ${
              activeTab === 'browser'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-white/45 hover:text-white'
            }`}
          >
            <Globe className="h-3 w-3" />
            <span>Live DOM</span>
          </button>

          <button
            onClick={() => setActiveTab('errands')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition whitespace-nowrap ${
              activeTab === 'errands'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/45 hover:text-white'
            }`}
          >
            <ListOrdered className="h-3 w-3 text-sky-400" />
            <span>Errands ({errands.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('functions')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition whitespace-nowrap ${
              activeTab === 'functions'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/45 hover:text-white'
            }`}
          >
            <Terminal className="h-3 w-3 text-emerald-400" />
            <span>Tools ({actions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('scratchpad')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition whitespace-nowrap ${
              activeTab === 'scratchpad'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/45 hover:text-white'
            }`}
          >
            <FileText className="h-3 w-3 text-amber-300" />
            <span>Notes</span>
          </button>

          {pendingActions.length > 0 && (
            <button
              onClick={() => setActiveTab('confirmations')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition whitespace-nowrap ${
                activeTab === 'confirmations'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-amber-400/70 hover:text-amber-300 animate-pulse'
              }`}
            >
              <ShieldAlert className="h-3 w-3" />
              <span>Confirm ({pendingActions.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Drawer Content Body */}
      <div className="m-scroll flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tab 0: LIVE DOM BRIDGE / BROWSER RUNNER */}
        {activeTab === 'browser' && (
          <div className="space-y-4">
            {/* Browser Stage Viewport */}
            <div className="rounded-2xl border border-white/10 bg-[#0B0C12] overflow-hidden shadow-xl">
              {/* URL Address Bar */}
              <div className="flex items-center gap-2 border-b border-white/8 bg-[#161722] px-3 py-2">
                <span className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500/60" />
                  <span className="h-2 w-2 rounded-full bg-amber-500/60" />
                  <span className="h-2 w-2 rounded-full bg-emerald-500/60" />
                </span>
                <div className="flex flex-1 items-center gap-1.5 rounded-md bg-black/40 px-2 py-0.5 font-mono text-[10.5px] text-white/70 truncate">
                  <Lock className="h-2.5 w-2.5 text-emerald-400" />
                  <span className="truncate">{browserUrl}</span>
                </div>
                {simulatingStep !== null && (
                  <RefreshCw className="h-3 w-3 text-sky-400 animate-spin shrink-0" />
                )}
              </div>

              {/* Viewport Canvas Simulation */}
              <div className="relative p-4 min-h-[160px] bg-gradient-to-b from-[#12131C] to-[#0A0B10] flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-mono text-sky-300 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />
                      DOM Automation Bridge Active
                    </span>
                    <span className="text-[9.5px] text-white/35 font-mono">0ms Sandboxed</span>
                  </div>

                  {/* Visual Step Pipeline */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <div className={`rounded p-1.5 text-center text-[9.5px] font-mono border ${simulatingStep === 1 ? 'border-sky-400 bg-sky-500/20 text-white' : 'border-white/8 text-white/40'}`}>
                      1. Navigate DOM
                    </div>
                    <div className={`rounded p-1.5 text-center text-[9.5px] font-mono border ${simulatingStep === 2 ? 'border-sky-400 bg-sky-500/20 text-white' : 'border-white/8 text-white/40'}`}>
                      2. Hydrate Cart
                    </div>
                    <div className={`rounded p-1.5 text-center text-[9.5px] font-mono border ${simulatingStep === 3 ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300' : 'border-white/8 text-white/40'}`}>
                      3. Stage & Verify
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-white/6 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-white/50 font-mono">
                    <span>Engine:</span>
                    <span className="text-white font-medium">{engine.replace('-flash', '').toUpperCase()}</span>
                  </div>
                  <button
                    onClick={() => handleRunBrowserSimulation('Whole Foods Weekly Cart', 'https://wholefoods.amazon.com/cart')}
                    className="flex items-center gap-1 rounded-lg bg-sky-600 hover:bg-sky-500 px-2.5 py-1 text-[10.5px] font-semibold text-white transition shadow-sm"
                  >
                    <Play className="h-3 w-3" />
                    <span>Run Whole Foods Errand</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Automation Triggers */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                Quick Errand DOM Triggers
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleRunBrowserSimulation('Google Calendar Slot Booking', 'https://calendar.google.com/scheduling')}
                  className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] p-2.5 text-left hover:border-sky-400/40 hover:bg-white/[0.04] transition"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-sky-400" />
                    <div>
                      <p className="text-xs font-semibold text-white">Google Calendar Scheduling Buffer</p>
                      <p className="text-[10px] text-white/40">Inspect 15-min buffers for Thursday review</p>
                    </div>
                  </div>
                  <PlayCircle className="h-4 w-4 text-white/40 group-hover:text-sky-300" />
                </button>

                <button
                  onClick={() => handleRunBrowserSimulation('Amazon Whey Isolate Cart', 'https://amazon.com/cart')}
                  className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] p-2.5 text-left hover:border-amber-400/40 hover:bg-white/[0.04] transition"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-amber-400" />
                    <div>
                      <p className="text-xs font-semibold text-white">Amazon Cart Reorder</p>
                      <p className="text-[10px] text-white/40">Stage 5lb Vanilla Whey Isolate in checkout</p>
                    </div>
                  </div>
                  <PlayCircle className="h-4 w-4 text-white/40 group-hover:text-amber-300" />
                </button>
              </div>
            </div>

            {/* Live DOM Log Stream */}
            <div className="rounded-xl border border-white/8 bg-black/60 p-3 space-y-1.5 font-mono text-[10px] text-sky-300/80 max-h-48 overflow-y-auto m-scroll">
              <p className="text-white/40 uppercase tracking-widest text-[9px] border-b border-white/8 pb-1">
                Live DOM Protocol Stream
              </p>
              {domLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 1: Active Errand Queues */}
        {activeTab === 'errands' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
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
                className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/60 hover:text-white"
              >
                + Add Errand
              </button>
            </div>

            {errands.map((errand) => (
              <div
                key={errand.id}
                className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5 transition hover:border-white/15"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {errand.target === 'whole-foods' ? (
                      <ShoppingCart className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Calendar className="h-4 w-4 text-sky-400" />
                    )}
                    <span className="text-[12.5px] font-semibold text-white">{errand.title}</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9.5px] font-medium uppercase tracking-wider ${
                      errand.status === 'completed'
                        ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                        : errand.status === 'queued'
                        ? 'border border-sky-500/40 bg-sky-500/10 text-sky-300'
                        : 'border border-white/10 bg-white/[0.04] text-white/50'
                    }`}
                  >
                    {errand.status}
                  </span>
                </div>

                {errand.scheduled_time && (
                  <p className="mt-1 text-[10.5px] text-white/45 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {errand.scheduled_time}
                  </p>
                )}

                <div className="mt-2.5 space-y-1">
                  {errand.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11.5px] text-white/70">
                      <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3.5 flex items-center justify-between border-t border-white/6 pt-2 text-[10px]">
                  <span className="font-mono text-white/35 uppercase">Domain: {errand.target}</span>
                  <div className="flex items-center gap-2">
                    {errand.status !== 'completed' && (
                      <button
                        onClick={() =>
                          onUpdateErrand({
                            ...errand,
                            status: errand.status === 'draft' ? 'queued' : 'completed',
                          })
                        }
                        className="rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-emerald-300 hover:bg-emerald-500/25 transition"
                      >
                        {errand.status === 'draft' ? 'Dispatch' : 'Mark Done'}
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteErrand(errand.id)}
                      className="text-white/30 hover:text-rose-400 p-0.5 transition"
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
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
              Tool Calling Stream (hydrate_form_or_errand)
            </span>

            {actions.length === 0 ? (
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-6 text-center text-[11px] text-white/40">
                No function tool calls yet. Ask Magdalene to book an appointment or stage an errand.
              </div>
            ) : (
              actions.map((act) => (
                <div
                  key={act.id}
                  className="rounded-xl border border-white/8 bg-black/40 p-3 text-[11px] font-mono"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/8">
                    <span className="text-emerald-400 font-semibold">{act.action_name}</span>
                    <span
                      className={`text-[9.5px] uppercase ${
                        act.status === 'executed' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>
                  <pre className="mt-2 text-[10px] text-white/70 overflow-x-auto p-1.5 rounded bg-white/[0.02]">
                    {JSON.stringify(act.form_payload, null, 2)}
                  </pre>
                  <div className="mt-2 flex items-center justify-between text-[9px] text-white/35">
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
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                Live Markdown Scratchpad
              </span>
              <button
                onClick={handleCopyScratchpad}
                className="flex items-center gap-1 rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/60 hover:text-white"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <textarea
              value={scratchpad}
              onChange={(e) => onChangeScratchpad(e.target.value)}
              placeholder="Live scratchpad synced across your sovereign workspace..."
              className="m-scroll w-full flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.02] p-3 text-[12px] text-white/90 placeholder:text-white/25 outline-none font-mono leading-relaxed focus:border-[var(--m-accent)]/50 min-h-[260px]"
            />
          </div>
        )}

        {/* Tab 4: Pending Confirmations */}
        {activeTab === 'confirmations' && (
          <div className="space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
              Affirmative Confirmations Required
            </span>

            {pendingActions.map((act) => (
              <div
                key={act.id}
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2"
              >
                <div className="flex items-center gap-2 text-amber-300 text-[12px] font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{act.action_name}</span>
                </div>
                <p className="text-[11.5px] text-white/80">
                  Target Domain: <strong className="text-white">{act.category}</strong>
                </p>
                <div className="rounded bg-black/30 p-2 text-[10.5px] text-white/70 font-mono">
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

