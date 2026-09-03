import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, Type, type LiveServerMessage } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

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
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    supabaseConfigured: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
  });
});

// Tool Definitions for Sovereign Executive OS Actions
const executiveTools = [
  {
    functionDeclarations: [
      {
        name: 'stage_grocery_errand',
        description: 'Stages an automated grocery order or shopping errand (e.g. Whole Foods, Erewhon, Trader Joes).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Order title, e.g. Weekly Organic Grocery Basket' },
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of specific items in the grocery order',
            },
            target_time: { type: Type.STRING, description: 'Delivery window or pickup timing' },
            notes: { type: Type.STRING, description: 'Delivery notes or instructions' },
          },
          required: ['title', 'items'],
        },
      },
      {
        name: 'stage_booking_appointment',
        description: 'Stages a salon, spa, wellness, or calendar booking appointment requiring user confirmation.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Appointment title, e.g. Cut, Color & Blowout' },
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Services or treatments requested' },
            target_time: { type: Type.STRING, description: 'Target date and time' },
            notes: { type: Type.STRING, description: 'Specialist, location, or travel buffer notes' },
          },
          required: ['title', 'items'],
        },
      },
      {
        name: 'update_workout_scratchpad',
        description: 'Programs or updates a strength, hypertrophy, cardio, or athletic training session.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Workout routine title, e.g. Upper/Lower Split — Week 3' },
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of exercises with sets, reps, and RPE cues',
            },
            target_time: { type: Type.STRING, description: 'Scheduled session time' },
            notes: { type: Type.STRING, description: 'Recovery metrics, HRV, or intensity guidelines' },
          },
          required: ['title', 'items'],
        },
      },
      {
        name: 'update_memory_ledger',
        description: 'Records a permanent personal fact, preference, habit, or relationship into local sovereign memory.',
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
              description: 'Searchable tags for indexing',
            },
          },
          required: ['category', 'content'],
        },
      },
    ],
  },
];

// Conversational Inference Route
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const {
      message,
      agentId = 'maggie-core',
      agentName = 'Maggie',
      agentRole = 'Sovereign Anchor & Executive Orchestrator',
      history = [],
      profile = {},
      memoryContext = '',
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const ai = getGenAI();

    // Fallback if no API key is set
    if (!ai) {
      const lower = message.toLowerCase();
      let replyContent = '';
      let toolCall: Record<string, unknown> | null = null;

      if (lower.includes('whole foods') || lower.includes('groceries') || lower.includes('cart') || lower.includes('order')) {
        toolCall = {
          id: `act_${Date.now()}`,
          category: 'errand',
          action_name: 'Whole Foods Automated Order',
          form_payload: {
            title: 'Weekly Organic Grocery Basket',
            items: ['Organic Pasture-Raised Eggs', 'Grass-Fed Ribeye', 'Baby Spinach', 'Almond Milk', 'Cold Brew Concentrate'],
            target_time: 'Tomorrow between 8:00 AM – 10:00 AM',
            notes: 'Leave at front entrance gate with access code',
          },
          requires_user_confirmation: true,
          status: 'pending_confirmation',
          timestamp: new Date().toISOString(),
        };
        replyContent = `I have staged your Whole Foods delivery cart locally based on your dietary preferences. Please review the items and authorize execution.`;
      } else if (lower.includes('salon') || lower.includes('hair') || lower.includes('nail') || lower.includes('book') || lower.includes('schedule')) {
        toolCall = {
          id: `act_${Date.now()}`,
          category: 'calendar_booking',
          action_name: 'Coco Executive Booking',
          form_payload: {
            title: 'Cut, Color & Blowout with Lead Stylist',
            items: ['Full Foil Balayage', 'Olaplex Treatment', 'Blowout & Style'],
            target_time: 'Saturday at 10:00 AM',
            notes: 'Requires 120-minute block with 15-minute travel buffer',
          },
          requires_user_confirmation: true,
          status: 'pending_confirmation',
          timestamp: new Date().toISOString(),
        };
        replyContent = `Coco has found an optimal opening on Saturday at 10:00 AM with a 15-minute buffer. I've staged the booking card for your confirmation.`;
      } else if (lower.includes('workout') || lower.includes('strength') || lower.includes('split') || lower.includes('gym') || lower.includes('deadlift')) {
        toolCall = {
          id: `act_${Date.now()}`,
          category: 'scratchpad_update',
          action_name: 'Ripp Hypertrophy Programming',
          form_payload: {
            title: 'Upper/Lower Split — Week 3 Hypertrophy',
            items: ['Barbell RDL: 4 sets x 8-10 reps @ RPE 8', 'Bulgarian Split Squats: 3 sets x 10 reps/leg', 'Weighted Hanging Leg Raises: 3 sets x 12 reps'],
            target_time: 'Today 5:30 PM',
            notes: 'Hydration check-in complete; HRV primed at 64ms.',
          },
          requires_user_confirmation: false,
          status: 'executed',
          timestamp: new Date().toISOString(),
        };
        replyContent = `Ripp here. Programmed your Week 3 progressive overload session into your live scratchpad. Intensity is set to RPE 8 with strict tempo on eccentric phases.`;
      } else {
        replyContent = `Understood. Magdalene has routed your request through ${agentName}. Local-first memory ledger is active on your sovereign device. How would you like to proceed?`;
      }

      return res.json({
        reply: replyContent,
        toolCall,
        agentId,
        source: 'local-fallback',
      });
    }

    const systemInstruction = `You are ${agentName}, ${agentRole} within the Magdalene Sovereign Executive Life OS.
Identity context:
- User Name: ${profile.name || 'Executive User'}
- User Focus: ${profile.identity || 'Autonomous high-performance lifestyle'}
- Wellness Goal: ${profile.wellnessGoal || 'Peak vitality, longevity, balanced energy'}
- Professional Focus: ${profile.professionalFocus || 'Executive strategy'}
- Sovereign Ledger Memories:
${memoryContext || 'None recorded yet.'}

Guidelines:
1. Speak directly, elegantly, with warm poise and high agency. Avoid sycophancy or generic filler.
2. If the user asks for errands (groceries, supplies), scheduling/salon appointments, workout programming, or recording a lasting fact, invoke the corresponding tool function declaration.
3. Keep answers focused and actionable.`;

    // Map conversation history
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents,
      config: {
        systemInstruction,
        tools: executiveTools,
      },
    });

    let reply = response.text || '';
    let toolCall: Record<string, unknown> | null = null;

    // Check for function calls
    const candidates = response.candidates || [];
    for (const c of candidates) {
      const parts = c.content?.parts || [];
      for (const p of parts) {
        if (p.functionCall) {
          const fc = p.functionCall;
          const args = (fc.args || {}) as Record<string, unknown>;
          if (fc.name === 'stage_grocery_errand') {
            toolCall = {
              id: `act_${Date.now()}`,
              category: 'errand',
              action_name: typeof args.title === 'string' ? args.title : 'Grocery Automated Order',
              form_payload: {
                title: typeof args.title === 'string' ? args.title : 'Grocery Order',
                items: Array.isArray(args.items) ? (args.items as string[]) : [],
                target_time: typeof args.target_time === 'string' ? args.target_time : 'Tomorrow morning',
                notes: typeof args.notes === 'string' ? args.notes : '',
              },
              requires_user_confirmation: true,
              status: 'pending_confirmation',
              timestamp: new Date().toISOString(),
            };
          } else if (fc.name === 'stage_booking_appointment') {
            toolCall = {
              id: `act_${Date.now()}`,
              category: 'calendar_booking',
              action_name: typeof args.title === 'string' ? args.title : 'Executive Booking',
              form_payload: {
                title: typeof args.title === 'string' ? args.title : 'Appointment Booking',
                items: Array.isArray(args.items) ? (args.items as string[]) : [],
                target_time: typeof args.target_time === 'string' ? args.target_time : 'Next opening',
                notes: typeof args.notes === 'string' ? args.notes : '',
              },
              requires_user_confirmation: true,
              status: 'pending_confirmation',
              timestamp: new Date().toISOString(),
            };
          } else if (fc.name === 'update_workout_scratchpad') {
            toolCall = {
              id: `act_${Date.now()}`,
              category: 'scratchpad_update',
              action_name: typeof args.title === 'string' ? args.title : 'Strength & Conditioning Programming',
              form_payload: {
                title: typeof args.title === 'string' ? args.title : 'Training Routine',
                items: Array.isArray(args.items) ? (args.items as string[]) : [],
                target_time: typeof args.target_time === 'string' ? args.target_time : 'Today',
                notes: typeof args.notes === 'string' ? args.notes : '',
              },
              requires_user_confirmation: false,
              status: 'executed',
              timestamp: new Date().toISOString(),
            };
          } else if (fc.name === 'update_memory_ledger') {
            toolCall = {
              id: `act_${Date.now()}`,
              category: 'profile_intake',
              action_name: 'Record Memory Ledger',
              form_payload: {
                title: `Memory: ${typeof args.category === 'string' ? args.category : 'general'}`,
                items: [typeof args.content === 'string' ? args.content : ''],
                notes: Array.isArray(args.tags) ? (args.tags as string[]).join(', ') : '',
              },
              requires_user_confirmation: false,
              status: 'executed',
              timestamp: new Date().toISOString(),
            };
          }
        }
      }
    }

    if (!reply && toolCall) {
      const payload = toolCall.form_payload as { title?: string } | undefined;
      reply = `I have staged the ${payload?.title || 'action'} for you.`;
    } else if (!reply) {
      reply = 'Processed and synchronized with your sovereign workspace.';
    }

    return res.json({
      reply,
      toolCall,
      agentId,
      source: 'gemini-3.7-flash',
    });
  } catch (error) {
    console.error('Error in /api/gemini/chat:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal inference error',
    });
  }
});

// Text-to-Speech Route using Gemini TTS
app.post('/api/gemini/tts', async (req, res) => {
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

// Create HTTP server and integrate WebSocket for Gemini Live API
async function bootstrap() {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/api/gemini/live' });

  wss.on('connection', async (clientWs: WebSocket) => {
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
          systemInstruction: 'You are Maggie, the sovereign companion for Magdalene OS. Speak warmly, concisely, and helpfully.',
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
        },
      });

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
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Magdalene OS Server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
});
