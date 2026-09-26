import React, { useMemo } from 'react';
import type { StickerWatermark, UserProfile } from '@/data/schemas';
import { useCarol } from '@/contexts/CarolContext';
import { isLightTheme } from '@/data/intake';
import { Shield, Sparkles, Trophy, Music, Heart, Crown, Award, Compass } from 'lucide-react';
import { UniversalTeamLogo } from './SportsLogos';

interface WatermarkLayerProps {
  stickers?: StickerWatermark[];
  profile?: UserProfile;
  className?: string;
  isAbsolute?: boolean;
}

export const WatermarkLayer: React.FC<WatermarkLayerProps> = ({
  stickers: propStickers,
  profile: propProfile,
  className = '',
  isAbsolute = false,
}) => {
  const carol = useCarol();
  const activeProfile = propProfile || carol.profile;
  const rawStickers = propStickers !== undefined ? propStickers : carol.stickers;
  const isLight = isLightTheme(activeProfile);

  const activeStickers = useMemo(() => {
    if (!Array.isArray(rawStickers)) return [];
    return rawStickers.filter((s) => s.active);
  }, [rawStickers]);

  if (activeStickers.length === 0) {
    return null;
  }

  const renderBadgeIcon = (sticker: StickerWatermark) => {
    // 1. If an image URL is specified (custom uploaded mark or URL)
    if (sticker.imageUrl) {
      return (
        <img
          src={sticker.imageUrl}
          alt={sticker.label}
          className="h-16 w-16 md:h-20 md:w-20 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-transform duration-300"
        />
      );
    }

    const norm = sticker.label.toLowerCase();

    // 2. Sports Franchises (Denver Broncos, Pittsburgh Steelers, etc.)
    if (
      sticker.category === 'sports' ||
      norm.includes('broncos') ||
      norm.includes('steelers') ||
      norm.includes('chiefs') ||
      norm.includes('cowboys') ||
      norm.includes('avalanche') ||
      norm.includes('lakers') ||
      norm.includes('celtics') ||
      norm.includes('yankees')
    ) {
      return (
        <UniversalTeamLogo
          teamNameOrId={sticker.label}
          size={76}
          fallbackEmoji={sticker.emoji || '🏆'}
        />
      );
    }

    // 3. Sovereign Executive marks
    if (norm.includes('sovereign') || norm.includes('seal')) {
      return (
        <div className="relative flex items-center justify-center h-16 w-16 md:h-20 md:w-20 rounded-full border border-amber-400/40 bg-gradient-to-br from-amber-500/20 via-rose-500/15 to-indigo-900/30 shadow-[0_0_25px_rgba(245,158,11,0.25)] backdrop-blur-xs">
          <Shield className="h-9 w-9 text-amber-300 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]" />
          <Crown className="absolute -top-1.5 h-4 w-4 text-amber-200" />
        </div>
      );
    }

    // 4. Music Badges (Fleetwood Mac, etc.)
    if (norm.includes('fleetwood') || norm.includes('mac')) {
      return (
        <div className="relative flex items-center justify-center h-16 w-16 md:h-20 md:w-20 rounded-full border border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-600/20 via-indigo-900/35 to-black/60 shadow-[0_0_25px_rgba(217,70,239,0.3)]">
          <Music className="h-8 w-8 text-fuchsia-300 drop-shadow-[0_2px_8px_rgba(217,70,239,0.5)]" />
        </div>
      );
    }

    if (sticker.category === 'music') {
      return (
        <div className="flex items-center justify-center h-14 w-14 rounded-2xl border border-fuchsia-500/30 bg-fuchsia-950/20 shadow-lg">
          <span className="text-3xl">{sticker.emoji || '🎵'}</span>
        </div>
      );
    }

    // 5. Default icon presentation
    return (
      <span className="text-4xl md:text-5xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
        {sticker.emoji || '✨'}
      </span>
    );
  };

  const getPositionClasses = (position?: StickerWatermark['position']): string => {
    switch (position) {
      case 'top-right':
        return 'top-14 right-6 md:top-16 md:right-10';
      case 'bottom-right':
        return 'bottom-12 right-6 md:bottom-14 md:right-10';
      case 'top-left':
        return 'top-14 left-6 md:top-16 md:left-76';
      case 'bottom-left':
        return 'bottom-12 left-6 md:bottom-14 md:left-76';
      case 'center-subtle':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      case 'header-accent':
        return 'top-3 right-72 hidden xl:flex';
      case 'sidebar-badge':
        return 'bottom-6 left-6 hidden md:flex';
      case 'chat-backdrop':
        return 'top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-14 right-6 md:top-16 md:right-10';
    }
  };

  const containerPositioning = isAbsolute
    ? 'pointer-events-none absolute inset-0 z-10 overflow-hidden select-none'
    : 'pointer-events-none fixed inset-0 z-20 overflow-hidden select-none';

  return (
    <div
      aria-hidden="true"
      className={`${containerPositioning} ${className}`}
    >
      {activeStickers.map((sticker) => {
        const posClass = getPositionClasses(sticker.position);
        const opacity = Math.min(Math.max(sticker.opacity ?? 0.25, 0.08), 0.95);
        const scale = sticker.scale ?? 1.0;

        return (
          <div
            key={sticker.id}
            className={`absolute flex flex-col items-center justify-center transition-all duration-500 ease-out ${posClass}`}
            style={{
              opacity,
              transform: `scale(${scale})`,
            }}
          >
            <div className="flex flex-col items-center text-center">
              {renderBadgeIcon(sticker)}
              <span
                className={`mt-2 font-mono text-[9px] uppercase tracking-[0.2em] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-xs shadow-xs ${
                  isLight
                    ? 'bg-white/90 text-slate-800 border border-slate-200/80 shadow-sm'
                    : 'bg-black/65 text-white/90 border border-white/14 shadow-md'
                }`}
              >
                {sticker.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WatermarkLayer;
