import React from 'react';
import type { StickerWatermark, UserProfile } from '@/data/schemas';
import { WALLPAPER_PRESETS } from '@/data/intake';

interface WatermarkLayerProps {
  stickers: StickerWatermark[];
  profile?: UserProfile;
}

export const WatermarkLayer: React.FC<WatermarkLayerProps> = ({ stickers, profile }) => {
  const activeStickers = stickers.filter((s) => s.active);

  const activeWallpaper = profile?.wallpaperPreset
    ? WALLPAPER_PRESETS.find((w) => w.id === profile.wallpaperPreset)
    : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* Optional Custom Wallpaper Texture Overlay */}
      {activeWallpaper && (
        <div
          className="absolute inset-0 opacity-40 transition-all duration-700 pointer-events-none"
          style={{ background: activeWallpaper.css }}
        />
      )}

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
                <span className="mt-1 font-mono text-[9px] uppercase tracking-widest text-white/60">
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

export default WatermarkLayer;
