import React, { useCallback, useEffect, useState } from 'react';
import {
  Sparkles, MessagesSquare, Users, Shield, Palette,
  Smartphone, Cloud, Loader2, UserCircle2, Settings,
  LogOut, LogIn, ShieldCheck, Wifi, CloudCog
} from 'lucide-react';
import { WorkspaceChat } from '@/components/workspace/WorkspaceChat';
import { AgentRosterMCP } from '@/components/workspace/AgentRosterMCP';
import { SovereignMemoryLedger } from '@/components/workspace/SovereignMemoryLedger';
import { SettingsThemeEngine } from '@/components/workspace/SettingsThemeEngine';
import { WatermarkLayer } from '@/components/workspace/WatermarkLayer';
import AuthModal from '@/components/auth/AuthModal';
import AccountSettings from '@/components/auth/AccountSettings';
import { useMaggie } from '@/contexts/MaggieContext';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeBus, isCloudBusLive, pullBusNow } from '@/lib/realtimeBus';
import { loadStickers } from '@/lib/memoryStore';
import type { StickerWatermark } from '@/data/schemas';

type TabId = 'chat' | 'roster' | 'ledger' | 'theme';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'chat', label: 'Workspace Chat', icon: MessagesSquare },
  { id: 'roster', label: 'Agent Roster & MCPs', icon: Users },
  { id: 'ledger', label: 'Sovereign Memory Ledger', icon: Shield },
  { id: 'theme', label: 'Settings & Theme', icon: Palette },
];

export const CommandCenter: React.FC<{ onOpenRemote: () => void }> = ({ onOpenRemote }) => {
  const { profile, updateProfile, theme, syncToCloud, syncing, lastSync, syncError, addCheckIn } = useMaggie();
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<TabId>('chat');
  const [stickers, setStickers] = useState<StickerWatermark[]>(() => loadStickers());

  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [relayLive, setRelayLive] = useState(false);
  const [remoteBeacon, setRemoteBeacon] = useState<string | null>(null);

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

  return (
    <div
      className="maggie-root relative flex h-screen flex-col overflow-hidden text-white"
      style={{
        backgroundColor: theme.surface,
        '--m-accent': profile.accentColor || theme.accent,
        '--m-accent-soft': theme.accentSoft,
      } as React.CSSProperties}
    >
      {/* Visual Sticker & Badge Watermark Overlay */}
      <WatermarkLayer stickers={stickers} />

      {/* Top Browser-Style Navigation Bar */}
      <header
        className="relative z-30 shrink-0 border-b border-white/8 select-none"
        style={{ backgroundImage: theme.texture, backgroundColor: theme.surfaceAlt }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          {/* Brand Header */}
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl m-gradient-bg shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold tracking-wide">Magdalene</p>
              <p className="text-[9px] uppercase tracking-[0.18em] text-white/40">Sovereign Executive OS</p>
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
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-white/45 hover:text-white/80 hover:bg-white/[0.03]'
                  }`}
                >
                  <t.icon
                    className={`h-3.5 w-3.5 ${
                      isActive ? 'text-[var(--m-accent-soft)]' : 'text-white/40'
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
            {remoteBeacon && (
              <span className="flex items-center gap-1.5 rounded-full border border-[var(--m-accent-soft)]/40 bg-[var(--m-accent-soft)]/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--m-accent-soft)]">
                <Wifi className="h-3 w-3" /> Remote: {remoteBeacon.slice(0, 24)}
              </span>
            )}

            <button
              onClick={onOpenRemote}
              className="flex items-center gap-1.5 rounded-lg border border-white/12 px-2.5 py-1.5 text-[11px] font-medium text-white/60 transition hover:border-white/30 hover:text-white"
              title="Open Mobile Remote"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Phone Remote</span>
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/8 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300"
                >
                  <UserCircle2 className="h-3.5 w-3.5" />
                  <span className="max-w-[120px] truncate">{user.email ?? 'Account'}</span>
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-white/12 bg-[#1B1C24] p-3 shadow-2xl">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Sovereign Private Ledger
                    </p>
                    <p className="mt-1 text-[10.5px] leading-relaxed text-white/40">
                      Isolated storage. Zero external telemetry or third-party CRM hooks.
                    </p>
                    <p className="mt-2 truncate rounded-lg bg-black/30 px-2 py-1.5 font-mono text-[10px] text-white/45">
                      {user.email}
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
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Stage */}
      <main className="relative z-10 min-h-0 flex-1 overflow-hidden bg-[#101118]">
        {tab === 'chat' && (
          <WorkspaceChat
            profile={profile}
            onUpdateProfile={updateProfile}
            theme={theme}
            onOpenAgentRoster={() => setTab('roster')}
          />
        )}
        {tab === 'roster' && (
          <AgentRosterMCP
            onSelectAgentForChat={(agentId) => {
              setTab('chat');
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
    </div>
  );
};

export default CommandCenter;
