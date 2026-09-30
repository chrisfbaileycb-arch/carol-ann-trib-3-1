import React, { useCallback, useEffect, useState } from 'react';
import {
  Sparkles, MessagesSquare, Users, Shield, Palette,
  Smartphone, Cloud, Loader2, UserCircle2, Settings,
  LogOut, LogIn, ShieldCheck, Wifi, CloudCog, Code2, Monitor
} from 'lucide-react';
import { sovereignBridge, type ExecutionHost } from '@/lib/sovereignBridge';
import { WorkspaceChat } from '@/components/workspace/WorkspaceChat';
import { AgentRosterMCP } from '@/components/workspace/AgentRosterMCP';
import { SovereignMemoryLedger } from '@/components/workspace/SovereignMemoryLedger';
import { SettingsThemeEngine } from '@/components/workspace/SettingsThemeEngine';
import { WorkspaceCanvas } from '@/components/canvas/WorkspaceCanvas';
import { WatermarkLayer } from '@/components/workspace/WatermarkLayer';
import AuthModal from '@/components/auth/AuthModal';
import AccountSettings from '@/components/auth/AccountSettings';
import { useCarol } from '@/contexts/CarolContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAgentRouting } from '@/contexts/AgentRoutingContext';
import { subscribeBus, isCloudBusLive, pullBusNow } from '@/lib/realtimeBus';
import { loadStickers } from '@/lib/memoryStore';
import type { StickerWatermark } from '@/data/schemas';
import { isLightTheme } from '@/data/intake';

type TabId = 'chat' | 'canvas' | 'roster' | 'ledger' | 'theme';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'chat', label: 'Workspace Chat', icon: MessagesSquare },
  { id: 'canvas', label: 'Workspace Canvas', icon: Code2 },
  { id: 'roster', label: 'Agent Studio', icon: Users },
  { id: 'ledger', label: 'Sovereign Memory', icon: Shield },
  { id: 'theme', label: 'Design & Wallpaper', icon: Palette },
];

export const CommandCenter: React.FC<{ onOpenRemote: () => void }> = ({ onOpenRemote }) => {
  const { profile, updateProfile, theme, syncToCloud, syncing, lastSync, syncError, addCheckIn, stickers } = useCarol();
  const { user, signOut } = useAuth();
  const { activeTab, setActiveTab, transitionToCanvasWithAgent } = useAgentRouting();
  const tab = activeTab;
  const setTab = setActiveTab;

  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [relayLive, setRelayLive] = useState(false);
  const [remoteBeacon, setRemoteBeacon] = useState<string | null>(null);
  const [executionHost, setExecutionHost] = useState<ExecutionHost>(() => sovereignBridge.executionHost);
  const [hostToast, setHostToast] = useState<string | null>(null);

  // Sync executionHost across tabs, devices & sovereign bridge
  useEffect(() => {
    const unsubscribe = sovereignBridge.subscribe((ev) => {
      if (ev.payload.executionHost) {
        setExecutionHost(ev.payload.executionHost);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleToggleExecutionHost = (targetHost: ExecutionHost) => {
    setExecutionHost(targetHost);
    sovereignBridge.setExecutionHost(targetHost, 'dashboard');
    const msg =
      targetHost === 'dashboard'
        ? '⚡ Switched to Local Browser Automation (Dashboard DOM Active)'
        : targetHost === 'phone'
        ? '📱 Switched to Remote Phone Automation (Phone Co-Pilot Active)'
        : '✨ Switched to Dual Automation Link (Synced)';
    setHostToast(msg);
    window.setTimeout(() => setHostToast(null), 3200);
  };

  // Cross-device relay checking
  useEffect(() => {
    if (!user) {
      setRelayLive(false);
      return;
    }
    const tick = window.setInterval(() => setRelayLive(isCloudBusLive()), 3000);
    void pullBusNow();
    return () => window.clearInterval(tick);
  }, [user]);

  // Phone remote bus subscriptions
  useEffect(() => {
    return subscribeBus((e) => {
      if (e.source !== 'mobile' && e.source !== 'cloud') return;
      setRemoteBeacon(String(e.payload.text ?? e.type));
      window.setTimeout(() => setRemoteBeacon(null), 4200);

      if (e.type === 'checkin') {
        addCheckIn({
          type: (e.payload.type as 'physical') ?? 'wellness',
          label: String(e.payload.label ?? 'Remote check-in'),
          notes: String(e.payload.notes ?? 'Logged from the phone remote.'),
        });
      }
    });
  }, [addCheckIn]);

  const isLight = isLightTheme(profile);

  return (
    <div
      className={`carol-ann-root relative flex h-full flex-1 flex-col overflow-hidden bg-transparent ${
        isLight ? 'text-slate-800' : 'text-white'
      }`}
      style={{
        '--m-accent': profile.accentColor || theme.accent,
        '--m-accent-soft': theme.accentSoft,
      } as React.CSSProperties}
    >
      {/* Visual Sticker & Badge Watermark Overlay */}
      <WatermarkLayer stickers={stickers} />

      {/* Top Browser-Style Navigation Bar */}
      <header
        className={`relative z-30 shrink-0 border-b backdrop-blur-md select-none transition-colors ${
          isLight
            ? 'border-rose-200/60 bg-white/75 text-slate-800 shadow-xs'
            : 'border-white/10 bg-zinc-950/75 text-white'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          {/* Brand Header */}
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl m-gradient-bg shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <div className="leading-tight">
              <p className={`font-display text-base font-semibold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Carol Ann
              </p>
              <p className={`text-[10px] uppercase tracking-[0.2em] font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                Sovereign Executive OS
              </p>
            </div>
          </div>

          {/* Center Tabs */}
          <nav className="flex items-center gap-1">
            {TABS.map((t) => {
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? isLight
                        ? 'bg-white text-slate-900 font-semibold shadow-xs border border-rose-200/60'
                        : 'bg-white/12 text-white font-semibold shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <t.icon
                    className={`h-3.5 w-3.5 ${
                      isActive
                        ? isLight ? 'text-[var(--m-accent)]' : 'text-[var(--m-accent-soft)]'
                        : isLight ? 'text-slate-500' : 'text-white/60'
                    }`}
                  />
                  <span>{t.label}</span>
                  {isActive && (
                    <span
                      className="absolute inset-x-3 -bottom-2.5 h-0.5 rounded-full"
                      style={{ background: 'linear-gradient(90deg,var(--m-accent),var(--m-accent-soft))' }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Automation Mode Toggle: Local Browser vs Remote Phone */}
            <div
              className={`flex items-center rounded-xl border p-1 shadow-sm transition ${
                isLight
                  ? 'border-rose-200/90 bg-white/95 text-slate-700'
                  : 'border-white/15 bg-zinc-900/90 text-white/90'
              }`}
              role="group"
              aria-label="Automation Engine Toggle"
            >
              <div className="flex items-center gap-1.5 px-2 py-0.5 mr-1 border-r border-slate-200 dark:border-white/10 hidden sm:flex">
                <span className="relative flex h-2 w-2">
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                    executionHost === 'dashboard' ? 'bg-sky-400' : 'bg-purple-400'
                  }`} />
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${
                    executionHost === 'dashboard' ? 'bg-sky-500' : 'bg-purple-500'
                  }`} />
                </span>
                <span className={`text-[10px] uppercase font-mono font-bold tracking-wider ${
                  isLight ? 'text-slate-500' : 'text-white/45'
                }`}>
                  Automation:
                </span>
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => handleToggleExecutionHost('dashboard')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    executionHost === 'dashboard' || executionHost === 'dual'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  title="Local Browser Automation: Execute DOM errands and browser tasks directly on this dashboard"
                >
                  <Monitor className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Local Browser</span>
                  <span className="md:hidden">Local</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleExecutionHost('phone')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    executionHost === 'phone'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  title="Remote Phone Automation: Delegate and execute DOM errands via Phone Remote companion"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Remote Phone</span>
                  <span className="md:hidden">Remote</span>
                </button>
              </div>
            </div>

            {remoteBeacon && (
              <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold ${
                isLight
                  ? 'border-[var(--m-accent)]/40 bg-[var(--m-accent)]/10 text-[var(--m-accent)]'
                  : 'border-[var(--m-accent-soft)]/40 bg-[var(--m-accent-soft)]/10 text-[var(--m-accent-soft)]'
              }`}>
                <Wifi className="h-3 w-3" /> Remote: {remoteBeacon.slice(0, 24)}
              </span>
            )}

            <button
              onClick={onOpenRemote}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                isLight
                  ? 'border-rose-200 bg-white/70 text-slate-700 hover:bg-white hover:text-slate-900 shadow-xs'
                  : 'border-white/15 bg-white/[0.03] text-white/80 hover:border-white/30 hover:text-white'
              }`}
              title="Open Mobile Remote"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Phone Remote</span>
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                    isLight
                      ? 'border-emerald-500/40 bg-emerald-50 text-emerald-700'
                      : 'border-emerald-400/35 bg-emerald-400/10 text-emerald-300'
                  }`}
                >
                  <UserCircle2 className="h-3.5 w-3.5" />
                  <span className="max-w-[120px] truncate">{user.email ?? 'Account'}</span>
                </button>
                {accountOpen && (
                  <div className={`absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border p-3.5 shadow-2xl backdrop-blur-xl ${
                    isLight
                      ? 'border-rose-200/80 bg-white/95 text-slate-800'
                      : 'border-white/12 bg-[#1B1C24] text-white'
                  }`}>
                    <p className={`flex items-center gap-1.5 text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Sovereign Private Ledger
                    </p>
                    <p className={`mt-1 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                      Isolated storage. Zero external telemetry or third-party CRM hooks.
                    </p>
                    <p className={`mt-2 truncate rounded-lg px-2.5 py-1.5 font-mono text-[11px] ${
                      isLight ? 'bg-slate-100 text-slate-700' : 'bg-black/40 text-white/70'
                    }`}>
                      {user.email}
                    </p>
                    <button
                      onClick={() => { setAccountOpen(false); setSettingsOpen(true); }}
                      className={`mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition ${
                        isLight
                          ? 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          : 'border-white/12 text-white/85 hover:border-[var(--m-accent)]/50 hover:text-white'
                      }`}
                    >
                      <Settings className="h-3.5 w-3.5" /> Account settings
                    </button>
                    <button
                      onClick={async () => { setAccountOpen(false); await signOut(); }}
                      className={`mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition ${
                        isLight
                          ? 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                          : 'border-white/12 text-white/75 hover:border-rose-400/40 hover:text-rose-300'
                      }`}
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--m-accent)]/45 bg-[var(--m-accent)]/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--m-accent)]/35"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Stage */}
      <main className="relative z-10 min-h-0 flex-1 overflow-hidden bg-transparent">
        {tab === 'chat' && (
          <WorkspaceChat
            profile={profile}
            onUpdateProfile={updateProfile}
            theme={theme}
            onOpenAgentRoster={() => setTab('roster')}
          />
        )}
        {tab === 'canvas' && (
          <WorkspaceCanvas />
        )}
        {tab === 'roster' && (
          <AgentRosterMCP
            profile={profile}
            onSelectAgentForChat={(agentId) => {
              setTab('chat');
            }}
            onSelectAgentForCanvas={(agentId) => {
              transitionToCanvasWithAgent(agentId);
            }}
          />
        )}
        {tab === 'ledger' && (
          <SovereignMemoryLedger profile={profile} />
        )}
        {tab === 'theme' && (
          <SettingsThemeEngine
            profile={profile}
            onUpdateProfile={updateProfile}
            currentTheme={theme}
          />
        )}
      </main>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <AccountSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Real-time Automation Host Switch Toast */}
      {hostToast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-12 right-6 z-50 flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-xs font-semibold shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            executionHost === 'phone'
              ? 'border-purple-400/40 bg-purple-950/95 text-purple-100 shadow-purple-500/20'
              : 'border-sky-400/40 bg-slate-900/95 text-sky-100 shadow-sky-500/20'
          }`}
        >
          {executionHost === 'phone' ? (
            <Smartphone className="h-4 w-4 text-purple-400 shrink-0" />
          ) : (
            <Monitor className="h-4 w-4 text-sky-400 shrink-0" />
          )}
          <span>{hostToast}</span>
        </div>
      )}
    </div>
  );
};

export default CommandCenter;
