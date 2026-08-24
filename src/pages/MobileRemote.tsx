import React, { useEffect, useRef, useState } from 'react';
import {
  Mic, MicOff, Camera, X, Monitor, Zap, ClipboardCheck, ShoppingBag, Dumbbell,
  ChevronUp, Send, Radio, Check, Trash2, LogIn, ShieldCheck, Bot,
} from 'lucide-react';
import { useMaggie } from '@/contexts/MaggieContext';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/auth/AuthModal';
import { publishBus, subscribeBus, isCloudBusLive, pullBusNow } from '@/lib/realtimeBus';
import SavedShortcuts from '@/components/shortcuts/SavedShortcuts';
import MobileAgentDock from '@/components/agents/MobileAgentDock';
import CopilotChat from '@/components/command/CopilotChat';
import { subscribeCopilot, pendingStep, getActiveTask } from '@/lib/copilotSession';

import { CHAIN_LIST, parseIntent } from '@/lib/browserAgent';
import { uid } from '@/lib/memoryStore';


interface QueueItem { id: string; text: string; state: 'queued' | 'sent'; }

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: { transcript: string };
      isFinal?: boolean;
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
}

export const MobileRemote: React.FC<{ onBackToDesktop: () => void }> = ({ onBackToDesktop }) => {
  const { profile, theme, addMessage, addCheckIn } = useMaggie();
  const { user } = useAuth();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [camError, setCamError] = useState('');
  const [captured, setCaptured] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recogRef = useRef<SpeechRecognitionInstance | null>(null);

  const [relayLive, setRelayLive] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);

  useEffect(() => subscribeBus(() => undefined), []);
  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  // Watch the shared co-pilot session so a permission asked for on the desktop
  // (or by a scheduled run) surfaces here as a badge on the phone.
  useEffect(
    () =>
      subscribeCopilot(() => {
        setNeedsPermission(!!pendingStep(getActiveTask()));
      }),
    [],
  );

  // Cross-device relay heartbeat: poll bus_events so a phone on another network stays in sync.
  useEffect(() => {
    if (!user) { setRelayLive(false); return; }
    void pullBusNow();
    const t = window.setInterval(() => setRelayLive(isCloudBusLive()), 2500);
    return () => window.clearInterval(t);
  }, [user]);



  const flash = (m: string) => { setToast(m); window.setTimeout(() => setToast(''), 2200); };


  const dispatch = (text: string) => {
    if (!text.trim()) return;
    const item: QueueItem = { id: uid('q'), text: text.trim(), state: 'sent' };
    setQueue((q) => [item, ...q].slice(0, 20));
    publishBus('command', { text: text.trim(), domain: parseIntent(text) ? 'errands' : 'core' }, 'mobile');
    addMessage({ domain: parseIntent(text) ? 'errands' : 'core', role: 'user', content: text.trim(), source: 'mobile' });
    setTranscript('');
    flash('Injected into desktop workspace');
  };

  const toggleVoice = () => {
    const win = window as WindowWithSpeech;
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) { flash('Voice not supported in this browser'); return; }
    if (listening) { recogRef.current?.stop(); setListening(false); return; }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    r.onresult = (ev) => {
      let text = '';
      for (let i = ev.resultIndex; i < ev.results.length; i += 1) text += ev.results[i][0].transcript;
      setTranscript(text);
      if (ev.results[ev.results.length - 1].isFinal) {
        publishBus('voice', { text: text.trim() }, 'mobile');
      }
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    r.start();
    setListening(true);
  };

  const openCamera = async () => {
    setSheetOpen(true);
    setCaptured(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setCamError('');
    } catch {
      setCamError('Camera unavailable. Grant permission in your browser settings.');
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setSheetOpen(false);
  };

  const capture = () => {
    const v = videoRef.current; const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth || 720; c.height = v.videoHeight || 960;
    c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height);
    const url = c.toDataURL('image/jpeg', 0.6);
    setCaptured(url);
    publishBus('vision', { label: 'Photo captured on phone — parsing for tasks', size: url.length }, 'mobile');
    flash('Frame sent to desktop agent queue');
  };

  const quickActions = [
    { label: 'Log check-in', icon: ClipboardCheck, run: () => { addCheckIn({ type: 'wellness', label: 'Quick check-in', notes: 'Logged from the phone remote.' }); publishBus('checkin', { type: 'wellness', label: 'Quick check-in' }, 'mobile'); flash('Check-in recorded'); } },
    { label: 'Start gym coach', icon: Dumbbell, run: () => { publishBus('coach', { action: 'start' }, 'mobile'); flash('Gym coach opening on desktop'); } },
    { label: 'Run errand', icon: ShoppingBag, run: () => dispatch('Order Whole Foods delivery') },
    { label: 'Voice memo', icon: Mic, run: toggleVoice },
  ];

  return (
    <div
      className="maggie-root relative flex min-h-screen flex-col text-white"
      style={{
        backgroundColor: theme.surface,
        backgroundImage: theme.texture,
        '--m-accent': profile.accentColor || theme.accent,
        '--m-accent-soft': theme.accentSoft,
      } as React.CSSProperties}
    >

      {/* Header */}
      <header className="flex items-center justify-between px-5 pb-3 pt-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">Phone remote</p>
          <h1 className="font-display text-2xl font-semibold">{profile.name ? `${profile.name}'s remote` : 'Maggie remote'}</h1>
        </div>
        <button
          onClick={onBackToDesktop}
          className="flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-2 text-[11px] text-white/60"
        >
          <Monitor className="h-3.5 w-3.5" /> Desktop
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2 px-5">
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/8 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Paired to canvas
        </span>
        <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] ${relayLive ? 'border-sky-400/30 bg-sky-400/10 text-sky-300' : 'border-white/12 text-white/45'}`}>
          <Radio className="h-3 w-3" /> {relayLive ? 'Cross-device relay live' : user ? 'Relay connecting…' : 'Local channel'}
        </span>

        {user ? (
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/8 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
            <ShieldCheck className="h-3 w-3" /> {user.email?.split('@')[0] ?? 'Account'}
          </span>
        ) : (
          <button
            onClick={() => setAuthOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-[var(--m-accent)]/45 bg-[var(--m-accent)]/12 px-2.5 py-1 text-[10px] font-semibold text-white"
          >
            <LogIn className="h-3 w-3" /> Sign in
          </button>
        )}
      </div>


      {/* Live transcript */}
      <div className="mt-4 flex-1 px-5">
        <div className="min-h-[140px] rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">Live voice copilot</p>
          <p className={`mt-2 text-sm leading-relaxed ${transcript ? 'text-white/85' : 'text-white/25'}`}>
            {transcript || 'Hold the orb and talk. Everything you say streams to the desktop rail in real time.'}
          </p>
          {listening && (
            <div className="mt-3 flex h-6 items-end gap-1">
              {Array.from({ length: 14 }).map((_, i) => (
                <span key={i} className="m-wave-bar w-1 rounded-full bg-[var(--m-accent-soft)]" style={{ height: '100%', animationDelay: `${i * 0.07}s` }} />
              ))}
            </div>
          )}
        </div>

        {/* Command composer */}
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/12 bg-black/25 px-3 py-2">
          <input
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && dispatch(transcript)}
            placeholder="Type a command to inject…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
          />
          <button onClick={() => dispatch(transcript)} className="grid h-9 w-9 place-items-center rounded-xl m-gradient-bg">
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Quick actions */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={a.run}
              className="m-lift flex flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl m-gradient-bg">
                <a.icon className="h-4 w-4 text-white" />
              </span>
              <span className="text-[13px] font-semibold text-white">{a.label}</span>
            </button>
          ))}
        </div>

        {/* Agent roster — same little agents as the desktop studio */}
        <MobileAgentDock className="mt-5" onHandOff={() => setCopilotOpen(true)} />


        {/* Saved one-tap shortcuts (synced from Remote activity) */}
        <SavedShortcuts
          className="mt-5"
          variant="pills"
          title="Saved shortcuts"
          onDispatch={(c) => dispatch(c.text)}
        />


        {/* Chain shortcuts */}
        <p className="mt-5 text-[10px] uppercase tracking-[0.18em] text-white/30">Dispatch to cloud runner</p>
        <div className="mt-2 flex flex-wrap gap-2 pb-40">
          {CHAIN_LIST.map((c) => (
            <button
              key={c.key}
              onClick={() => dispatch(c.title)}
              className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-2 text-[11px] text-white/60"
            >
              <Zap className="mr-1 inline h-3 w-3" /> {c.title}
            </button>
          ))}
        </div>

      </div>

      {/* Command queue drawer */}
      <div className={`fixed inset-x-0 bottom-0 z-30 transition-transform duration-300 ${drawerOpen ? 'translate-y-0' : 'translate-y-[calc(100%-3rem)]'}`}>
        <div className="rounded-t-3xl border-t border-white/12 bg-[#15161C]/95 backdrop-blur">
          <button onClick={() => setDrawerOpen((v) => !v)} className="flex w-full items-center justify-between px-5 py-3">
            <span className="text-xs font-semibold text-white/70">Command queue · {queue.length}</span>
            <ChevronUp className={`h-4 w-4 text-white/40 transition ${drawerOpen ? 'rotate-180' : ''}`} />
          </button>
          <div className="m-scroll max-h-64 space-y-2 overflow-y-auto px-5 pb-28">
            {queue.length === 0 && <p className="text-[11px] text-white/25">Nothing queued yet.</p>}
            {queue.map((q) => (
              <div key={q.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span className="flex-1 truncate text-[12px] text-white/70">{q.text}</span>
                <button onClick={() => setQueue((list) => list.filter((x) => x.id !== q.id))} className="text-white/25">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Thumb-zone orb */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex items-end justify-center gap-6 px-8">
        <button
          onClick={() => void openCamera()}
          className="pointer-events-auto grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-[#1D1E28]/90 backdrop-blur"
        >
          <Camera className="h-5 w-5 text-white/70" />
        </button>
        <button
          onClick={toggleVoice}
          className={`pointer-events-auto relative grid h-20 w-20 place-items-center rounded-full m-gradient-bg shadow-2xl ${listening ? 'm-pulse-ring' : ''}`}
        >
          {listening ? <MicOff className="h-7 w-7 text-white" /> : <Mic className="h-7 w-7 text-white" />}
        </button>
        <button
          onClick={() => setCopilotOpen(true)}
          className="pointer-events-auto relative grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-[#1D1E28]/90 backdrop-blur"
          title="Browser co-pilot"
        >
          <Bot className="h-5 w-5 text-white/70" />
          {needsPermission && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-[var(--m-accent)] text-[10px] font-bold text-white">
              !
            </span>
          )}
        </button>
      </div>

      {/* Browser co-pilot sheet — the same thread the desktop rail shows */}
      {copilotOpen && (
        <div className="fixed inset-0 z-[75] flex flex-col bg-[#101118]">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Browser co-pilot</p>
              <p className="text-[13px] font-semibold text-white">Booking runs here — step by step</p>
            </div>
            <button onClick={() => setCopilotOpen(false)} className="rounded-full border border-white/15 p-2 text-white/60">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <CopilotChat surface="mobile" />
          </div>
        </div>
      )}


      {/* Camera sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm font-semibold text-white">Vision ingestion</p>
            <button onClick={closeCamera} className="rounded-full border border-white/15 p-2 text-white/60">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="relative flex-1 overflow-hidden">
            {captured ? (
              <img src={captured} alt="Captured frame" className="h-full w-full object-contain" />
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            )}
            {camError && <p className="absolute inset-x-6 top-1/2 text-center text-sm text-rose-300">{camError}</p>}
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex items-center justify-center gap-6 py-8">
            {captured ? (
              <>
                <button onClick={() => setCaptured(null)} className="rounded-full border border-white/20 px-5 py-3 text-xs text-white/70">Retake</button>
                <button onClick={closeCamera} className="rounded-full m-gradient-bg px-6 py-3 text-xs font-semibold text-white">Send to queue</button>
              </>
            ) : (
              <button onClick={capture} className="h-[72px] w-[72px] rounded-full border-4 border-white/80 p-1">

                <span className="block h-14 w-14 rounded-full bg-white" />
              </button>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed inset-x-8 top-6 z-[60] rounded-xl border border-white/15 bg-[#1D1E28]/95 px-4 py-3 text-center text-xs text-white/85 backdrop-blur">
          {toast}
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default MobileRemote;
