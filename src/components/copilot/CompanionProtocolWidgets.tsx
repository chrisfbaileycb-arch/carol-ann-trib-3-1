import React, { useEffect, useState } from 'react';
import {
  Mic, Volume2, Radio, ShieldAlert, Check, X, Star, ShoppingBag,
  Sparkles, Monitor, Smartphone, Send, Play, CheckCircle2, Clock
} from 'lucide-react';
import {
  sovereignBridge,
  type CompanionProtocolState,
  type CompanionApprovalCard,
  type ProductRecommendation,
} from '@/lib/sovereignBridge';
import { speak } from '@/lib/agentStore';

interface CompanionWidgetsProps {
  isLight?: boolean;
  onVoiceCommand?: (text: string) => void;
  listening?: boolean;
  onToggleVoice?: () => void;
  activeVoiceKey?: string;
  onOpenMainDashboard?: () => void;
}

export const CompanionProtocolPanel: React.FC<CompanionWidgetsProps> = ({
  isLight = false,
  onVoiceCommand,
  listening = false,
  onToggleVoice,
  activeVoiceKey = 'warm',
  onOpenMainDashboard,
}) => {
  const [companionState, setCompanionState] = useState<CompanionProtocolState>(() =>
    sovereignBridge.getCompanionState()
  );
  const [commandInput, setCommandInput] = useState('');

  useEffect(() => {
    return sovereignBridge.subscribeCompanion((next) => {
      setCompanionState(next);
    });
  }, []);

  const handleDispatchCommand = (rawText: string) => {
    const clean = rawText.trim();
    if (!clean) return;
    if (onVoiceCommand) {
      onVoiceCommand(clean);
    } else {
      sovereignBridge.dispatchErrand(
        clean,
        companionState.activeUrl,
        [],
        'mobile',
        'carol-anchor',
        companionState.activeSpecialist
      );
    }
    setCommandInput('');
  };

  const pendingApprovals = companionState.approvalCards.filter((c) => c.status === 'pending');
  const latestRun = companionState.headlessRuns[0];

  const headlessVoiceCommands = [
    'Inspect Whole Foods cart & rank Top-3 organic almond milk',
    'Compare Top-3 grass-fed vanilla whey isolate on Amazon',
    'Find Top-3 artisan pizza dinner deliveries for tonight',
  ];

  return (
    <div className="space-y-4">
      {/* 1. Companion Mode Protocol Status & Headless Desktop Run Monitor */}
      <div
        className={`rounded-2xl border p-4 shadow-md transition ${
          isLight
            ? 'border-indigo-200/90 bg-white/95 text-slate-900'
            : 'border-indigo-500/30 bg-[#12131C]/95 text-white'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                  companionState.wsConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  companionState.wsConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider">
              Companion Mode Protocol
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${
                companionState.wsConnected
                  ? isLight
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                  : isLight
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-amber-500/30 bg-amber-500/15 text-amber-300'
              }`}
            >
              {companionState.wsConnected
                ? `WS Live · ${companionState.wsLatencyMs}ms`
                : 'Local Relay Sync'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-semibold">
            {onOpenMainDashboard && (
              <button
                type="button"
                onClick={onOpenMainDashboard}
                className="inline-flex items-center gap-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1 text-[11px] font-bold shadow-xs transition cursor-pointer"
              >
                <Monitor className="h-3 w-3" /> Open Main Dashboard
              </button>
            )}
            <span
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 ${
                isLight
                  ? 'border-slate-200 bg-slate-50 text-slate-700'
                  : 'border-white/10 bg-white/5 text-white/80'
              }`}
            >
              <Mic className="h-3 w-3 text-rose-400" /> Executive Mic
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 ${
                isLight
                  ? 'border-slate-200 bg-slate-50 text-slate-700'
                  : 'border-white/10 bg-white/5 text-white/80'
              }`}
            >
              <Volume2 className="h-3 w-3 text-sky-400" /> Voice Speaker
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 ${
                isLight
                  ? 'border-slate-200 bg-slate-50 text-slate-700'
                  : 'border-white/10 bg-white/5 text-white/80'
              }`}
            >
              <Radio className="h-3 w-3 text-purple-400" /> Remote Controller
            </span>
          </div>
        </div>

        <p className={`mt-1.5 text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/65'}`}>
          Phone offloads heavy browser automation to your docked Googlebook / desktop environment. Voice inputs command headless Playwright runs over WebSocket.
        </p>

        {/* Active Headless Run Status on Docked Desktop */}
        {latestRun && (
          <div
            className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${
              isLight
                ? 'border-sky-200 bg-sky-50/80 text-slate-800'
                : 'border-sky-500/25 bg-sky-500/10 text-sky-100'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Monitor className="h-4 w-4 text-sky-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold truncate">
                  Docked Desktop Run: {latestRun.command}
                </p>
                <p className={`text-[10.5px] font-mono ${isLight ? 'text-slate-600' : 'text-sky-200/75'}`}>
                  {latestRun.stepLabel}
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase shrink-0 ${
                latestRun.status === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : latestRun.status === 'awaiting_approval'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              }`}
            >
              {latestRun.status.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {/* 2. Conversational Voice Stream (Phone as Immediate Voice Terminal) */}
      <div
        className={`rounded-2xl border p-4 shadow-md transition ${
          isLight
            ? 'border-rose-200/80 bg-white/95 text-slate-900'
            : 'border-white/12 bg-[#12131C]/95 text-white'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-xl m-gradient-bg text-white shadow-xs">
              <Mic className="h-3.5 w-3.5" />
            </span>
            <div>
              <h3 className="font-display text-xs font-bold uppercase tracking-wider">
                Conversational Voice Stream
              </h3>
              <p className={`text-[10.5px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Immediate voice terminal · Commands headless runs on docked desktop
              </p>
            </div>
          </div>

          {onToggleVoice && (
            <button
              type="button"
              onClick={onToggleVoice}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition cursor-pointer ${
                listening
                  ? 'bg-rose-500 text-white animate-pulse shadow-md'
                  : isLight
                  ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  : 'border border-white/15 bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              <Mic className="h-3 w-3" />
              <span>{listening ? 'Listening…' : 'Push to Talk'}</span>
            </button>
          )}
        </div>

        {/* Stream Log */}
        <div
          className={`max-h-48 overflow-y-auto m-scroll space-y-2 rounded-xl border p-3 ${
            isLight ? 'border-slate-200/80 bg-slate-50/80' : 'border-white/8 bg-[#090A0F]'
          }`}
        >
          {companionState.voiceStream.slice(-6).map((item) => {
            const isUser = item.role === 'user';
            const isSystem = item.role === 'system';
            return (
              <div
                key={item.id}
                className={`flex items-start justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${
                  isUser
                    ? isLight
                      ? 'border-rose-200 bg-rose-50/70 text-slate-900'
                      : 'border-rose-500/30 bg-rose-500/10 text-white'
                    : isSystem
                    ? isLight
                      ? 'border-indigo-200 bg-indigo-50/60 text-indigo-950'
                      : 'border-indigo-500/25 bg-indigo-500/10 text-indigo-200'
                    : isLight
                    ? 'border-slate-200 bg-white text-slate-800'
                    : 'border-white/10 bg-white/[0.04] text-white/90'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">
                      {isUser ? 'You (Phone Mic)' : isSystem ? 'Protocol Sync' : item.agentName}
                    </span>
                    <span className="text-[9.5px] font-mono opacity-45">
                      {item.source === 'phone' ? '📱 Phone' : '💻 Desktop'}
                    </span>
                  </div>
                  <p className="leading-relaxed font-medium">{item.text}</p>
                </div>

                {!isUser && (
                  <button
                    type="button"
                    onClick={() => void speak(item.text, activeVoiceKey as 'warm')}
                    className={`shrink-0 rounded-lg border p-1.5 transition cursor-pointer ${
                      isLight
                        ? 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                        : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                    }`}
                    title="Play on Phone Voice Speaker"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* 1-Tap Headless Desktop Voice Command Chips */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {headlessVoiceCommands.map((cmd) => (
            <button
              key={cmd}
              type="button"
              onClick={() => handleDispatchCommand(cmd)}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                isLight
                  ? 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:bg-white'
                  : 'border-white/10 bg-white/[0.04] text-white/75 hover:border-white/25 hover:bg-white/10'
              }`}
            >
              <Play className="h-2.5 w-2.5 text-[var(--m-accent)] shrink-0" />
              <span className="truncate max-w-[240px]">{cmd}</span>
            </button>
          ))}
        </div>

        {/* Quick Voice/Text Command Composer */}
        <div
          className={`mt-2.5 flex items-center gap-2 rounded-xl border px-3 py-1.5 ${
            isLight
              ? 'border-slate-200 bg-white'
              : 'border-white/12 bg-black/40'
          }`}
        >
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDispatchCommand(commandInput)}
            placeholder="Command a headless run on docked desktop…"
            className="flex-1 bg-transparent text-xs outline-none"
          />
          <button
            type="button"
            onClick={() => handleDispatchCommand(commandInput)}
            className="flex items-center gap-1 rounded-lg m-gradient-bg px-2.5 py-1 text-[11px] font-bold text-white shadow-xs cursor-pointer"
          >
            <Send className="h-3 w-3" />
            <span>Run</span>
          </button>
        </div>
      </div>

      {/* 3. Approval Action Cards */}
      <div
        className={`rounded-2xl border p-4 shadow-md transition ${
          isLight
            ? 'border-amber-200/90 bg-white/95 text-slate-900'
            : 'border-amber-500/30 bg-[#12131C]/95 text-white'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="h-3.5 w-3.5" />
            </span>
            <div>
              <h3 className="font-display text-xs font-bold uppercase tracking-wider">
                Approval Action Cards ({pendingApprovals.length} Pending)
              </h3>
              <p className={`text-[10.5px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Remote sign-off for staged desktop browser checkouts & calendar mutations
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          {companionState.approvalCards.slice(0, 4).map((card: CompanionApprovalCard) => {
            const isPending = card.status === 'pending';
            const isApproved = card.status === 'approved';
            return (
              <div
                key={card.id}
                className={`rounded-xl border p-3.5 transition ${
                  isPending
                    ? isLight
                      ? 'border-amber-300 bg-amber-50/70'
                      : 'border-amber-400/40 bg-amber-500/10'
                    : isApproved
                    ? isLight
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-emerald-500/25 bg-emerald-500/10'
                    : isLight
                    ? 'border-slate-200 bg-slate-50 opacity-65'
                    : 'border-white/10 bg-white/[0.02] opacity-65'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{card.title}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9.5px] font-mono font-bold uppercase ${
                          isPending
                            ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                            : isApproved
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {card.status}
                      </span>
                    </div>
                    <p className={`mt-0.5 text-[11px] ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                      {card.subtitle}
                    </p>
                    <p className={`mt-1 font-mono text-[10px] ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
                      {card.command} · {card.requestedBy}
                    </p>
                  </div>
                </div>

                {isPending && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => sovereignBridge.decideApprovalCard(card.id, 'approved')}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-bold text-white shadow-sm transition cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Approve on Desktop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => sovereignBridge.decideApprovalCard(card.id, 'denied')}
                      className={`flex items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                        isLight
                          ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                          : 'border-white/15 bg-white/5 text-white/75 hover:bg-white/10'
                      }`}
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Deny</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Top-3 Product Recommendation Picker */}
      <div
        className={`rounded-2xl border p-4 shadow-md transition ${
          isLight
            ? 'border-emerald-200/90 bg-white/95 text-slate-900'
            : 'border-emerald-500/30 bg-[#12131C]/95 text-white'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ShoppingBag className="h-3.5 w-3.5" />
            </span>
            <div>
              <h3 className="font-display text-xs font-bold uppercase tracking-wider">
                Top-3 Product Recommendation Picker
              </h3>
              <p className={`text-[10.5px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Extracted by headless desktop browser · Tap to stage into desktop cart
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {companionState.top3Recommendations.map((prod: ProductRecommendation) => (
            <div
              key={prod.id}
              onClick={() => sovereignBridge.selectTop3Product(prod.id)}
              className={`group relative flex flex-col justify-between rounded-xl border p-3.5 transition cursor-pointer ${
                prod.selected
                  ? isLight
                    ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/25 shadow-sm'
                    : 'border-emerald-400/70 bg-emerald-500/15 ring-2 ring-emerald-400/25 shadow-sm'
                  : isLight
                  ? 'border-slate-200 bg-white hover:border-emerald-300'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/25'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs font-black ${
                      prod.rank === 1
                        ? 'bg-amber-500 text-slate-950'
                        : prod.rank === 2
                        ? 'bg-slate-300 text-slate-900'
                        : 'bg-amber-700/80 text-white'
                    }`}
                  >
                    #{prod.rank}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="text-xs font-bold leading-snug">{prod.name}</h4>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${
                          isLight
                            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                        }`}
                      >
                        {prod.badge}
                      </span>
                    </div>
                    <p className={`mt-0.5 text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                      {prod.brand} ·{' '}
                      <span className="inline-flex items-center gap-0.5 text-amber-400 font-bold">
                        <Star className="h-3 w-3 fill-amber-400" /> {prod.rating}
                      </span>{' '}
                      ({prod.reviewsCount.toLocaleString()})
                    </p>
                    <p className={`mt-1 text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/75'}`}>
                      {prod.matchReason}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-mono text-sm font-black text-emerald-500 dark:text-emerald-400">
                    {prod.price}
                  </p>
                  <p className={`font-mono text-[10px] ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
                    {prod.unitPrice}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sovereignBridge.selectTop3Product(prod.id);
                    }}
                    className={`mt-2 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10.5px] font-bold transition ${
                      prod.selected
                        ? 'bg-emerald-600 text-white'
                        : isLight
                        ? 'border border-slate-300 bg-slate-100 text-slate-800 hover:bg-emerald-600 hover:text-white'
                        : 'border border-white/15 bg-white/10 text-white hover:bg-emerald-500'
                    }`}
                  >
                    {prod.selected ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Staged in Cart</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        <span>Pick #{prod.rank}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Component 3: Dual-View Search Presentation & Small-Business-First Voice Recitation */}
      {companionState.splitPipeline?.dualViewSummary && (
        <div
          className={`rounded-2xl border p-4 shadow-md transition space-y-3 ${
            isLight
              ? 'border-emerald-200/90 bg-white/95 text-slate-900'
              : 'border-emerald-500/30 bg-[#12131C]/95 text-white'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-500">
                  Dual-View Answer · Small Business First
                </span>
                <span className="text-[11px] font-mono tabular-nums opacity-65">
                  · $0.00 CPC · No Pay-to-Rank Auction
                </span>
              </div>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                Query: &ldquo;{companionState.splitPipeline.query}&rdquo;
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void speak(
                  companionState.splitPipeline.dualViewSummary.voiceRecitationScript,
                  activeVoiceKey as 'warm'
                )
              }
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Recite Small-Business-First Answer</span>
            </button>
          </div>

          <div
            className={`rounded-xl border p-3 text-xs leading-relaxed ${
              isLight
                ? 'border-emerald-200 bg-emerald-50/70 text-slate-800'
                : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'
            }`}
          >
            <span className="font-semibold">Carol Ann Voice Recitation: </span>
            &ldquo;{companionState.splitPipeline.dualViewSummary.voiceRecitationScript}&rdquo;
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Commercial Option */}
            <div
              className={`rounded-xl border p-3 flex flex-col justify-between ${
                isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-sky-500">
                    Commercial Option · {companionState.splitPipeline.dualViewSummary.commercialOption.merchant}
                  </span>
                  <span className="font-mono font-bold tabular-nums">
                    {companionState.splitPipeline.dualViewSummary.commercialOption.price}
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold">
                  {companionState.splitPipeline.dualViewSummary.commercialOption.name}
                </p>
                <p className={`mt-1 text-[11px] ${isLight ? 'text-slate-600' : 'text-white/65'}`}>
                  {companionState.splitPipeline.dualViewSummary.commercialOption.summary}
                </p>
              </div>
            </div>

            {/* Independent / Artisan Pick */}
            <div
              className={`rounded-xl border p-3 flex flex-col justify-between ${
                isLight
                  ? 'border-emerald-400 bg-emerald-50/50'
                  : 'border-emerald-500/40 bg-emerald-500/10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-emerald-500">
                    Independent / Artisan Pick
                  </span>
                  <span className="font-mono font-bold tabular-nums text-emerald-500">
                    {companionState.splitPipeline.dualViewSummary.independentArtisanPick.price}
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold">
                  {companionState.splitPipeline.dualViewSummary.independentArtisanPick.makerName} (
                  {companionState.splitPipeline.dualViewSummary.independentArtisanPick.originRegion})
                </p>
                <p className={`mt-1 text-[11px] ${isLight ? 'text-slate-600' : 'text-white/75'}`}>
                  {companionState.splitPipeline.dualViewSummary.independentArtisanPick.summary}
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[10.5px]">
                <span className="font-mono opacity-75">
                  {companionState.splitPipeline.dualViewSummary.independentArtisanPick.placeCardTier}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    sovereignBridge.selectSplitPipelineMatch(
                      companionState.splitPipeline.dualViewSummary.independentArtisanPick.matchId,
                      'sovereign'
                    )
                  }
                  className="font-semibold text-emerald-500 hover:underline cursor-pointer"
                >
                  Stage Artisan Pick →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanionProtocolPanel;
