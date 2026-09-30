import React, { useState, useEffect, useRef } from 'react';
import {
  Monitor, ListOrdered, Terminal, FileText, ShieldAlert, CheckCircle2,
  Clock, Trash2, Check, Copy, ExternalLink, ChevronRight,
  Sparkles, CheckSquare, Calendar, AlertTriangle,
  Cpu, ArrowRight, Eye, ShieldCheck, Lock, ShoppingCart,
  Play, RefreshCw, PanelRightClose, Globe, Layers, CheckCircle,
  Smartphone
} from 'lucide-react';
import type { ErrandTask, HydrateFormAction, UserProfile } from '@/data/schemas';
import { isLightTheme } from '@/data/intake';
import { sovereignBridge, type SovereignBridgeEvent, type ExecutionHost } from '@/lib/sovereignBridge';

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

interface PipelineStep {
  id: number;
  label: string;
  status: 'idle' | 'running' | 'done';
}

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
  // Default to Live DOM per canonical design
  const [activeTab, setActiveTab] = useState<'dom' | 'errands' | 'functions' | 'scratchpad' | 'confirmations'>('dom');
  const [engine, setEngine] = useState<BrowserEngine>('gemini-flash');
  const [copied, setCopied] = useState(false);

  // Live DOM State
  const [url, setUrl] = useState<string>('https://wholefoods.amazon.com/cart');
  const [executionHost, setExecutionHost] = useState<ExecutionHost>(() => sovereignBridge.executionHost);
  const [activeSpecialist, setActiveSpecialist] = useState<string>('Carol Ann (Executive Orchestrator)');
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([
    { id: 1, label: '1. Navigate DOM', status: 'idle' },
    { id: 2, label: '2. Hydrate Cart', status: 'idle' },
    { id: 3, label: '3. Stage & Verify', status: 'idle' },
  ]);
  const [logs, setLogs] = useState<string[]>(() => sovereignBridge.getLogs());
  const [isExecuting, setIsExecuting] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const pendingActions = actions.filter((a) => a.status === 'pending_confirmation');

  // Subscribe to bi-directional sovereign bridge events (e.g. from Phone Remote)
  useEffect(() => {
    const unsubscribe = sovereignBridge.subscribe((event: SovereignBridgeEvent) => {
      if (event.payload.url) {
        setUrl(event.payload.url);
      }
      if (event.payload.executionHost) {
        setExecutionHost(event.payload.executionHost);
      }
      if (event.payload.agentName) {
        setActiveSpecialist(event.payload.agentName);
      }
      if (event.payload.logText) {
        setLogs((prev) => [...prev.slice(-40), event.payload.logText!]);
      }
      if (event.type === 'connect' && event.payload.agentName) {
        setActiveSpecialist(event.payload.agentName);
      }
      if (event.type === 'host_switch' && event.payload.executionHost) {
        setExecutionHost(event.payload.executionHost);
      }
      if (event.type === 'pipeline_step' && event.payload.stepIndex) {
        setPipelineSteps((prev) =>
          prev.map((step) =>
            step.id === event.payload.stepIndex
              ? { ...step, status: (event.payload.status as 'idle' | 'running' | 'done') || 'running' }
              : step.id < event.payload.stepIndex!
              ? { ...step, status: 'done' }
              : step
          )
        );
      }
      if (event.type === 'action_dispatch') {
        setIsExecuting(true);
        setActiveTab('dom');
        if (event.payload.agentName) {
          setActiveSpecialist(event.payload.agentName);
        }
        setPipelineSteps([
          { id: 1, label: '1. Navigate DOM', status: 'running' },
          { id: 2, label: '2. Hydrate Cart', status: 'idle' },
          { id: 3, label: '3. Stage & Verify', status: 'idle' },
        ]);
        setTimeout(() => setIsExecuting(false), 2400);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSetHost = (host: ExecutionHost) => {
    setExecutionHost(host);
    sovereignBridge.setExecutionHost(host, 'dashboard');
  };

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCopyScratchpad = () => {
    navigator.clipboard.writeText(scratchpad);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunWholeFoodsErrand = () => {
    setIsExecuting(true);
    setActiveSpecialist('Carol Ann (Executive Orchestrator)');
    sovereignBridge.dispatchErrand(
      'Whole Foods Grocery Order',
      'https://wholefoods.amazon.com/cart',
      ['Organic Tuscan Kale', 'Grass-Fed Ribeye', 'Raw Honey', 'Almond Milk'],
      'desktop',
      'carol-anchor',
      'Carol Ann (Executive Orchestrator)'
    );
    setTimeout(() => setIsExecuting(false), 2400);
  };

  const handleTriggerQuickErrand = (
    title: string,
    targetUrl: string,
    sampleItems: string[],
    agentId: string,
    agentName: string
  ) => {
    setIsExecuting(true);
    setUrl(targetUrl);
    setActiveSpecialist(agentName);
    sovereignBridge.dispatchErrand(title, targetUrl, sampleItems, 'desktop', agentId, agentName);
    setTimeout(() => setIsExecuting(false), 2400);
  };

  return (
    <div
      className={`flex h-full flex-col select-none border-l transition-colors font-sans ${
        isLight
          ? 'bg-rose-50/40 text-slate-800 border-rose-200/60'
          : 'bg-[#0B0C10] text-white border-white/8'
      }`}
    >
      {/* 1. Right Rail Header & Mode Bar */}
      <div
        className={`flex shrink-0 items-center justify-between border-b px-3.5 py-2.5 backdrop-blur-md ${
          isLight ? 'border-rose-200/60 bg-white/70' : 'border-white/8 bg-[#101118]/80'
        }`}
      >
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-sky-500" />
          <span className={`text-xs font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Browser Co-Pilot
          </span>
        </div>

        {/* Engine Badge / Selector */}
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] uppercase font-mono font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
            ENGINE:
          </span>
          <div
            className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition ${
              isLight
                ? 'border-sky-200 bg-sky-50/80 text-sky-800 shadow-xs'
                : 'border-sky-500/30 bg-sky-500/10 text-sky-300'
            }`}
          >
            <span>⚡ Gemini 2.0 (Native)</span>
          </div>

          <button
            onClick={onClose}
            className={`p-1 rounded-md transition ml-1 ${
              isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'
            }`}
            title="Collapse Co-Pilot"
          >
            <PanelRightClose className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Runner Host Switcher: Main Dashboard <-> Phone Co-Pilot */}
      <div
        className={`flex shrink-0 items-center justify-between border-b px-3 py-1.5 backdrop-blur-md ${
          isLight ? 'border-rose-200/50 bg-rose-50/40' : 'border-white/6 bg-white/[0.02]'
        }`}
      >
        <span className={`text-[10px] uppercase font-mono font-bold tracking-wider ${
          isLight ? 'text-slate-500' : 'text-white/40'
        }`}>
          Runner Host:
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleSetHost('dashboard')}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-medium transition cursor-pointer ${
              executionHost === 'dashboard'
                ? isLight
                  ? 'bg-sky-500 text-white font-semibold shadow-xs'
                  : 'bg-sky-500 text-white font-semibold shadow-xs'
                : isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="Run browser agent from Main Dashboard"
          >
            <Monitor className="h-3 w-3" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleSetHost('phone')}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-medium transition cursor-pointer ${
              executionHost === 'phone'
                ? isLight
                  ? 'bg-purple-600 text-white font-semibold shadow-xs'
                  : 'bg-purple-600 text-white font-semibold shadow-xs'
                : isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="Run browser agent from Phone Co-Pilot"
          >
            <Smartphone className="h-3 w-3" />
            <span>Phone Co-Pilot</span>
          </button>

          <button
            onClick={() => handleSetHost('dual')}
            className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium transition cursor-pointer ${
              executionHost === 'dual'
                ? isLight
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-emerald-600 text-white font-semibold shadow-xs'
                : isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="Dual Link: Execute from either Dashboard or Phone Co-Pilot"
          >
            <Sparkles className="h-3 w-3" />
            <span>Dual</span>
          </button>
        </div>
      </div>

      {/* 2. Tab Bar Directly Below */}
      <div
        className={`flex shrink-0 items-center gap-1 border-b px-2.5 py-1.5 overflow-x-auto backdrop-blur-md ${
          isLight ? 'border-rose-200/60 bg-white/60' : 'border-white/8 bg-[#101118]/50'
        }`}
      >
        <button
          onClick={() => setActiveTab('dom')}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition whitespace-nowrap ${
            activeTab === 'dom'
              ? isLight
                ? 'bg-sky-100 text-sky-900 font-semibold border border-sky-300 shadow-xs'
                : 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-400/40 shadow-sm'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-white/65 hover:text-white'
          }`}
        >
          <Globe className="h-3.5 w-3.5 text-sky-400" />
          <span>Live DOM</span>
        </button>

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
          <ListOrdered className="h-3.5 w-3.5 text-amber-500" />
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
          <FileText className="h-3.5 w-3.5 text-pink-500" />
          <span>Notes</span>
        </button>

        {pendingActions.length > 0 && (
          <button
            onClick={() => setActiveTab('confirmations')}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold transition whitespace-nowrap ${
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

      {/* Drawer Content Body */}
      <div className="m-scroll flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* ===================== TAB: LIVE DOM (Canonical) ===================== */}
        {activeTab === 'dom' && (
          <div className="space-y-4">
            {/* The Live DOM Card (Upper Section) */}
            <div
              className={`rounded-2xl border transition-all shadow-md overflow-hidden ${
                isLight
                  ? 'border-rose-200/90 bg-white/95 text-slate-800 shadow-slate-200/50'
                  : 'border-white/10 bg-[#12131A] text-white shadow-black/40'
              }`}
            >
              {/* Browser Mock Chrome Bar */}
              <div
                className={`flex items-center gap-2 border-b px-3 py-2 ${
                  isLight ? 'border-rose-100 bg-rose-50/50' : 'border-white/6 bg-[#0E0F14]'
                }`}
              >
                {/* 🔴 🟡 🟢 Window Control Dots */}
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 shadow-xs" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80 shadow-xs" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 shadow-xs" />
                </div>

                {/* URL Address Bar */}
                <div
                  className={`flex flex-1 items-center gap-1.5 rounded-lg border px-2.5 py-1 transition ${
                    isLight
                      ? 'border-rose-200/80 bg-white text-slate-800'
                      : 'border-white/8 bg-[#090A0E] text-white/80'
                  }`}
                >
                  <Lock className="h-3 w-3 text-emerald-500 shrink-0" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-transparent font-mono text-[10.5px] outline-none truncate"
                  />
                  {isExecuting && <RefreshCw className="h-3 w-3 text-sky-400 animate-spin shrink-0" />}
                </div>
              </div>

              {/* Status Bar */}
              <div
                className={`flex items-center justify-between border-b px-3.5 py-1.5 text-[10px] font-semibold tracking-wide ${
                  isLight ? 'border-rose-100 bg-white' : 'border-white/6 bg-[#12131A]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span>DOM AUTOMATION BRIDGE ACTIVE</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9.5px] font-medium border truncate max-w-[140px] ${
                      isLight
                        ? 'border-sky-200 bg-sky-50 text-sky-800'
                        : 'border-sky-500/30 bg-sky-500/10 text-sky-300'
                    }`}
                    title={activeSpecialist}
                  >
                    {activeSpecialist.split(' ')[0]} Specialist
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9.5px] font-mono border ${
                      isLight
                        ? 'border-slate-200 bg-slate-50 text-slate-600'
                        : 'border-white/10 bg-white/[0.04] text-white/50'
                    }`}
                  >
                    0ms Sandboxed
                  </span>
                </div>
              </div>

              {/* Three-step pipeline cards in horizontal grid */}
              <div className="p-3">
                <div className="grid grid-cols-3 gap-2">
                  {pipelineSteps.map((step) => {
                    const isDone = step.status === 'done';
                    const isRunning = step.status === 'running';

                    return (
                      <div
                        key={step.id}
                        className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                          isRunning
                            ? 'border-sky-500/80 bg-sky-500/15 ring-2 ring-sky-500/30'
                            : isDone
                            ? isLight
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : isLight
                            ? 'border-rose-200/60 bg-rose-50/30 text-slate-700'
                            : 'border-white/6 bg-white/[0.02] text-white/70'
                        }`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          {isRunning ? (
                            <RefreshCw className="h-3 w-3 text-sky-400 animate-spin" />
                          ) : isDone ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-slate-400/40" />
                          )}
                        </div>
                        <span className="text-[10px] font-semibold tracking-tight">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Strip */}
              <div
                className={`flex items-center justify-between border-t px-3.5 py-2.5 ${
                  isLight ? 'border-rose-100 bg-rose-50/30' : 'border-white/6 bg-[#0E0F14]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-slate-500 dark:text-white/40">
                  <span>Engine:</span>
                  <span className="font-semibold text-slate-800 dark:text-white/80">GEMINI</span>
                </div>

                <button
                  onClick={handleRunWholeFoodsErrand}
                  disabled={isExecuting}
                  className="flex items-center gap-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-[11px] px-3 py-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  <Play className="h-3 w-3 fill-white" />
                  <span>Run Whole Foods Errand</span>
                </button>
              </div>
            </div>

            {/* Quick Errand DOM Triggers Section */}
            <div className="space-y-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider block ${
                  isLight ? 'text-slate-500' : 'text-white/40'
                }`}
              >
                QUICK ERRAND DOM TRIGGERS
              </span>

              {/* Trigger 1: Google Calendar Scheduling Buffer */}
              <div
                onClick={() =>
                  handleTriggerQuickErrand(
                    'Google Calendar Scheduling Buffer',
                    'https://calendar.google.com/calendar/u/0/r',
                    ['15-min buffers for Thursday review'],
                    'archivist',
                    'Archivist (Work Specialist)'
                  )
                }
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition hover:scale-[1.01] active:scale-[0.99] ${
                  isLight
                    ? 'border-rose-200/80 bg-white/90 text-slate-800 hover:border-sky-300 shadow-xs'
                    : 'border-white/8 bg-[#12131A] text-white hover:border-sky-500/40'
                }`}
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sky-500/15 text-sky-500 border border-sky-500/25 mt-0.5">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-[12px] font-semibold leading-tight">Google Calendar Scheduling Buffer</h4>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-500 font-mono">Archivist</span>
                  </div>
                  <p className={`mt-0.5 text-[10.5px] leading-relaxed truncate ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    Inspect 15-min buffers for Thursday review
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 self-center shrink-0" />
              </div>

              {/* Trigger 2: Amazon Cart Reorder */}
              <div
                onClick={() =>
                  handleTriggerQuickErrand(
                    'Amazon Cart Reorder',
                    'https://amazon.com/gp/cart/view.html',
                    ['5lb Vanilla Whey Isolate in checkout'],
                    'coach',
                    'Coach (Wellness Specialist)'
                  )
                }
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition hover:scale-[1.01] active:scale-[0.99] ${
                  isLight
                    ? 'border-rose-200/80 bg-white/90 text-slate-800 hover:border-amber-300 shadow-xs'
                    : 'border-white/8 bg-[#12131A] text-white hover:border-amber-500/40'
                }`}
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/25 mt-0.5">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-[12px] font-semibold leading-tight">Amazon Cart Reorder</h4>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 font-mono">Coach</span>
                  </div>
                  <p className={`mt-0.5 text-[10.5px] leading-relaxed truncate ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    Stage 5lb Vanilla Whey Isolate in checkout
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 self-center shrink-0" />
              </div>

              {/* Trigger 3: Hot Artisan Pizza & Dinner Delivery */}
              <div
                onClick={() =>
                  handleTriggerQuickErrand(
                    'Hot Artisan Pizza & Dinner Delivery',
                    'https://dominos.com/order',
                    ['Hand-Tossed Artisan Pizza', 'San Pellegrino Sparkling Water'],
                    'keeper',
                    'Keeper (Family Specialist)'
                  )
                }
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition hover:scale-[1.01] active:scale-[0.99] ${
                  isLight
                    ? 'border-rose-200/80 bg-white/90 text-slate-800 hover:border-rose-300 shadow-xs'
                    : 'border-white/8 bg-[#12131A] text-white hover:border-rose-500/40'
                }`}
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-500/15 text-rose-500 border border-rose-500/25 mt-0.5">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-[12px] font-semibold leading-tight">Hot Artisan Pizza & Dinner Order</h4>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 font-mono">Keeper</span>
                  </div>
                  <p className={`mt-0.5 text-[10.5px] leading-relaxed truncate ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    Order hot artisan pizza & dinner essentials
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 self-center shrink-0" />
              </div>
            </div>

            {/* Live DOM Protocol Stream (Bottom Terminal) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isLight ? 'text-slate-500' : 'text-white/40'
                  }`}
                >
                  LIVE DOM PROTOCOL STREAM
                </span>
                <span className="text-[9.5px] font-mono text-emerald-500">● LIVE</span>
              </div>

              <div
                ref={logContainerRef}
                className={`rounded-xl border p-3 font-mono text-[10px] leading-relaxed h-36 overflow-y-auto m-scroll transition ${
                  isLight
                    ? 'border-slate-300 bg-slate-900 text-emerald-400'
                    : 'border-white/8 bg-[#090A0E] text-emerald-400/90'
                }`}
              >
                {logs.map((line, idx) => (
                  <div key={idx} className="whitespace-pre-wrap py-0.5">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: ERRANDS ===================== */}
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
                    <span className={`text-[12.5px] font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {errand.title}
                    </span>
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
                  <span className={`font-mono uppercase ${isLight ? 'text-slate-400' : 'text-white/35'}`}>
                    Domain: {errand.target}
                  </span>
                  <div className="flex items-center gap-2">
                    {errand.status !== 'completed' && (
                      <button
                        onClick={() =>
                          onUpdateErrand({
                            ...errand,
                            status: errand.status === 'draft' ? 'queued' : 'completed',
                          })
                        }
                        className="rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/25 transition cursor-pointer"
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

        {/* ===================== TAB: TOOLS ===================== */}
        {activeTab === 'functions' && (
          <div className="space-y-3">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
              Tool Calling Stream (hydrate_form_or_errand)
            </span>

            {actions.length === 0 ? (
              <div
                className={`rounded-xl border p-6 text-center text-[11px] ${
                  isLight ? 'border-rose-200 bg-white/75 text-slate-500' : 'border-white/8 bg-white/[0.02] text-white/40'
                }`}
              >
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
                  <pre
                    className={`mt-2 text-[10px] overflow-x-auto p-1.5 rounded ${
                      isLight ? 'bg-rose-50/50 text-slate-700 border border-rose-100' : 'bg-white/[0.02] text-white/70'
                    }`}
                  >
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

        {/* ===================== TAB: NOTES ===================== */}
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

        {/* ===================== TAB: CONFIRMATIONS ===================== */}
        {activeTab === 'confirmations' && (
          <div className="space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300">
              Affirmative Confirmations Required
            </span>

            {pendingActions.map((act) => (
              <div
                key={act.id}
                className={`rounded-xl border p-3.5 space-y-2 ${
                  isLight ? 'border-amber-300 bg-amber-50/90 text-slate-800 shadow-xs' : 'border-amber-500/30 bg-amber-500/10'
                }`}
              >
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-300 text-[12px] font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{act.action_name}</span>
                </div>
                <p className={`text-[11.5px] ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                  Target Domain: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{act.category}</strong>
                </p>
                <div
                  className={`rounded p-2 text-[10.5px] font-mono ${
                    isLight ? 'bg-white border border-amber-200 text-slate-800' : 'bg-black/30 text-white/70'
                  }`}
                >
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
                    className="flex items-center gap-1.5 rounded-lg m-gradient-bg px-3 py-1.5 text-[11px] font-semibold text-white shadow-md hover:brightness-110 cursor-pointer"
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
