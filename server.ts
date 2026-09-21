import express from 'express';
import http from 'http';
import path from 'path';
import { chromium } from 'playwright';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, Type, type LiveServerMessage } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { getAdminBackend } from './server/lib/firebaseAdmin.js';
import {
  requireFirebaseAuth,
  verifyAppCheck,
  type AuthenticatedRequest,
} from './server/middleware/auth.js';
import { assertUrlSafe, createHostAllowCheck, SsrfError } from './server/lib/ssrfGuard.js';
import firebaseConfig from './firebase-applet-config.json';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory workspace cache fallback used when Firestore is unreachable
const localWorkspaceCache = new Map<string, Record<string, unknown>>();

// Lazy Google GenAI Client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Health Check
app.get('/api/health', (_req, res) => {
  const backend = getAdminBackend();
  res.json({
    status: 'ok',
    cloudAgentNative: true,
    deployed: true,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    firebaseConfigured: Boolean(firebaseConfig.projectId && firebaseConfig.apiKey),
    firebaseAdminConfigured: Boolean(backend),
    firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
    backend: backend ? 'firebase_admin_firestore' : 'local_resilient_cache',
  });
});

// Cloud state fetch endpoint backed by Firestore Admin with resilient fallback.
// Requires Firebase Authentication. The workspace is always scoped to the
// authenticated user's UID — callers can no longer read other users' state.
app.get('/api/cloud/state', requireFirebaseAuth, verifyAppCheck, async (req, res) => {
  try {
    const authUser = (req as AuthenticatedRequest).firebaseUser;
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const cleanId = authUser.uid.replace(/[^a-zA-Z0-9_-]/g, '_');
    let state: Record<string, unknown> | null = null;
    let backendUsed = 'local_resilient_cache';

    const backend = getAdminBackend();
    if (backend?.db) {
      try {
        const docSnap = await backend.db.collection('workspaces').doc(cleanId).get();
        if (docSnap.exists) {
          state = (docSnap.data() as Record<string, unknown>) || null;
          backendUsed = 'firebase_admin_firestore';
        }
      } catch (err) {
        console.warn('[Cloud State] Firestore admin read fallback:', err instanceof Error ? err.message : err);
      }
    }

    if (!state) {
      state = localWorkspaceCache.get(cleanId) || null;
    }

    if (state && typeof state === 'object') {
      if (Array.isArray(state.memories)) {
        state.memories = (state.memories as Array<Record<string, unknown>>).filter((m) => {
          const content = String(m?.content || '').toLowerCase();
          const tags = Array.isArray(m?.tags) ? (m.tags as string[]).join(' ').toLowerCase() : '';
          const id = String(m?.id || '').toLowerCase();
          return (
            !id.includes('seed') &&
            !id.includes('fake') &&
            !content.includes('volleyball') &&
            !content.includes('whey') &&
            !tags.includes('volleyball') &&
            !tags.includes('whey')
          );
        });
      }
      if (Array.isArray(state.messages)) {
        state.messages = (state.messages as Array<Record<string, unknown>>).filter((m) => {
          const id = String(m?.id || '').toLowerCase();
          return !id.includes('seed') && !id.includes('fake') && id !== 'msg_init_1' && id !== 'msg_init_2';
        });
      }
    }

    res.json({
      status: 'ok',
      cloudNative: true,
      backend: backendUsed,
      databaseId: firebaseConfig.firestoreDatabaseId,
      state,
      authenticated: true,
    });
  } catch (err: unknown) {
    console.error('[Cloud State Error]', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'State read failure' });
  }
});

// Cloud state sync endpoint backed by Firestore Admin with resilient fallback.
// Requires Firebase Authentication; writes are scoped to the token's UID.
app.post('/api/cloud/sync', requireFirebaseAuth, verifyAppCheck, async (req, res) => {
  try {
    const { state } = req.body;
    if (!state) {
      return res.status(400).json({ error: 'State payload is required.' });
    }

    const authUser = (req as AuthenticatedRequest).firebaseUser;
    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const cleanId = authUser.uid.replace(/[^a-zA-Z0-9_-]/g, '_');
    const payload: Record<string, unknown> = {
      ...state,
      userId: cleanId,
      lastSyncedAt: new Date().toISOString(),
    };

    localWorkspaceCache.set(cleanId, payload);
    let backendUsed = 'local_resilient_cache';

    const backend = getAdminBackend();
    if (backend?.db) {
      try {
        const docRef = backend.db.collection('workspaces').doc(cleanId);
        await docRef.set(payload, { merge: true });
        backendUsed = 'firebase_admin_firestore';
      } catch (err) {
        console.warn('[Cloud Sync] Firestore admin write fallback:', err instanceof Error ? err.message : err);
      }
    }

    res.json({
      status: 'ok',
      cloudNative: true,
      backend: backendUsed,
      databaseId: firebaseConfig.firestoreDatabaseId,
      lastSyncedAt: payload.lastSyncedAt,
      authenticated: true,
      recordsCount: {
        memories: Array.isArray(payload.memories) ? payload.memories.length : 0,
        errands: Array.isArray(payload.errands) ? payload.errands.length : 0,
        checkIns: Array.isArray(payload.checkIns) ? payload.checkIns.length : 0,
      },
    });
  } catch (err: unknown) {
    console.error('[Cloud Sync Error]', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Sync write failure' });
  }
});

// Tool Definitions for cloud-native workspace actions
const executiveTools = [
  {
    functionDeclarations: [
      {
        name: 'stage_grocery_errand',
        description: 'Stages a grocery or shopping errand in the cloud workspace for user confirmation.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Order title' },
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of requested items',
            },
            target_time: { type: Type.STRING, description: 'Requested delivery or pickup window' },
            notes: { type: Type.STRING, description: 'Notes or instructions' },
          },
          required: ['title', 'items'],
        },
      },
      {
        name: 'stage_booking_appointment',
        description: 'Stages an appointment or booking in the cloud workspace for user confirmation.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Appointment title' },
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Services or requests' },
            target_time: { type: Type.STRING, description: 'Target date and time' },
            notes: { type: Type.STRING, description: 'Location, provider, or travel notes' },
          },
          required: ['title', 'items'],
        },
      },
      {
        name: 'update_workout_scratchpad',
        description: 'Stages a workout or wellness plan in the cloud workspace.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Routine title' },
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Planned exercises or habits',
            },
            target_time: { type: Type.STRING, description: 'Scheduled session time' },
            notes: { type: Type.STRING, description: 'Recovery or context notes' },
          },
          required: ['title', 'items'],
        },
      },
      {
        name: 'update_memory_ledger',
        description: 'Records a personal fact, preference, habit, or relationship into cloud agent memory.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: 'Category: habit, fitness, nutrition, preference, people, or family',
            },
            content: { type: Type.STRING, description: 'The exact memory content to retain' },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Searchable tags',
            },
          },
          required: ['category', 'content'],
        },
      },
      {
        name: 'meta_schedule_reel',
        description: 'Stages an Instagram Reel or Facebook video post for scheduled release via Meta Graph API.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING, description: 'Caption and hashtags for the reel' },
            scheduled_time: { type: Type.STRING, description: 'Target date and time for publication' },
            notes: { type: Type.STRING, description: 'Audio track, audio tags, or placement notes' },
          },
          required: ['caption'],
        },
      },
      {
        name: 'quickbooks_create_invoice',
        description: 'Stages an accounts receivable invoice for a client in QuickBooks Online.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            customer_name: { type: Type.STRING, description: 'Client or customer name' },
            amount: { type: Type.NUMBER, description: 'Total invoice amount' },
            line_items: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Line items on the invoice',
            },
            due_date: { type: Type.STRING, description: 'Payment due date' },
          },
          required: ['customer_name', 'amount'],
        },
      },
      {
        name: 'tripadvisor_respond_review',
        description: 'Stages a verified management response to a guest review on TripAdvisor or Google Business.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            review_id: { type: Type.STRING, description: 'Review ID or guest identifier' },
            response_text: { type: Type.STRING, description: 'Official public reply copy' },
            tone: { type: Type.STRING, description: 'Hospitality tone (e.g., hospitable, appreciative)' },
          },
          required: ['response_text'],
        },
      },
      {
        name: 'zapier_trigger_action',
        description: 'Executes a remote SaaS workflow through the Zapier Universal MCP Bridge.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            action_name: { type: Type.STRING, description: 'Zapier action name' },
            target_app: { type: Type.STRING, description: 'Underlying SaaS tool (HubSpot, Slack, etc.)' },
            summary: { type: Type.STRING, description: 'Summary of payload' },
          },
          required: ['action_name'],
        },
      },
    ],
  },
];

const ANCHOR_SYSTEM_INSTRUCTION = `You are Carol Ann, the warm, steady executive anchor for this cloud-agent native web workspace deployed on Google Cloud.

Core Behavioral Tenets:
1. Remember the person, not the persona. Calibrate every response against the explicit profile, memories, and intentions the operator has shared.
2. Cloud agent native intelligence. You orchestrate cloud-deployed sub-agents, synchronize memory across browser sessions, and execute browser automation and tool actions through cloud microservices.
3. Direct action over generic advice. Favor concrete plans, structured data, and tool calls over conversational filler.
4. Warmth with boundaries. Be kind, clear, and gently honest. Avoid sycophancy, excessive flattery, or performative enthusiasm.

When the user asks for errands, bookings, workout plans, or recording a lasting fact, use the matching tool function declaration. Keep answers focused and actionable.`;

// Deterministic local sovereign rule engine fallback
function evaluateLocalFallback(message: string, agentId: string, agentName: string) {
  const lower = message.toLowerCase();
  let toolCall: Record<string, unknown> | null = null;
  let reply = '';

  if (lower.includes('grocery') || lower.includes('food') || lower.includes('cart') || lower.includes('order')) {
    toolCall = {
      id: `act_${Date.now()}`,
      category: 'errand',
      action_name: 'Grocery Errand',
      form_payload: {
        title: 'Grocery order',
        items: ['Eggs', 'Spinach', 'Almond milk', 'Bread'],
        target_time: 'Tomorrow morning',
        notes: 'Staged in cloud workspace — confirm before placing.',
      },
      requires_user_confirmation: true,
      status: 'pending_confirmation',
      timestamp: new Date().toISOString(),
    };
    reply = 'I have staged a grocery order in your cloud workspace. Please review and confirm before placing.';
  } else if (lower.includes('book') || lower.includes('appointment') || lower.includes('schedule') || lower.includes('salon')) {
    toolCall = {
      id: `act_${Date.now()}`,
      category: 'calendar_booking',
      action_name: 'Appointment Booking',
      form_payload: {
        title: 'Appointment request',
        items: ['Preferred time', 'Provider notes'],
        target_time: 'Next available opening',
        notes: 'Staged in cloud workspace — confirm before booking.',
      },
      requires_user_confirmation: true,
      status: 'pending_confirmation',
      timestamp: new Date().toISOString(),
    };
    reply = 'I have staged an appointment booking card in your cloud workspace. Add the provider and time, then confirm.';
  } else if (lower.includes('workout') || lower.includes('gym') || lower.includes('train') || lower.includes('exercise')) {
    toolCall = {
      id: `act_${Date.now()}`,
      category: 'scratchpad_update',
      action_name: 'Wellness Plan',
      form_payload: {
        title: 'Movement plan',
        items: ['Warm-up 5 min', 'Main session', 'Cool-down stretch'],
        target_time: 'Today',
        notes: 'Staged in your cloud workspace scratchpad.',
      },
      requires_user_confirmation: false,
      status: 'executed',
      timestamp: new Date().toISOString(),
    };
    reply = 'I have updated your cloud wellness scratchpad.';
  } else if (lower.includes('reel') || lower.includes('instagram') || lower.includes('tiktok') || lower.includes('post video')) {
    toolCall = {
      id: `act_${Date.now()}`,
      target_app: 'Meta / Instagram Reels',
      category: 'social_marketing',
      action_name: 'Schedule Instagram Reel',
      form_payload: {
        title: 'Instagram Reel & Carousel Dispatch',
        items: ['Caption: "Behind the scenes at the studio ✨ #executive #workflow"', 'Media: reel_4k_v3.mp4', 'Audio: Ambient Lo-Fi #04'],
        target_time: 'Tomorrow 11:30 AM EST',
        notes: 'Requires confirmation. Tap Approve to dispatch to Meta API.',
      },
      requires_user_confirmation: true,
      status: 'pending_confirmation',
      timestamp: new Date().toISOString(),
    };
    reply = 'I have staged your Instagram Reel campaign in the Safety & Verification Tray. Review details and approve when ready.';
  } else if (lower.includes('invoice') || lower.includes('quickbooks') || lower.includes('bill client') || lower.includes('retainer')) {
    toolCall = {
      id: `act_${Date.now()}`,
      target_app: 'QuickBooks Online',
      category: 'finance_accounting',
      action_name: 'Create Accounts Receivable Invoice',
      form_payload: {
        title: 'Invoice for Global Ventures LLC',
        items: ['Strategic Consulting & Ops Alignment - Q3', 'Dedicated MCP Infrastructure Support'],
        target_time: 'Net 30',
        fields: {
          customer: 'Global Ventures LLC',
          total_amount: '$4,500.00',
          currency: 'USD',
        },
        notes: 'Requires confirmation. Tap Approve to transmit to QuickBooks.',
      },
      requires_user_confirmation: true,
      status: 'pending_confirmation',
      timestamp: new Date().toISOString(),
    };
    reply = 'I have prepared the QuickBooks Online invoice. Please review the total and terms in the Verification Tray.';
  } else if (lower.includes('review') || lower.includes('tripadvisor') || lower.includes('yelp') || lower.includes('guest')) {
    toolCall = {
      id: `act_${Date.now()}`,
      target_app: 'TripAdvisor Reviews',
      category: 'hospitality_review',
      action_name: 'Publish Management Review Response',
      form_payload: {
        title: 'Response to Guest Review #TR-8841',
        items: ['"Thank you for dining with us! We are thrilled you enjoyed the seasonal tasting menu and bespoke cellar selection."'],
        target_time: 'Immediate',
        notes: 'Requires confirmation. Tap Approve to publish public reply on TripAdvisor.',
      },
      requires_user_confirmation: true,
      status: 'pending_confirmation',
      timestamp: new Date().toISOString(),
    };
    reply = 'I have drafted a hospitality management response for TripAdvisor. You can verify and approve it below.';
  } else if (lower.includes('zapier') || lower.includes('hubspot') || lower.includes('sync lead')) {
    toolCall = {
      id: `act_${Date.now()}`,
      target_app: 'Zapier Universal MCP Bridge',
      category: 'social_marketing',
      action_name: 'Sync VIP Lead to HubSpot CRM',
      form_payload: {
        title: 'Zapier SaaS Action: HubSpot CRM Lead Sync',
        items: ['Contact: Sarah Jenkins', 'Company: Apex Global', 'Lifecycle: Marketing Qualified Lead'],
        target_time: 'Instant Trigger',
        notes: 'Requires confirmation. Dispatches via Zapier MCP Gateway.',
      },
      requires_user_confirmation: true,
      status: 'pending_confirmation',
      timestamp: new Date().toISOString(),
    };
    reply = 'I have prepared the Zapier SaaS automation dispatch in your verification tray.';
  } else {
    reply = `Understood. Carol Ann has routed your request through ${agentName}. Your cloud agent memory is active and synchronized. How would you like to proceed?`;
  }

  return { reply, toolCall, agentId, source: 'cloud-agent-fallback' };
}

// Shared inference helper
async function runAnchorChat(
  message: string,
  agentId: string,
  agentName: string,
  agentRole: string,
  history: { role: string; content: string }[],
  profile: Record<string, unknown>,
  memoryContext: string,
) {
  const ai = getGenAI();

  if (!ai) {
    return evaluateLocalFallback(message, agentId, agentName);
  }

  const systemInstruction = `${ANCHOR_SYSTEM_INSTRUCTION}\n\nIdentity context:\n- User Name: ${(profile.name as string) || 'Operator'}\n- User Focus: ${(profile.identity as string) || 'Cloud-native lifestyle and executive management'}\n- Wellness Goal: ${(profile.wellnessGoal as string) || 'Balanced energy and recovery'}\n- Professional Focus: ${(profile.professionalFocus as string) || 'Personal projects'}\n- Cloud Memories:\n${memoryContext || 'None recorded yet.'}\n\nYou are ${agentName}, ${agentRole}.`;

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  for (const h of history.slice(-10)) {
    if (h.role === 'user' || h.role === 'assistant') {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      });
    }
  }
  contents.push({ role: 'user', parts: [{ text: message }] });

  try {
    const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents,
    config: {
      systemInstruction,
      tools: executiveTools,
    },
  });

  let reply = response.text || '';
  let toolCall: Record<string, unknown> | null = null;

  const candidates = response.candidates || [];
  for (const c of candidates) {
    const parts = c.content?.parts || [];
    for (const p of parts) {
      if (p.functionCall) {
        const fc = p.functionCall;
        const args = (fc.args || {}) as Record<string, unknown>;
        const base = {
          id: `act_${Date.now()}`,
          requires_user_confirmation: fc.name !== 'update_workout_scratchpad' && fc.name !== 'update_memory_ledger',
          status: fc.name === 'update_workout_scratchpad' || fc.name === 'update_memory_ledger' ? 'executed' : 'pending_confirmation',
          timestamp: new Date().toISOString(),
        };
        if (fc.name === 'stage_grocery_errand') {
          toolCall = {
            ...base,
            category: 'errand',
            action_name: typeof args.title === 'string' ? args.title : 'Grocery Errand',
            form_payload: {
              title: typeof args.title === 'string' ? args.title : 'Grocery Order',
              items: Array.isArray(args.items) ? (args.items as string[]) : [],
              target_time: typeof args.target_time === 'string' ? args.target_time : 'Tomorrow morning',
              notes: typeof args.notes === 'string' ? args.notes : '',
            },
          };
        } else if (fc.name === 'stage_booking_appointment') {
          toolCall = {
            ...base,
            category: 'calendar_booking',
            action_name: typeof args.title === 'string' ? args.title : 'Appointment Booking',
            form_payload: {
              title: typeof args.title === 'string' ? args.title : 'Appointment Booking',
              items: Array.isArray(args.items) ? (args.items as string[]) : [],
              target_time: typeof args.target_time === 'string' ? args.target_time : 'Next opening',
              notes: typeof args.notes === 'string' ? args.notes : '',
            },
          };
        } else if (fc.name === 'update_workout_scratchpad') {
          toolCall = {
            ...base,
            category: 'scratchpad_update',
            action_name: typeof args.title === 'string' ? args.title : 'Wellness Plan',
            form_payload: {
              title: typeof args.title === 'string' ? args.title : 'Training Routine',
              items: Array.isArray(args.items) ? (args.items as string[]) : [],
              target_time: typeof args.target_time === 'string' ? args.target_time : 'Today',
              notes: typeof args.notes === 'string' ? args.notes : '',
            },
          };
        } else if (fc.name === 'update_memory_ledger') {
          toolCall = {
            ...base,
            category: 'profile_intake',
            action_name: 'Record Memory Ledger',
            form_payload: {
              title: `Memory: ${typeof args.category === 'string' ? args.category : 'general'}`,
              items: [typeof args.content === 'string' ? args.content : ''],
              notes: Array.isArray(args.tags) ? (args.tags as string[]).join(', ') : '',
            },
          };
        } else if (fc.name === 'meta_schedule_reel') {
          toolCall = {
            ...base,
            target_app: 'Meta / Instagram Reels',
            category: 'social_marketing',
            action_name: 'Schedule Instagram Reel',
            requires_user_confirmation: true,
            status: 'pending_confirmation',
            form_payload: {
              title: 'Instagram Reel & Carousel Dispatch',
              items: [
                `Caption: "${String(args.caption || '')}"`,
                args.scheduled_time ? `Scheduled: ${String(args.scheduled_time)}` : 'Target: Tomorrow 11:30 AM EST',
              ],
              target_time: typeof args.scheduled_time === 'string' ? args.scheduled_time : 'Tomorrow 11:30 AM EST',
              notes: typeof args.notes === 'string' ? args.notes : 'Staged in Verification Tray. Click Approve to publish via Meta API.',
            },
          };
        } else if (fc.name === 'quickbooks_create_invoice') {
          toolCall = {
            ...base,
            target_app: 'QuickBooks Online',
            category: 'finance_accounting',
            action_name: 'Create Accounts Receivable Invoice',
            requires_user_confirmation: true,
            status: 'pending_confirmation',
            form_payload: {
              title: `Invoice for ${String(args.customer_name || 'Client')}`,
              items: Array.isArray(args.line_items) ? (args.line_items as string[]) : ['Executive Advisory & Retainer'],
              target_time: typeof args.due_date === 'string' ? args.due_date : 'Net 30',
              fields: {
                total_amount: `$${Number(args.amount || 0).toLocaleString()}`,
                currency: 'USD',
                customer: String(args.customer_name || 'Client'),
              },
              notes: 'Staged in Verification Tray. Click Approve to transmit over QuickBooks MCP Bridge.',
            },
          };
        } else if (fc.name === 'tripadvisor_respond_review') {
          toolCall = {
            ...base,
            target_app: 'TripAdvisor Reviews',
            category: 'hospitality_review',
            action_name: 'Submit Management Review Response',
            requires_user_confirmation: true,
            status: 'pending_confirmation',
            form_payload: {
              title: `Public Reply to Review ${String(args.review_id || 'Latest')}`,
              items: [String(args.response_text || 'Thank you for your stay.')],
              notes: 'Staged in Verification Tray. Click Approve to publish public reply.',
            },
          };
        } else if (fc.name === 'zapier_trigger_action') {
          toolCall = {
            ...base,
            target_app: typeof args.target_app === 'string' ? args.target_app : 'Zapier Universal MCP Bridge',
            category: 'social_marketing',
            action_name: typeof args.action_name === 'string' ? args.action_name : 'Execute Zapier SaaS Action',
            requires_user_confirmation: true,
            status: 'pending_confirmation',
            form_payload: {
              title: `Zapier Action: ${String(args.action_name || 'Workflow')}`,
              items: [typeof args.summary === 'string' ? args.summary : 'Automated action triggered via Universal Bridge'],
              notes: 'Staged in Verification Tray. Click Approve to dispatch over Zapier Gateway.',
            },
          };
        }
      }
    }
  }

  if (!reply && toolCall) {
    const payload = toolCall.form_payload as { title?: string } | undefined;
    reply = `I have staged the ${payload?.title || 'action'} for you.`;
  } else if (!reply) {
    reply = 'Processed and synchronized with your local workspace.';
  }

  return { reply, toolCall, agentId, source: 'gemini-3.8-flash' };
} catch (apiErr) {
  console.warn('Gemini API call failed, falling back to sovereign rule engine:', apiErr);
  return evaluateLocalFallback(message, agentId, agentName);
}
}

// Conversational Inference Route (requires Firebase Authentication)
app.post('/api/gemini/chat', requireFirebaseAuth, verifyAppCheck, async (req, res) => {
  try {
    const {
      message,
      agentId = 'carol-anchor',
      agentName = 'Carol Ann',
      agentRole = 'Warm Anchor & Workspace Orchestrator',
      history = [],
      profile = {},
      memoryContext = '',
      attachments = [],
    } = req.body;

    if (!message && (!Array.isArray(attachments) || attachments.length === 0)) {
      return res.status(400).json({ error: 'Message content or attachments required.' });
    }

    let fullMessage = message || '';
    if (Array.isArray(attachments) && attachments.length > 0) {
      const attachmentSummaries = attachments
        .map((att: { type?: string; name?: string; size?: string; contextSnippet?: string; connectorName?: string }) => {
          if (att.type === 'image') return `[Attached Photo: ${att.name || 'Image'} (${att.size || 'image'})]`;
          if (att.type === 'video') return `[Attached Video: ${att.name || 'Video'} (${att.size || 'video'})]`;
          if (att.type === 'file') return `[Attached Document/File: ${att.name || 'File'} (${att.size || 'document'})]`;
          if (att.type === 'connector') return `[Attached MCP Connector: ${att.connectorName || att.name || 'Connector'}]`;
          if (att.type === 'context') return `[Attached Workspace Context: ${att.name || 'Context'}\n${att.contextSnippet || ''}]`;
          return `[Attached: ${att.name || 'Item'}]`;
        })
        .join('\n');

      fullMessage = fullMessage ? `${fullMessage}\n\nAttachments & Attached Context:\n${attachmentSummaries}` : `Attachments:\n${attachmentSummaries}`;
    }

    const result = await runAnchorChat(fullMessage, agentId, agentName, agentRole, history, profile, memoryContext);
    return res.json(result);
  } catch (error) {
    console.error('Error in /api/gemini/chat:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal inference error',
    });
  }
});

// Agent dispatch route — plans and routes a task to the right specialist
// (requires Firebase Authentication)
app.post('/api/agent/dispatch', requireFirebaseAuth, verifyAppCheck, async (req, res) => {
  try {
    const { task, agentId = 'carol-anchor', agentName = 'Carol Ann', history = [], profile = {}, memoryContext = '' } = req.body;
    if (!task) {
      return res.status(400).json({ error: 'Task description is required.' });
    }

    const result = await runAnchorChat(
      `Dispatch this task to the right specialist and outline a plan: ${task}`,
      agentId,
      agentName,
      'Warm Anchor & Workspace Orchestrator',
      history,
      profile,
      memoryContext,
    );

    return res.json({
      ...result,
      dispatched: true,
      task,
    });
  } catch (error) {
    console.error('Error in /api/agent/dispatch:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Dispatch error',
    });
  }
});

// Browser automation: run a navigation / DOM task.
// Requires Firebase Authentication. Target URLs are screened by the SSRF
// guard: only public http(s) hosts, redirect chains re-validated, and every
// request (including subresources) intercepted and checked.
app.post('/api/browser/run', requireFirebaseAuth, verifyAppCheck, async (req, res) => {
  const { url, waitFor } = req.body as { url?: string; waitFor?: string };
  if (!url) {
    return res.status(400).json({ error: 'URL is required.' });
  }

  let safeUrl: string;
  try {
    safeUrl = (await assertUrlSafe(url)).normalizedUrl;
  } catch (err) {
    return res
      .status(err instanceof SsrfError ? err.statusCode : 400)
      .json({ error: err instanceof Error ? err.message : 'URL rejected.' });
  }

  const isHostAllowed = createHostAllowCheck();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.route('**/*', async (route) => {
      try {
        const target = new URL(route.request().url());
        if (await isHostAllowed(target.hostname)) {
          await route.continue();
        } else {
          await route.abort('blockedbyclient');
        }
      } catch {
        await route.abort('blockedbyclient');
      }
    });
    const page = await context.newPage();
    await page.goto(safeUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Re-validate the final URL — catches redirect chains into restricted hosts.
    try {
      await assertUrlSafe(page.url());
    } catch (err) {
      await browser.close();
      return res
        .status(err instanceof SsrfError ? err.statusCode : 400)
        .json({ error: 'Navigation redirected to a restricted address.' });
    }

    if (waitFor) {
      await page.waitForSelector(waitFor, { timeout: 15000 }).catch(() => undefined);
    }

    const title = await page.title().catch(() => '');
    const text = await page.evaluate(() => document.body?.innerText?.slice(0, 4000) || '');
    const pageUrl = page.url();

    await browser.close();
    return res.json({
      ok: true,
      url: pageUrl,
      title,
      text,
      source: 'playwright',
    });
  } catch (error) {
    if (browser) await browser.close().catch(() => undefined);
    console.error('Error in /api/browser/run:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Browser run failed',
    });
  }
});

// Browser automation: capture a screenshot.
// Requires Firebase Authentication; same SSRF screening as /api/browser/run.
app.post('/api/browser/screenshot', requireFirebaseAuth, verifyAppCheck, async (req, res) => {
  const { url, fullPage } = req.body as { url?: string; fullPage?: boolean };
  if (!url) {
    return res.status(400).json({ error: 'URL is required.' });
  }

  let safeUrl: string;
  try {
    safeUrl = (await assertUrlSafe(url)).normalizedUrl;
  } catch (err) {
    return res
      .status(err instanceof SsrfError ? err.statusCode : 400)
      .json({ error: err instanceof Error ? err.message : 'URL rejected.' });
  }

  const isHostAllowed = createHostAllowCheck();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.route('**/*', async (route) => {
      try {
        const target = new URL(route.request().url());
        if (await isHostAllowed(target.hostname)) {
          await route.continue();
        } else {
          await route.abort('blockedbyclient');
        }
      } catch {
        await route.abort('blockedbyclient');
      }
    });
    const page = await context.newPage();
    await page.goto(safeUrl, { waitUntil: 'networkidle', timeout: 30000 });

    try {
      await assertUrlSafe(page.url());
    } catch (err) {
      await browser.close();
      return res
        .status(err instanceof SsrfError ? err.statusCode : 400)
        .json({ error: 'Navigation redirected to a restricted address.' });
    }
    const screenshot = await page.screenshot({ fullPage: Boolean(fullPage), type: 'png' });
    await browser.close();
    return res.json({
      ok: true,
      url: page.url(),
      image: screenshot.toString('base64'),
      mimeType: 'image/png',
      source: 'playwright',
    });
  } catch (error) {
    if (browser) await browser.close().catch(() => undefined);
    console.error('Error in /api/browser/screenshot:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Screenshot failed',
    });
  }
});

// Text-to-Speech Route using Gemini TTS (requires Firebase Authentication)
app.post('/api/gemini/tts', requireFirebaseAuth, verifyAppCheck, async (req, res) => {
  try {
    const { text, voiceName = 'Aoede' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for speech synthesis.' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({ audio: null, available: false, notice: 'Gemini API key not configured on server.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: text,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName || 'Aoede',
            },
          },
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return res.json({
          audio: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'audio/wav',
          available: true,
        });
      }
    }

    return res.status(500).json({ error: 'No audio part returned by Gemini TTS' });
  } catch (error) {
    console.error('Error in /api/gemini/tts:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'TTS generation error',
    });
  }
});

// SaaS connector diagnostic ping — SIMULATED (demo sandbox).
// This endpoint never contacts a live service. It exists so the UI can
// preview connector payload shapes during development. A simulated
// connector must never present as connected.
app.post('/api/connectors/ping', requireFirebaseAuth, (req, res) => {
  const { connectorId, authState, capabilities } = req.body;
  return res.json({
    status: '200_OK',
    protocol: 'mcp-jsonrpc-2.0',
    connector: connectorId || 'generic-saas',
    capabilities_available: Array.isArray(capabilities) ? capabilities : [],
    auth_state: authState || 'ANONYMOUS_SANDBOX',
    demo: true,
    simulated: true,
    connected: false,
    verified: false,
    note: 'Simulated connector ping. No live service was contacted and no connector is connected.',
    server_time: new Date().toISOString(),
  });
});

// SaaS connector action execution — SIMULATED (demo sandbox).
// Nothing is executed and no live service is contacted.
app.post('/api/connectors/execute', requireFirebaseAuth, (req, res) => {
  const { connectorId, action, params } = req.body;
  return res.json({
    status: 'simulated',
    connector: connectorId || 'generic-saas',
    action: action || 'sync',
    timestamp: new Date().toISOString(),
    demo: true,
    simulated: true,
    executed: false,
    result: {
      success: false,
      message: `Simulated preview of action '${action || 'sync'}' on ${connectorId}. No live service was contacted and nothing was executed.`,
      paramsEcho: params || {},
    },
  });
});

// Create HTTP server and integrate WebSocket for Gemini Live API
async function bootstrap() {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/api/gemini/live' });

  wss.on('connection', async (clientWs: WebSocket, req: http.IncomingMessage) => {
    // Live voice sessions require a Firebase ID token on the handshake:
    // wss://host/api/gemini/live?token=<idToken>
    const wsUrl = new URL(req.url || '/', 'http://localhost');
    const wsToken = wsUrl.searchParams.get('token');
    const backend = getAdminBackend();
    let wsAuthed = false;
    if (wsToken && backend?.auth) {
      try {
        await backend.auth.verifyIdToken(wsToken);
        wsAuthed = true;
      } catch {
        wsAuthed = false;
      }
    }
    if (!wsAuthed) {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ error: 'Authentication required for live voice sessions.' }));
      }
      clientWs.close(4401, 'unauthorized');
      return;
    }

    const ai = getGenAI();
    if (!ai) {
      clientWs.send(JSON.stringify({ error: 'Gemini API Key is not set on the server.' }));
      clientWs.close();
      return;
    }

    let liveSession: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null = null;

    try {
      liveSession = await ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
          },
          systemInstruction: ANCHOR_SYSTEM_INSTRUCTION,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (audio && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (text && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ text }));
            }
            if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
        },
      });

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'connected',
            model: 'gemini-3.1-flash-live-preview',
            voice: 'Aoede',
            status: 'ready',
          })
        );
      }

      clientWs.on('message', (rawData) => {
        try {
          const parsed = JSON.parse(rawData.toString()) as { audio?: string };
          if (parsed.audio && liveSession) {
            liveSession.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          }
        } catch (err) {
          console.error('Error processing live audio chunk:', err);
        }
      });

      clientWs.on('close', () => {
        try {
          if (liveSession && typeof liveSession.close === 'function') {
            liveSession.close();
          }
        } catch (err) {
          void err;
        }
      });
    } catch (err) {
      console.error('Failed to establish Gemini Live connection:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ error: err instanceof Error ? err.message : 'Live session failed' }));
        clientWs.close();
      }
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Carol Ann server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
});
