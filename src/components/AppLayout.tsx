import React, { useEffect, useState } from 'react';
import { Monitor, Smartphone, ShieldCheck, Sparkles, SlidersHorizontal } from 'lucide-react';
import { MaggieProvider, useMaggie } from '@/contexts/MaggieContext';
import { useAuth } from '@/contexts/AuthContext';
import CommandCenter from '@/pages/CommandCenter';
import MobileRemote from '@/pages/MobileRemote';
import Onboarding from '@/pages/Onboarding';
import { useIsMobile } from '@/hooks/use-mobile';
import { initBus } from '@/lib/realtimeBus';
import { applyBrightCanvas, loadAISettings } from '@/lib/agentStore';

type Surface = 'desktop' | 'remote';

const MaggieShell: React.FC = () => {
  const { profile, updateProfile, theme, memories, checkIns } = useMaggie();
  const { user } = useAuth();

  const isMobile = useIsMobile();
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';

  const [surface, setSurface] = useState<Surface>(path === '/remote' ? 'remote' : 'desktop');
  const [autoSwitched, setAutoSwitched] = useState(false);
  const [showIntake, setShowIntake] = useState(!profile.onboarded || path === '/onboarding');

  useEffect(() => {
    initBus();
    // Bright white + sage welcome canvas (purely visual — every saved theme value stays intact).
    applyBrightCanvas(loadAISettings().brightCanvas);
  }, []);

  // On phones, drop straight into the one-handed remote surface (once).
  useEffect(() => {
    if (isMobile && !autoSwitched) {
      setSurface('remote');
      setAutoSwitched(true);
    }
  }, [isMobile, autoSwitched]);


  if (showIntake) {
    return (
      <Onboarding
        onComplete={() => {
          updateProfile({ onboarded: true });
          setShowIntake(false);
        }}
      />
    );
  }

  return (
    <div
      className="maggie-root relative min-h-screen"
      style={
        {
          backgroundColor: theme.surface,
          '--m-accent': profile.accentColor || theme.accent,
          '--m-accent-soft': theme.accentSoft,
        } as React.CSSProperties
      }
    >
      {/* Active surface */}
      {surface === 'remote' ? (
        <MobileRemote onBackToDesktop={() => setSurface('desktop')} />
      ) : (
        <CommandCenter onOpenRemote={() => setSurface('remote')} />
      )}

      {/* Global sovereign status bar — desktop only, floats over the canvas */}
      {surface === 'desktop' && (
        <div className="pointer-events-none fixed bottom-3 left-1/2 z-30 hidden -translate-x-1/2 lg:block">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/12 bg-[#15161C]/92 px-4 py-2 shadow-2xl backdrop-blur">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/70">
              <Sparkles className="h-3.5 w-3.5 text-[var(--m-accent-soft)]" />
              {profile.name ? `${profile.name}'s workspace` : 'Maggie workspace'}
            </span>
            <span className="h-3 w-px bg-white/12" />
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-300/85">
              <ShieldCheck className="h-3.5 w-3.5" /> Local-first · {memories.length + checkIns.length} records held
            </span>
            <span className="h-3 w-px bg-white/12" />
            <div className="flex items-center gap-1 rounded-full bg-white/[0.06] p-0.5">
              <button
                onClick={() => setSurface('desktop')}
                className="flex items-center gap-1 rounded-full bg-white/12 px-2.5 py-1 text-[10.5px] font-semibold text-white"
              >
                <Monitor className="h-3 w-3" /> Desktop
              </button>
              <button
                onClick={() => setSurface('remote')}
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium text-white/45 transition hover:text-white"
              >
                <Smartphone className="h-3 w-3" /> Remote
              </button>
            </div>
            <span className="h-3 w-px bg-white/12" />
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-white/45">
              {user ? `Private ledger · ${user.email}` : 'Anonymous device session'}
            </span>
            <span className="h-3 w-px bg-white/12" />
            <button
              onClick={() => setShowIntake(true)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-white/45 transition hover:text-white"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Re-run intake
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

const AppLayout: React.FC = () => (
  <MaggieProvider>
    <MaggieShell />
  </MaggieProvider>
);

export default AppLayout;
