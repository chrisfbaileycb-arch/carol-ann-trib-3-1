import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { voiceByName, type GeminiVoiceOption } from '@/data/agents';

interface VoiceOrbProps {
  onTranscript: (text: string) => void;
  voiceName?: string;
  isSpeaking?: boolean;
  disabled?: boolean;
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
}) => {
  const [listening, setListening] = useState(false);
  const [soundBars, setSoundBars] = useState<number[]>([18, 35, 60, 42, 20]);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const recogRef = useRef<SpeechRecognitionInstance | null>(null);
  const animRef = useRef<number | null>(null);

  const voiceMeta: GeminiVoiceOption = voiceByName(voiceName);

  // Soundwave animation simulation for active listening / speaking
  useEffect(() => {
    if (listening || isSpeaking) {
      const updateWave = () => {
        setSoundBars([
          Math.floor(15 + Math.random() * 55),
          Math.floor(25 + Math.random() * 65),
          Math.floor(40 + Math.random() * 60),
          Math.floor(30 + Math.random() * 60),
          Math.floor(15 + Math.random() * 50),
        ]);
        animRef.current = window.setTimeout(updateWave, 110);
      };
      updateWave();
    } else {
      setSoundBars([16, 28, 45, 28, 16]);
      if (animRef.current) clearTimeout(animRef.current);
    }
    return () => {
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, [listening, isSpeaking]);

  const toggleListening = () => {
    if (disabled) return;
    const win = window as WindowWithSpeech;
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SR) {
      setErrorNotice('Voice capture not supported in this browser.');
      setTimeout(() => setErrorNotice(null), 3000);
      return;
    }

    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }

    try {
      const r = new SR();
      recogRef.current = r;
      r.continuous = false;
      r.interimResults = true;
      r.lang = 'en-US';

      r.onresult = (ev) => {
        const transcript = ev.results[0][0].transcript;
        if (transcript) {
          onTranscript(transcript);
        }
      };

      r.onend = () => {
        setListening(false);
      };

      r.onerror = () => {
        setListening(false);
      };

      r.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  return (
    <div className="relative flex items-center gap-1.5">
      {/* Soundwave Bars / Breathing Pulse Visualizer */}
      {(listening || isSpeaking) && (
        <div className="flex h-6 items-center gap-0.5 px-1.5 transition-all">
          {soundBars.map((height, idx) => (
            <span
              key={idx}
              className="w-0.5 rounded-full transition-all duration-100"
              style={{
                height: `${height}%`,
                backgroundColor: listening ? '#E8A0BF' : '#8B5FBF',
              }}
            />
          ))}
        </div>
      )}

      {/* Inline Voice Orb Button */}
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        title={
          listening
            ? 'Listening... Click to stop'
            : isSpeaking
            ? `Speaking as ${voiceMeta.name}`
            : `Voice Input (Gemini Live: ${voiceMeta.name})`
        }
        className={`group relative flex h-8 w-8 items-center justify-center rounded-full transition-all ${
          listening
            ? 'border-2 border-[var(--m-accent-soft)] bg-[var(--m-accent-soft)]/25 text-white shadow-[0_0_15px_rgba(232,160,191,0.6)]'
            : isSpeaking
            ? 'border border-[var(--m-accent)] bg-[var(--m-accent)]/30 text-white animate-pulse'
            : 'border border-white/12 bg-white/[0.04] text-white/60 hover:border-white/30 hover:bg-white/10 hover:text-white'
        }`}
      >
        {listening ? (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-[var(--m-accent-soft)]/20" />
            <Mic className="h-3.5 w-3.5 text-pink-200" />
          </>
        ) : isSpeaking ? (
          <Volume2 className="h-3.5 w-3.5 text-[var(--m-accent-soft)]" />
        ) : (
          <Mic className="h-3.5 w-3.5" />
        )}
      </button>

      {errorNotice && (
        <div className="absolute -top-9 right-0 z-50 rounded-lg border border-amber-400/30 bg-[#1e1a14] px-2.5 py-1 text-[10px] text-amber-200 shadow-xl whitespace-nowrap">
          {errorNotice}
        </div>
      )}
    </div>
  );
};

export default VoiceOrb;
