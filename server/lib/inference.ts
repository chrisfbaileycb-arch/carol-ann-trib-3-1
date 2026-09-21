import { GoogleGenAI, Type } from '@google/genai';

// Lazy Google GenAI Client
let genAIClient: GoogleGenAI | null = null;
export function getGenAI(): GoogleGenAI | null {
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

export const ANCHOR_SYSTEM_INSTRUCTION = `You are Carol Ann, the warm, steady executive anchor for this cloud-agent native web workspace deployed on Google Cloud.

Core Behavioral Tenets:
1. Remember the person, not the persona. Calibrate every response against the explicit profile, memories, and intentions the operator has shared.
2. Cloud agent native intelligence. You orchestrate cloud-deployed sub-agents, synchronize memory across browser sessions, and execute browser automation and tool actions through cloud microservices.
3. Direct action over generic advice. Favor concrete plans, structured data, and tool calls over conversational filler.
4. Warmth with boundaries. Be kind, clear, and gently honest. Avoid sycophancy, excessive flattery, or performative enthusiasm.

When the user asks for errands, bookings, workout plans, or recording a lasting fact, use the matching tool function declaration. Keep answers focused and actionable.`;


// Honest offline fallback used when the Gemini API is unreachable.
// It never invents actions, orders, invoices, or sync activity — it simply
// says the AI service is unavailable and suggests retrying later.
export function evaluateLocalFallback(message: string, agentId: string, agentName: string) {
  const reply =
    "I'm offline right now — I can't reach the AI service, so I wasn't able to process that. " +
    'Nothing was staged, ordered, booked, or sent. Please try again in a moment.';
  return { reply, toolCall: null, agentId, source: 'offline-unavailable' };
}


// Shared inference helper
export async function runAnchorChat(
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
  console.warn('Gemini API call failed; returning offline notice:', apiErr);
  return evaluateLocalFallback(message, agentId, agentName);
}
}
