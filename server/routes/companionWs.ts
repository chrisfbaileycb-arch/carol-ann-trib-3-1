import type { Server as HttpServer, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import {
  synthesizeSplitPipeline,
  type SplitPipelineRun,
} from '../../src/lib/splitPipelineCatalog.ts';

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

interface ConnectedPeer {
  clientId: string;
  deviceRole: 'phone' | 'desktop';
  agentId: string;
  ws: WebSocket;
}

interface CompanionServerState {
  activeHost: 'dashboard' | 'phone' | 'dual';
  activeUrl: string;
  activeSpecialist: string;
  cartItems: string[];
  voiceStream: CompanionVoiceEntry[];
  approvalCards: CompanionApprovalCard[];
  top3Recommendations: ProductRecommendation[];
  headlessRuns: HeadlessRunRecord[];
  splitPipeline: SplitPipelineRun;
}

const processedEventIds = new Set<string>();

function rememberEventId(id?: string): boolean {
  if (!id) return false;
  if (processedEventIds.has(id)) return true;
  processedEventIds.add(id);
  if (processedEventIds.size > 500) {
    const oldest = Array.from(processedEventIds).slice(0, 200);
    oldest.forEach((k) => processedEventIds.delete(k));
  }
  return false;
}

const serverState: CompanionServerState = {
  activeHost: 'dual',
  activeUrl: 'https://wholefoods.amazon.com/cart',
  activeSpecialist: 'Carol Ann (Executive Orchestrator)',
  cartItems: [
    'Organic Tuscan Kale (2 bunches)',
    'Grass-Fed Ribeye Steak (1.2 lbs)',
    'Raw Local Wildflower Honey (16 oz)',
    'Unsweetened Organic Almond Milk (64 oz)',
  ],
  voiceStream: [
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
      text: 'Docked desktop browser runner is standing by. Speak or tap a command on your phone to trigger headless DOM inspection or approve staged actions.',
      source: 'desktop',
      agentName: 'Carol Ann',
      timestamp: new Date().toISOString(),
    },
  ],
  approvalCards: [
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
  ],
  top3Recommendations: [
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
  ],
  headlessRuns: [
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
  ],
  splitPipeline: synthesizeSplitPipeline('hand-stitched leather belt', 'Playwright Sandboxed Stream'),
};

function buildRecommendationsForQuery(queryText: string): ProductRecommendation[] {
  const lower = queryText.toLowerCase();
  if (lower.includes('whey') || lower.includes('protein') || lower.includes('gym') || lower.includes('supplement')) {
    return [
      {
        id: `prod_whey_1_${Date.now()}`,
        rank: 1,
        name: 'Momentous Grass-Fed Whey Protein Isolate (Vanilla, 2 lb)',
        brand: 'Momentous',
        price: '$64.95',
        unitPrice: '$2.03 / serving',
        rating: 4.9,
        reviewsCount: 3110,
        badge: 'NSF Certified for Sport · #1 Pick',
        matchReason: 'Cold-processed grass-fed isolate with ProHydrolase enzyme complex.',
        selected: true,
        category: 'Wellness',
      },
      {
        id: `prod_whey_2_${Date.now()}`,
        rank: 2,
        name: 'Thorne Whey Protein Isolate (Vanilla, 30 Servings)',
        brand: 'Thorne',
        price: '$58.00',
        unitPrice: '$1.93 / serving',
        rating: 4.8,
        reviewsCount: 1890,
        badge: 'Clinical Grade',
        matchReason: '21g bioavailable protein per scoop, low sugar, soy-free.',
        selected: false,
        category: 'Wellness',
      },
      {
        id: `prod_whey_3_${Date.now()}`,
        rank: 3,
        name: 'Optimum Nutrition Gold Standard 100% Whey Isolate (5 lb)',
        brand: 'Optimum Nutrition',
        price: '$79.99',
        unitPrice: '$1.08 / serving',
        rating: 4.7,
        reviewsCount: 12400,
        badge: 'Best Bulk Value',
        matchReason: 'High-volume 5lb tub with fast Prime same-day delivery.',
        selected: false,
        category: 'Wellness',
      },
    ];
  }

  if (lower.includes('pizza') || lower.includes('dinner') || lower.includes('takeout')) {
    return [
      {
        id: `prod_dinner_1_${Date.now()}`,
        rank: 1,
        name: 'Artisan Margherita Wood-Fired Sourdough Pizza + Arugula Salad',
        brand: 'Roberta’s Local Kitchen',
        price: '$28.50',
        unitPrice: '30–40 min delivery',
        rating: 4.9,
        reviewsCount: 940,
        badge: 'Fastest Local Artisan · #1 Pick',
        matchReason: 'Naturally leavened dough, San Marzano tomatoes, fresh mozzarella.',
        selected: true,
        category: 'Dining',
      },
      {
        id: `prod_dinner_2_${Date.now()}`,
        rank: 2,
        name: 'Truffle Mushroom & Burrata Caulipower Crust',
        brand: 'Pizzeria Mozza',
        price: '$31.00',
        unitPrice: '35–45 min delivery',
        rating: 4.8,
        reviewsCount: 620,
        badge: 'Lighter Gluten-Free Option',
        matchReason: 'Matches evening recovery macros with high-protein burrata.',
        selected: false,
        category: 'Dining',
      },
      {
        id: `prod_dinner_3_${Date.now()}`,
        rank: 3,
        name: 'Family Mediterranean Mezze & Flatbread Feast',
        brand: 'CAVA Catering',
        price: '$36.00',
        unitPrice: '25–35 min delivery',
        rating: 4.8,
        reviewsCount: 1510,
        badge: 'Balanced Macros',
        matchReason: 'Includes harissa honey chicken, hummus, pita, and supergreens.',
        selected: false,
        category: 'Dining',
      },
    ];
  }

  return serverState.top3Recommendations;
}

export function attachCompanionWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });
  const peers = new Map<WebSocket, ConnectedPeer>();

  const getPresenceSummary = () => {
    let phoneClients = 0;
    let desktopClients = 0;
    peers.forEach((p) => {
      if (p.deviceRole === 'phone') phoneClients += 1;
      else desktopClients += 1;
    });
    return {
      phoneClients,
      desktopClients,
      totalClients: peers.size,
    };
  };

  const broadcast = (message: Record<string, unknown>, excludeWs?: WebSocket) => {
    const payload = JSON.stringify({
      ...message,
      presence: getPresenceSummary(),
      timestamp: new Date().toISOString(),
    });
    peers.forEach((peer, ws) => {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
        } catch {
          // ignore broken socket
        }
      }
    });
  };

  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    try {
      const url = new URL(req.url || '/', 'http://localhost');
      if (url.pathname === '/api/ws/companion') {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
        });
      }
    } catch {
      // ignore malformed URL
    }
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url || '/', 'http://localhost');
    const roleParam = url.searchParams.get('role');
    const deviceRole: 'phone' | 'desktop' = roleParam === 'phone' ? 'phone' : 'desktop';
    const clientId = url.searchParams.get('clientId') || `peer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const agentId = url.searchParams.get('agentId') || 'carol-anchor';

    peers.set(ws, { clientId, deviceRole, agentId, ws });

    // 1. Send initial authoritative state to newly connected client
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'companion:init',
          state: serverState,
          presence: getPresenceSummary(),
          clientId,
          timestamp: new Date().toISOString(),
        })
      );
    }

    // 2. Broadcast updated presence to all other peers
    broadcast({
      type: 'companion:presence',
      clientId,
      deviceRole,
      agentId,
    });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as Record<string, unknown>;
        const eventId = typeof msg.eventId === 'string' ? msg.eventId : undefined;
        if (rememberEventId(eventId)) {
          return; // Idempotent guard
        }

        const msgType = String(msg.type || '');

        if (msgType === 'companion:ping') {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'companion:pong',
                clientTs: msg.clientTs,
                serverTs: Date.now(),
                presence: getPresenceSummary(),
              })
            );
          }
          return;
        }

        if (msgType === 'companion:register') {
          const peer = peers.get(ws);
          if (peer) {
            if (msg.deviceRole === 'phone' || msg.deviceRole === 'desktop') {
              peer.deviceRole = msg.deviceRole;
            }
            if (typeof msg.agentId === 'string') {
              peer.agentId = msg.agentId;
            }
            peers.set(ws, peer);
            broadcast({
              type: 'companion:presence',
              clientId: peer.clientId,
              deviceRole: peer.deviceRole,
              agentId: peer.agentId,
            });
          }
          return;
        }

        if (msgType === 'companion:voice_command') {
          const text = String(msg.text || '').trim();
          if (!text) return;
          const source: 'phone' | 'desktop' = msg.source === 'phone' ? 'phone' : 'desktop';
          const agentName = String(msg.agentName || 'Carol Ann');
          const targetUrl = String(msg.targetUrl || serverState.activeUrl);

          const voiceEntry: CompanionVoiceEntry = {
            id: eventId || `vs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            role: 'user',
            text,
            source,
            agentName,
            timestamp: new Date().toISOString(),
          };
          serverState.voiceStream = [...serverState.voiceStream.slice(-28), voiceEntry];
          serverState.activeUrl = targetUrl;
          serverState.activeSpecialist = agentName;

          const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
          const newRun: HeadlessRunRecord = {
            id: runId,
            command: text,
            targetUrl,
            specialist: agentName,
            status: 'running',
            stepLabel: 'Step 1/3 · Headless desktop browser inspecting DOM selectors…',
            startedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          serverState.headlessRuns = [newRun, ...serverState.headlessRuns.slice(0, 14)];

          // Update Top-3 recommendations if relevant
          serverState.top3Recommendations = buildRecommendationsForQuery(text);

          // Create an approval card for remote phone sign-off
          const newApproval: CompanionApprovalCard = {
            id: `apr_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            title: `Approve Headless Run: ${text.slice(0, 42)}`,
            subtitle: `Staged on docked desktop (${targetUrl.replace(/^https?:\/\//, '')})`,
            command: `PlaywrightRunner.execute(${JSON.stringify(text.slice(0, 36))})`,
            targetUrl,
            riskLevel: text.toLowerCase().includes('calendar') ? 'calendar' : 'checkout',
            status: 'pending',
            requestedBy: agentName,
            timestamp: new Date().toISOString(),
          };
          serverState.approvalCards = [newApproval, ...serverState.approvalCards.slice(0, 8)];

          broadcast({
            type: 'companion:state_delta',
            reason: 'voice_command',
            voiceEntry,
            headlessRun: newRun,
            approvalCard: newApproval,
            top3Recommendations: serverState.top3Recommendations,
            state: serverState,
          });

          // Simulate headless desktop progress update after 1.1s
          setTimeout(() => {
            newRun.status = 'awaiting_approval';
            newRun.stepLabel = 'Step 2/3 · DOM hydrated & Top-3 options ranked. Awaiting phone approval.';
            newRun.updatedAt = new Date().toISOString();

            const replyEntry: CompanionVoiceEntry = {
              id: `vs_reply_${Date.now()}`,
              role: 'assistant',
              text: `Headless desktop run staged for "${text}". Top-3 options and approval card are ready on your companion screen.`,
              source: 'desktop',
              agentName,
              timestamp: new Date().toISOString(),
            };
            serverState.voiceStream = [...serverState.voiceStream.slice(-28), replyEntry];

            broadcast({
              type: 'companion:state_delta',
              reason: 'headless_progress',
              voiceEntry: replyEntry,
              headlessRun: newRun,
              state: serverState,
            });
          }, 1100);

          return;
        }

        if (msgType === 'companion:voice_reply') {
          const text = String(msg.text || '').trim();
          if (!text) return;
          const agentName = String(msg.agentName || 'Carol Ann');
          const replyEntry: CompanionVoiceEntry = {
            id: eventId || `vs_ai_${Date.now()}`,
            role: 'assistant',
            text,
            source: 'desktop',
            agentName,
            timestamp: new Date().toISOString(),
          };
          serverState.voiceStream = [...serverState.voiceStream.slice(-28), replyEntry];
          broadcast({
            type: 'companion:state_delta',
            reason: 'voice_reply',
            voiceEntry: replyEntry,
            state: serverState,
          });
          return;
        }

        if (msgType === 'companion:approval_decision') {
          const cardId = String(msg.cardId || '');
          const decision: 'approved' | 'denied' = msg.decision === 'denied' ? 'denied' : 'approved';
          const card = serverState.approvalCards.find((c) => c.id === cardId);
          if (card) {
            card.status = decision;
            if (serverState.headlessRuns[0]) {
              serverState.headlessRuns[0].status = decision === 'approved' ? 'completed' : 'queued';
              serverState.headlessRuns[0].stepLabel =
                decision === 'approved'
                  ? 'Step 3/3 · Approved via Phone Co-Pilot & executed on desktop DOM'
                  : 'Halted · Denied by operator on Phone Co-Pilot';
              serverState.headlessRuns[0].updatedAt = new Date().toISOString();
            }
            const sysEntry: CompanionVoiceEntry = {
              id: `vs_apr_${Date.now()}`,
              role: 'system',
              text:
                decision === 'approved'
                  ? `Approved "${card.title}" from Phone Co-Pilot. Desktop browser completed execution.`
                  : `Denied "${card.title}" from Phone Co-Pilot. Desktop runner paused.`,
              source: 'phone',
              agentName: card.requestedBy,
              timestamp: new Date().toISOString(),
            };
            serverState.voiceStream = [...serverState.voiceStream.slice(-28), sysEntry];

            broadcast({
              type: 'companion:state_delta',
              reason: 'approval_decision',
              cardId,
              decision,
              voiceEntry: sysEntry,
              state: serverState,
            });
          }
          return;
        }

        if (msgType === 'companion:select_product') {
          const productId = String(msg.productId || '');
          let picked: ProductRecommendation | undefined;
          serverState.top3Recommendations = serverState.top3Recommendations.map((item) => {
            const isMatch = item.id === productId;
            if (isMatch) picked = { ...item, selected: true };
            return { ...item, selected: isMatch };
          });

          if (picked) {
            const cartLabel = `${picked.name} (${picked.price})`;
            if (!serverState.cartItems.includes(cartLabel)) {
              serverState.cartItems = [cartLabel, ...serverState.cartItems.slice(0, 5)];
            }
            const sysEntry: CompanionVoiceEntry = {
              id: `vs_pick_${Date.now()}`,
              role: 'system',
              text: `Selected Top-${picked.rank} pick "${picked.name}" (${picked.price}) — hydrated into docked desktop cart.`,
              source: 'phone',
              agentName: serverState.activeSpecialist,
              timestamp: new Date().toISOString(),
            };
            serverState.voiceStream = [...serverState.voiceStream.slice(-28), sysEntry];

            broadcast({
              type: 'companion:state_delta',
              reason: 'product_selected',
              product: picked,
              voiceEntry: sysEntry,
              state: serverState,
            });
          }
          return;
        }

        if (msgType === 'companion:bridge_sync' && msg.event) {
          const ev = msg.event as { type?: string; payload?: Record<string, unknown> };
          if (ev.payload?.url && typeof ev.payload.url === 'string') {
            serverState.activeUrl = ev.payload.url;
          }
          if (ev.payload?.executionHost) {
            serverState.activeHost = ev.payload.executionHost as 'dashboard' | 'phone' | 'dual';
          }
          if (ev.payload?.agentName && typeof ev.payload.agentName === 'string') {
            serverState.activeSpecialist = ev.payload.agentName;
          }
          if (Array.isArray(ev.payload?.items) && ev.payload.items.length > 0) {
            serverState.cartItems = ev.payload.items.map(String);
          }
          broadcast(
            {
              type: 'companion:bridge_event',
              event: ev,
              state: serverState,
            },
            ws
          );
          return;
        }

        if (msgType === 'companion:split_pipeline') {
          const query = String(msg.query || 'hand-stitched leather belt').trim();
          const runtimeEngine = (msg.runtimeEngine || 'Playwright Sandboxed Stream') as SplitPipelineRun['runtimeEngine'];
          const result = synthesizeSplitPipeline(query, runtimeEngine);
          serverState.splitPipeline = result;
          serverState.activeUrl =
            result.sovereignDiscoveryMatches[0]?.directUrl ||
            result.directUtilityMatches[0]?.merchantUrl ||
            serverState.activeUrl;

          const sysEntry: CompanionVoiceEntry = {
            id: `vs_sp_${Date.now()}`,
            role: 'system',
            text: `Split Pipeline completed for "${query}": Thread 1 extracted 3 verified commodity options (${result.thread1Status.junkReviewsDiscarded} junk reviews discarded) · Thread 2 discovered ${result.sovereignDiscoveryMatches.length} independent artisan makers.`,
            source: 'desktop',
            agentName: 'Carol Ann (DOM Synthesizer)',
            timestamp: new Date().toISOString(),
          };
          serverState.voiceStream = [...serverState.voiceStream.slice(-28), sysEntry];

          broadcast({
            type: 'companion:state_delta',
            reason: 'split_pipeline_completed',
            splitPipeline: result,
            voiceEntry: sysEntry,
            state: serverState,
          });
          return;
        }

        if (msgType === 'companion:select_split_match') {
          const matchId = String(msg.matchId || '');
          const thread = msg.thread === 'direct' ? 'direct' : 'sovereign';
          let stagedLabel = '';
          let targetUrl = serverState.activeUrl;

          if (thread === 'direct') {
            serverState.splitPipeline.directUtilityMatches =
              serverState.splitPipeline.directUtilityMatches.map((m) => {
                const isSelected = m.id === matchId;
                if (isSelected) {
                  stagedLabel = `[Direct Utility · ${m.merchant}] ${m.name} (${m.price})`;
                  targetUrl = m.merchantUrl;
                }
                return { ...m, selected: isSelected };
              });
          } else {
            serverState.splitPipeline.sovereignDiscoveryMatches =
              serverState.splitPipeline.sovereignDiscoveryMatches.map((m) => {
                const isSelected = m.id === matchId;
                if (isSelected) {
                  stagedLabel = `[Sovereign Maker · ${m.makerName}] ${m.name} (${m.price})`;
                  targetUrl = m.directUrl;
                }
                return { ...m, selected: isSelected };
              });
          }

          if (stagedLabel) {
            serverState.activeUrl = targetUrl;
            if (!serverState.cartItems.includes(stagedLabel)) {
              serverState.cartItems = [stagedLabel, ...serverState.cartItems.slice(0, 5)];
            }
            const sysEntry: CompanionVoiceEntry = {
              id: `vs_spm_${Date.now()}`,
              role: 'system',
              text: `Staged ${stagedLabel} into active DOM cart.`,
              source: 'desktop',
              agentName: 'Carol Ann (DOM Synthesizer)',
              timestamp: new Date().toISOString(),
            };
            serverState.voiceStream = [...serverState.voiceStream.slice(-28), sysEntry];

            broadcast({
              type: 'companion:state_delta',
              reason: 'split_match_selected',
              splitPipeline: serverState.splitPipeline,
              voiceEntry: sysEntry,
              state: serverState,
            });
          }
          return;
        }
      } catch (err) {
        console.warn('[CompanionWS] Failed to parse message:', err);
      }
    });

    ws.on('close', () => {
      const peer = peers.get(ws);
      peers.delete(ws);
      if (peer) {
        broadcast({
          type: 'companion:presence',
          clientId: peer.clientId,
          deviceRole: peer.deviceRole,
          disconnected: true,
        });
      }
    });
  });
}
