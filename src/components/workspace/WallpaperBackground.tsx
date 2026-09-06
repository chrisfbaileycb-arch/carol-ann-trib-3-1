import React, { useMemo } from 'react';
import type { StickerWatermark, UserProfile } from '@/data/schemas';
import { WALLPAPER_PRESETS, getTheme, isLightTheme, type AestheticTheme } from '@/data/intake';

interface WallpaperBackgroundProps {
  profile: UserProfile;
  stickers?: StickerWatermark[];
}

export const WallpaperBackground: React.FC<WallpaperBackgroundProps> = ({ profile, stickers = [] }) => {
  const currentTheme: AestheticTheme = useMemo(() => getTheme(profile.theme), [profile.theme]);

  const activePreset = useMemo(() => {
    return WALLPAPER_PRESETS.find((w) => w.id === profile.wallpaperPreset) ?? WALLPAPER_PRESETS[0];
  }, [profile.wallpaperPreset]);

  const isLight = useMemo(() => isLightTheme(profile), [profile]);

  const activeStickers = useMemo(() => stickers.filter((s) => s.active), [stickers]);

  const intensity = profile.wallpaperIntensity ?? activePreset.glowIntensity ?? 0.35;
  const glowColor = profile.wallpaperGlowColor || activePreset.glowColor || profile.accentColor || currentTheme.accent;
  const pattern = profile.wallpaperPattern || activePreset.pattern || 'bloom';

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none bg-transparent">
      {/* Foundation Solid Base Tint */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{
          backgroundColor: activePreset.foundationColor || (isLight ? '#FFF7F7' : '#0A0B10'),
          opacity: 0.95,
        }}
      />

      {/* Custom User Background Image */}
      {profile.wallpaperCustomImage && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{
            backgroundImage: `url(${profile.wallpaperCustomImage})`,
            opacity: isLight ? 0.9 : 0.85,
            filter: isLight ? 'brightness(1.02) contrast(0.98)' : 'brightness(0.95) contrast(1.05)',
          }}
        />
      )}

      {/* Atmospheric Wallpaper Preset Gradient Overlay */}
      <div
        className="absolute inset-0 transition-all duration-700 ease-out"
        style={{
          background: activePreset.css,
          opacity: Math.max(0.85, intensity * 2.2),
        }}
      />

      {/* Dynamic Personalized Radial Glow Spotlights */}
      <div
        className="absolute -top-[15%] left-[10%] h-[750px] w-[750px] rounded-full blur-[130px] transition-all duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          opacity: isLight ? Math.max(0.35, intensity * 0.9) : Math.max(0.45, intensity * 1.5),
        }}
      />
      <div
        className="absolute top-[40%] -right-[10%] h-[800px] w-[800px] rounded-full blur-[140px] transition-all duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${currentTheme.accentSoft || '#D8B4FE'} 0%, transparent 70%)`,
          opacity: isLight ? Math.max(0.3, intensity * 0.8) : Math.max(0.35, intensity * 1.2),
        }}
      />
      <div
        className="absolute -bottom-[20%] left-[30%] h-[750px] w-[750px] rounded-full blur-[150px] transition-all duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${profile.accentColor || currentTheme.accent} 0%, transparent 70%)`,
          opacity: isLight ? Math.max(0.25, intensity * 0.7) : Math.max(0.3, intensity * 1.1),
        }}
      />

      {/* Pattern Atmospheric Overlays */}
      {pattern === 'starlight' && (
        <div className={`absolute inset-0 ${isLight ? 'opacity-25' : 'opacity-40'}`}>
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={isLight ? '#C084FC' : '#FFFFFF'} stopOpacity="0.9" />
                <stop offset="100%" stopColor={isLight ? '#C084FC' : '#FFFFFF'} stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Twinkling star field */}
            <circle cx="8%" cy="14%" r="1.5" fill={isLight ? '#9333EA' : 'white'} opacity="0.8" />
            <circle cx="15%" cy="28%" r="1" fill={isLight ? '#9333EA' : 'white'} opacity="0.5" />
            <circle cx="24%" cy="8%" r="2" fill="url(#starGlow)" opacity="0.9" />
            <circle cx="35%" cy="22%" r="1" fill={isLight ? '#9333EA' : 'white'} opacity="0.6" />
            <circle cx="48%" cy="12%" r="1.5" fill={isLight ? '#9333EA' : 'white'} opacity="0.7" />
            <circle cx="58%" cy="32%" r="2.5" fill="url(#starGlow)" opacity="0.85" />
            <circle cx="68%" cy="15%" r="1" fill={isLight ? '#9333EA' : 'white'} opacity="0.4" />
            <circle cx="79%" cy="24%" r="1.5" fill={isLight ? '#9333EA' : 'white'} opacity="0.75" />
            <circle cx="88%" cy="10%" r="2" fill="url(#starGlow)" opacity="0.8" />
            <circle cx="94%" cy="38%" r="1" fill={isLight ? '#9333EA' : 'white'} opacity="0.5" />
            <circle cx="12%" cy="65%" r="1.5" fill={isLight ? '#9333EA' : 'white'} opacity="0.6" />
            <circle cx="22%" cy="82%" r="2" fill="url(#starGlow)" opacity="0.8" />
            <circle cx="38%" cy="70%" r="1" fill={isLight ? '#9333EA' : 'white'} opacity="0.4" />
            <circle cx="52%" cy="88%" r="1.5" fill={isLight ? '#9333EA' : 'white'} opacity="0.7" />
            <circle cx="65%" cy="75%" r="2" fill="url(#starGlow)" opacity="0.9" />
            <circle cx="78%" cy="85%" r="1" fill={isLight ? '#9333EA' : 'white'} opacity="0.5" />
            <circle cx="90%" cy="68%" r="2.5" fill="url(#starGlow)" opacity="0.85" />
          </svg>
        </div>
      )}

      {pattern === 'bloom' && (
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="petalGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={isLight ? '#FDA4AF' : '#FF8EB8'} stopOpacity="0.8" />
                <stop offset="100%" stopColor={isLight ? '#F43F5E' : '#FF4D8D'} stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="15%" cy="18%" r="140" fill="url(#petalGlow)" opacity="0.6" />
            <circle cx="85%" cy="30%" r="180" fill="url(#petalGlow)" opacity="0.5" />
            <circle cx="45%" cy="85%" r="200" fill="url(#petalGlow)" opacity="0.4" />
          </svg>
        </div>
      )}

      {pattern === 'grid' && (
        <div
          className={`absolute inset-0 ${isLight ? 'opacity-10' : 'opacity-15'}`}
          style={{
            backgroundImage: isLight
              ? `linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)`
              : `linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
      )}

      {pattern === 'dots' && (
        <div
          className={`absolute inset-0 ${isLight ? 'opacity-12' : 'opacity-20'}`}
          style={{
            backgroundImage: isLight
              ? `radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)`
              : `radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      )}

      {/* Soft Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: isLight
            ? 'radial-gradient(circle at center, transparent 75%, rgba(254, 205, 211, 0.2) 100%)'
            : 'radial-gradient(circle at center, transparent 65%, rgba(0, 0, 0, 0.4) 100%)',
          opacity: isLight ? 0.35 : 0.25,
        }}
      />

      {/* Render Active Stickers */}
      {activeStickers.map((sticker) => {
        let positionClasses = '';
        switch (sticker.position) {
          case 'top-right':
            positionClasses = 'top-14 right-8';
            break;
          case 'bottom-right':
            positionClasses = 'bottom-12 right-8';
            break;
          case 'top-left':
            positionClasses = 'top-14 left-80';
            break;
          case 'bottom-left':
            positionClasses = 'bottom-12 left-80';
            break;
          case 'center-subtle':
            positionClasses = 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
            break;
          case 'header-accent':
            positionClasses = 'top-3.5 right-64 hidden xl:flex';
            break;
          case 'sidebar-badge':
            positionClasses = 'bottom-4 left-4 hidden md:flex';
            break;
          case 'chat-backdrop':
            positionClasses = 'top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none';
            break;
          default:
            positionClasses = 'top-14 right-8';
        }

        return (
          <div
            key={sticker.id}
            className={`absolute flex flex-col items-center justify-center transition-all duration-700 ${positionClasses}`}
            style={{
              opacity: sticker.opacity,
              transform: `scale(${sticker.scale})`,
            }}
          >
            {sticker.imageUrl ? (
              <img
                src={sticker.imageUrl}
                alt={sticker.label}
                className="h-24 w-24 object-contain filter drop-shadow-md"
              />
            ) : (
              <div className="flex flex-col items-center text-center">
                <span className="text-5xl filter drop-shadow-lg">{sticker.emoji ?? '✨'}</span>
                <span
                  className={`mt-1 font-mono text-[9px] uppercase tracking-widest ${
                    isLight ? 'text-slate-700 font-semibold' : 'text-white/60'
                  }`}
                >
                  {sticker.label}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WallpaperBackground;
