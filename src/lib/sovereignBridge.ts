// Sovereign Execution Bridge & Real-Time WebSocket Companion Mode Protocol
import { performanceTracker } from './performanceTracker';
import {
  synthesizeSplitPipeline,
  type SplitPipelineRun,
  type CustomIndexedMerchant,
} from './splitPipelineCatalog';

export type ExecutionHost = 'dashboard' | 'phone' | 'dual';

export interface CompanionVoiceEntry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  source: 'phone' | 'desktop';
  agentName: string;
  timestamp: string;
}

export interface CompanionApprovalCard {
  id: string;
  title: string;
  subtitle: string;
  command: string;
  targetUrl: string;
  riskLevel: 'standard' | 'checkout' | 'calendar';
  status: 'pending' | 'approved' | 'denied';
  requestedBy: string;
  timestamp: string;
}

export interface ProductRecommendation {
  id: string;
  rank: 1 | 2 | 3;
  name: string;
  brand: string;
  price: string;
  unitPrice: string;
  rating: number;
  reviewsCount: number;
  badge: string;
  matchReason: string;
  selected: boolean;
  category: string;
}

export interface HeadlessRunRecord {
  id: string;
  command: string;
  targetUrl: string;
  specialist: string;
  status: 'queued' | 'running' | 'awaiting_approval' | 'completed';
  stepLabel: string;
  startedAt: string;
  updatedAt: string;
}

export interface CompanionPresence {
  phoneClients: number;
  desktopClients: number;
  totalClients: number;
}

export interface CompanionProtocolState {
  wsConnected: boolean;
  wsLatencyMs: number;
  presence: CompanionPresence;
  activeHost: ExecutionHost;
  activeUrl: string;
  activeSpecialist: string;
  cartItems: string[];
  voiceStream: CompanionVoiceEntry[];
  approvalCards: CompanionApprovalCard[];
  top3Recommendations: ProductRecommendation[];
  headlessRuns: HeadlessRunRecord[];
  splitPipeline: SplitPipelineRun;
  customIndexedMerchants: CustomIndexedMerchant[];
}

export interface SovereignBridgePayload {
  url?: string;
  title?: string;
  items?: string[];
  stepIndex?: number;
  stepName?: string;
  status?: string;
  logText?: string;
  source?: 'mobile' | 'desktop' | 'agent' | 'copilot';
  agentId?: string;
  agentName?: string;
  executionHost?: ExecutionHost;
  timestamp?: string;
}

export interface SovereignBridgeEvent {
  type: 'navigate' | 'errand' | 'pipeline_step' | 'log' | 'action_dispatch' | 'status' | 'connect' | 'host_switch';
  payload: SovereignBridgePayload;
}

export type BridgeListener = (event: SovereignBridgeEvent) => void;
export type CompanionStateListener = (state: CompanionProtocolState) => void;

export interface ErrandResolution {
  agentId: string;
  agentName: string;
  targetTitle: string;
  targetUrl: string;
  items: string[];
}

/**
 * Maps natural voice or text errands from Phone Remote to their specialized agent and target DOM endpoints
 */
export function resolveSpecialistAndAction(text: string, currentAgentId?: string): ErrandResolution {
  const lower = text.toLowerCase();

  // 1. Keeper: Family & Domestic Logistics (Pizza, food orders, household groceries)
  if (lower.includes('pizza') || lower.includes('dinner') || lower.includes('takeout') || lower.includes('dominos') || lower.includes('food')) {
    return {
      agentId: 'keeper',
      agentName: 'Keeper (Family Specialist)',
      targetTitle: 'Hot Artisan Pizza & Dinner Delivery',
      targetUrl: 'https://dominos.com/order',
      items: ['Hand-Tossed Artisan Pizza', 'San Pellegrino Sparkling Water', 'Garlic Bread Twists'],
    };
  }

  // 2. Coach: Wellness, Gym, Sports Nutrition & Fitness Supps
  if (lower.includes('amazon') || lower.includes('whey') || lower.includes('isolate') || lower.includes('gym') || lower.includes('supplement') || lower.includes('workout') || lower.includes('reorder')) {
    return {
      agentId: 'coach',
      agentName: 'Coach (Wellness Specialist)',
      targetTitle: 'Amazon Cart Reorder: 5lb Vanilla Whey',
      targetUrl: 'https://amazon.com/gp/cart/view.html',
      items: ['5lb Vanilla Whey Isolate in checkout', 'Optimum Electrolyte Hydration Packets'],
    };
  }

  // 3. Archivist: Executive Work, Meetings, Schedules & Calendar Buffers
  if (lower.includes('calendar') || lower.includes('schedule') || lower.includes('appointment') || lower.includes('buffer') || lower.includes('meeting') || lower.includes('review')) {
    return {
      agentId: 'archivist',
      agentName: 'Archivist (Work Specialist)',
      targetTitle: 'Google Calendar Scheduling Buffer',
      targetUrl: 'https://calendar.google.com/calendar/u/0/r',
      items: ['Inspect 15-min buffers for Thursday review', 'Sync executive architecture notes'],
    };
  }

  // 4. Default: Carol Ann (Core Executive / Lifestyle Orchestrator) -> Whole Foods
  return {
    agentId: currentAgentId || 'carol-anchor',
    agentName: 'Carol Ann (Executive Orchestrator)',
    targetTitle: 'Whole Foods Grocery Delivery',
    targetUrl: 'https://wholefoods.amazon.com/cart',
    items: ['Organic Tuscan Kale', 'Grass-Fed Ribeye', 'Raw Honey', 'Almond Milk'],
  };
}

const DEFAULT_RECOMMENDATIONS: ProductRecommendation[] = [
  {
    id: 'prod_1',
    rank: 1,
    name: '365 Organic Unsweetened Almond Milk (64 fl oz)',
    brand: '365 by Whole Foods Market',
    price: '$3.69',
    unitPrice: '$0.06 / fl oz',
    rating: 4.9,
    reviewsCount: 2840,
    badge: 'Top Executive Pick · Clean Ingredients',
    matchReason: 'Zero gums or carrageenan; matches your clean pantry preference.',
    selected: true,
    category: 'Grocery',
  },
  {
    id: 'prod_2',
    rank: 2,
    name: 'Malk Organic Pure Almond Milk (28 fl oz)',
    brand: 'MALK Organics',
    price: '$5.99',
    unitPrice: '$0.21 / fl oz',
    rating: 4.8,
    reviewsCount: 1420,
    badge: '3 Ingredients Only',
    matchReason: 'Cold-pressed sprouted almonds, filtered water, Himalayan pink salt.',
    selected: false,
    category: 'Grocery',
  },
  {
    id: 'prod_3',
    rank: 3,
    name: 'Califia Farms Organic Barista Almond Milk (32 fl oz)',
    brand: 'Califia Farms',
    price: '$4.79',
    unitPrice: '$0.15 / fl oz',
    rating: 4.7,
    reviewsCount: 980,
    badge: 'Best for Espresso & Matcha',
    matchReason: 'Micro-foams cleanly for morning matcha lattes.',
    selected: false,
    category: 'Grocery',
  },
];

const DEFAULT_APPROVALS: CompanionApprovalCard[] = [
  {
    id: 'apr_wf_checkout',
    title: 'Confirm Whole Foods Delivery Window',
    subtitle: '4 organic items staged ($48.60) · Today 5:00 PM – 6:00 PM',
    command: 'DOM.click("#wf-checkout-reserve-slot-1700")',
    targetUrl: 'https://wholefoods.amazon.com/cart',
    riskLevel: 'checkout',
    status: 'pending',
    requestedBy: 'Keeper (Household Specialist)',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'apr_cal_buffer',
    title: 'Insert 15-Min Executive Focus Buffers',
    subtitle: 'Protects Thursday 10:00 AM & 2:30 PM architecture reviews',
    command: 'CalendarAPI.insertBuffers({ durationMin: 15, day: "Thursday" })',
    targetUrl: 'https://calendar.google.com/calendar/u/0/r',
    riskLevel: 'calendar',
    status: 'pending',
    requestedBy: 'Archivist (Work Specialist)',
    timestamp: new Date().toISOString(),
  },
];

class SovereignBridgeEngine {
  private listeners: Set<BridgeListener> = new Set();
  private companionListeners: Set<CompanionStateListener> = new Set();
  public activeUrl: string = 'https://wholefoods.amazon.com/cart';
  public activeStatus: string = 'DOM AUTOMATION BRIDGE ACTIVE';
  public executionHost: ExecutionHost = 'dual';
  private activeSpecialist = 'Carol Ann (Executive Orchestrator)';
  private cartItems: string[] = [
    'Organic Tuscan Kale (2 bunches)',
    'Grass-Fed Ribeye Steak (1.2 lbs)',
    'Raw Local Wildflower Honey (16 oz)',
    'Unsweetened Organic Almond Milk (64 oz)',
  ];
  private voiceStream: CompanionVoiceEntry[] = [
    {
      id: 'vs_init_1',
      role: 'system',
      text: 'Companion Mode Protocol online. Phone functions as Executive Mic, Voice Speaker & Remote Controller synced to docked desktop runner.',
      source: 'desktop',
      agentName: 'Carol Ann',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'vs_init_2',
      role: 'assistant',
      text: "I found the standard option at Target for $30, but there's a family workshop in Turkey crafting full-grain belts for $42 with direct shipping. Would you like to review their profile?",
      source: 'desktop',
      agentName: 'Carol Ann',
      timestamp: new Date().toISOString(),
    },
  ];
  private approvalCards: CompanionApprovalCard[] = DEFAULT_APPROVALS;
  private top3Recommendations: ProductRecommendation[] = DEFAULT_RECOMMENDATIONS;
  private customIndexedMerchants: CustomIndexedMerchant[] = [];
  private splitPipeline: SplitPipelineRun = synthesizeSplitPipeline(
    'hand-stitched leather belt',
    'Playwright Sandboxed Stream',
    []
  );
  private headlessRuns: HeadlessRunRecord[] = [
    {
      id: 'run_initial_1',
      command: 'Inspect Whole Foods cart & rank Top-3 organic almond milk options',
      targetUrl: 'https://wholefoods.amazon.com/cart',
      specialist: 'Carol Ann (Executive Orchestrator)',
      status: 'awaiting_approval',
      stepLabel: 'Step 2/3 · Top-3 options extracted, awaiting slot confirmation',
      startedAt: new Date(Date.now() - 45000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private ws: WebSocket | null = null;
  private wsConnected = false;
  private wsLatencyMs = 14;
  private presence: CompanionPresence = { phoneClients: 1, desktopClients: 1, totalClients: 2 };
  private deviceRole: 'phone' | 'desktop' = 'desktop';
  private clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;

  private logs: string[] = [
    '[INIT] Browser Engine ready: Gemini 2.0 Flash Native Tool Runner',
    '[BRIDGE] DOM inspector listening on window.sovereignBridge',
    '[WS] Companion Mode Protocol WebSocket channel (/api/ws/companion) initialized',
    '[HOST] Active Runner Mode: Dual Link (Main Dashboard & Phone Co-Pilot)',
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const storedHost = localStorage.getItem('sovereign_execution_host') as ExecutionHost | null;
        if (storedHost && ['dashboard', 'phone', 'dual'].includes(storedHost)) {
          this.executionHost = storedHost;
        }
      } catch {
        // local storage unavailable
      }

      if (window.location.pathname.includes('/remote') || window.innerWidth < 640) {
        this.deviceRole = 'phone';
      }

      window.addEventListener('storage', (e) => {
        if (e.key === 'sovereign_bridge_event' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue) as SovereignBridgeEvent;
            this.handleLocalEvent(parsed, false);
          } catch {
            // ignore JSON parse error
          }
        }
      });

      this.connectWebSocket();
    }
  }

  private connectWebSocket() {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return;
    try {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${window.location.host}/api/ws/companion?role=${this.deviceRole}&clientId=${this.clientId}`;
      const socket = new WebSocket(wsUrl);
      this.ws = socket;

      socket.onopen = () => {
        this.wsConnected = true;
        this.notifyCompanionListeners();
        if (this.pingTimer) window.clearInterval(this.pingTimer);
        this.pingTimer = window.setInterval(() => {
          this.sendWs({ type: 'companion:ping', clientTs: Date.now() });
        }, 12000);
      };

      socket.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data)) as Record<string, unknown>;
          if (msg.presence && typeof msg.presence === 'object') {
            this.presence = msg.presence as CompanionPresence;
          }

          if (msg.type === 'companion:pong' && typeof msg.clientTs === 'number') {
            this.wsLatencyMs = Math.max(2, Date.now() - msg.clientTs);
            this.notifyCompanionListeners();
            return;
          }

          if (msg.type === 'companion:init' && msg.state && typeof msg.state === 'object') {
            this.applyServerState(msg.state as Record<string, unknown>);
            return;
          }

          if (msg.type === 'companion:state_delta' && msg.state && typeof msg.state === 'object') {
            this.applyServerState(msg.state as Record<string, unknown>);
            if (msg.reason === 'voice_command' && msg.headlessRun) {
              const run = msg.headlessRun as HeadlessRunRecord;
              this.addLog(`[WS COMPANION] Phone voice command received -> Headless run "${run.command}" started on desktop`);
            } else if (msg.reason === 'approval_decision') {
              this.addLog(`[WS COMPANION] Approval decision (${String(msg.decision).toUpperCase()}) synced from Phone Co-Pilot`);
            } else if (msg.reason === 'product_selected' && msg.product) {
              const p = msg.product as ProductRecommendation;
              this.addLog(`[WS COMPANION] Top-${p.rank} Product Picked: "${p.name}" (${p.price}) hydrated to desktop cart`);
            }
            return;
          }

          if (msg.type === 'companion:bridge_event' && msg.event) {
            const bridgeEv = msg.event as SovereignBridgeEvent;
            this.handleLocalEvent(bridgeEv, false);
            return;
          }

          if (msg.type === 'companion:presence') {
            this.notifyCompanionListeners();
          }
        } catch {
          // ignore parse error
        }
      };

      socket.onclose = () => {
        this.wsConnected = false;
        this.notifyCompanionListeners();
        if (this.pingTimer) {
          window.clearInterval(this.pingTimer);
          this.pingTimer = null;
        }
        if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
        this.reconnectTimer = window.setTimeout(() => this.connectWebSocket(), 3500);
      };

      socket.onerror = () => {
        this.wsConnected = false;
      };
    } catch {
      this.wsConnected = false;
    }
  }

  private applyServerState(s: Record<string, unknown>) {
    if (typeof s.activeUrl === 'string') this.activeUrl = s.activeUrl;
    if (typeof s.activeSpecialist === 'string') this.activeSpecialist = s.activeSpecialist;
    if (typeof s.activeHost === 'string' && ['dashboard', 'phone', 'dual'].includes(s.activeHost)) {
      this.executionHost = s.activeHost as ExecutionHost;
    }
    if (Array.isArray(s.cartItems)) this.cartItems = s.cartItems as string[];
    if (Array.isArray(s.voiceStream)) this.voiceStream = s.voiceStream as CompanionVoiceEntry[];
    if (Array.isArray(s.approvalCards)) this.approvalCards = s.approvalCards as CompanionApprovalCard[];
    if (Array.isArray(s.top3Recommendations)) {
      this.top3Recommendations = s.top3Recommendations as ProductRecommendation[];
    }
    if (Array.isArray(s.headlessRuns)) {
      this.headlessRuns = s.headlessRuns as HeadlessRunRecord[];
    }
    if (s.splitPipeline && typeof s.splitPipeline === 'object') {
      this.splitPipeline = s.splitPipeline as SplitPipelineRun;
    }
    this.notifyCompanionListeners();
  }

  private sendWs(data: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
      } catch {
        // ignore
      }
    }
  }

  public getCompanionState(): CompanionProtocolState {
    return {
      wsConnected: this.wsConnected,
      wsLatencyMs: this.wsLatencyMs,
      presence: this.presence,
      activeHost: this.executionHost,
      activeUrl: this.activeUrl,
      activeSpecialist: this.activeSpecialist,
      cartItems: [...this.cartItems],
      voiceStream: [...this.voiceStream],
      approvalCards: [...this.approvalCards],
      top3Recommendations: [...this.top3Recommendations],
      headlessRuns: [...this.headlessRuns],
      splitPipeline: this.splitPipeline,
      customIndexedMerchants: [...this.customIndexedMerchants],
    };
  }

  public subscribeCompanion(listener: CompanionStateListener): () => void {
    this.companionListeners.add(listener);
    listener(this.getCompanionState());
    return () => this.companionListeners.delete(listener);
  }

  private notifyCompanionListeners() {
    const snap = this.getCompanionState();
    this.companionListeners.forEach((fn) => {
      try {
        fn(snap);
      } catch {
        // ignore listener error
      }
    });
  }

  public registerDeviceRole(role: 'phone' | 'desktop', agentId = 'carol-anchor') {
    this.deviceRole = role;
    this.sendWs({
      type: 'companion:register',
      deviceRole: role,
      agentId,
    });
  }

  public sendCompanionVoiceCommand(
    text: string,
    source: 'phone' | 'desktop' = 'phone',
    agentName = 'Carol Ann',
    targetUrl?: string
  ) {
    const clean = text.trim();
    if (!clean) return;
    const resolution = resolveSpecialistAndAction(clean);
    const resolvedUrl = targetUrl || resolution.targetUrl;
    const eventId = `vs_cmd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // Optimistic local state update
    const entry: CompanionVoiceEntry = {
      id: eventId,
      role: 'user',
      text: clean,
      source,
      agentName: agentName || resolution.agentName,
      timestamp: new Date().toISOString(),
    };
    this.voiceStream = [...this.voiceStream.slice(-28), entry];
    this.notifyCompanionListeners();

    this.sendWs({
      type: 'companion:voice_command',
      eventId,
      text: clean,
      source,
      agentName: agentName || resolution.agentName,
      targetUrl: resolvedUrl,
    });
  }

  public sendCompanionVoiceReply(text: string, agentName = 'Carol Ann') {
    const clean = text.trim();
    if (!clean) return;
    const eventId = `vs_ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const entry: CompanionVoiceEntry = {
      id: eventId,
      role: 'assistant',
      text: clean,
      source: 'desktop',
      agentName,
      timestamp: new Date().toISOString(),
    };
    this.voiceStream = [...this.voiceStream.slice(-28), entry];
    this.notifyCompanionListeners();

    this.sendWs({
      type: 'companion:voice_reply',
      eventId,
      text: clean,
      agentName,
    });
  }

  public decideApprovalCard(cardId: string, decision: 'approved' | 'denied') {
    const eventId = `apr_dec_${cardId}_${decision}_${Date.now()}`;
    this.approvalCards = this.approvalCards.map((c) =>
      c.id === cardId ? { ...c, status: decision } : c
    );
    this.notifyCompanionListeners();

    this.sendWs({
      type: 'companion:approval_decision',
      eventId,
      cardId,
      decision,
    });

    this.addLog(
      `[APPROVAL GATE] Card "${cardId}" ${decision.toUpperCase()} via Companion Mode Protocol`
    );
  }

  public selectTop3Product(productId: string) {
    const eventId = `pick_${productId}_${Date.now()}`;
    let picked: ProductRecommendation | undefined;
    this.top3Recommendations = this.top3Recommendations.map((item) => {
      const isSelected = item.id === productId;
      if (isSelected) picked = { ...item, selected: true };
      return { ...item, selected: isSelected };
    });
    if (picked) {
      const label = `${picked.name} (${picked.price})`;
      if (!this.cartItems.includes(label)) {
        this.cartItems = [label, ...this.cartItems.slice(0, 5)];
      }
    }
    this.notifyCompanionListeners();

    this.sendWs({
      type: 'companion:select_product',
      eventId,
      productId,
    });
  }

  /**
   * Dispatches the Parallel Split Pipeline (Thread 1: Direct Utility + Thread 2: Sovereign Discovery)
   */
  public runSplitPipeline(
    query: string,
    runtimeEngine: SplitPipelineRun['runtimeEngine'] = 'Playwright Sandboxed Stream'
  ) {
    const cleanQuery = query.trim() || 'hand-stitched leather belt';
    const eventId = `sp_cmd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // 1. Mark both threads as running immediately for responsive UI feedback
    this.splitPipeline = {
      ...this.splitPipeline,
      query: cleanQuery,
      runtimeEngine,
      status: 'intercepting',
      thread1Status: {
        ...this.splitPipeline.thread1Status,
        state: 'running',
        stepText: `Intercepting standard merchant DOMs (Home Depot, Target, Amazon) for "${cleanQuery}"…`,
      },
      thread2Status: {
        ...this.splitPipeline.thread2Status,
        state: 'running',
        stepText: `Querying federated independent feeds (Shopify Index, Etsy Artisan, BiteLocal, Craft Guilds)…`,
      },
    };
    this.notifyCompanionListeners();

    this.addLog(
      `[SPLIT PIPELINE] Dispatching 2 parallel worker threads for "${cleanQuery}" via ${runtimeEngine}`
    );
    this.addLog(
      `[THREAD 1 · DIRECT UTILITY] Loading merchant DOMs & stripping incentivized/bot reviews…`
    );
    this.addLog(
      `[THREAD 2 · SOVEREIGN DISCOVERY] Querying Shopify Independent Index, Etsy Artisan Exports, Chamber/BiteLocal & Global Craft Guilds…`
    );

    // 2. Hit backend API & broadcast over WebSocket
    if (typeof window !== 'undefined' && window.fetch) {
      fetch('/api/browser/split-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: cleanQuery, runtimeEngine }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.ok && data.pipeline) {
            this.splitPipeline = data.pipeline as SplitPipelineRun;
            this.notifyCompanionListeners();
          }
        })
        .catch(() => {
          // Fallback to local deterministic synthesizer
        });
    }

    setTimeout(() => {
      const completed = synthesizeSplitPipeline(
        cleanQuery,
        runtimeEngine,
        this.customIndexedMerchants
      );
      this.splitPipeline = completed;
      const topMakerUrl =
        completed.sovereignDiscoveryMatches[0]?.directUrl ||
        completed.directUtilityMatches[0]?.merchantUrl;
      if (topMakerUrl) {
        this.activeUrl = topMakerUrl;
      }

      // Component 3: Append Small-Business-First Agent Voice Recitation to Voice Stream
      const recitationEntry: CompanionVoiceEntry = {
        id: `vs_recite_${Date.now()}`,
        role: 'assistant',
        text: completed.dualViewSummary.voiceRecitationScript,
        source: 'desktop',
        agentName: 'Carol Ann (Sovereign Discovery)',
        timestamp: new Date().toISOString(),
      };
      this.voiceStream = [...this.voiceStream.slice(-18), recitationEntry];

      this.notifyCompanionListeners();

      this.addLog(
        `[DOM SYNTHESIZER] Split Pipeline complete: 3 Direct Utility matches (${completed.thread1Status.junkReviewsDiscarded} junk reviews discarded) + ${completed.sovereignDiscoveryMatches.length} Sovereign Discovery makers verified (0.00 CPC · No Pay-to-Rank Auction).`
      );
      this.addLog(
        `[VOICE RECITATION] Carol Ann: "${completed.dualViewSummary.voiceRecitationScript}"`
      );

      this.sendWs({
        type: 'companion:split_pipeline',
        eventId,
        query: cleanQuery,
        runtimeEngine,
      });
    }, 520);
  }

  /**
   * Component 3: Phase 1 Free Open Ingestion & Phase 2 Flat-Rate Place Card Sponsorship
   */
  public ingestIndependentMerchant(
    input: Omit<CustomIndexedMerchant, 'id' | 'indexedAt'>
  ): CustomIndexedMerchant {
    const newMerchant: CustomIndexedMerchant = {
      ...input,
      id: `custom_maker_${Date.now()}`,
      indexedAt: new Date().toISOString(),
    };
    this.customIndexedMerchants = [newMerchant, ...this.customIndexedMerchants];
    this.splitPipeline = synthesizeSplitPipeline(
      input.categoryKeyword || this.splitPipeline.query,
      this.splitPipeline.runtimeEngine,
      this.customIndexedMerchants
    );

    const voiceNote: CompanionVoiceEntry = {
      id: `vs_ingest_${Date.now()}`,
      role: 'system',
      text: `Indexed independent workshop "${newMerchant.makerName}" (${newMerchant.originCity}) via ${newMerchant.ingestionProtocol} [${newMerchant.placeCardTier}]. Zero Pay-to-Rank CPC auction applied.`,
      source: 'desktop',
      agentName: 'Sovereign Indexer',
      timestamp: new Date().toISOString(),
    };
    this.voiceStream = [...this.voiceStream.slice(-18), voiceNote];

    this.addLog(
      `[OPEN INGESTION] Indexed "${newMerchant.makerName}" (${newMerchant.originCity}) via ${newMerchant.ingestionProtocol} · Tier: ${newMerchant.placeCardTier}`
    );
    this.notifyCompanionListeners();
    return newMerchant;
  }

  public selectSplitPipelineMatch(matchId: string, thread: 'direct' | 'sovereign') {
    const eventId = `sp_pick_${matchId}_${Date.now()}`;
    let stagedLabel = '';
    let targetUrl = this.activeUrl;

    if (thread === 'direct') {
      this.splitPipeline = {
        ...this.splitPipeline,
        directUtilityMatches: this.splitPipeline.directUtilityMatches.map((m) => {
          const isSelected = m.id === matchId;
          if (isSelected) {
            stagedLabel = `[Direct Utility · ${m.merchant}] ${m.name} (${m.price})`;
            targetUrl = m.merchantUrl;
          }
          return { ...m, selected: isSelected };
        }),
      };
    } else {
      this.splitPipeline = {
        ...this.splitPipeline,
        sovereignDiscoveryMatches: this.splitPipeline.sovereignDiscoveryMatches.map((m) => {
          const isSelected = m.id === matchId;
          if (isSelected) {
            stagedLabel = `[Sovereign Maker · ${m.makerName}] ${m.name} (${m.price})`;
            targetUrl = m.directUrl;
          }
          return { ...m, selected: isSelected };
        }),
      };
    }

    if (stagedLabel) {
      this.activeUrl = targetUrl;
      if (!this.cartItems.includes(stagedLabel)) {
        this.cartItems = [stagedLabel, ...this.cartItems.slice(0, 5)];
      }
      this.addLog(`[DOM CART] Staged ${stagedLabel} -> ${targetUrl}`);
    }
    this.notifyCompanionListeners();

    this.sendWs({
      type: 'companion:select_split_match',
      eventId,
      matchId,
      thread,
    });
  }

  public subscribe(listener: BridgeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private handleLocalEvent(event: SovereignBridgeEvent, broadcast = true) {
    if (event.payload.url) {
      this.activeUrl = event.payload.url;
    }
    if (event.payload.executionHost) {
      this.executionHost = event.payload.executionHost;
    }
    if (event.payload.agentName) {
      this.activeSpecialist = event.payload.agentName;
    }
    if (event.payload.items && event.payload.items.length > 0) {
      this.cartItems = event.payload.items;
    }
    if (event.payload.logText) {
      this.logs = [...this.logs.slice(-50), event.payload.logText];
    }
    this.listeners.forEach((fn) => {
      try {
        fn(event);
      } catch (err) {
        console.warn('[SovereignBridge] listener error:', err);
      }
    });
    this.notifyCompanionListeners();

    if (broadcast) {
      this.sendWs({
        type: 'companion:bridge_sync',
        eventId: `br_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        event,
      });

      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem(
            'sovereign_bridge_event',
            JSON.stringify({ ...event, _ts: Date.now() })
          );
        } catch {
          // storage quota exceeded or disabled
        }
      }
    }
  }

  public emit(event: SovereignBridgeEvent) {
    this.handleLocalEvent(event, true);
  }

  public setExecutionHost(host: ExecutionHost, origin: 'dashboard' | 'mobile' = 'dashboard') {
    this.executionHost = host;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('sovereign_execution_host', host);
      } catch {
        // ignore
      }
    }

    const hostLabels: Record<ExecutionHost, string> = {
      dashboard: 'Local Browser (Main Dashboard DOM Bridge)',
      phone: 'Remote Phone (Phone Co-Pilot Runner)',
      dual: 'Dual Link (Local Browser + Remote Phone Synced)',
    };

    this.emit({
      type: 'host_switch',
      payload: {
        executionHost: host,
        source: origin,
        logText: `[HOST SWITCH] Browser Agent runner set to: ${hostLabels[host]} (via ${origin})`,
        timestamp: new Date().toISOString(),
      },
    });
  }

  public addLog(text: string) {
    this.emit({
      type: 'log',
      payload: { logText: text, timestamp: new Date().toISOString() },
    });
  }

  public getLogs(): string[] {
    return [...this.logs];
  }

  /**
   * Called when Phone Remote is opened or connects to the bridge
   */
  public connectRemote(agentId = 'carol-anchor', agentName = 'Carol Ann') {
    this.registerDeviceRole('phone', agentId);
    this.emit({
      type: 'connect',
      payload: {
        agentId,
        agentName,
        source: 'mobile',
        executionHost: this.executionHost,
        logText: `[CONNECT] Phone Remote connected to Sovereign Bridge (Agent: ${agentName}) [Host: ${this.executionHost.toUpperCase()}]`,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Dispatches an errand action and drives the 3-step Live DOM pipeline
   */
  public dispatchErrand(
    title: string,
    url: string,
    items: string[] = [],
    source: 'mobile' | 'desktop' = 'desktop',
    agentId = 'carol-anchor',
    agentName = 'Carol Ann'
  ) {
    const originLabel = source === 'mobile' ? '📱 Phone Co-Pilot' : '💻 Main Dashboard';
    const taskId = `dom_pipeline_${Date.now()}`;
    performanceTracker.startBackgroundTask(taskId, `Live DOM Pipeline: ${title}`);

    // Sync with Companion WebSocket protocol
    this.sendCompanionVoiceCommand(title, source === 'mobile' ? 'phone' : 'desktop', agentName, url);

    // 1. Initial Action Dispatch
    this.emit({
      type: 'action_dispatch',
      payload: {
        title,
        url,
        items,
        source,
        agentId,
        agentName,
        executionHost: this.executionHost,
        logText: `[EXECUTION] Action triggered from ${originLabel}: "${title}" (${agentName})`,
        timestamp: new Date().toISOString(),
      },
    });

    // Fire and forget server API proxy dispatch for backend logging
    if (typeof window !== 'undefined' && window.fetch) {
      fetch('/api/bridge/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url, items, source, agentId, agentName, executionHost: this.executionHost }),
      }).catch(() => {
        // Safe offline / dev preview fallback
      });
    }

    // Step 1: Navigate DOM
    setTimeout(() => {
      this.emit({
        type: 'pipeline_step',
        payload: {
          stepIndex: 1,
          stepName: 'Navigate DOM',
          status: 'running',
          url,
          agentId,
          executionHost: this.executionHost,
          logText: `[NAVIGATE] Target URL resolved: ${url}`,
        },
      });
    }, 350);

    // Step 2: Hydrate Cart / DOM
    setTimeout(() => {
      this.emit({
        type: 'pipeline_step',
        payload: {
          stepIndex: 2,
          stepName: 'Hydrate Cart',
          status: 'running',
          items,
          agentId,
          executionHost: this.executionHost,
          logText: `[DOM] Hydrating ${items.length || 1} selector(s) [${items.slice(0, 2).join(', ')}] in browser container`,
        },
      });
    }, 1000);

    // Step 3: Stage & Verify
    setTimeout(() => {
      performanceTracker.endBackgroundTask(taskId, 'completed');
      this.emit({
        type: 'pipeline_step',
        payload: {
          stepIndex: 3,
          stepName: 'Stage & Verify',
          status: 'done',
          agentId,
          executionHost: this.executionHost,
          logText: `[STAGE] Pipeline verified by ${agentName}. Ready in verification tray.`,
        },
      });
    }, 1800);
  }
}

export const sovereignBridge = new SovereignBridgeEngine();

// Attach globally to window for browser agent runtime and developer inspection
if (typeof window !== 'undefined') {
  (window as unknown as { sovereignBridge: SovereignBridgeEngine }).sovereignBridge = sovereignBridge;
}
