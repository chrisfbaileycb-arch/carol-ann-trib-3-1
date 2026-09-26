import React, { useState, useRef, useMemo } from 'react';
import {
  Sparkles, Palette, Plus, Trash2, Eye, EyeOff, Music,
  Heart, Shield, Trophy, Coffee, Check, Shuffle, Sliders,
  Image as ImageIcon, UploadCloud, Crown, Compass, Award,
  ChevronDown
} from 'lucide-react';
import type { StickerWatermark, UserProfile } from '@/data/schemas';
import {
  AESTHETIC_THEMES, SPORTS_TEAMS, MUSIC_BAND_PRESETS,
  FAITH_SYMBOLS, CULINARY_LIFESTYLE, WALLPAPER_PRESETS,
  type AestheticTheme
} from '@/data/intake';
import {
  SPORTS_TEAMS_CATALOG, SPORT_LEAGUES,
  type SportType, type SportsTeam
} from '@/data/sportsTeams';
import { UniversalTeamLogo } from './SportsLogos';
import { uid } from '@/lib/memoryStore';
import { useCarol } from '@/contexts/CarolContext';

interface SpaceCustomizerProps {
  profile?: UserProfile;
  onUpdateProfile?: (patch: Partial<UserProfile>) => void;
  stickers?: StickerWatermark[];
  onAddSticker?: (sticker: StickerWatermark) => void;
  onUpdateSticker?: (sticker: StickerWatermark) => void;
  onDeleteSticker?: (id: string) => void;
  onToggleSticker?: (id: string) => void;
  currentTheme?: AestheticTheme;
  onSelectTheme?: (themeId: string) => void;
}

// Flexible Registry of Aesthetic Sovereign Badges
export const SOVEREIGN_SEALS = [
  { name: 'Sovereign Executive Seal', emoji: '🛡️', category: 'aesthetic' as const, position: 'top-right' as const },
  { name: 'Golden Laurel Wreath', emoji: '🌿', category: 'aesthetic' as const, position: 'top-left' as const },
  { name: 'Crown of Sovereignty', emoji: '👑', category: 'aesthetic' as const, position: 'header-accent' as const },
  { name: 'Atelier Rose Emblem', emoji: '🌹', category: 'aesthetic' as const, position: 'bottom-right' as const },
  { name: 'Celestial Horizon', emoji: '✨', category: 'aesthetic' as const, position: 'center-subtle' as const },
  { name: 'Quiet Luxury Compass', emoji: '🧭', category: 'aesthetic' as const, position: 'sidebar-badge' as const },
];

export const SpaceCustomizer: React.FC<SpaceCustomizerProps> = ({
  profile: propProfile,
  onUpdateProfile: propUpdateProfile,
  stickers: propStickers,
  onAddSticker: propAddSticker,
  onUpdateSticker: propUpdateSticker,
  onDeleteSticker: propDeleteSticker,
  onToggleSticker: propToggleSticker,
  currentTheme: propTheme,
  onSelectTheme: propSelectTheme,
}) => {
  const carol = useCarol();
  const profile = propProfile || carol.profile;
  const onUpdateProfile = propUpdateProfile || carol.updateProfile;
  const stickers = propStickers !== undefined ? propStickers : carol.stickers;
  const onAddSticker = propAddSticker || carol.addSticker;
  const onUpdateSticker = propUpdateSticker || carol.updateSticker;
  const onDeleteSticker = propDeleteSticker || carol.deleteSticker;
  const onToggleSticker = propToggleSticker || carol.toggleSticker;
  const currentTheme = propTheme || carol.theme;
  const onSelectTheme = propSelectTheme || ((id: string) => onUpdateProfile({ theme: id }));

  const [activeCategory, setActiveCategory] = useState<'stickers' | 'theme' | 'identity' | 'wallpapers'>('stickers');
  const [stickerFilter, setStickerFilter] = useState<'all' | 'seals' | 'sports' | 'music' | 'faith' | 'culinary' | 'custom'>('all');

  // Sports Team Selector State (Football, Baseball, Basketball, Hockey, Soccer)
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');
  const [selectedTeamDropdownId, setSelectedTeamDropdownId] = useState<string>('nfl-broncos');

  const visibleSportsTeams = useMemo(() => {
    if (selectedSport === 'all') return SPORTS_TEAMS_CATALOG;
    return SPORTS_TEAMS_CATALOG.filter((t) => t.sport === selectedSport);
  }, [selectedSport]);

  const activeDropdownTeam = useMemo(() => {
    return SPORTS_TEAMS_CATALOG.find((t) => t.id === selectedTeamDropdownId) ?? visibleSportsTeams[0] ?? SPORTS_TEAMS_CATALOG[0];
  }, [selectedTeamDropdownId, visibleSportsTeams]);

  // Custom Sticker Creator State
  const [customLabel, setCustomLabel] = useState('');
  const [customEmoji, setCustomEmoji] = useState('✨');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [customPosition, setCustomPosition] = useState<StickerWatermark['position']>('top-right');
  const [customOpacity, setCustomOpacity] = useState(0.35);
  const [customScale, setCustomScale] = useState(1.0);
  const [showCreator, setShowCreator] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomImageUrl(dataUrl);
        if (!customLabel) {
          setCustomLabel(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateCustomSticker = () => {
    if (!customLabel.trim()) return;
    const newStk: StickerWatermark = {
      id: uid('stk'),
      label: customLabel.trim(),
      emoji: customImageUrl ? undefined : customEmoji || '✨',
      imageUrl: customImageUrl.trim() || undefined,
      category: 'custom',
      opacity: customOpacity,
      position: customPosition,
      scale: customScale,
      active: true,
    };
    onAddSticker(newStk);
    setCustomLabel('');
    setCustomImageUrl('');
    setShowCreator(false);
  };

  const handleAddPresetSticker = (
    label: string,
    emoji: string,
    category: StickerWatermark['category'],
    position: StickerWatermark['position'] = 'top-right'
  ) => {
    const existing = stickers.find((s) => s.label === label);
    if (existing) {
      onUpdateSticker({ ...existing, active: !existing.active });
      return;
    }
    const newStk: StickerWatermark = {
      id: uid('stk'),
      label,
      emoji,
      category,
      opacity: 0.35,
      position,
      scale: 1.0,
      active: true,
    };
    onAddSticker(newStk);
  };

  const filteredStickers = stickerFilter === 'all'
    ? stickers
    : stickerFilter === 'seals'
    ? stickers.filter((s) => s.category === 'aesthetic' || s.label.toLowerCase().includes('sovereign'))
    : stickers.filter((s) => s.category === stickerFilter);

  return (
    <div className="flex h-full flex-col bg-transparent text-white select-none overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-6 py-4 bg-zinc-950/75 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-indigo-500/30 border border-fuchsia-500/30">
              <Sparkles className="h-4 w-4 text-fuchsia-400" />
            </span>
            <h2 className="font-display text-lg font-semibold text-white">Sovereign Space Customizer</h2>
          </div>
          <p className="text-xs text-white/50 mt-0.5">
            Personalize your floating workspace watermark badges, aesthetic marks, theme, and sound profile.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-black/40 p-1">
          <button
            onClick={() => setActiveCategory('stickers')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === 'stickers'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span>Badges & Watermarks ({stickers.filter((s) => s.active).length})</span>
          </button>

          <button
            onClick={() => setActiveCategory('wallpapers')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === 'wallpapers'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5 text-sky-400" />
            <span>Wallpapers</span>
          </button>

          <button
            onClick={() => setActiveCategory('identity')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === 'identity'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Music className="h-3.5 w-3.5 text-fuchsia-400" />
            <span>Profile Song & Quote</span>
          </button>

          <button
            onClick={() => setActiveCategory('theme')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === 'theme'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Palette className="h-3.5 w-3.5 text-emerald-400" />
            <span>Aesthetic Theme</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 m-scroll space-y-6">
        {/* TAB 1: STICKERS & BADGES */}
        {activeCategory === 'stickers' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Quick Filter Bar & Add Button */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(['all', 'seals', 'sports', 'music', 'faith', 'culinary', 'custom'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setStickerFilter(cat)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition ${
                      stickerFilter === cat
                        ? 'bg-[var(--m-accent)] text-white shadow-sm'
                        : 'border border-white/8 bg-white/[0.04] text-white/60 hover:text-white'
                    }`}
                  >
                    {cat === 'seals' ? 'Executive Seals' : cat}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowCreator(!showCreator)}
                className="flex items-center gap-1.5 rounded-lg border border-fuchsia-500/40 bg-fuchsia-500/20 px-3.5 py-1.5 text-xs font-semibold text-fuchsia-200 hover:bg-fuchsia-500/30 transition shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add / Upload Custom Mark</span>
              </button>
            </div>

            {/* Custom Sticker Creator Drawer */}
            {showCreator && (
              <div className="rounded-2xl border border-fuchsia-500/40 bg-[#161726] p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-fuchsia-400" />
                    <h3 className="text-sm font-semibold text-white">Create or Upload Custom Watermark</h3>
                  </div>
                  <span className="text-[11px] text-fuchsia-300 font-mono">Live Canvas Overlay</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/60 mb-1">
                      Mark Label / Title
                    </label>
                    <input
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="e.g. Sovereign Seal, Denver Broncos, Fleetwood Mac"
                      className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-fuchsia-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/60 mb-1">
                      Emoji Symbol
                    </label>
                    <input
                      value={customEmoji}
                      onChange={(e) => setCustomEmoji(e.target.value)}
                      placeholder="✨, 🐴, 🌹, 👑, 🕊️, 🍵"
                      className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-fuchsia-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/60 mb-1">
                      Upload Logo / Graphic (PNG / SVG)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/20 bg-white/5 py-2 px-3 text-xs text-white/80 hover:border-fuchsia-400 hover:text-white transition"
                      >
                        <UploadCloud className="h-3.5 w-3.5 text-fuchsia-400" />
                        <span>{customImageUrl ? 'Image Loaded' : 'Browse Local Image'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/60 mb-1">
                      Canvas Position
                    </label>
                    <select
                      value={customPosition}
                      onChange={(e) => setCustomPosition(e.target.value as StickerWatermark['position'])}
                      className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-fuchsia-400"
                    >
                      <option value="top-right">Top Right (Corner)</option>
                      <option value="bottom-right">Bottom Right (Footer)</option>
                      <option value="top-left">Top Left (Rail Adjacent)</option>
                      <option value="bottom-left">Bottom Left (Dock Adjacent)</option>
                      <option value="header-accent">Header Accent Bar</option>
                      <option value="center-subtle">Center Subtle Watermark</option>
                      <option value="sidebar-badge">Sidebar Dock Badge</option>
                      <option value="chat-backdrop">Chat Stage Backdrop</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] uppercase tracking-wider text-white/60 mb-1">
                      <span>Opacity</span>
                      <span className="font-mono text-fuchsia-300">{Math.round(customOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={0.85}
                      step={0.05}
                      value={customOpacity}
                      onChange={(e) => setCustomOpacity(parseFloat(e.target.value))}
                      className="w-full accent-fuchsia-400"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateCustomSticker}
                      className="flex-1 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 px-4 py-2 text-xs font-semibold text-white shadow-lg transition"
                    >
                      Place on Active Space
                    </button>
                    <button
                      onClick={() => setShowCreator(false)}
                      className="rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs text-white/60 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Active Placed Stickers Management Grid */}
            <div className="rounded-2xl border border-white/8 bg-[#161724]/90 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Active Space Badges & Watermarks</h3>
                  <p className="text-xs text-white/50">Manage watermarks floating persistently over your workspace canvas.</p>
                </div>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-mono font-medium text-emerald-300">
                  {stickers.filter((s) => s.active).length} Active on Canvas
                </span>
              </div>

              {stickers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-white/40 text-xs">
                  No badges selected yet. Click any badge from the catalog below or upload your own.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredStickers.map((sticker) => (
                    <div
                      key={sticker.id}
                      className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                        sticker.active
                          ? 'border-white/20 bg-white/[0.06] shadow-sm'
                          : 'border-white/6 bg-white/[0.01] opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {sticker.imageUrl ? (
                            <img src={sticker.imageUrl} alt={sticker.label} className="h-7 w-7 object-contain" />
                          ) : (
                            <span className="text-2xl">{sticker.emoji ?? '✨'}</span>
                          )}
                          <div>
                            <p className="text-xs font-semibold text-white">{sticker.label}</p>
                            <p className="text-[10px] uppercase font-mono tracking-wider text-white/50">
                              {sticker.position} • {Math.round((sticker.opacity ?? 0.35) * 100)}%
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onToggleSticker(sticker.id)}
                            title={sticker.active ? 'Hide watermark' : 'Show watermark'}
                            className={`rounded-lg p-1.5 text-xs transition ${
                              sticker.active
                                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                : 'bg-white/6 text-white/40 hover:text-white'
                            }`}
                          >
                            {sticker.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => onDeleteSticker(sticker.id)}
                            title="Remove watermark"
                            className="rounded-lg p-1.5 text-xs text-rose-400/70 hover:bg-rose-500/20 hover:text-rose-300 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Position & Opacity adjustments */}
                      <div className="mt-3 pt-2.5 border-t border-white/8 grid grid-cols-2 gap-2 text-[10px]">
                        <select
                          value={sticker.position}
                          onChange={(e) => onUpdateSticker({ ...sticker, position: e.target.value as StickerWatermark['position'] })}
                          className="rounded-md border border-white/10 bg-black/50 px-2 py-1 text-[10px] text-white/80"
                        >
                          <option value="top-right">Top Right</option>
                          <option value="bottom-right">Bottom Right</option>
                          <option value="top-left">Top Left</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="header-accent">Header Accent</option>
                          <option value="center-subtle">Center Subtle</option>
                          <option value="sidebar-badge">Sidebar Dock</option>
                        </select>

                        <div className="flex items-center gap-1">
                          <span className="text-white/50">Scale:</span>
                          <select
                            value={sticker.scale ?? 1.0}
                            onChange={(e) => onUpdateSticker({ ...sticker, scale: parseFloat(e.target.value) })}
                            className="rounded-md border border-white/10 bg-black/50 px-2 py-1 text-[10px] text-white/80"
                          >
                            <option value={0.75}>0.75x</option>
                            <option value={1.0}>1.0x</option>
                            <option value={1.25}>1.25x</option>
                            <option value={1.5}>1.5x</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Catalog / Add from Presets */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white/90">Browse Flexible Badge Catalog</h3>

              {/* 1. Sovereign Executive Seals & Aesthetic Marks */}
              <div className="rounded-2xl border border-white/8 bg-[#161724]/60 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Sovereign Executive Marks</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SOVEREIGN_SEALS.map((seal) => {
                    const isAdded = stickers.some((s) => s.label === seal.name && s.active);
                    return (
                      <button
                        key={seal.name}
                        onClick={() => handleAddPresetSticker(seal.name, seal.emoji, seal.category, seal.position)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          isAdded
                            ? 'border-amber-400/60 bg-amber-400/20 text-amber-200 shadow-sm'
                            : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        <span>{seal.emoji}</span>
                        <span>{seal.name}</span>
                        {isAdded ? <Check className="h-3 w-3 text-amber-300" /> : <Plus className="h-3 w-3 opacity-40" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Sports Franchises: Comprehensive Sports Team Selector (NFL, MLB, NBA, NHL, Soccer) */}
              <div className="rounded-2xl border border-orange-500/30 bg-[#161724]/75 p-5 space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-orange-400" />
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-white">
                        Major Sports Teams & Franchises
                      </span>
                      <p className="text-[11px] text-white/55">
                        Authentic NFL, MLB, NBA, NHL & Soccer marks with official team vector logos
                      </p>
                    </div>
                  </div>

                  {/* Sport / League Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    <button
                      onClick={() => setSelectedSport('all')}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                        selectedSport === 'all'
                          ? 'bg-orange-500 text-white font-semibold shadow-xs'
                          : 'bg-white/[0.04] text-white/60 hover:text-white'
                      }`}
                    >
                      All Sports ({SPORTS_TEAMS_CATALOG.length})
                    </button>
                    {SPORT_LEAGUES.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setSelectedSport(l.id)}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                          selectedSport === l.id
                            ? 'bg-orange-500 text-white font-semibold shadow-xs'
                            : 'bg-white/[0.04] text-white/60 hover:text-white'
                        }`}
                      >
                        <span>{l.iconEmoji}</span>
                        <span>{l.leagueCode}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team Selector Dropdown Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center rounded-xl bg-black/40 border border-white/10 p-3.5">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10.5px] font-mono uppercase tracking-wider text-orange-300 font-semibold flex items-center gap-1">
                      <span>Select Team:</span>
                      <span className="text-white/40">({visibleSportsTeams.length} teams available)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTeamDropdownId}
                        onChange={(e) => setSelectedTeamDropdownId(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-white/15 bg-zinc-900/90 px-3 py-2 pr-9 text-xs font-semibold text-white focus:border-orange-500 focus:outline-none"
                      >
                        {visibleSportsTeams.map((team) => (
                          <option key={team.id} value={team.id}>
                            [{team.league}] {team.name} — {team.city}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-white/50" />
                    </div>
                  </div>

                  {/* Quick Action Button for Selected Dropdown Team */}
                  <div className="flex flex-col justify-end">
                    {(() => {
                      const isAdded = stickers.some(
                        (s) => (s.label === activeDropdownTeam.name || s.label.toLowerCase() === activeDropdownTeam.shortName.toLowerCase()) && s.active
                      );
                      return (
                        <button
                          onClick={() =>
                            handleAddPresetSticker(
                              activeDropdownTeam.name,
                              activeDropdownTeam.badgeEmoji,
                              'sports',
                              activeDropdownTeam.defaultPosition
                            )
                          }
                          className={`w-full flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition shadow-md ${
                            isAdded
                              ? 'border border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                              : 'border border-orange-500/50 bg-orange-600 text-white hover:bg-orange-500'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-300" />
                              <span>Active on Canvas</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              <span>Set {activeDropdownTeam.shortName} Watermark</span>
                            </>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* Featured Active Team Detail Card */}
                {activeDropdownTeam && (
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/12 bg-white/[0.04] p-4">
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 rounded-2xl bg-zinc-950/80 p-2.5 border border-white/10 shadow-lg">
                        <UniversalTeamLogo
                          teamNameOrId={activeDropdownTeam.name}
                          size={56}
                          fallbackEmoji={activeDropdownTeam.badgeEmoji}
                          primaryColor={activeDropdownTeam.primaryColor}
                          secondaryColor={activeDropdownTeam.secondaryColor}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-mono font-bold text-orange-300 border border-white/10">
                            {activeDropdownTeam.league}
                          </span>
                          <h4 className="font-display text-sm font-bold text-white">
                            {activeDropdownTeam.name}
                          </h4>
                        </div>
                        <p className="text-[11px] text-white/60 mt-0.5">
                          {activeDropdownTeam.city} · Official Team Logo & Vector Colors
                        </p>
                        {/* Color Swatches */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-white/40">Colors:</span>
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-xs"
                            style={{ backgroundColor: activeDropdownTeam.primaryColor }}
                            title={`Primary: ${activeDropdownTeam.primaryColor}`}
                          />
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-xs"
                            style={{ backgroundColor: activeDropdownTeam.secondaryColor }}
                            title={`Secondary: ${activeDropdownTeam.secondaryColor}`}
                          />
                          {activeDropdownTeam.accentColor && (
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-xs"
                              style={{ backgroundColor: activeDropdownTeam.accentColor }}
                              title={`Accent: ${activeDropdownTeam.accentColor}`}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Visual Team Cards Gallery */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                    Quick Team Selection:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {visibleSportsTeams.map((team) => {
                      const isAdded = stickers.some(
                        (s) => (s.label === team.name || s.label.toLowerCase() === team.shortName.toLowerCase()) && s.active
                      );
                      const isCurrent = selectedTeamDropdownId === team.id;
                      return (
                        <div
                          key={team.id}
                          onClick={() => {
                            setSelectedTeamDropdownId(team.id);
                            handleAddPresetSticker(team.name, team.badgeEmoji, 'sports', team.defaultPosition);
                          }}
                          className={`cursor-pointer group flex flex-col items-center justify-between rounded-xl border p-2.5 text-center transition-all ${
                            isAdded
                              ? 'border-orange-400 bg-orange-500/20 shadow-md ring-1 ring-orange-400/50'
                              : isCurrent
                              ? 'border-white/30 bg-white/10'
                              : 'border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="my-1.5 flex h-10 w-10 items-center justify-center">
                            <UniversalTeamLogo
                              teamNameOrId={team.name}
                              size={38}
                              fallbackEmoji={team.badgeEmoji}
                              primaryColor={team.primaryColor}
                              secondaryColor={team.secondaryColor}
                            />
                          </div>
                          <p className="text-[11px] font-semibold text-white truncate max-w-full">
                            {team.shortName}
                          </p>
                          <span className="text-[9px] font-mono text-white/50">{team.league}</span>
                          <span className="mt-1 flex items-center justify-center">
                            {isAdded ? (
                              <Check className="h-3.5 w-3.5 text-orange-300" />
                            ) : (
                              <Plus className="h-3.5 w-3.5 text-white/40 group-hover:text-white" />
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. Bands & Music Badges (Fleetwood Mac, etc.) */}
              <div className="rounded-2xl border border-white/8 bg-[#161724]/60 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-fuchsia-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Music & Culture Badges</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {MUSIC_BAND_PRESETS.map((m) => {
                    const isAdded = stickers.some((s) => s.label === m.name && s.active);
                    return (
                      <button
                        key={m.name}
                        onClick={() => handleAddPresetSticker(m.name, m.emoji, 'music', 'bottom-right')}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          isAdded
                            ? 'border-fuchsia-400/60 bg-fuchsia-400/20 text-fuchsia-200 shadow-sm'
                            : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        <span>{m.emoji}</span>
                        <span>{m.name}</span>
                        {isAdded ? <Check className="h-3 w-3 text-fuchsia-300" /> : <Plus className="h-3 w-3 opacity-40" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Faith & Inner Peace Symbols */}
              <div className="rounded-2xl border border-white/8 bg-[#161724]/60 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-sky-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Faith & Inner Peace Symbols</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {FAITH_SYMBOLS.map((f) => {
                    const isAdded = stickers.some((s) => s.label === f.name && s.active);
                    return (
                      <button
                        key={f.name}
                        onClick={() => handleAddPresetSticker(f.name, f.emoji, 'faith', 'bottom-left')}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          isAdded
                            ? 'border-sky-400/60 bg-sky-400/20 text-sky-200 shadow-sm'
                            : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        <span>{f.emoji}</span>
                        <span>{f.name}</span>
                        {isAdded ? <Check className="h-3 w-3 text-sky-300" /> : <Plus className="h-3 w-3 opacity-40" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Culinary & Lifestyle Badges */}
              <div className="rounded-2xl border border-white/8 bg-[#161724]/60 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Culinary & Wellness Badges</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CULINARY_LIFESTYLE.map((c) => {
                    const isAdded = stickers.some((s) => s.label === c.name && s.active);
                    return (
                      <button
                        key={c.name}
                        onClick={() => handleAddPresetSticker(c.name, c.emoji, 'culinary', 'top-left')}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          isAdded
                            ? 'border-emerald-400/60 bg-emerald-400/20 text-emerald-200 shadow-sm'
                            : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        <span>{c.emoji}</span>
                        <span>{c.name}</span>
                        {isAdded ? <Check className="h-3 w-3 text-emerald-300" /> : <Plus className="h-3 w-3 opacity-40" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WALLPAPERS */}
        {activeCategory === 'wallpapers' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <h3 className="text-sm font-semibold text-white">Ambient Space Wallpapers</h3>
              <p className="text-xs text-white/50">Choose an atmospheric canvas texture for your executive stage.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {WALLPAPER_PRESETS.map((w) => {
                const isSelected = profile.wallpaperPreset === w.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => onUpdateProfile({ wallpaperPreset: w.id })}
                    className={`relative flex flex-col justify-end h-36 rounded-2xl border p-4 text-left transition-all overflow-hidden ${
                      isSelected
                        ? 'border-[var(--m-accent)] ring-2 ring-[var(--m-accent)]/30'
                        : 'border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="absolute inset-0 opacity-80" style={{ background: w.css }} />
                    <div className="relative z-10 flex items-center justify-between gap-2 w-full">
                      <span className="text-sm font-semibold text-white truncate min-w-0 flex-1">{w.label}</span>
                      {isSelected && (
                        <span className="rounded-full bg-[var(--m-accent)] p-1 text-white shadow-md shrink-0">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: IDENTITY / PROFILE SONG & QUOTE */}
        {activeCategory === 'identity' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <h3 className="text-sm font-semibold text-white">MySpace-Style Profile Badge</h3>
              <p className="text-xs text-white/50">Set your space anthem, daily anchor quote, and personal affirmation.</p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#161724] p-6 space-y-5">
              <div>
                <label className="block text-xs uppercase font-medium tracking-wider text-white/60 mb-2">
                  Space Anthem / Now Playing Song
                </label>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-fuchsia-500/20 text-fuchsia-400">
                    <Music className="h-5 w-5" />
                  </span>
                  <input
                    value={profile.profileSong || ''}
                    onChange={(e) => onUpdateProfile({ profileSong: e.target.value })}
                    placeholder="e.g. Fleetwood Mac — Dreams, Daft Punk — Digital Love"
                    className="flex-1 rounded-xl border border-white/12 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-fuchsia-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-medium tracking-wider text-white/60 mb-2">
                  Personal Space Anchor Quote
                </label>
                <textarea
                  rows={2}
                  value={profile.profileQuote || ''}
                  onChange={(e) => onUpdateProfile({ profileQuote: e.target.value })}
                  placeholder="e.g. Sovereignty, strength, and grounded clarity every day."
                  className="w-full rounded-xl border border-white/12 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-fuchsia-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-medium tracking-wider text-white/60 mb-2">
                  Daily Sovereign Affirmation
                </label>
                <input
                  value={profile.affirmation || ''}
                  onChange={(e) => onUpdateProfile({ affirmation: e.target.value })}
                  placeholder="Focused, intentional, and strong every single day."
                  className="w-full rounded-xl border border-white/12 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-fuchsia-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AESTHETIC THEME */}
        {activeCategory === 'theme' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <h3 className="text-sm font-semibold text-white">Select Aesthetic Archetype</h3>
              <p className="text-xs text-white/50">Instantly calibrate typography, ambient hues, and surface colors.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {AESTHETIC_THEMES.map((theme) => {
                const isSelected = currentTheme.id === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => onSelectTheme(theme.id)}
                    className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition-all ${
                      isSelected
                        ? 'border-[var(--m-accent)] bg-white/[0.08] shadow-lg ring-2 ring-[var(--m-accent)]/30'
                        : 'border-white/8 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">{theme.label}</span>
                        <span
                          className="h-4 w-4 rounded-full border border-white/20"
                          style={{ backgroundColor: theme.accent }}
                        />
                      </div>
                      <p className="text-xs text-white/50 mt-1.5 leading-relaxed">{theme.description}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3 text-[11px]">
                      <span className="font-mono text-white/50" style={{ color: theme.accentSoft }}>
                        {theme.accent}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 font-semibold text-[var(--m-accent)]">
                          <Check className="h-3.5 w-3.5" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceCustomizer;
