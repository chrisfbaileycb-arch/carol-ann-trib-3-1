import type { Express } from 'express';
import { Modality } from '@google/genai';
import { requireFirebaseAuth, verifyAppCheck } from '../middleware/auth.js';
import { getGenAI } from '../lib/inference.js';

export function registerTtsRoutes(app: Express) {
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
}
