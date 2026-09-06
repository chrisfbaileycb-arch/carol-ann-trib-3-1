import React from 'react';
import type { StickerWatermark, UserProfile } from '@/data/schemas';
import { WallpaperBackground } from './WallpaperBackground';
import { useCarol } from '@/contexts/CarolContext';

interface WatermarkLayerProps {
  stickers: StickerWatermark[];
  profile?: UserProfile;
}

export const WatermarkLayer: React.FC<WatermarkLayerProps> = ({ stickers, profile }) => {
  const carol = useCarol();
  const activeProfile = profile || carol.profile;
  return <WallpaperBackground profile={activeProfile} stickers={stickers} />;
};

export default WatermarkLayer;
