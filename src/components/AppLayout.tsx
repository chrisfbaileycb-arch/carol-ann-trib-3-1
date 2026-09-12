import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Monitor, Smartphone, Cloud, Sparkles, SlidersHorizontal, Shield, Bot, Palette } from 'lucide-react';
import { CarolProvider, useCarol } from '@/contexts/CarolContext';
import { useAuth } from '@/contexts/AuthContext';
import CommandCenter from '@/pages/CommandCenter';
import AgentPage from '@/pages/AgentPage';
import MemoryPage from '@/pages/MemoryPage';
import MobileRemote from '@/pages/MobileRemote';
import Onboarding from '@/pages/Onboarding';
import { useIsMobile } from '@/hooks/use-mobile';
import { initBus } from '@/lib/realtimeBus';
import { FONT_OPTIONS, WALLPAPER_PRESETS, isLightTheme } from '@/data/intake';
import WallpaperBackground from '@/components/workspace/WallpaperBackground';

const CarolShell: React.FC = () => {
  const { profile, updateProfile, theme, memories, checkIns, stickers } = useCarol();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const currentPath = location.pathname;

  useEffect(() => {
    initBus();
  }, []);

  // Auto-switch to phone remote once on mobile screens if currently on root
  useEffect(() => {
    if (isMobile && currentPath === '/') {
      navigate('/remote', { replace: true });
    }
  }, [isMobile, currentPath, navigate]);

  const currentFont = FONT_OPTIONS.find((f) => f.id === profile.fontFamily) || FONT_OPTIONS[0];

  const activePreset = useMemo(() => {
    return WALLPAPER_PRESETS.find((w) => w.id === profile.wallpaperPreset) ?? WALLPAPER_PRESETS[0];
  }, [profile.wallpaperPreset]);

  const isLight = useMemo(() => isLightTheme(profile), [profile]);

  // Inject wallpaper and foundation settings state directly onto <body> and <html>
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const foundation = activePreset.foundationColor || (isLight ? '#FFF7F7' : '#0A0B10');
      document.body.style.backgroundColor = foundation;
      
      // Manage HTML dark mode class for Tailwind `dark:` variants
      if (isLight) {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      }

      if (profile.wallpaperCustomImage) {
        document.body.style.backgroundImage = isLight
          ? `linear-gradient(rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.7)), url(${profile.wallpaperCustomImage})`
          : `linear-gradient(rgba(10, 11, 18, 0.4), rgba(10, 11, 18, 0.6)), url(${profile.wallpaperCustomImage})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
      } else {
        document.body.style.backgroundImage = activePreset.css;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
      }
    }
  }, [profile.wallpaperCustomImage, profile.wallpaperPreset, activePreset, isLight]);

  // Route: /onboarding or un-onboarded initial visit
  if (!profile.onboarded || currentPath === '/onboarding') {
    return (
      <Onboarding
        onComplete={() => {
          updateProfile({ onboarded: true });
          navigate('/');
        }}
      />
    );
  }

  const rootBgStyle: React.CSSProperties = {
    backgroundImage: profile.wallpaperCustomImage
      ? isLight
        ? `linear-gradient(rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.65)), url(${profile.wallpaperCustomImage})`
        : `linear-gradient(rgba(10, 11, 18, 0.35), rgba(10, 11, 18, 0.55)), url(${profile.wallpaperCustomImage})`
      : activePreset.css,
    backgroundColor: activePreset.foundationColor || (isLight ? '#FFF7F7' : '#0A0B10'),
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    '--m-accent': profile.accentColor || theme.accent,
    '--m-accent-soft': theme.accentSoft,
    '--font-display': currentFont.displayFont,
    '--font-body': currentFont.bodyFont,
  } as React.CSSProperties;

  return (
    <div
      className={`carol-ann-root relative flex h-screen flex-col overflow-hidden transition-colors duration-500 ${
        isLight ? 'text-slate-800' : 'text-white'
      }`}
      style={rootBgStyle}
    >
      {/* Root Atmospheric Wallpaper Layer with Glows & Ambient Highlights */}
      <WallpaperBackground profile={profile} stickers={stickers} />

      {/* Active Route Surface Container */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
        {currentPath === '/remote' ? (
          <MobileRemote onBackToDesktop={() => navigate('/')} />
        ) : currentPath === '/agent' ? (
          <AgentPage />
        ) : currentPath === '/memory' ? (
          <MemoryPage />
        ) : (
          <CommandCenter onOpenRemote={() => navigate('/remote')} />
        )}
      </div>

      {/* Global Sovereign Status Bar — Semi-transparent Docked at Bottom */}
      {currentPath !== '/remote' && (
        <footer
          className={`shrink-0 z-30 hidden h-8 border-t px-4 select-none lg:flex items-center justify-between text-xs backdrop-blur-md transition-colors duration-300 ${
            isLight
              ? 'border-rose-200/50 bg-white/70 text-slate-700 shadow-sm'
              : 'border-white/10 bg-zinc-950/75 text-white/90'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                isLight ? 'text-slate-800' : 'text-white/90'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[var(--m-accent-soft)]" />
              {profile.name ? `${profile.name}'s workspace` : 'Carol workspace'}
            </span>
            <span className={`h-3 w-px ${isLight ? 'bg-slate-300' : 'bg-white/15'}`} />
            <span
              className={`flex items-center gap-1.5 text-[11px] font-medium ${
                isLight ? 'text-emerald-700' : 'text-emerald-300'
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-emerald-500" /> Sovereign On-Device Storage · {memories.length} memories on this device
            </span>
            <span className={`h-3 w-px ${isLight ? 'bg-slate-300' : 'bg-white/15'}`} />
            <span
              className={`text-[10.5px] font-mono ${
                isLight ? 'text-slate-500' : 'text-white/40'
              }`}
            >
              {activePreset.label} · {currentFont.name}
            </span>
          </div>

          {/* Quick Route Switcher */}
          <div
            className={`flex items-center gap-1 rounded-full p-0.5 border ${
              isLight
                ? 'bg-rose-50/80 border-rose-200/60'
                : 'bg-white/[0.06] border-white/10'
            }`}
          >
            <button
              onClick={() => navigate('/')}
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold transition ${
                currentPath === '/'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-white/20 text-white shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Monitor className="h-3 w-3" /> Workspace
            </button>
            <button
              onClick={() => navigate('/agent')}
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium transition ${
                currentPath === '/agent'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-white/20 text-white shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Bot className="h-3 w-3" /> Agents
            </button>
            <button
              onClick={() => navigate('/memory')}
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium transition ${
                currentPath === '/memory'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-white/20 text-white shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Shield className="h-3 w-3" /> Memory
            </button>
            <button
              onClick={() => navigate('/remote')}
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium transition ${
                currentPath === '/remote'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-white/20 text-white shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Smartphone className="h-3 w-3" /> Remote
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 text-[11px] font-medium ${
                isLight ? 'text-slate-600' : 'text-white/65'
              }`}
            >
              {user ? `Cloud Account · ${user.email}` : 'Sovereign Web Instance'}
            </span>
            <span className={`h-3 w-px ${isLight ? 'bg-slate-300' : 'bg-white/15'}`} />
            <button
              onClick={() => navigate('/onboarding')}
              className={`flex items-center gap-1.5 text-[11px] font-medium transition ${
                isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/65 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Re-run intake
            </button>
          </div>
        </footer>
      )}
    </div>
  );
};

const AppLayout: React.FC = () => (
  <CarolProvider>
    <CarolShell />
  </CarolProvider>
);

export default AppLayout;
