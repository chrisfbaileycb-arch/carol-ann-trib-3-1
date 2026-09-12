import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Activity } from 'lucide-react';
import { voiceByName, type GeminiVoiceOption } from '@/data/agents';
import { liveAudioEngine, type LiveAudioState, type AudioMetrics } from '@/lib/geminiLiveAudio';
import LiveWaveformIndicator from '@/components/voice/LiveWaveformIndicator';

interface VoiceOrbProps {
  onTranscript: (text: string) => void;
  voiceName?: string;
  isSpeaking?: boolean;
  disabled?: boolean;
  isLight?: boolean;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  onTranscript,
  voiceName = 'Aoede',
  isSpeaking = false,
  disabled = false,
  isLight = false,
}) => {
  const [engineState, setEngineState] = useState<LiveAudioState>(liveAudioEngine.getState());
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [showExpandedWave, setShowExpandedWave] = useState(false);
  const recogRef = useRef<SpeechRecognitionInstance | null>(null);

  const voiceMeta: GeminiVoiceOption = voiceByName(voiceName);
  const isLive = engineState === 'listening' || engineState === 'speaking' || engineState === 'connecting' || engineState === 'requesting_mic';

  // Synchronize state from liveAudioEngine
  useEffect(() => {
    const unsubState = liveAudioEngine.subscribeState((state, err) => {
      setEngineState(state);
      if (err) {
        setErrorNotice(err);
        setTimeout(() => setErrorNotice(null), 4500);
      }
    });

    const unsubTranscript = liveAudioEngine.subscribeTranscript((text) => {
      if (text) {
        onTranscript(text);
      }
    });

    return () => {
      unsubState();
      unsubTranscript();
    };
  }, [onTranscript]);

  const toggleListening = async () => {
    if (disabled) return;

    if (isLive) {
      // Stop session
      liveAudioEngine.stop();
      if (recogRef.current) {
        try { recogRef.current.stop(); } catch { /* ignore */ }
      }
      setShowExpandedWave(false);
      return;
    }

    try {
      // Start Gemini Live voice orchestrator with real mic stream
      await liveAudioEngine.start({ voiceName: voiceMeta.name });

      // Start companion SpeechRecognition to transcribe user voice to input
      const win = window as WindowWithSpeech;
      const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SR) {
        try {
          const r = new SR();
          recogRef.current = r;
          r.continuous = true;
          r.interimResults = true;
          r.lang = 'en-US';

          r.onresult = (ev) => {
            const results = ev.results;
            const latest = results[results.length - 1];
            if (latest && latest[0]) {
              onTranscript(latest[0].transcript);
            }
          };

          r.onend = () => {
            // Restart if engine is still active
            if (liveAudioEngine.getState() === 'listening') {
              try { r.start(); } catch { /* ignore */ }
            }
          };

          r.onerror = () => {
            // Continue with liveAudioEngine even if webkitSpeech errors
          };

          r.start();
        } catch {
          // Browser speech recognition fallback gracefully ignored
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize voice';
      setErrorNotice(msg);
      setTimeout(() => setErrorNotice(null), 4000);
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Real-Time Acoustic Waveform Reactive Indicator */}
      {isLive && (
        <button
          type="button"
          role="button"
          onClick={() => setShowExpandedWave(!showExpandedWave)}
          aria-expanded={showExpandedWave}
          aria-label="Toggle expanded real-time acoustic waveform visualizer"
          className="cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded-full border border-[var(--m-accent-soft)]/40 bg-[var(--m-accent-soft)]/10 hover:bg-[var(--m-accent-soft)]/20 transition-all outline-none focus:ring-2 focus:ring-[var(--m-accent-soft)]/50"
          title="Click to toggle expanded waveform studio"
        >
          <LiveWaveformIndicator mode="compact" voiceName={voiceMeta.name} isLight={isLight} />
          <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--m-accent-soft)]">
            {engineState === 'speaking' ? 'Aoede' : 'Live Wave'}
          </span>
        </button>
      )}

      {/* Main Voice Toggle Orb Button */}
      <button
        id="btn-voice-orb-orchestrator"
        type="button"
        role="button"
        onClick={toggleListening}
        disabled={disabled}
        aria-pressed={isLive}
        aria-label={
          isLive
            ? 'Disconnect Gemini Live voice session'
            : isSpeaking
            ? `Speaking as ${voiceMeta.name}`
            : `Talk to Gemini Live Voice Orchestrator (${voiceMeta.name})`
        }
        title={
          isLive
            ? 'Gemini Live Voice Active · Click to disconnect'
            : isSpeaking
            ? `Speaking as ${voiceMeta.name}`
            : `Talk to Gemini Live Voice Orchestrator (${voiceMeta.name})`
        }
        className={`group relative flex h-8 w-8 items-center justify-center rounded-full transition-all outline-none focus:ring-2 focus:ring-[var(--m-accent-soft)]/60 ${
          isLive
            ? 'border-2 border-[var(--m-accent-soft)] bg-[var(--m-accent-soft)]/25 text-white shadow-[0_0_16px_rgba(232,160,191,0.65)]'
            : isSpeaking
            ? 'border border-[var(--m-accent)] bg-[var(--m-accent)]/30 text-white animate-pulse'
            : 'border border-white/12 bg-white/[0.04] text-white/60 hover:border-white/30 hover:bg-white/10 hover:text-white'
        }`}
      >
        {isLive ? (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-[var(--m-accent-soft)]/25" />
            <Mic className="h-3.5 w-3.5 text-pink-200" />
          </>
        ) : isSpeaking ? (
          <Volume2 className="h-3.5 w-3.5 text-[var(--m-accent-soft)]" />
        ) : (
          <Mic className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Popover Expanded Real-Time Audio Waveform HUD */}
      {showExpandedWave && isLive && (
        <div className="absolute bottom-11 right-0 z-50 w-80 sm:w-96 shadow-2xl">
          <LiveWaveformIndicator
            mode="expanded"
            voiceName={voiceMeta.name}
            isLight={isLight}
            onClose={() => setShowExpandedWave(false)}
          />
        </div>
      )}

      {errorNotice && (
        <div className="absolute -top-9 right-0 z-50 rounded-lg border border-amber-400/30 bg-[#1e1a14] px-2.5 py-1 text-[10px] text-amber-200 shadow-xl whitespace-nowrap">
          {errorNotice}
        </div>
      )}
    </div>
  );
};

export default VoiceOrb;
