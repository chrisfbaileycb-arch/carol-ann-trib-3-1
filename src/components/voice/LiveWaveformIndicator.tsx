import React, { useEffect, useRef, useState } from 'react';
import { liveAudioEngine, type AudioMetrics, type LiveAudioState } from '@/lib/geminiLiveAudio';
import { Mic, MicOff, Volume2, Radio, Shield, Sparkles, Activity, X } from 'lucide-react';

export interface LiveWaveformIndicatorProps {
  mode?: 'compact' | 'inline' | 'expanded';
  barsCount?: number;
  className?: string;
  isLight?: boolean;
  voiceName?: string;
  onClose?: () => void;
}

export const LiveWaveformIndicator: React.FC<LiveWaveformIndicatorProps> = ({
  mode = 'inline',
  barsCount = 16,
  className = '',
  isLight = false,
  voiceName = 'Aoede',
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<LiveAudioState>(liveAudioEngine.getState());
  const [metrics, setMetrics] = useState<AudioMetrics>({
    rms: 0,
    decibels: -90,
    peak: 0,
    isSpeaking: false,
    frequencies: new Uint8Array(32),
    timeDomain: new Uint8Array(64),
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(liveAudioEngine.getErrorMessage());

  // Subscribe to live audio state and real-time audio metrics
  useEffect(() => {
    const unsubState = liveAudioEngine.subscribeState((nextState, err) => {
      setState(nextState);
      if (err) setErrorMessage(err);
    });

    const unsubMetrics = liveAudioEngine.subscribeMetrics((nextMetrics) => {
      setMetrics(nextMetrics);
    });

    return () => {
      unsubState();
      unsubMetrics();
    };
  }, []);

  // Real-time Canvas Waveform Rendering
  useEffect(() => {
    if (mode === 'compact') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const isModelSpeaking = state === 'speaking';
      const isListening = state === 'listening';
      const isConnected = state === 'listening' || state === 'speaking';

      if (!isConnected) {
        // Draw calm standby line
        ctx.beginPath();
        ctx.strokeStyle = isLight ? 'rgba(225, 29, 72, 0.25)' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        animId = requestAnimationFrame(render);
        return;
      }

      // Compute dynamic amplitude scaling based on live audio volume
      const timeData = metrics.timeDomain;
      const sliceWidth = width / (timeData.length - 1);
      const ampScale = isListening
        ? Math.min(2.5, 0.4 + metrics.rms * 5.0)
        : Math.min(2.2, 0.6 + metrics.rms * 4.0);

      // Create glowing gradient for waveform
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      if (isModelSpeaking) {
        // Model Voice: Purple to Indigo
        gradient.addColorStop(0, '#8B5FBF');
        gradient.addColorStop(0.5, '#A855F7');
        gradient.addColorStop(1, '#6366F1');
      } else if (metrics.isSpeaking) {
        // User actively speaking: Vivid Coral Pink / Magenta
        gradient.addColorStop(0, '#EC4899');
        gradient.addColorStop(0.5, '#F43F5E');
        gradient.addColorStop(1, '#FB7185');
      } else {
        // Ambient room noise / breathing: Soft Rose
        gradient.addColorStop(0, '#E8A0BF');
        gradient.addColorStop(0.5, '#D97706');
        gradient.addColorStop(1, '#8B5FBF');
      }

      // Draw primary glowing waveform
      ctx.beginPath();
      ctx.lineWidth = metrics.isSpeaking || isModelSpeaking ? 2.5 : 1.8;
      ctx.strokeStyle = gradient;
      ctx.shadowColor = isModelSpeaking ? '#A855F7' : '#F43F5E';
      ctx.shadowBlur = metrics.isSpeaking || isModelSpeaking ? 12 : 4;

      let x = 0;
      for (let i = 0; i < timeData.length; i++) {
        const v = (timeData[i] - 128) / 128;
        const y = height / 2 + v * (height * 0.42) * ampScale;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // Smooth curve
          const prevX = (i - 1) * sliceWidth;
          const prevV = (timeData[i - 1] - 128) / 128;
          const prevY = height / 2 + prevV * (height * 0.42) * ampScale;
          const cx = (prevX + x) / 2;
          const cy = (prevY + y) / 2;
          ctx.quadraticCurveTo(prevX, prevY, cx, cy);
        }
        x += sliceWidth;
      }
      ctx.stroke();

      // Secondary translucent shadow echo wave
      if (metrics.isSpeaking || isModelSpeaking) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = isModelSpeaking ? 'rgba(168, 85, 247, 0.35)' : 'rgba(244, 63, 94, 0.35)';
        ctx.shadowBlur = 0;
        x = 0;
        for (let i = 0; i < timeData.length; i++) {
          const v = (timeData[i] - 128) / 128;
          const y = height / 2 - v * (height * 0.3) * ampScale;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [mode, state, metrics, isLight]);

  // Extract selected frequency bins for bar visualizer
  const displayBars = React.useMemo(() => {
    const bars: number[] = [];
    const freq = metrics.frequencies;
    const len = freq.length;
    if (len === 0) {
      return Array(barsCount).fill(12);
    }
    const step = Math.max(1, Math.floor(len / barsCount));
    for (let i = 0; i < barsCount; i++) {
      const idx = Math.min(len - 1, i * step);
      const val = freq[idx] || 0;
      // Scale 0-255 to percentage height 10% to 100%
      const pct = Math.max(10, Math.min(100, Math.round((val / 255) * 100)));
      bars.push(pct);
    }
    return bars;
  }, [metrics.frequencies, barsCount]);

  // COMPACT MODE: Minimalist inline equalizer bars for buttons / headers
  if (mode === 'compact') {
    const isActive = state === 'listening' || state === 'speaking';
    return (
      <div className={`flex items-center gap-[2.5px] h-4 ${className}`} title="Gemini Live Voice Waveform">
        {displayBars.slice(0, 5).map((h, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full transition-all duration-75"
            style={{
              height: isActive ? `${Math.max(20, h)}%` : '20%',
              backgroundColor: state === 'speaking'
                ? '#8B5FBF'
                : metrics.isSpeaking
                ? '#F43F5E'
                : isActive
                ? '#E8A0BF'
                : isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.25)',
              boxShadow: (metrics.isSpeaking || state === 'speaking') ? '0 0 6px rgba(244,63,94,0.6)' : 'none',
            }}
          />
        ))}
      </div>
    );
  }

  // INLINE MODE: Rich horizontal waveform banner with live status
  if (mode === 'inline') {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border p-2.5 transition-all ${
          isLight
            ? 'border-rose-200/80 bg-rose-50/70 text-slate-800 shadow-xs'
            : 'border-white/12 bg-white/[0.04] text-white shadow-md'
        } ${className}`}
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between gap-2 mb-1.5 px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {state === 'listening' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  state === 'speaking'
                    ? 'bg-purple-500'
                    : state === 'listening'
                    ? 'bg-rose-500'
                    : state === 'connecting' || state === 'requesting_mic'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-zinc-500'
                }`}
              />
            </span>
            <span className="font-semibold tracking-wide text-[11px] uppercase">
              {state === 'speaking'
                ? `Gemini Live: Speaking (${voiceName})`
                : state === 'listening'
                ? metrics.isSpeaking
                  ? 'User Speaking...'
                  : 'Live Microphone Active'
                : state === 'connecting'
                ? 'Connecting Live Orchestrator...'
                : state === 'requesting_mic'
                ? 'Requesting Microphone Access...'
                : state === 'interrupted'
                ? 'Barge-In Interrupted'
                : 'Microphone Standby'}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] text-white/60 dark:text-white/60">
            {state === 'listening' && (
              <>
                <span className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
                  {metrics.decibels > -80 ? `${metrics.decibels} dB` : '-∞ dB'}
                </span>
                <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  16kHz PCM Live
                </span>
              </>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Oscillating Canvas Waveform */}
        <div className="relative h-10 w-full rounded-lg bg-black/10 dark:bg-black/30 overflow-hidden flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={480}
            height={40}
            className="h-full w-full block"
          />

          {/* Equalizer Frequency Bars Overlay on side */}
          <div className="absolute right-2 flex items-center gap-1 h-6 pointer-events-none">
            {displayBars.slice(0, 8).map((h, i) => (
              <span
                key={i}
                className="w-1 rounded-full transition-all duration-75"
                style={{
                  height: `${h}%`,
                  backgroundColor: state === 'speaking'
                    ? '#A855F7'
                    : metrics.isSpeaking
                    ? '#FB7185'
                    : '#E8A0BF',
                  opacity: metrics.isSpeaking || state === 'speaking' ? 0.9 : 0.4,
                }}
              />
            ))}
          </div>
        </div>

        {/* Error Notification if any */}
        {errorMessage && (
          <p className="mt-1.5 text-[10px] text-amber-400 font-medium px-1">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  // EXPANDED HUD MODE: Sovereign Live Voice Orchestrator Studio HUD
  return (
    <div
      className={`relative rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all ${
        isLight
          ? 'border-rose-300 bg-white/95 text-slate-900'
          : 'border-white/15 bg-zinc-950/95 text-white'
      } ${className}`}
    >
      {/* Header with Title and Status */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl m-gradient-bg shadow-md">
            <Radio className="h-4 w-4 text-white animate-pulse" />
          </div>
          <div>
            <h4 className="font-display text-sm font-bold tracking-tight">
              Gemini Live Voice Orchestrator
            </h4>
            <p className="text-[11px] text-white/60 dark:text-white/60">
              Low-latency 16kHz bidirectional streaming with barge-in support
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              state === 'speaking'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : state === 'listening'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                state === 'listening' ? 'bg-emerald-400 animate-ping' : 'bg-purple-400'
              }`}
            />
            {state === 'speaking'
              ? `Speaking (${voiceName})`
              : state === 'listening'
              ? 'Listening'
              : state}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg border border-white/10 p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Waveform View */}
      <div className="my-3 relative rounded-xl border border-white/10 bg-black/40 p-2 overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          width={600}
          height={72}
          className="h-20 w-full block"
        />

        {/* Live Decibel Gauge Overlay */}
        <div className="absolute top-2 left-3 flex items-center gap-2 text-[10px] font-mono text-white/70">
          <Activity className="h-3.5 w-3.5 text-rose-400" />
          <span>Input Level: {metrics.decibels > -85 ? `${metrics.decibels} dB` : '-∞ dB'}</span>
          <span className="text-white/30">|</span>
          <span>RMS: {metrics.rms.toFixed(3)}</span>
        </div>

        {/* Vocal Status Badge Overlay */}
        <div className="absolute bottom-2 right-3">
          <span
            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
              metrics.isSpeaking
                ? 'bg-rose-500 text-white shadow-md animate-pulse'
                : 'bg-white/10 text-white/50'
            }`}
          >
            {metrics.isSpeaking ? 'Voice Active' : 'Noise Gate Idle'}
          </span>
        </div>
      </div>

      {/* Frequency Spectrum Equalizer Bars */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-white/60 font-medium px-0.5">
          <span>Acoustic Frequency Spectrum</span>
          <span>64-band FFT Realtime Analysis</span>
        </div>
        <div className="flex items-end gap-1 h-12 rounded-lg bg-black/20 p-2">
          {displayBars.map((height, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end h-full">
              <div
                className="w-full rounded-t transition-all duration-75"
                style={{
                  height: `${height}%`,
                  backgroundColor:
                    state === 'speaking'
                      ? '#A855F7'
                      : metrics.isSpeaking
                      ? '#F43F5E'
                      : '#8B5FBF',
                  opacity: metrics.isSpeaking || state === 'speaking' ? 0.95 : 0.35,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => liveAudioEngine.handleInterruption()}
            disabled={state !== 'speaking'}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-amber-300 font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-500/20 transition"
          >
            <Shield className="h-3.5 w-3.5" />
            Interrupt Model
          </button>
        </div>

        <button
          onClick={() => liveAudioEngine.stop()}
          className="flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 py-1 text-rose-200 font-bold hover:bg-rose-500/30 transition"
        >
          <MicOff className="h-3.5 w-3.5" />
          Disconnect Voice
        </button>
      </div>
    </div>
  );
};

export default LiveWaveformIndicator;
