import type { Server as HttpServer, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { getAdminBackend } from '../lib/firebaseAdmin.js';
import { getGenAI, ANCHOR_SYSTEM_INSTRUCTION } from '../lib/inference.js';
import { GoogleGenAI, Modality, type LiveServerMessage } from '@google/genai';

export function attachLiveVoice(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/api/gemini/live' });

  wss.on('connection', async (clientWs: WebSocket, req: IncomingMessage) => {
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
}
