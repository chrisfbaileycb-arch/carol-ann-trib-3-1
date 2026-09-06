import React, { useEffect, useRef, useState } from 'react';
import {
  Mic, MicOff, Camera, X, Monitor, Zap, ClipboardCheck, ShoppingBag, Dumbbell,
  ChevronUp, Send, Radio, Check, Trash2, LogIn, ShieldCheck, Bot,
} from 'lucide-react';
import { useCarol } from '@/contexts/CarolContext';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/auth/AuthModal';
import { publishBus, subscribeBus, isCloudBusLive, pullBusNow } from '@/lib/realtimeBus';
import SavedShortcuts from '@/components/shortcuts/SavedShortcuts';
import MobileAgentDock from '@/components/agents/MobileAgentDock';
import CopilotChat from '@/components/command/CopilotChat';
import BrowserCopilotSpotlight from '@/components/command/BrowserCopilotSpotlight';
import { subscribeCopilot, pendingStep, getActiveTask } from '@/lib/copilotSession';

import { CHAIN_LIST, parseIntent } from '@/lib/browserAgent';
import { uid } from '@/lib/memoryStore';
import WallpaperBackground from '@/components/workspace/WallpaperBackground';
import { SaaSConnectorsDirectory } from '@/components/connectors/SaaSConnectorsDirectory';
import { loadConnectedSaasIds } from '@/data/saasConnectors';
import { isLightTheme, FONT_OPTIONS } from '@/data/intake';


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
  const { profile, theme, addMessage, addCheckIn } = useCarol();
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
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [connectedSaasCount, setConnectedSaasCount] = useState(() => loadConnectedSaasIds().length);

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

  const isLight = isLightTheme(profile);
  const currentFont = FONT_OPTIONS.find((f) => f.id === profile.fontFamily) || FONT_OPTIONS[0];

  const quickActions = [
    { label: 'Connectors (170+)', icon: ShieldCheck, run: () => setConnectorsOpen(true) },
    { label: 'Log check-in', icon: ClipboardCheck, run: () => { addCheckIn({ type: 'wellness', label: 'Quick check-in', notes: 'Logged from the phone remote.' }); publishBus('checkin', { type: 'wellness', label: 'Quick check-in' }, 'mobile'); flash('Check-in recorded'); } },
    { label: 'Start gym coach', icon: Dumbbell, run: () => { publishBus('coach', { action: 'start' }, 'mobile'); flash('Gym coach opening on desktop'); } },
    { label: 'Run errand', icon: ShoppingBag, run: () => dispatch('Order Whole Foods delivery') },
    { label: 'Voice memo', icon: Mic, run: toggleVoice },
  ];

  return (
    <div
      className={`carol-ann-root ${isLight ? 'is-light text-slate-900' : 'text-white'} relative flex min-h-screen flex-col bg-transparent antialiased transition-colors duration-300`}
      style={{
        '--m-accent': profile.accentColor || theme.accent,
        '--m-accent-soft': theme.accentSoft,
        '--font-display': currentFont.displayFont,
        '--font-body': currentFont.bodyFont,
        fontFamily: currentFont.bodyFont,
      } as React.CSSProperties}
    >
      {/* Shared Wallpaper Atmospheric Background */}
      <WallpaperBackground profile={profile} />

      {/* Header */}
      <header className="flex items-center justify-between px-5 pb-2 pt-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-[0.2em] uppercase border shadow-sm ${
              isLight
                ? 'border-[var(--m-accent)]/40 bg-[var(--m-accent)]/15 text-[var(--m-accent)]'
                : 'border-[var(--m-accent)]/60 bg-[var(--m-accent)]/25 text-white'
            }`}>
              <span className="h-2 w-2 rounded-full bg-[var(--m-accent)] animate-pulse" />
              Carol Ann OS
            </span>
            <span className={`text-[11px] font-bold ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
              Phone Edition
            </span>
          </div>
          <h1 className={`font-display text-2xl font-black tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
            {profile.name ? `${profile.name} · Carol Ann OS` : 'Carol Ann OS Mobile'}
          </h1>
        </div>
        <button
          onClick={onBackToDesktop}
          className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold shadow-sm transition ${
            isLight
              ? 'border-slate-300/90 bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-950'
              : 'border-white/20 bg-white/[0.08] text-white/90 hover:bg-white/15 hover:text-white'
          }`}
        >
          <Monitor className="h-3.5 w-3.5" /> Desktop
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2 px-5">
        <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold shadow-sm ${
          isLight ? 'border-emerald-600/40 bg-emerald-50 text-emerald-900' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
        }`}>
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Paired to canvas
        </span>
        <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
          relayLive
            ? (isLight ? 'border-sky-600/40 bg-sky-50 text-sky-900' : 'border-sky-400/30 bg-sky-400/10 text-sky-300')
            : (isLight ? 'border-slate-300/80 bg-white/90 text-slate-700' : 'border-white/20 text-white/80')
        }`}>
          <Radio className="h-3.5 w-3.5" /> {relayLive ? 'Cross-device relay live' : user ? 'Relay connecting…' : 'Local channel'}
        </span>

        {user ? (
          <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold shadow-sm ${
            isLight ? 'border-violet-600/40 bg-violet-50 text-violet-900' : 'border-violet-400/30 bg-violet-400/10 text-violet-200'
          }`}>
            <ShieldCheck className="h-3.5 w-3.5" /> {user.email?.split('@')[0] ?? 'Account'}
          </span>
        ) : (
          <button
            onClick={() => setAuthOpen(true)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition shadow-sm ${
              isLight
                ? 'border-[var(--m-accent)]/50 bg-white text-slate-900 hover:bg-[var(--m-accent)]/10'
                : 'border-[var(--m-accent)]/50 bg-[var(--m-accent)]/20 text-white hover:bg-[var(--m-accent)]/30'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" /> Sign in
          </button>
        )}

        <button
          onClick={() => setConnectorsOpen(true)}
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition shadow-sm ${
            isLight
              ? 'border-indigo-600/40 bg-indigo-50 text-indigo-900 hover:bg-indigo-100'
              : 'border-indigo-400/30 bg-indigo-400/10 text-indigo-300 hover:bg-indigo-400/20'
          }`}
        >
          <Zap className="h-3.5 w-3.5 text-indigo-500" />
          <span>170+ Connectors</span>
          <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.2 text-[9px] font-mono">
            {connectedSaasCount}
          </span>
        </button>
      </div>

      {/* Live transcript */}
      <div className="mt-4 flex-1 px-5">
        <div className={`min-h-[140px] rounded-2xl border p-4 shadow-sm backdrop-blur-md transition ${
          isLight ? 'border-slate-200/90 bg-white/95 text-slate-900' : 'border-white/15 bg-black/45 text-white'
        }`}>
          <p className={`text-[11px] uppercase tracking-[0.18em] font-bold ${isLight ? 'text-slate-600' : 'text-white/70'}`}>Live voice copilot</p>
          <p className={`mt-2 text-sm leading-relaxed font-medium ${
            transcript
              ? (isLight ? 'text-slate-950 font-semibold' : 'text-white font-medium')
              : (isLight ? 'text-slate-600' : 'text-white/70')
          }`}>
            {transcript || 'Hold the orb and talk. Everything you say streams to the desktop rail in real time.'}
          </p>
          {listening && (
            <div className="mt-3 flex h-6 items-end gap-1">
              {Array.from({ length: 14 }).map((_, i) => (
                <span key={i} className="m-wave-bar w-1 rounded-full bg-[var(--m-accent)]" style={{ height: '100%', animationDelay: `${i * 0.07}s` }} />
              ))}
            </div>
          )}
        </div>

        {/* Command composer */}
        <div className={`mt-3 flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 shadow-sm transition ${
          isLight ? 'border-slate-300 bg-white/95 focus-within:border-[var(--m-accent)] focus-within:ring-2 focus-within:ring-[var(--m-accent)]/20' : 'border-white/20 bg-black/45 focus-within:border-[var(--m-accent)]/70'
        }`}>
          <input
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && dispatch(transcript)}
            placeholder="Type a command to inject…"
            className={`flex-1 bg-transparent text-sm font-medium outline-none ${
              isLight ? 'text-slate-950 placeholder:text-slate-500' : 'text-white placeholder:text-white/50'
            }`}
          />
          <button onClick={() => dispatch(transcript)} className="grid h-9 w-9 place-items-center rounded-xl m-gradient-bg shadow-sm text-white hover:brightness-110 active:scale-95 transition">
            <Send className="h-4 w-4" />
          </button>
        </div>

        {/* Lit-up Browser Agent Co-pilot Spotlight */}
        <BrowserCopilotSpotlight
          className="mt-4"
          isLight={isLight}
          onOpenFullSheet={() => setCopilotOpen(true)}
        />

        {/* Quick actions */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={a.run}
              className={`m-lift flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-left transition shadow-sm ${
                isLight
                  ? 'border-slate-200/90 bg-white/95 hover:bg-white hover:shadow-md hover:border-[var(--m-accent)]/50'
                  : 'border-white/15 bg-zinc-900/75 hover:bg-zinc-800/90 shadow-sm'
              }`}
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl m-gradient-bg shadow-sm text-white">
                <a.icon className="h-4 w-4" />
              </span>
              <span className={`text-[14px] font-bold tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Agent roster — same little agents as the desktop studio */}
        <MobileAgentDock className="mt-5" onHandOff={() => setCopilotOpen(true)} isLight={isLight} />

        {/* Saved one-tap shortcuts (synced from Remote activity) */}
        <SavedShortcuts
          className="mt-5"
          variant="pills"
          title="Saved shortcuts"
          onDispatch={(c) => dispatch(c.text)}
          isLight={isLight}
        />

        {/* Chain shortcuts */}
        <p className={`mt-5 text-[11px] uppercase tracking-[0.18em] font-bold ${isLight ? 'text-slate-700' : 'text-white/80'}`}>Dispatch to cloud runner</p>
        <div className="mt-2 flex flex-wrap gap-2 pb-40">
          {CHAIN_LIST.map((c) => (
            <button
              key={c.key}
              onClick={() => dispatch(c.title)}
              className={`rounded-full border px-3.5 py-2 text-xs font-semibold shadow-sm transition ${
                isLight
                  ? 'border-slate-300/90 bg-white/95 text-slate-800 hover:bg-white hover:text-slate-950 hover:border-slate-400'
                  : 'border-white/20 bg-white/[0.08] text-white/90 hover:bg-white/15'
              }`}
            >
              <Zap className="mr-1 inline h-3.5 w-3.5 text-[var(--m-accent)]" /> {c.title}
            </button>
          ))}
        </div>

      </div>

      {/* Command queue drawer */}
      <div className={`fixed inset-x-0 bottom-0 z-30 transition-transform duration-300 ${drawerOpen ? 'translate-y-0' : 'translate-y-[calc(100%-3.25rem)]'}`}>
        <div className={`rounded-t-3xl border-t backdrop-blur-lg shadow-2xl transition ${
          isLight ? 'border-slate-200/90 bg-white/95 text-slate-900' : 'border-white/15 bg-[#15161C]/95 text-white'
        }`}>
          <button onClick={() => setDrawerOpen((v) => !v)} className="flex w-full items-center justify-between px-5 py-3.5">
            <span className={`text-xs font-bold ${isLight ? 'text-slate-950' : 'text-white/90'}`}>Command queue · {queue.length}</span>
            <ChevronUp className={`h-4 w-4 transition ${drawerOpen ? 'rotate-180' : ''} ${isLight ? 'text-slate-600' : 'text-white/60'}`} />
          </button>
          <div className="m-scroll max-h-64 space-y-2 overflow-y-auto px-5 pb-28">
            {queue.length === 0 && <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Nothing queued yet.</p>}
            {queue.map((q) => (
              <div key={q.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                isLight ? 'border-slate-200 bg-slate-50/90 text-slate-900' : 'border-white/10 bg-black/40 text-white/90'
              }`}>
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span className={`flex-1 truncate text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white/90'}`}>{q.text}</span>
                <button onClick={() => setQueue((list) => list.filter((x) => x.id !== q.id))} className={isLight ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white'}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Thumb-zone orb */}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex items-end justify-center gap-5 px-6">
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => void openCamera()}
            className={`pointer-events-auto grid h-14 w-14 place-items-center rounded-full border shadow-xl backdrop-blur transition hover:scale-105 active:scale-95 ${
              isLight
                ? 'border-slate-300 bg-white/95 text-slate-800 shadow-slate-300/40'
                : 'border-white/20 bg-[#1D1E28]/95 text-white/90 shadow-black/50'
            }`}
            title="Camera Vision"
          >
            <Camera className="h-5 w-5" />
          </button>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
            Vision
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={toggleVoice}
            className={`pointer-events-auto relative grid h-20 w-20 place-items-center rounded-full m-gradient-bg shadow-2xl transition hover:scale-105 active:scale-95 text-white ${listening ? 'm-pulse-ring' : ''}`}
            title="Voice Command"
          >
            {listening ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
          </button>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
            Voice
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => setCopilotOpen(true)}
            className={`pointer-events-auto relative grid h-14 w-14 place-items-center rounded-full border shadow-xl backdrop-blur transition hover:scale-105 active:scale-95 ${
              needsPermission
                ? 'border-amber-400 bg-amber-500/30 text-amber-300 ring-4 ring-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.5)] animate-pulse'
                : isLight
                  ? 'border-[var(--m-accent)] bg-white/95 text-[var(--m-accent)] ring-2 ring-[var(--m-accent)]/40 shadow-[0_0_20px_rgba(139,95,191,0.25)]'
                  : 'border-[var(--m-accent)]/80 bg-gradient-to-tr from-[var(--m-accent)]/40 via-zinc-900 to-[#1D1E28]/95 text-white ring-2 ring-[var(--m-accent)]/50 shadow-[0_0_24px_rgba(139,95,191,0.45)]'
            }`}
            title="Browser Agent Co-pilot"
          >
            <Bot className="h-6 w-6" />
            {needsPermission ? (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-amber-500 text-[10px] font-black text-white shadow-md animate-ping">
                !
              </span>
            ) : (
              <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 animate-pulse" />
            )}
          </button>
          <span className={`text-[10px] font-black uppercase tracking-wider ${
            needsPermission
              ? 'text-amber-500 font-black'
              : isLight ? 'text-[var(--m-accent)]' : 'text-white'
          }`}>
            Co-pilot
          </span>
        </div>
      </div>

      {/* Browser co-pilot sheet — the same thread the desktop rail shows */}
      {copilotOpen && (
        <div className={`fixed inset-0 z-[75] flex flex-col ${isLight ? 'bg-white text-slate-900' : 'bg-[#101118] text-white'}`}>
          <div className={`flex items-center justify-between border-b px-4 py-3 ${isLight ? 'border-slate-200 bg-slate-50/95' : 'border-white/10 bg-black/40'}`}>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black tracking-widest uppercase bg-[var(--m-accent)]/20 text-[var(--m-accent)] border border-[var(--m-accent)]/40">
                  Carol Ann OS
                </span>
                <p className={`text-[11px] uppercase tracking-[0.2em] font-extrabold ${isLight ? 'text-slate-700' : 'text-white/80'}`}>Browser Agent Co-pilot</p>
              </div>
              <p className={`text-sm font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>Autonomous Booking & Step-by-Step Automation</p>
            </div>
            <button onClick={() => setCopilotOpen(false)} className={`rounded-full border p-2 transition ${isLight ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100' : 'border-white/15 text-white/70 hover:text-white'}`}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <CopilotChat surface="mobile" isLight={isLight} />
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

      {/* SaaS & Enterprise Connectors Modal Sheet */}
      {connectorsOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`relative flex h-[92vh] w-full flex-col rounded-t-3xl border-t p-5 shadow-2xl overflow-hidden ${
            isLight ? 'border-slate-200 bg-white text-slate-900' : 'border-white/15 bg-zinc-950 text-white'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-600/15 text-indigo-500">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold">Carol Ann Connectors & SaaS Ecosystem</h3>
                  <p className="text-[11px] text-slate-500 dark:text-white/50">170+ enterprise data bridges across 25 categories</p>
                </div>
              </div>
              <button
                onClick={() => setConnectorsOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto m-scroll pt-4 pb-12">
              <SaaSConnectorsDirectory
                isLight={isLight}
                compact
                onConnectorToggled={(ids) => setConnectedSaasCount(ids.length)}
              />
            </div>
          </div>
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default MobileRemote;
