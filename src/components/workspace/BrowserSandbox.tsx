import React, { useState, useEffect, useRef } from 'react';
import {
  Monitor, ListOrdered, Terminal, FileText, ShieldAlert, CheckCircle2,
  Trash2, Check, Copy, Calendar,
  Sparkles, ShoppingCart, Play, RefreshCw,
  Smartphone, Activity, Wrench, Lock, Plus, ShieldCheck, X, Star, Radio, Send, MessagesSquare,
  Search, Layers, Compass, Scale, Volume2, Store, Rss
} from 'lucide-react';
import type { ErrandTask, HydrateFormAction, UserProfile } from '@/data/schemas';
import { isLightTheme } from '@/data/intake';
import {
  sovereignBridge,
  type SovereignBridgeEvent,
  type ExecutionHost,
  type CompanionProtocolState,
  type ProductRecommendation,
  type CompanionApprovalCard,
} from '@/lib/sovereignBridge';
import {
  PRESET_PIPELINE_QUERIES,
  PLACE_CARD_TIERS,
  type FederatedFeedSource,
  type SplitPipelineRun,
  type SovereignDiscoveryMatch,
  type MerchantIngestionProtocol,
  type PlaceCardTier,
} from '@/lib/splitPipelineCatalog';
import { CompanionProtocolPanel } from '@/components/copilot/CompanionProtocolWidgets';
import { usePerformanceTracker } from '@/hooks/usePerformanceTracker';
import {
  loadErrands, saveErrands, loadActions, saveActions,
  loadScratchpad, saveScratchpad, uid
} from '@/lib/memoryStore';
import { loadRegistry } from '@/lib/skillRegistry';
import { speak } from '@/lib/agentStore';

interface BrowserSandboxProps {
  profile: UserProfile;
}

interface PipelineStep {
  id: number;
  label: string;
  status: 'idle' | 'running' | 'done';
}

type AdaptiveWindowMode = 'auto' | 'mobile_640' | 'desktop_1024';
type BrowserViewTab = 'split_pipeline' | 'monetization_model' | 'dom_runner';

export const BrowserSandbox: React.FC<BrowserSandboxProps> = ({ profile }) => {
  const isLight = isLightTheme(profile);
  const perfSnapshot = usePerformanceTracker();

  const [errands, setErrands] = useState<ErrandTask[]>(() => loadErrands());
  const [actions, setActions] = useState<HydrateFormAction[]>(() => loadActions());
  const [scratchpad, setScratchpad] = useState<string>(() => loadScratchpad());
  const [rightPanelTab, setRightPanelTab] = useState<'chat_ledger' | 'logs' | 'errands' | 'tools' | 'notes'>('chat_ledger');
  const [windowMode, setWindowMode] = useState<AdaptiveWindowMode>('auto');
  const [browserViewTab, setBrowserViewTab] = useState<BrowserViewTab>('split_pipeline');
  const [companionState, setCompanionState] = useState<CompanionProtocolState>(() =>
    sovereignBridge.getCompanionState()
  );
  const [execChatInput, setExecChatInput] = useState('');

  // Component 2 & 3: Interactive AI Browser Tab, Split Pipeline & Small Business Model State
  const [searchQuery, setSearchQuery] = useState<string>(() =>
    sovereignBridge.getCompanionState().splitPipeline?.query || 'hand-stitched leather belt'
  );
  const [runtimeEngine, setRuntimeEngine] = useState<SplitPipelineRun['runtimeEngine']>(
    'Playwright Sandboxed Stream'
  );
  const [selectedFeedFilter, setSelectedFeedFilter] = useState<'ALL' | FederatedFeedSource>('ALL');
  const [showSideBySideMatrix, setShowSideBySideMatrix] = useState<boolean>(true);
  const [activeProfileMaker, setActiveProfileMaker] = useState<SovereignDiscoveryMatch | null>(null);
  const [autoSpeakRecitation, setAutoSpeakRecitation] = useState<boolean>(false);

  // Component 3 Phase 1 (Free Open Ingestion) & Phase 2 (Flat-Rate Place Card Sponsorship) Form State
  const [newMakerName, setNewMakerName] = useState('Anatolian Loom & Saddle Co.');
  const [newMakerCity, setNewMakerCity] = useState('Cappadocia, Turkey');
  const [newProductName, setNewProductName] = useState('Hand-Stitched Anatolian Bridle Belt (Vegetable-Tanned)');
  const [newCategoryKeyword, setNewCategoryKeyword] = useState('belt');
  const [newPrice, setNewPrice] = useState('$45.00');
  const [newFeedUrl, setNewFeedUrl] = useState('https://anatoliansaddle.artisan/feeds/schema-products.xml');
  const [newIngestionProtocol, setNewIngestionProtocol] = useState<MerchantIngestionProtocol>('RSS / Atom Product Feed');
  const [newPlaceCardTier, setNewPlaceCardTier] = useState<PlaceCardTier>('Phase 2: Workshop Place Card ($15/mo)');
  const [newMaterials, setNewMaterials] = useState('12 oz Pit-Tanned Bullhide + Hand-Cast Solid Brass Buckle');
  const [newCraftNotes, setNewCraftNotes] = useState('Hand-stitched with waxed linen thread; zero synthetic finishes.');
  const [ingestionSuccessBanner, setIngestionSuccessBanner] = useState<string | null>(null);

  useEffect(() => { saveErrands(errands); }, [errands]);
  useEffect(() => { saveActions(actions); }, [actions]);
  useEffect(() => { saveScratchpad(scratchpad); }, [scratchpad]);

  // Live DOM State
  const [url, setUrl] = useState<string>('https://wholefoods.amazon.com/cart');
  const [executionHost, setExecutionHost] = useState<ExecutionHost>(() => sovereignBridge.executionHost);
  const [activeSpecialist, setActiveSpecialist] = useState<string>('Carol Ann (Executive Orchestrator)');
  const [activeCartItems, setActiveCartItems] = useState<string[]>([
    'Organic Tuscan Kale (2 bunches)',
    'Grass-Fed Ribeye Steak (1.2 lbs)',
    'Raw Local Wildflower Honey (16 oz)',
    'Unsweetened Organic Almond Milk (64 oz)',
  ]);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([
    { id: 1, label: '1. Navigate DOM', status: 'idle' },
    { id: 2, label: '2. Hydrate Cart', status: 'idle' },
    { id: 3, label: '3. Stage & Verify', status: 'idle' },
  ]);
  const [logs, setLogs] = useState<string[]>(() => sovereignBridge.getLogs());
  const [isExecuting, setIsExecuting] = useState(false);
  const [newErrandTitle, setNewErrandTitle] = useState('');
  const [copied, setCopied] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const pendingActions = actions.filter((a) => a.status === 'pending_confirmation');
  const pendingCompanionApprovals = companionState.approvalCards.filter((c) => c.status === 'pending');
  const connectedSkillsCount = loadRegistry().installed.length;
  const splitPipeline = companionState.splitPipeline;

  useEffect(() => {
    const unsubCompanion = sovereignBridge.subscribeCompanion((state) => {
      setCompanionState(state);
      if (state.cartItems.length > 0) {
        setActiveCartItems(state.cartItems);
      }
      if (state.activeUrl) {
        setUrl(state.activeUrl);
      }
      if (state.activeSpecialist) {
        setActiveSpecialist(state.activeSpecialist);
      }
    });

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
      if (event.payload.items && event.payload.items.length > 0) {
        setActiveCartItems(event.payload.items);
      }
      if (event.payload.logText) {
        setLogs((prev) => [...prev.slice(-80), event.payload.logText!]);
      }
      if (event.type === 'connect' && event.payload.agentName) {
        setActiveSpecialist(event.payload.agentName);
      }
      if (event.type === 'host_switch' && event.payload.executionHost) {
        setExecutionHost(event.payload.executionHost);
        if (event.payload.executionHost === 'dashboard') {
          setWindowMode((prev) => (prev === 'mobile_640' || (typeof window !== 'undefined' && window.innerWidth < 640) ? 'desktop_1024' : prev));
        }
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

    return () => {
      unsubCompanion();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSetHost = (host: ExecutionHost) => {
    setExecutionHost(host);
    sovereignBridge.setExecutionHost(host, 'dashboard');
    if (host === 'dashboard') {
      setWindowMode((prev) => (prev === 'mobile_640' || (typeof window !== 'undefined' && window.innerWidth < 640) ? 'desktop_1024' : prev));
    } else if (host === 'phone') {
      setWindowMode('mobile_640');
    }
  };

  const handleDispatchSplitPipeline = (overrideQuery?: string) => {
    const q = (overrideQuery ?? searchQuery).trim() || 'hand-stitched leather belt';
    setSearchQuery(q);
    setSelectedFeedFilter('ALL');
    setActiveProfileMaker(null);
    setIsExecuting(true);
    sovereignBridge.runSplitPipeline(q, runtimeEngine);
    setTimeout(() => {
      setIsExecuting(false);
      if (autoSpeakRecitation) {
        const latestScript =
          sovereignBridge.getCompanionState().splitPipeline?.dualViewSummary?.voiceRecitationScript;
        if (latestScript) {
          void speak(latestScript, 'warm');
        }
      }
    }, 600);
  };

  const handleSpeakRecitation = () => {
    const script = splitPipeline.dualViewSummary?.voiceRecitationScript;
    if (!script) return;
    void speak(script, 'warm');
    sovereignBridge.addLog(`[VOICE RECITATION] Playing TTS audio: "${script}"`);
  };

  const handleReviewTopArtisanProfile = () => {
    const matchId = splitPipeline.dualViewSummary?.independentArtisanPick?.matchId;
    const found =
      splitPipeline.sovereignDiscoveryMatches.find((m) => m.id === matchId) ||
      splitPipeline.sovereignDiscoveryMatches[0] ||
      null;
    setActiveProfileMaker(found);
  };

  const handleIngestSmallBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMakerName.trim() || !newProductName.trim()) return;
    const numeric = parseFloat(newPrice.replace(/[^0-9.]/g, '')) || 45;
    const formattedPrice = newPrice.startsWith('$') ? newPrice : `$${numeric.toFixed(2)}`;

    const created = sovereignBridge.ingestIndependentMerchant({
      makerName: newMakerName.trim(),
      originCity: newMakerCity.trim() || 'Independent Workshop',
      productName: newProductName.trim(),
      categoryKeyword: newCategoryKeyword.trim() || 'belt',
      price: formattedPrice,
      numericPrice: numeric,
      directUrl: newFeedUrl.trim().replace(/\/feeds\/.*$/, '') || 'https://independent.workshop/direct',
      feedUrl: newFeedUrl.trim(),
      ingestionProtocol: newIngestionProtocol,
      placeCardTier: newPlaceCardTier,
      federatedSource:
        newIngestionProtocol === 'BiteLocal Chamber Sync'
          ? 'Chamber / BiteLocal Registry'
          : newIngestionProtocol === 'Shopify Open Index'
          ? 'Shopify Independent Index'
          : 'Global Craft Guild',
      materials: newMaterials.trim(),
      craftsmanshipNotes: newCraftNotes.trim(),
      guildVerification: `Verified via ${newIngestionProtocol}`,
      workshopProfileBio: `${newMakerName.trim()} in ${newMakerCity.trim()} indexed via ${newIngestionProtocol} (${newPlaceCardTier}). Protected by Carol Ann's No Pay-to-Rank Covenant.`,
    });

    setIngestionSuccessBanner(
      `Indexed "${created.makerName}" (${created.originCity}) under ${created.placeCardTier} with $0.00 CPC bidding.`
    );
    setSearchQuery(newCategoryKeyword.trim() || 'hand-stitched leather belt');
  };

  const handleRunWholeFoodsErrand = () => {
    setIsExecuting(true);
    const items = ['Organic Tuscan Kale', 'Grass-Fed Ribeye', 'Raw Honey', 'Almond Milk'];
    setActiveCartItems(items);
    setActiveSpecialist('Carol Ann (Executive Orchestrator)');
    sovereignBridge.dispatchErrand(
      'Whole Foods Grocery Order',
      'https://wholefoods.amazon.com/cart',
      items,
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
    setActiveCartItems(sampleItems);
    setActiveSpecialist(agentName);
    sovereignBridge.dispatchErrand(title, targetUrl, sampleItems, 'desktop', agentId, agentName);
    setTimeout(() => setIsExecuting(false), 2400);
  };

  const handleSendExecChatCommand = () => {
    const clean = execChatInput.trim();
    if (!clean) return;
    sovereignBridge.sendCompanionVoiceCommand(clean, 'desktop', activeSpecialist, url);
    setExecChatInput('');
  };

  const handleAddErrand = () => {
    if (!newErrandTitle.trim()) return;
    const newE: ErrandTask = {
      id: uid('er'),
      target: 'custom',
      title: newErrandTitle.trim(),
      items: ['Staged via Browser Sandbox'],
      status: 'draft',
    };
    setErrands((prev) => [newE, ...prev]);
    setNewErrandTitle('');
  };

  const handleToggleErrandStatus = (errand: ErrandTask) => {
    const nextStatus = errand.status === 'executed' ? 'draft' : 'executed';
    setErrands((prev) =>
      prev.map((e) => (e.id === errand.id ? { ...e, status: nextStatus } : e))
    );
  };

  const handleDeleteErrand = (id: string) => {
    setErrands((prev) => prev.filter((e) => e.id !== id));
  };

  const handleConfirmAction = (action: HydrateFormAction) => {
    const updated: HydrateFormAction = {
      ...action,
      status: 'executed',
      executed_at: new Date().toISOString(),
    };
    setActions((prev) => prev.map((a) => (a.id === action.id ? updated : a)));
    handleTriggerQuickErrand(
      action.form_payload.title,
      `https://${(action.target_app || 'app').toLowerCase().replace(/\s+/g, '')}.com/action`,
      action.form_payload.items || [action.action_name],
      'carol-anchor',
      'Carol Ann (Executive Orchestrator)'
    );
  };

  const handleCopyScratchpad = () => {
    navigator.clipboard.writeText(scratchpad);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredSovereignMatches =
    selectedFeedFilter === 'ALL'
      ? splitPipeline.sovereignDiscoveryMatches
      : splitPipeline.sovereignDiscoveryMatches.filter(
          (m) => m.federatedSource === selectedFeedFilter
        );

  const dualView = splitPipeline.dualViewSummary;

  return (
    <div
      className={`adaptive-shell-container flex h-full flex-col select-none overflow-hidden transition-colors ${
        isLight ? 'bg-rose-50/30 text-slate-800' : 'bg-[#0B0C10]/90 text-white'
      }`}
    >
      {/* Sandbox Top Sub-Header with Adaptive Windowing Mode Switcher */}
      <div
        className={`flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-6 py-3 backdrop-blur-md ${
          isLight ? 'border-rose-200/60 bg-white/80' : 'border-white/8 bg-[#101118]/90'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Monitor className="h-4 w-4" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={`font-display text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Interactive AI Browser Tab & Sovereign Discovery
              </h1>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-mono tabular-nums ${
                  companionState.wsConnected
                    ? isLight
                      ? 'text-emerald-700'
                      : 'text-emerald-300'
                    : isLight
                    ? 'text-amber-700'
                    : 'text-amber-300'
                }`}
              >
                <span aria-hidden="true">·</span>
                <Radio className="h-3 w-3" />
                {companionState.wsConnected
                  ? `WS Co-Pilot Live (${companionState.wsLatencyMs}ms)`
                  : 'Local Bridge Sync'}
              </span>
            </div>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              Embedded Browser Stream ({runtimeEngine}) · Dual-View Answer · $0.00 CPC No Pay-to-Rank Auction
            </p>
          </div>
        </div>

        {/* Adaptive Windowing Mode & Runner Host Strip */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Primary Mode Selector inside Browser Tab */}
          <div
            className={`flex items-center gap-1 rounded-xl border p-1 ${
              isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-black/40'
            }`}
          >
            <button
              onClick={() => setBrowserViewTab('split_pipeline')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                browserViewTab === 'split_pipeline'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-white/60 hover:bg-white/5'
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>Dual-View Split Pipeline</span>
            </button>
            <button
              onClick={() => setBrowserViewTab('monetization_model')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                browserViewTab === 'monetization_model'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-white/60 hover:bg-white/5'
              }`}
            >
              <Store className="h-3 w-3" />
              <span>Place Card & Open Index</span>
            </button>
            <button
              onClick={() => setBrowserViewTab('dom_runner')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                browserViewTab === 'dom_runner'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-white/60 hover:bg-white/5'
              }`}
            >
              <Monitor className="h-3 w-3" />
              <span>DOM Errand Runner</span>
            </button>
          </div>

          {/* Windowing Manifest Layout Selector */}
          <div
            className={`flex items-center gap-1 rounded-xl border p-1 ${
              isLight ? 'border-indigo-200 bg-white' : 'border-white/10 bg-black/40'
            }`}
          >
            <button
              onClick={() => setWindowMode('auto')}
              className={`rounded-lg px-2 py-1 text-[10.5px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                windowMode === 'auto'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-white/60 hover:bg-white/5'
              }`}
              title="Automatically adapt via CSS @container queries (<640px vs >1024px)"
            >
              Auto (@container)
            </button>
            <button
              onClick={() => setWindowMode('mobile_640')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                windowMode === 'mobile_640'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-white/60 hover:bg-white/5'
              }`}
              title="Preview <640px Companion Mode (Voice Stream, Approval Cards & Top-3 Picker)"
            >
              <Smartphone className="h-3 w-3" />
              <span>&lt;640px Co-Pilot</span>
            </button>
            <button
              onClick={() => setWindowMode('desktop_1024')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                windowMode === 'desktop_1024'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-white/60 hover:bg-white/5'
              }`}
              title="Preview >1024px Googlebook Split Canvas"
            >
              <Monitor className="h-3 w-3" />
              <span>&gt;1024px Split</span>
            </button>
          </div>

          <div
            className={`flex items-center gap-1 rounded-xl border p-1 ${
              isLight ? 'border-rose-200 bg-white' : 'border-white/10 bg-black/40'
            }`}
          >
            <button
              onClick={() => handleSetHost('dashboard')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                executionHost === 'dashboard'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-white/60 hover:bg-white/5'
              }`}
            >
              <Monitor className="h-3 w-3" />
              <span>Local</span>
            </button>
            <button
              onClick={() => handleSetHost('phone')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                executionHost === 'phone'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-white/60 hover:bg-white/5'
              }`}
            >
              <Smartphone className="h-3 w-3" />
              <span>Phone</span>
            </button>
            <button
              onClick={() => handleSetHost('dual')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                executionHost === 'dual'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-white/60 hover:bg-white/5'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>Dual</span>
            </button>
          </div>

          <div
            className={`hidden xl:flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[11px] font-mono tabular-nums ${
              isLight ? 'border-slate-200 bg-white text-slate-700' : 'border-white/10 bg-white/[0.03] text-white/70'
            }`}
          >
            <Wrench className="h-3.5 w-3.5 text-purple-400" />
            <span>{connectedSkillsCount} Skills</span>
            <span className="opacity-30">·</span>
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>{perfSnapshot.fps} FPS</span>
          </div>
        </div>
      </div>

      {/* MOBILE / <640px COMPANION VIEW (Active via @container <640px or explicit mobile_640 preview) */}
      <div
        className={
          windowMode === 'mobile_640'
            ? 'flex-1 min-h-0 overflow-y-auto m-scroll p-4'
            : windowMode === 'desktop_1024'
            ? 'hidden'
            : 'adaptive-mobile-companion flex-1 min-h-0 overflow-y-auto m-scroll p-4'
        }
      >
        <div className="mx-auto max-w-xl">
          <CompanionProtocolPanel
            isLight={isLight}
            onOpenMainDashboard={() => {
              setWindowMode('desktop_1024');
              setExecutionHost('dashboard');
              sovereignBridge.setExecutionHost('dashboard', 'dashboard');
            }}
          />
        </div>
      </div>

      {/* DESKTOP / >1024px GOOGLEBOOK SPLIT CANVAS (Interactive Browser Runner on Left, Executive Chat & Ledger on Right) */}
      <div
        className={
          windowMode === 'mobile_640'
            ? 'hidden'
            : windowMode === 'desktop_1024'
            ? 'flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden'
            : 'adaptive-desktop-split flex-1 min-h-0 overflow-hidden'
        }
      >
        {/* LEFT PANE (7 cols): Interactive AI Browser Tab (DOM Interceptor & Split Pipeline + Small Business Model + DOM Runner) */}
        <div
          className={`lg:col-span-7 flex flex-col min-h-0 overflow-y-auto m-scroll p-6 space-y-6 border-b lg:border-b-0 lg:border-r ${
            isLight ? 'border-rose-200/60' : 'border-white/8'
          }`}
        >
          {/* Embedded Sandboxed Browser Stream Frame & Omni-Search Bar */}
          <div
            className={`rounded-2xl border transition-all overflow-hidden ${
              isLight
                ? 'border-slate-200 bg-white text-slate-800'
                : 'border-white/12 bg-[#12131A] text-white'
            }`}
          >
            {/* Browser Chrome Bar + Embedded Runtime Selector */}
            <div
              className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 ${
                isLight ? 'border-slate-200 bg-slate-50' : 'border-white/8 bg-[#0E0F14]'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                </div>
                <span className={`ml-2 text-xs font-medium ${isLight ? 'text-slate-600' : 'text-white/65'}`}>
                  Embedded Webview Runtime:
                </span>
              </div>

              <div className="flex items-center gap-1">
                {(
                  [
                    'Playwright Sandboxed Stream',
                    'CEF Chromium Stream',
                    'Tauri System Webview',
                  ] as SplitPipelineRun['runtimeEngine'][]
                ).map((engine) => (
                  <button
                    key={engine}
                    type="button"
                    onClick={() => setRuntimeEngine(engine)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                      runtimeEngine === engine
                        ? isLight
                          ? 'bg-slate-900 text-white'
                          : 'bg-white/15 text-white'
                        : isLight
                        ? 'text-slate-600 hover:bg-slate-200/60'
                        : 'text-white/50 hover:text-white/85'
                    }`}
                  >
                    {engine}
                  </button>
                ))}
              </div>
            </div>

            {/* DOM Interceptor Search & URL Bar */}
            <div className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div
                  className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3.5 py-2 transition ${
                    isLight
                      ? 'border-slate-300 bg-slate-50/70 text-slate-900 focus-within:border-slate-900'
                      : 'border-white/15 bg-[#090A0E] text-white focus-within:border-emerald-400'
                  }`}
                >
                  <Search className="h-4 w-4 text-emerald-500 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDispatchSplitPipeline()}
                    placeholder='Search item to dispatch Parallel Split Pipeline (e.g. "hand-stitched leather belt" or "cordless drill")…'
                    className="w-full bg-transparent text-xs font-medium outline-none"
                  />
                  {isExecuting && <RefreshCw className="h-3.5 w-3.5 text-emerald-400 animate-spin shrink-0" />}
                </div>

                <button
                  type="button"
                  onClick={() => handleDispatchSplitPipeline()}
                  disabled={isExecuting}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 transition disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>Dispatch Split Pipeline</span>
                </button>
              </div>

              {/* Preset Search Starters + Active URL indicator */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
                    Try query:
                  </span>
                  {PRESET_PIPELINE_QUERIES.map((preset) => (
                    <button
                      key={preset.query}
                      type="button"
                      onClick={() => handleDispatchSplitPipeline(preset.query)}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                        splitPipeline.query.toLowerCase() === preset.query.toLowerCase()
                          ? isLight
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                            : 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300 font-semibold'
                          : isLight
                          ? 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                          : 'border-white/10 bg-white/[0.03] text-white/65 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className={`flex items-center gap-1.5 text-[11px] font-mono truncate max-w-xs ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
                  <Lock className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span className="truncate">{url}</span>
                </div>
              </div>
            </div>
          </div>

          {browserViewTab === 'split_pipeline' && (
            <>
              {/* COMPONENT 3: DUAL-VIEW SEARCH PRESENTATION ("Commercial Option" vs. "Independent / Artisan Pick") & VOICE RECITATION */}
              {dualView && (
                <div
                  className={`rounded-2xl border p-5 space-y-4 ${
                    isLight
                      ? 'border-emerald-300 bg-white'
                      : 'border-emerald-500/35 bg-[#12141C]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-500">
                          Dual-View Search Presentation · Small Business First
                        </span>
                        <span className={`text-[11px] font-mono tabular-nums ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                          · $0.00 CPC · No Pay-to-Rank Auction
                        </span>
                      </div>
                      <p className={`mt-0.5 text-xs ${isLight ? 'text-slate-600' : 'text-white/65'}`}>
                        Carol Ann always contrasts the standard big-box commodity against verified local & global independent workshops.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAutoSpeakRecitation((v) => !v)}
                        className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                          autoSpeakRecitation
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-semibold'
                            : isLight
                            ? 'border-slate-200 bg-slate-50 text-slate-600'
                            : 'border-white/10 bg-white/[0.03] text-white/60'
                        }`}
                      >
                        {autoSpeakRecitation ? 'Auto-Voice: ON' : 'Auto-Voice: OFF'}
                      </button>

                      <button
                        type="button"
                        onClick={handleSpeakRecitation}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>Recite Small-Business-First Answer</span>
                      </button>
                    </div>
                  </div>

                  {/* Agent Voice Recitation Transcript Box */}
                  <div
                    className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isLight
                        ? 'border-emerald-200 bg-emerald-50/60 text-slate-800'
                        : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-emerald-500">
                        Carol Ann Agent Voice Recitation (Introduces Independent Workshop First):
                      </div>
                      <p className="text-xs leading-relaxed font-medium italic">
                        &ldquo;{dualView.voiceRecitationScript}&rdquo;
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleReviewTopArtisanProfile}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                        isLight
                          ? 'border-emerald-600 bg-white text-emerald-800 hover:bg-emerald-50'
                          : 'border-emerald-400/50 bg-[#0B0C10] text-emerald-300 hover:bg-emerald-500/20'
                      }`}
                    >
                      Review Workshop Profile
                    </button>
                  </div>

                  {/* Side-by-Side Dual-View Answer Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    {/* Left: Commercial Option */}
                    <div
                      className={`rounded-xl border p-4 flex flex-col justify-between ${
                        isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/10 bg-white/[0.02]'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-sky-500">
                            01. Commercial Option · {dualView.commercialOption.merchant}
                          </span>
                          <span className="font-mono text-sm font-bold tabular-nums">
                            {dualView.commercialOption.price}
                          </span>
                        </div>
                        <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {dualView.commercialOption.name}
                        </h3>
                        <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/65'}`}>
                          {dualView.commercialOption.summary}
                        </p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[11px]">
                        <span className="font-mono opacity-60">Standard Big-Box SKU</span>
                        <button
                          type="button"
                          onClick={() => {
                            const firstDirect = splitPipeline.directUtilityMatches[0];
                            if (firstDirect) {
                              sovereignBridge.selectSplitPipelineMatch(firstDirect.id, 'direct');
                            }
                          }}
                          className={`font-semibold cursor-pointer hover:underline ${
                            isLight ? 'text-sky-700' : 'text-sky-400'
                          }`}
                        >
                          Stage Commercial Option →
                        </button>
                      </div>
                    </div>

                    {/* Right: Independent / Artisan Pick */}
                    <div
                      className={`rounded-xl border p-4 flex flex-col justify-between ${
                        isLight
                          ? 'border-emerald-500 bg-emerald-50/40'
                          : 'border-emerald-400/60 bg-emerald-500/10'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-emerald-500">
                            02. Independent / Artisan Pick · {dualView.independentArtisanPick.originRegion}
                          </span>
                          <span className="font-mono text-sm font-bold tabular-nums text-emerald-500">
                            {dualView.independentArtisanPick.price}
                          </span>
                        </div>
                        <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {dualView.independentArtisanPick.makerName} — {dualView.independentArtisanPick.name}
                        </h3>
                        <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/75'}`}>
                          {dualView.independentArtisanPick.summary}
                        </p>
                        {dualView.secondaryArtisanPick && (
                          <div
                            className={`mt-2 pt-2 border-t text-[11px] flex items-center justify-between gap-2 ${
                              isLight ? 'border-emerald-200/70 text-slate-700' : 'border-white/10 text-white/75'
                            }`}
                          >
                            <span>
                              <span className="font-semibold">Regional Alternative:</span>{' '}
                              {dualView.secondaryArtisanPick.makerName} ({dualView.secondaryArtisanPick.originRegion})
                            </span>
                            <span className="font-mono font-semibold tabular-nums text-emerald-500">
                              {dualView.secondaryArtisanPick.price}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[11px]">
                        <span className="font-mono opacity-75">
                          {dualView.independentArtisanPick.placeCardTier}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleReviewTopArtisanProfile}
                            className="font-semibold underline cursor-pointer opacity-80 hover:opacity-100"
                          >
                            Profile
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              sovereignBridge.selectSplitPipelineMatch(
                                dualView.independentArtisanPick.matchId,
                                'sovereign'
                              )
                            }
                            className="font-semibold text-emerald-500 hover:underline cursor-pointer"
                          >
                            Support Artisan →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Workshop Profile Drawer (Opens when user clicks "Review Workshop Profile") */}
                  {activeProfileMaker && (
                    <div
                      className={`rounded-xl border p-4 space-y-3 ${
                        isLight
                          ? 'border-slate-300 bg-slate-50 text-slate-900'
                          : 'border-white/20 bg-[#0B0C10] text-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-emerald-500">
                              Verified Workshop Place Card Profile
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              Craft Merit Score: {activeProfileMaker.craftMeritScore}/100 ($0.00 CPC)
                            </span>
                          </div>
                          <h4 className="mt-1 text-sm font-semibold">
                            {activeProfileMaker.makerName} · {activeProfileMaker.originCity}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveProfileMaker(null)}
                          className="p-1 opacity-60 hover:opacity-100 cursor-pointer"
                          title="Close Workshop Profile"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                        {activeProfileMaker.workshopProfileBio}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                        <div className={`rounded-lg border p-2.5 ${isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/[0.02]'}`}>
                          <div className="opacity-60">Ingestion Protocol</div>
                          <div className="font-semibold mt-0.5">{activeProfileMaker.ingestionProtocol}</div>
                        </div>
                        <div className={`rounded-lg border p-2.5 ${isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/[0.02]'}`}>
                          <div className="opacity-60">Place Card Membership</div>
                          <div className="font-semibold mt-0.5 text-emerald-500">{activeProfileMaker.placeCardTier}</div>
                        </div>
                        <div className={`rounded-lg border p-2.5 ${isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/[0.02]'}`}>
                          <div className="opacity-60">Guild & Margin</div>
                          <div className="font-semibold mt-0.5">{activeProfileMaker.directMarginRetained}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Parallel Worker Threads Status Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {/* Thread 1 Status Box */}
                <div
                  className={`rounded-xl border p-4 flex flex-col justify-between ${
                    isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#12131A]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-sky-500">
                        01. Thread 1 · Direct Utility (Commodity DOM)
                      </span>
                      <span className="font-mono text-[11px] tabular-nums opacity-65">
                        {splitPipeline.thread1Status.latencyMs}ms · {splitPipeline.thread1Status.domNodesScanned} nodes
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/75'}`}>
                      {splitPipeline.thread1Status.stepText}
                    </p>
                  </div>
                  <div className={`mt-3 pt-2.5 border-t flex flex-wrap items-center gap-2 text-[11px] font-mono tabular-nums ${
                    isLight ? 'border-slate-100 text-slate-500' : 'border-white/8 text-white/50'
                  }`}>
                    <span>Merchants: Home Depot · Target · Amazon</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-500 font-semibold">
                      {splitPipeline.thread1Status.junkReviewsDiscarded} Junk Reviews Discarded
                    </span>
                  </div>
                </div>

                {/* Thread 2 Status Box */}
                <div
                  className={`rounded-xl border p-4 flex flex-col justify-between ${
                    isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#12131A]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-emerald-500">
                        02. Thread 2 · Sovereign Discovery (Core Mission)
                      </span>
                      <span className="font-mono text-[11px] tabular-nums opacity-65">
                        {splitPipeline.thread2Status.latencyMs}ms · {splitPipeline.thread2Status.independentIndexesScanned} indexes
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/75'}`}>
                      {splitPipeline.thread2Status.stepText}
                    </p>
                  </div>
                  <div className={`mt-3 pt-2.5 border-t flex flex-wrap items-center gap-2 text-[11px] font-mono tabular-nums ${
                    isLight ? 'border-slate-100 text-slate-500' : 'border-white/8 text-white/50'
                  }`}>
                    <span>Shopify Index · Etsy Artisan · BiteLocal · Craft Guilds</span>
                  </div>
                </div>
              </div>

              {/* THREAD 2: SOVEREIGN DISCOVERY (THE CORE MISSION) */}
              <div
                className={`rounded-2xl border p-5 space-y-4 ${
                  isLight ? 'border-slate-200 bg-white' : 'border-white/12 bg-[#12131A]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Compass className="h-4 w-4 text-emerald-500" />
                      <h2 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Thread 2 · Sovereign Discovery — Small-Business & Federated Independent Feeds
                      </h2>
                    </div>
                    <p className={`mt-0.5 text-xs ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                      Ranked strictly by Craft Merit Score ($0.00 CPC · No Pay-to-Rank Auction) for &ldquo;{splitPipeline.query}&rdquo;
                    </p>
                  </div>

                  {/* Federated Feed Filter Bar */}
                  <div
                    className={`flex flex-wrap items-center gap-1 rounded-xl border p-1 ${
                      isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/30'
                    }`}
                  >
                    {(
                      [
                        { id: 'ALL', label: 'All Feeds' },
                        { id: 'Shopify Independent Index', label: 'Shopify Index' },
                        { id: 'Etsy Artisan Export', label: 'Etsy Artisan' },
                        { id: 'Chamber / BiteLocal Registry', label: 'BiteLocal' },
                        { id: 'Global Craft Guild', label: 'Craft Guilds' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFeedFilter(f.id)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                          selectedFeedFilter === f.id
                            ? 'bg-emerald-600 text-white'
                            : isLight
                            ? 'text-slate-600 hover:text-slate-900'
                            : 'text-white/60 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Independent Makers Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
                  {filteredSovereignMatches.map((maker) => (
                    <div
                      key={maker.id}
                      className={`rounded-xl border p-4 flex flex-col justify-between transition ${
                        maker.selected
                          ? isLight
                            ? 'border-emerald-600 bg-emerald-50/40'
                            : 'border-emerald-400/70 bg-emerald-500/10'
                          : isLight
                          ? 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className={`font-medium ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                            {maker.federatedSource} · {maker.originCity}
                          </span>
                          <span className="font-mono text-sm font-semibold tabular-nums text-emerald-500">
                            {maker.price}
                          </span>
                        </div>

                        <h3 className={`text-sm font-semibold leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {maker.name}
                        </h3>

                        <div className={`flex flex-wrap items-center gap-1.5 text-xs ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                          <span className="font-semibold">{maker.makerName}</span>
                          <span aria-hidden="true">·</span>
                          <span>{maker.leadTime}</span>
                        </div>

                        <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                          {maker.craftsmanshipNotes}
                        </p>

                        <div className={`pt-1 text-[11px] space-y-1 ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                          <div>
                            <span className="font-semibold">Materials:</span> {maker.materials}
                          </div>
                          <div>
                            <span className="font-semibold">Provenance:</span> {maker.guildVerification} · {maker.directMarginRetained}
                          </div>
                          <div className="flex items-center justify-between pt-0.5 font-mono text-[10.5px] tabular-nums">
                            <span>{maker.placeCardTier}</span>
                            <span className="text-emerald-500 font-semibold">
                              Merit {maker.craftMeritScore}/100 · $0 CPC
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveProfileMaker(maker)}
                          className="text-xs font-medium underline opacity-75 hover:opacity-100 cursor-pointer"
                        >
                          Inspect Place Card
                        </button>
                        <button
                          type="button"
                          onClick={() => sovereignBridge.selectSplitPipelineMatch(maker.id, 'sovereign')}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                            maker.selected
                              ? 'bg-emerald-600 text-white'
                              : isLight
                              ? 'bg-slate-900 text-white hover:bg-slate-800'
                              : 'bg-white/12 text-white hover:bg-emerald-600'
                          }`}
                        >
                          {maker.selected ? '✓ Staged in DOM Cart' : 'Support Maker & Stage'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* THREAD 1: DIRECT UTILITY (COMMODITY SIDE-BY-SIDE SPEC & PRICE COMPARISON CARD) */}
              <div
                className={`rounded-2xl border p-5 space-y-4 ${
                  isLight ? 'border-slate-200 bg-white' : 'border-white/12 bg-[#12131A]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-sky-500" />
                      <h2 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Thread 1 · Direct Utility — Side-by-Side Spec & Price Comparison
                      </h2>
                    </div>
                    <p className={`mt-0.5 text-xs ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                      Top 3 verified commodity matches from standard merchants · {splitPipeline.thread1Status.junkReviewsDiscarded} incentivized/junk reviews discarded
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSideBySideMatrix((v) => !v)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                      isLight
                        ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        : 'border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {showSideBySideMatrix ? 'View Individual Cards' : 'View Comparison Table'}
                  </button>
                </div>

                {showSideBySideMatrix ? (
                  /* Side-by-Side Comparison Table with Tabular Numerals */
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className={`border-b ${isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-white/50'}`}>
                          <th className="py-2.5 pr-3 font-semibold">Rank & Commodity Match</th>
                          <th className="py-2.5 px-3 font-semibold">Merchant</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Price</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Verified Rating</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Junk Stripped</th>
                          <th className="py-2.5 px-3 font-semibold">Key Specifications</th>
                          <th className="py-2.5 pl-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 dark:divide-white/8">
                        {splitPipeline.directUtilityMatches.map((item) => (
                          <tr
                            key={item.id}
                            className={`transition ${
                              item.selected
                                ? isLight
                                  ? 'bg-sky-50/70'
                                  : 'bg-sky-500/10'
                                : isLight
                                ? 'hover:bg-slate-50'
                                : 'hover:bg-white/[0.02]'
                            }`}
                          >
                            <td className="py-3 pr-3 align-top">
                              <div className="font-semibold">
                                0{item.rank}. {item.name}
                              </div>
                              <div className={`mt-0.5 text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                                {item.unitSpec} · {item.fulfillment}
                              </div>
                            </td>
                            <td className="py-3 px-3 align-top font-medium whitespace-nowrap">
                              {item.merchant}
                            </td>
                            <td className="py-3 px-3 align-top text-right font-mono font-semibold tabular-nums whitespace-nowrap text-emerald-500">
                              {item.price}
                            </td>
                            <td className="py-3 px-3 align-top text-right font-mono tabular-nums whitespace-nowrap">
                              {item.rating.toFixed(1)} ★ ({item.verifiedReviews})
                            </td>
                            <td className="py-3 px-3 align-top text-right font-mono tabular-nums whitespace-nowrap text-amber-500">
                              -{item.discardedJunkReviews} filtered
                            </td>
                            <td className="py-3 px-3 align-top">
                              <div className="space-y-0.5 text-[11px]">
                                {item.specs.slice(0, 2).map((s) => (
                                  <div key={s.label}>
                                    <span className="opacity-60">{s.label}:</span> {s.value}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 pl-3 align-top text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => sovereignBridge.selectSplitPipelineMatch(item.id, 'direct')}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                                  item.selected
                                    ? 'bg-sky-600 text-white'
                                    : isLight
                                    ? 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                                    : 'border border-white/15 bg-white/[0.04] text-white hover:bg-sky-600'
                                }`}
                              >
                                {item.selected ? '✓ Staged' : 'Stage DOM'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* 3-Column Side-by-Side Spec Cards */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
                    {splitPipeline.directUtilityMatches.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-4 flex flex-col justify-between ${
                          item.selected
                            ? isLight
                              ? 'border-sky-600 bg-sky-50/40'
                              : 'border-sky-400/70 bg-sky-500/10'
                            : isLight
                            ? 'border-slate-200 bg-slate-50/40'
                            : 'border-white/10 bg-white/[0.02]'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-sky-500">
                              0{item.rank}. {item.merchant}
                            </span>
                            <span className="font-mono font-bold tabular-nums text-emerald-500">
                              {item.price}
                            </span>
                          </div>
                          <h3 className="text-xs font-semibold leading-snug">{item.name}</h3>
                          <p className="text-[11px] font-mono tabular-nums opacity-70">
                            {item.rating} ★ ({item.verifiedReviews} verified) · -{item.discardedJunkReviews} junk stripped
                          </p>
                          <div className="pt-2 border-t border-black/5 dark:border-white/10 space-y-1 text-[11px]">
                            {item.specs.map((s) => (
                              <div key={s.label} className="flex justify-between gap-2">
                                <span className="opacity-60">{s.label}</span>
                                <span className="font-medium text-right">{s.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => sovereignBridge.selectSplitPipelineMatch(item.id, 'direct')}
                          className={`mt-3 w-full rounded-lg py-1.5 text-xs font-semibold transition cursor-pointer ${
                            item.selected
                              ? 'bg-sky-600 text-white'
                              : isLight
                              ? 'bg-slate-900 text-white hover:bg-slate-800'
                              : 'bg-white/10 text-white hover:bg-sky-600'
                          }`}
                        >
                          {item.selected ? '✓ Staged in Cart' : 'Select Commodity Match'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {browserViewTab === 'monetization_model' && (
            /* COMPONENT 3: SMALL BUSINESS RECOMMENDATION & MONETIZATION MODEL PORTAL */
            <div className="space-y-6">
              {/* Mechanism Overview Matrix */}
              <div
                className={`rounded-2xl border p-5 space-y-4 ${
                  isLight ? 'border-slate-200 bg-white' : 'border-white/12 bg-[#12131A]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold">
                      Small Business Recommendation & Anti-Auction Monetization Model
                    </h2>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                      Protecting independent artisans and local workshops from being priced out by billion-dollar CPC ad budgets.
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-emerald-500 tabular-nums">
                    0% Ad-Auction · Flat-Rate Place Cards
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`border-b ${isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-white/50'}`}>
                        <th className="py-2.5 pr-4 font-semibold">Mechanism</th>
                        <th className="py-2.5 px-4 font-semibold">Carol Ann Sovereign Implementation</th>
                        <th className="py-2.5 pl-4 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/8">
                      <tr>
                        <td className="py-3 pr-4 font-semibold whitespace-nowrap">Search Presentation</td>
                        <td className="py-3 px-4">
                          Always displays a dual-view answer: <strong>Commercial Option</strong> (e.g., Target $30) vs. <strong>Independent / Artisan Pick</strong> (e.g., Bolu Mountains, Turkey $42 or Golden, Colorado $68).
                        </td>
                        <td className="py-3 pl-4 text-right font-mono text-emerald-500 whitespace-nowrap">
                          Active Dual-View
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 font-semibold whitespace-nowrap">No Pay-to-Rank Auction</td>
                        <td className="py-3 px-4">
                          Eliminates cost-per-click (CPC) bidding wars. Top slots are ranked strictly by Craft Merit Score, material grade, and guild provenance.
                        </td>
                        <td className="py-3 pl-4 text-right font-mono text-emerald-500 whitespace-nowrap">
                          $0.00 CPC Enforced
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 font-semibold whitespace-nowrap">Phase 1: Free Ingestion</td>
                        <td className="py-3 px-4">
                          Open indexing via Schema.org micro-schema or RSS/Atom product feeds for small merchants and local shops to build ecosystem density.
                        </td>
                        <td className="py-3 pl-4 text-right font-mono text-emerald-500 whitespace-nowrap">
                          Open Feed Ready
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 font-semibold whitespace-nowrap">Phase 2: Flat-Rate &ldquo;Place Card&rdquo;</td>
                        <td className="py-3 px-4">
                          Accessible flat membership ($10–$25/mo) allowing small merchants to be verified and highlighted as featured local/global creators.
                        </td>
                        <td className="py-3 pl-4 text-right font-mono text-emerald-500 whitespace-nowrap">
                          $10–$25/mo Flat
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 font-semibold whitespace-nowrap">Agent Voice Recitation</td>
                        <td className="py-3 px-4">
                          Carol Ann naturally introduces the small business option first via voice synthesis and offers to open their workshop profile.
                        </td>
                        <td className="py-3 pl-4 text-right font-mono text-emerald-500 whitespace-nowrap">
                          Voice Priority #1
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Phase 2: Flat-Rate Place Card Tiers ($0 / $10 / $15 / $25 per month) */}
              <div
                className={`rounded-2xl border p-5 space-y-4 ${
                  isLight ? 'border-slate-200 bg-white' : 'border-white/12 bg-[#12131A]'
                }`}
              >
                <div>
                  <h3 className="text-sm font-semibold">
                    Phase 1 & Phase 2 Membership Tiers (Zero Pay-to-Rank Auction)
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                    Select a tier below to pre-configure the live Open Ingestion & Place Card simulator.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
                  {PLACE_CARD_TIERS.map((tier) => {
                    const isSelected = newPlaceCardTier === tier.id;
                    return (
                      <div
                        key={tier.id}
                        onClick={() => setNewPlaceCardTier(tier.id)}
                        className={`rounded-xl border p-4 flex flex-col justify-between transition cursor-pointer ${
                          isSelected
                            ? isLight
                              ? 'border-emerald-600 bg-emerald-50/50'
                              : 'border-emerald-400/70 bg-emerald-500/10'
                            : isLight
                            ? 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-emerald-500">
                              {tier.phase} · {tier.name}
                            </span>
                            <span className="font-mono text-sm font-bold tabular-nums">
                              {tier.monthlyRate}
                            </span>
                          </div>
                          <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                            {tier.description}
                          </p>
                          <ul className={`space-y-1 pt-1 text-[11px] ${isLight ? 'text-slate-600' : 'text-white/65'}`}>
                            {tier.features.map((feat) => (
                              <li key={feat} className="flex items-start gap-1.5">
                                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[11px] font-semibold">
                          <span className="font-mono opacity-65">No CPC Bidding</span>
                          <span className={isSelected ? 'text-emerald-500' : 'opacity-60'}>
                            {isSelected ? '✓ Active Tier' : 'Select Tier'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phase 1 Free Open Ingestion & Place Card Registration Simulator */}
              <form
                onSubmit={handleIngestSmallBusiness}
                className={`rounded-2xl border p-5 space-y-4 ${
                  isLight ? 'border-slate-200 bg-white' : 'border-white/12 bg-[#12131A]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Rss className="h-4 w-4 text-emerald-500" />
                    <div>
                      <h3 className="text-sm font-semibold">
                        Live Small-Business Feed Ingestion (Micro-Schema & RSS Indexer)
                      </h3>
                      <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                        Index an independent workshop into Thread 2 and immediately verify it in Dual-View search results.
                      </p>
                    </div>
                  </div>
                </div>

                {ingestionSuccessBanner && (
                  <div
                    className={`rounded-xl border p-3 text-xs flex items-center justify-between gap-2 ${
                      isLight
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                        : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                    }`}
                  >
                    <span>{ingestionSuccessBanner}</span>
                    <button
                      type="button"
                      onClick={() => setBrowserViewTab('split_pipeline')}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-white font-semibold cursor-pointer whitespace-nowrap shrink-0"
                    >
                      View in Split Pipeline →
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="space-y-1">
                    <span className="font-semibold opacity-75">Workshop / Maker Name</span>
                    <input
                      type="text"
                      value={newMakerName}
                      onChange={(e) => setNewMakerName(e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 outline-none ${
                        isLight ? 'border-slate-300 bg-slate-50' : 'border-white/15 bg-[#090A0E]'
                      }`}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="font-semibold opacity-75">Origin City / Region</span>
                    <input
                      type="text"
                      value={newMakerCity}
                      onChange={(e) => setNewMakerCity(e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 outline-none ${
                        isLight ? 'border-slate-300 bg-slate-50' : 'border-white/15 bg-[#090A0E]'
                      }`}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="font-semibold opacity-75">Artisan Product Title</span>
                    <input
                      type="text"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 outline-none ${
                        isLight ? 'border-slate-300 bg-slate-50' : 'border-white/15 bg-[#090A0E]'
                      }`}
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1">
                      <span className="font-semibold opacity-75">Direct Price</span>
                      <input
                        type="text"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className={`w-full rounded-xl border px-3 py-2 font-mono outline-none ${
                          isLight ? 'border-slate-300 bg-slate-50' : 'border-white/15 bg-[#090A0E]'
                        }`}
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="font-semibold opacity-75">Category Keyword</span>
                      <input
                        type="text"
                        value={newCategoryKeyword}
                        onChange={(e) => setNewCategoryKeyword(e.target.value)}
                        className={`w-full rounded-xl border px-3 py-2 outline-none ${
                          isLight ? 'border-slate-300 bg-slate-50' : 'border-white/15 bg-[#090A0E]'
                        }`}
                      />
                    </label>
                  </div>
                  <label className="space-y-1">
                    <span className="font-semibold opacity-75">Phase 1 Ingestion Protocol</span>
                    <select
                      value={newIngestionProtocol}
                      onChange={(e) => setNewIngestionProtocol(e.target.value as MerchantIngestionProtocol)}
                      className={`w-full rounded-xl border px-3 py-2 outline-none ${
                        isLight ? 'border-slate-300 bg-slate-50' : 'border-white/15 bg-[#090A0E]'
                      }`}
                    >
                      <option value="RSS / Atom Product Feed">RSS / Atom Product Feed</option>
                      <option value="Schema.org Micro-Schema">Schema.org Micro-Schema</option>
                      <option value="Shopify Open Index">Shopify Open Index</option>
                      <option value="BiteLocal Chamber Sync">BiteLocal Chamber Sync</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="font-semibold opacity-75">Feed / Micro-Schema Endpoint URL</span>
                    <input
                      type="text"
                      value={newFeedUrl}
                      onChange={(e) => setNewFeedUrl(e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 font-mono outline-none ${
                        isLight ? 'border-slate-300 bg-slate-50' : 'border-white/15 bg-[#090A0E]'
                      }`}
                    />
                  </label>
                  <label className="space-y-1 sm:col-span-2">
                    <span className="font-semibold opacity-75">Materials & Craftsmanship Provenance</span>
                    <input
                      type="text"
                      value={newMaterials}
                      onChange={(e) => setNewMaterials(e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 outline-none ${
                        isLight ? 'border-slate-300 bg-slate-50' : 'border-white/15 bg-[#090A0E]'
                      }`}
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] font-mono opacity-65">
                    Selected Membership: {newPlaceCardTier} · $0.00 CPC Guarantee
                  </span>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    Index Workshop & Activate Place Card
                  </button>
                </div>
              </form>
            </div>
          )}

          {browserViewTab === 'dom_runner' && (
            /* DOM Errand Runner View (Whole Foods & Calendar Automation + Top-3 Companion Picker) */
            <>
              <div
                className={`rounded-2xl border p-5 space-y-5 ${
                  isLight ? 'border-slate-200 bg-white' : 'border-white/12 bg-[#12131A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Headless DOM Automation Pipeline</h2>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                      Active Specialist: {activeSpecialist} · Synced with Phone Co-Pilot
                    </p>
                  </div>
                  <button
                    onClick={handleRunWholeFoodsErrand}
                    disabled={isExecuting}
                    className="flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs px-3.5 py-2 transition disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Play className="h-3.5 w-3.5 fill-white" />
                    <span>Run Whole Foods Errand</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {pipelineSteps.map((step) => {
                    const isDone = step.status === 'done';
                    const isRunning = step.status === 'running';
                    return (
                      <div
                        key={step.id}
                        className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-center transition-all ${
                          isRunning
                            ? 'border-sky-500/80 bg-sky-500/15'
                            : isDone
                            ? isLight
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : isLight
                            ? 'border-slate-200 bg-slate-50 text-slate-700'
                            : 'border-white/8 bg-white/[0.02] text-white/70'
                        }`}
                      >
                        {isRunning ? (
                          <RefreshCw className="h-4 w-4 text-sky-400 animate-spin shrink-0" />
                        ) : isDone ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : null}
                        <span className="text-xs font-semibold">{step.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Active DOM Target Payload */}
                <div
                  className={`rounded-xl border p-4 space-y-3 ${
                    isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/8 bg-[#0B0C10]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-semibold">
                        Active Staged DOM Cart ({activeCartItems.length} items hydrated)
                      </span>
                    </div>
                    <span className="font-mono text-[11px] tabular-nums opacity-60">
                      SANDBOX READY
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeCartItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                          isLight
                            ? 'border-slate-200 bg-white text-slate-800'
                            : 'border-white/8 bg-white/[0.03] text-white/90'
                        }`}
                      >
                        <span className="truncate font-medium">{item}</span>
                        <span className="ml-2 flex items-center gap-1 text-[10px] font-mono text-emerald-500 shrink-0">
                          <Check className="h-3 w-3" /> Ready
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top-3 Product Recommendation Picker (Synced live with Phone Co-Pilot) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-white/75'}`}>
                    Top-3 Product Recommendation Picker (Synced with Phone Co-Pilot)
                  </h2>
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
                    Select an option to hydrate the active DOM cart
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {companionState.top3Recommendations.map((prod: ProductRecommendation) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => sovereignBridge.selectTop3Product(prod.id)}
                      className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition cursor-pointer ${
                        prod.selected
                          ? isLight
                            ? 'border-emerald-500 bg-emerald-50/70'
                            : 'border-emerald-400/70 bg-emerald-500/15'
                          : isLight
                          ? 'border-slate-200 bg-white hover:border-emerald-400'
                          : 'border-white/10 bg-[#12131A] hover:border-white/25'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-semibold text-amber-500">
                            0{prod.rank}. Pick
                          </span>
                          <span className="font-mono text-xs font-bold tabular-nums text-emerald-500">
                            {prod.price}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold line-clamp-2">{prod.name}</h4>
                        <p className={`mt-1 text-[11px] ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                          {prod.brand} · <Star className="inline h-3 w-3 fill-amber-400 text-amber-400" /> {prod.rating}
                        </p>
                        <p className={`mt-1.5 text-[11px] line-clamp-2 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                          {prod.matchReason}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[11px] font-semibold">
                        <span className="truncate text-indigo-400">{prod.badge}</span>
                        <span className={prod.selected ? 'text-emerald-400' : 'opacity-60'}>
                          {prod.selected ? '✓ Selected' : 'Select'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Errand DOM Triggers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    handleTriggerQuickErrand(
                      'Whole Foods Weekly Restock',
                      'https://wholefoods.amazon.com/cart',
                      ['Organic Tuscan Kale', 'Grass-Fed Ribeye', 'Raw Honey', 'Almond Milk'],
                      'keeper',
                      'Keeper (Household Specialist)'
                    )
                  }
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition cursor-pointer ${
                    isLight
                      ? 'border-slate-200 bg-white hover:border-emerald-400'
                      : 'border-white/10 bg-[#12131A] hover:border-emerald-500/40'
                  }`}
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold">Whole Foods Weekly Restock</h4>
                    <p className={`mt-0.5 text-[11px] line-clamp-2 ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                      Hydrates cart with organic staples and stages checkout confirmation.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleTriggerQuickErrand(
                      'Google Calendar Scheduling Buffer',
                      'https://calendar.google.com/calendar/u/0/r',
                      ['15-min buffers for Thursday executive review', 'Protect 8am-10am deep work block'],
                      'archivist',
                      'Archivist (Work Specialist)'
                    )
                  }
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition cursor-pointer ${
                    isLight
                      ? 'border-slate-200 bg-white hover:border-sky-400'
                      : 'border-white/10 bg-[#12131A] hover:border-sky-500/40'
                  }`}
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-500 border border-sky-500/25">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold">Google Calendar Scheduling Buffer</h4>
                    <p className={`mt-0.5 text-[11px] line-clamp-2 ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                      Inserts 15-minute focus buffers around Thursday meetings via Archivist.
                    </p>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* RIGHT PANE (5 cols): Executive Chat & Sovereign Ledger, Live Protocol Stream, Errands Queue & Approvals */}
        <div className="lg:col-span-5 flex flex-col min-h-0 overflow-hidden">
          {/* Right Pane Mode Switcher */}
          <div
            className={`flex shrink-0 items-center justify-between border-b px-4 py-2.5 ${
              isLight ? 'border-rose-200/60 bg-white/75' : 'border-white/8 bg-[#101118]/80'
            }`}
          >
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setRightPanelTab('chat_ledger')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  rightPanelTab === 'chat_ledger'
                    ? isLight
                      ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <MessagesSquare className="h-3.5 w-3.5" />
                <span>Executive Chat & Ledger</span>
              </button>

              <button
                onClick={() => setRightPanelTab('logs')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  rightPanelTab === 'logs'
                    ? isLight
                      ? 'bg-sky-100 text-sky-900 border border-sky-300'
                      : 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                <span className="tabular-nums">Protocol ({logs.length})</span>
              </button>

              <button
                onClick={() => setRightPanelTab('tools')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  rightPanelTab === 'tools'
                    ? isLight
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span className="tabular-nums">Approvals ({pendingCompanionApprovals.length + pendingActions.length})</span>
              </button>

              <button
                onClick={() => setRightPanelTab('errands')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  rightPanelTab === 'errands'
                    ? isLight
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <ListOrdered className="h-3.5 w-3.5" />
                <span className="tabular-nums">Errands ({errands.length})</span>
              </button>

              <button
                onClick={() => setRightPanelTab('notes')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  rightPanelTab === 'notes'
                    ? isLight
                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Scratchpad</span>
              </button>
            </div>
          </div>

          {/* Right Pane Content Body */}
          <div className="flex-1 min-h-0 overflow-y-auto m-scroll p-5">
            {rightPanelTab === 'chat_ledger' && (
              <div className="flex h-full flex-col space-y-4">
                {/* Executive Chat & Companion Voice Stream */}
                <div
                  className={`flex-1 flex flex-col rounded-2xl border p-4 overflow-hidden ${
                    isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#12131A]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-black/5 dark:border-white/10">
                    <span className="text-xs font-semibold">
                      Executive Chat & Companion Voice Stream
                    </span>
                    <span className="font-mono text-[10px] text-emerald-400">
                      Phone + Desktop Synced
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto m-scroll space-y-2.5 py-3">
                    {companionState.voiceStream.map((entry) => (
                      <div
                        key={entry.id}
                        className={`rounded-xl border px-3 py-2 text-xs ${
                          entry.role === 'user'
                            ? isLight
                              ? 'border-rose-200 bg-rose-50/70'
                              : 'border-rose-500/30 bg-rose-500/10'
                            : entry.role === 'system'
                            ? isLight
                              ? 'border-indigo-200 bg-indigo-50/60'
                              : 'border-indigo-500/25 bg-indigo-500/10 text-indigo-200'
                            : isLight
                            ? 'border-slate-200 bg-slate-50'
                            : 'border-white/10 bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-semibold opacity-70 mb-0.5">
                          <span>
                            {entry.role === 'user' ? 'Operator' : entry.role === 'system' ? 'Ledger Event' : entry.agentName}
                          </span>
                          <div className="flex items-center gap-2">
                            {entry.role !== 'user' && (
                              <button
                                type="button"
                                onClick={() => void speak(entry.text, 'warm')}
                                className="hover:text-emerald-400 cursor-pointer"
                                title="Speak message"
                              >
                                <Volume2 className="h-3 w-3" />
                              </button>
                            )}
                            <span className="font-mono">
                              {entry.source === 'phone' ? 'Phone Mic' : 'Desktop'}
                            </span>
                          </div>
                        </div>
                        <p className="leading-relaxed">{entry.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center gap-2">
                    <input
                      type="text"
                      value={execChatInput}
                      onChange={(e) => setExecChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendExecChatCommand()}
                      placeholder="Send executive command or inspect DOM…"
                      className={`flex-1 rounded-xl border px-3 py-1.5 text-xs outline-none ${
                        isLight
                          ? 'border-slate-200 bg-slate-50 text-slate-900'
                          : 'border-white/10 bg-black/40 text-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleSendExecChatCommand}
                      className="flex items-center gap-1 rounded-xl m-gradient-bg px-3 py-1.5 text-xs font-semibold text-white cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Send className="h-3 w-3" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>

                {/* Sovereign Run Ledger & Pending Approvals */}
                <div
                  className={`rounded-2xl border p-4 space-y-2.5 ${
                    isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#12131A]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">
                      Sovereign Execution Ledger & Approval Gates
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-amber-400">
                      {pendingCompanionApprovals.length} Pending
                    </span>
                  </div>

                  {companionState.approvalCards.slice(0, 2).map((card: CompanionApprovalCard) => (
                    <div
                      key={card.id}
                      className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs ${
                        isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.03]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{card.title}</p>
                        <p className="text-[10.5px] opacity-65 truncate">{card.subtitle}</p>
                      </div>
                      {card.status === 'pending' ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => sovereignBridge.decideApprovalCard(card.id, 'approved')}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[10.5px] font-semibold text-white cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => sovereignBridge.decideApprovalCard(card.id, 'denied')}
                            className="rounded-lg border border-white/15 px-2 py-1 text-[10.5px] font-semibold opacity-75 hover:opacity-100 cursor-pointer"
                          >
                            Deny
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono text-[10px] font-semibold uppercase text-emerald-400">
                          {card.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rightPanelTab === 'logs' && (
              <div className="flex h-full flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-mono font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    Sovereign Bridge & Split Pipeline Stream
                  </span>
                  <button
                    onClick={() => setLogs(['[SYSTEM] Protocol stream cleared by operator. Ready for DOM hydration.'])}
                    className={`text-[11px] font-medium hover:underline cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/40 hover:text-white'}`}
                  >
                    Clear Logs
                  </button>
                </div>

                <div
                  ref={logContainerRef}
                  className={`flex-1 rounded-2xl border p-4 font-mono text-xs space-y-2 overflow-y-auto m-scroll tabular-nums ${
                    isLight
                      ? 'border-slate-200 bg-slate-900 text-emerald-300'
                      : 'border-white/10 bg-[#07080C] text-emerald-300/90'
                  }`}
                >
                  {logs.map((line, i) => (
                    <div key={i} className="leading-relaxed break-words border-b border-white/5 pb-1.5 last:border-none">
                      <span className="text-sky-400 mr-2">[{String(i + 1).padStart(2, '0')}]</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rightPanelTab === 'errands' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newErrandTitle}
                    onChange={(e) => setNewErrandTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddErrand()}
                    placeholder="Add a new DOM errand or grocery task..."
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs outline-none ${
                      isLight
                        ? 'border-slate-200 bg-white text-slate-900'
                        : 'border-white/12 bg-white/[0.04] text-white'
                    }`}
                  />
                  <button
                    onClick={handleAddErrand}
                    className="flex items-center gap-1 rounded-xl bg-sky-500 hover:bg-sky-400 px-3.5 py-2 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {errands.map((errand) => (
                    <div
                      key={errand.id}
                      className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 transition ${
                        isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#12131A]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          onClick={() => handleToggleErrandStatus(errand)}
                          className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border transition cursor-pointer ${
                            errand.status === 'executed'
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-slate-400'
                          }`}
                        >
                          {errand.status === 'executed' && <Check className="h-3 w-3" />}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-semibold ${
                              errand.status === 'executed' ? 'line-through opacity-50' : ''
                            }`}
                          >
                            {errand.title}
                          </p>
                          {errand.items && errand.items.length > 0 && (
                            <p className={`mt-1 text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                              {errand.items.join(' · ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() =>
                            handleTriggerQuickErrand(
                              errand.title,
                              'https://wholefoods.amazon.com/cart',
                              errand.items || [errand.title],
                              'keeper',
                              'Keeper (Household Specialist)'
                            )
                          }
                          className="rounded-lg bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 px-2 py-1 text-[10px] font-semibold transition cursor-pointer"
                        >
                          Run DOM
                        </button>
                        <button
                          onClick={() => handleDeleteErrand(errand.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rightPanelTab === 'tools' && (
              <div className="space-y-3">
                {companionState.approvalCards.map((card) => (
                  <div
                    key={card.id}
                    className={`rounded-xl border p-3.5 space-y-2 ${
                      isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#12131A]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{card.title}</span>
                      <span className="font-mono text-[10px] text-amber-400">
                        {card.status}
                      </span>
                    </div>
                    <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                      {card.subtitle}
                    </p>
                    <p className={`text-[10.5px] font-mono ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
                      {card.command}
                    </p>
                    {card.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => sovereignBridge.decideApprovalCard(card.id, 'approved')}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Approve & Hydrate DOM</span>
                        </button>
                        <button
                          onClick={() => sovereignBridge.decideApprovalCard(card.id, 'denied')}
                          className="flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Deny</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {actions.map((act) => (
                  <div
                    key={act.id}
                    className={`rounded-xl border p-3.5 space-y-2 ${
                      isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#12131A]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{act.form_payload.title}</span>
                      <span className="font-mono text-[10px] text-amber-400">
                        {act.status}
                      </span>
                    </div>
                    <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      Tool: {act.action_name}
                    </p>
                    {act.status === 'pending_confirmation' && (
                      <button
                        onClick={() => handleConfirmAction(act)}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Approve & Hydrate DOM</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {rightPanelTab === 'notes' && (
              <div className="flex h-full flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Executive Scratchpad</span>
                  <button
                    onClick={handleCopyScratchpad}
                    className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-[11px] hover:bg-white/5 cursor-pointer"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <textarea
                  value={scratchpad}
                  onChange={(e) => setScratchpad(e.target.value)}
                  rows={14}
                  placeholder="Executive notes, staged receipts, and protocol thoughts..."
                  className={`w-full flex-1 resize-none rounded-xl border p-3.5 text-xs leading-relaxed outline-none ${
                    isLight
                      ? 'border-slate-200 bg-white text-slate-800'
                      : 'border-white/10 bg-[#0E0F14] text-white/90'
                  }`}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserSandbox;
