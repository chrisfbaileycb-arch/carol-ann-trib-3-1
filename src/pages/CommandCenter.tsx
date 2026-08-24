import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Sparkles, LayoutDashboard, Globe, Users, Package, Bot, Smartphone, Dumbbell,
  Cloud, Loader2, Wifi, LogIn, LogOut, ShieldCheck, UserCircle2, Settings, CloudCog, Radio,
  MessagesSquare, Plug,
} from 'lucide-react';
import ConversationRail from '@/components/command/ConversationRail';
import BrowserViewport from '@/components/command/BrowserViewport';
import RemoteActivity from '@/components/command/RemoteActivity';
import PersonalSpace from '@/components/canvas/PersonalSpace';
import SkillsEngine from '@/components/skills/SkillsEngine';
import AgentStackStore from '@/components/skills/AgentStackStore';
import GymCoach from '@/components/coach/GymCoach';
import TaskDispatcher from '@/components/copilot/TaskDispatcher';
import AuthModal from '@/components/auth/AuthModal';
import AccountSettings from '@/components/auth/AccountSettings';
import ChatHub from '@/components/hub/ChatHub';
import AgentStudio from '@/components/agents/AgentStudio';
import ConnectionsHub from '@/components/connections/ConnectionsHub';
import { useMaggie } from '@/contexts/MaggieContext';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeBus, isCloudBusLive, pullBusNow } from '@/lib/realtimeBus';
import { startRun, pushLog } from '@/lib/agentRunner';
import { parseIntent } from '@/lib/browserAgent';


type TabId =
  | 'hub' | 'agents' | 'connect'
  | 'dashboard' | 'agent' | 'activity' | 'skills' | 'store' | 'coach';

/** Tabs that own the full width (no conversation rail) so the work area stays calm. */
const FULL_WIDTH_TABS: TabId[] = ['hub', 'agents', 'connect'];

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'hub', label: 'Chat Hub', icon: MessagesSquare },
  { id: 'agents', label: 'Agent Studio', icon: Users },
  { id: 'connect', label: 'Connections & Skills', icon: Plug },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'agent', label: 'Cloud Browser Agent', icon: Globe },
  { id: 'activity', label: 'Remote Activity', icon: Radio },
  { id: 'skills', label: 'Family & Life Skills', icon: Users },
  { id: 'store', label: 'Agent Stack Store', icon: Package },
  { id: 'coach', label: 'Gym Coach', icon: Dumbbell },
];



export const CommandCenter: React.FC<{ onOpenRemote: () => void }> = ({ onOpenRemote }) => {
  const { profile, theme, syncToCloud, syncing, lastSync, syncError, addCheckIn } = useMaggie();
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<TabId>('hub');
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);

  const [railWidth, setRailWidth] = useState(380);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [relayLive, setRelayLive] = useState(false);
  const [remoteBeacon, setRemoteBeacon] = useState<string | null>(null);
  const dragging = useRef(false);

  const openAgent = useCallback(() => setTab('agent'), []);

  // Reflect the cross-device relay status (bus_events polling) in the header.
  useEffect(() => {
    if (!user) {
      setRelayLive(false);
      return;
    }
    const tick = window.setInterval(() => setRelayLive(isCloudBusLive()), 2000);
    void pullBusNow();
    return () => window.clearInterval(tick);
  }, [user]);


  useEffect(() => {
    return subscribeBus((e) => {
      // Phone pushes and cloud-scheduled dispatches both raise the beacon.
      if (e.source !== 'mobile' && e.source !== 'cloud') return;
      setRemoteBeacon(String(e.payload.text ?? e.type));
      window.setTimeout(() => setRemoteBeacon(null), 4200);

      if (e.type === 'command' || e.type === 'voice') {
        const intent = parseIntent(String(e.payload.text ?? ''));
        if (intent) {
          startRun(intent.key);
          setTab('agent');
        }
      }
      if (e.type === 'checkin') {
        addCheckIn({
          type: (e.payload.type as 'physical') ?? 'wellness',
          label: String(e.payload.label ?? 'Remote check-in'),
          notes: String(e.payload.notes ?? 'Logged from the phone remote.'),
        });
      }
      if (e.type === 'vision') {
        pushLog(`Vision frame ingested from phone → queued for parsing.`, 'action');
        setTab('agent');
      }
    });
  }, [addCheckIn]);

  useEffect(() => {
    const move = (ev: MouseEvent) => {
      if (!dragging.current) return;
      setRailWidth(Math.min(620, Math.max(300, ev.clientX)));
    };
    const up = () => { dragging.current = false; document.body.style.cursor = ''; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);

  return (
    <div
      className="maggie-root flex h-screen flex-col overflow-hidden text-white"
      style={{
        backgroundColor: theme.surface,
        '--m-accent': profile.accentColor || theme.accent,
        '--m-accent-soft': theme.accentSoft,
      } as React.CSSProperties}
    >

      {/* Top bar */}
      <header className="shrink-0 border-b border-white/8" style={{ backgroundImage: theme.texture, backgroundColor: theme.surfaceAlt }}>
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg m-gradient-bg">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-base font-semibold">Maggie</p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">Sovereign Executive OS</p>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {remoteBeacon && (
              <span className="flex items-center gap-1.5 rounded-full border border-[var(--m-accent-soft)]/40 bg-[var(--m-accent-soft)]/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--m-accent-soft)]">
                <Wifi className="h-3 w-3" /> Remote: {remoteBeacon.slice(0, 34)}
              </span>
            )}
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/8 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 md:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Runner online
            </span>
            {user && (
              <button
                onClick={() => void pullBusNow()}
                title="Pull remote events queued by your phone (cross-device relay)"
                className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition md:flex ${relayLive ? 'border-sky-400/30 bg-sky-400/10 text-sky-300' : 'border-white/12 text-white/40 hover:text-white'}`}
              >
                <CloudCog className="h-3 w-3" /> {relayLive ? 'Relay live' : 'Relay idle'}
              </button>
            )}
            <button
              onClick={() => (user ? void syncToCloud() : setAuthOpen(true))}
              title={user ? 'Push an encrypted snapshot to your private ledger' : 'Sign in to enable cloud sync'}

              className="flex items-center gap-1.5 rounded-lg border border-white/12 px-2.5 py-1.5 text-[11px] font-medium text-white/60 transition hover:border-white/30 hover:text-white"
            >
              {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Cloud className="h-3.5 w-3.5" />}
              {syncing ? 'Syncing' : lastSync ? 'Synced' : 'Sync'}
            </button>
            <button
              onClick={onOpenRemote}
              className="flex items-center gap-1.5 rounded-lg border border-white/12 px-2.5 py-1.5 text-[11px] font-medium text-white/60 transition hover:border-white/30 hover:text-white"
            >
              <Smartphone className="h-3.5 w-3.5" /> Phone remote
            </button>
            <button
              onClick={() => setCopilotOpen(true)}
              className="flex items-center gap-1.5 rounded-lg m-gradient-bg px-3 py-1.5 text-[11px] font-semibold text-white"
            >
              <Bot className="h-3.5 w-3.5" /> Copilot
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/8 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300"
                >
                  <UserCircle2 className="h-3.5 w-3.5" />
                  <span className="max-w-[130px] truncate">{user.email ?? 'Account'}</span>
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-white/12 bg-[#1B1C24] p-3 shadow-2xl">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Private ledger active
                    </p>
                    <p className="mt-1 text-[10.5px] leading-relaxed text-white/40">
                      Row-level security scopes every journal entry, check-in, memory, and errand to this account alone.
                    </p>
                    <p className="mt-2 truncate rounded-lg bg-black/30 px-2 py-1.5 font-mono text-[10px] text-white/45">
                      {user.name ? `${user.name} · ` : ''}{user.email}
                    </p>
                    <button
                      onClick={() => { setAccountOpen(false); setSettingsOpen(true); }}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/12 py-2 text-[11px] font-medium text-white/75 transition hover:border-[var(--m-accent)]/50 hover:text-white"
                    >
                      <Settings className="h-3.5 w-3.5" /> Account settings
                    </button>
                    <button
                      onClick={async () => { setAccountOpen(false); await signOut(); }}
                      className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/12 py-2 text-[11px] font-medium text-white/65 transition hover:border-rose-400/40 hover:text-rose-300"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--m-accent)]/45 bg-[var(--m-accent)]/12 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[var(--m-accent)]/25"
              >
                <LogIn className="h-3.5 w-3.5" /> Sign in
              </button>
            )}
          </div>
        </div>

        {syncError && (
          <p className="border-t border-amber-400/20 bg-amber-400/8 px-4 py-1.5 text-[10.5px] text-amber-200/85">
            {syncError}
          </p>
        )}


        {/* Workspace tabs */}
        <nav className="m-scroll flex gap-1 overflow-x-auto px-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium transition ${tab === t.id ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
              <span
                className="m-tab-underline absolute inset-x-2 bottom-0 h-0.5 rounded-full"
                style={{ background: tab === t.id ? 'linear-gradient(90deg,var(--m-accent),var(--m-accent-soft))' : 'transparent' }}
              />
            </button>
          ))}
        </nav>
      </header>

      {/* Dual pane — the hub, studio and connections run full width so the work area stays clean */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {!FULL_WIDTH_TABS.includes(tab) && (
          <>
            <div
              className="h-[48vh] min-h-0 shrink-0 border-b border-white/8 lg:h-auto lg:w-[var(--rail-w)] lg:border-b-0"
              style={{ '--rail-w': `${railWidth}px` } as React.CSSProperties}
            >
              <ConversationRail onOpenAgent={openAgent} />
            </div>

            {/* Resize handle */}
            <div
              onMouseDown={() => { dragging.current = true; document.body.style.cursor = 'col-resize'; }}
              className="hidden w-1 shrink-0 cursor-col-resize bg-white/[0.06] transition hover:bg-[var(--m-accent)]/50 lg:block"
              title="Drag to resize"
            />
          </>
        )}

        <main className="min-h-0 flex-1 overflow-hidden bg-[#101118]">
          {tab === 'hub' && (
            <ChatHub
              activeAgentId={activeAgentId}
              onSelectAgent={setActiveAgentId}
              onOpenStudio={() => setTab('agents')}
            />
          )}
          {tab === 'agents' && (
            <AgentStudio onOpenChat={(id) => { setActiveAgentId(id); setTab('hub'); }} />
          )}
          {tab === 'connect' && <ConnectionsHub />}
          {tab === 'dashboard' && <PersonalSpace />}
          {tab === 'agent' && <BrowserViewport />}
          {tab === 'activity' && (
            <RemoteActivity onOpenAgent={openAgent} onSignIn={() => setAuthOpen(true)} />
          )}
          {tab === 'skills' && <SkillsEngine onRunAgent={openAgent} />}
          {tab === 'store' && <AgentStackStore />}
          {tab === 'coach' && <GymCoach />}
        </main>


      </div>

      <TaskDispatcher open={copilotOpen} onClose={() => setCopilotOpen(false)} onRunStarted={openAgent} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <AccountSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>

  );
};

export default CommandCenter;
