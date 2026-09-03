import React, { useState } from 'react';
import {
  Sparkles, Palette, Plus, Trash2, Eye, EyeOff, Music,
  Heart, Shield, Trophy, Coffee, Check, Shuffle, Sliders, Image as ImageIcon
} from 'lucide-react';
import type { StickerWatermark, UserProfile } from '@/data/schemas';
import {
  AESTHETIC_THEMES, SPORTS_TEAMS, MUSIC_BAND_PRESETS,
  FAITH_SYMBOLS, CULINARY_LIFESTYLE, WALLPAPER_PRESETS,
  type AestheticTheme
} from '@/data/intake';
import { uid } from '@/lib/memoryStore';

interface SpaceCustomizerProps {
  profile: UserProfile;
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  stickers: StickerWatermark[];
  onAddSticker: (sticker: StickerWatermark) => void;
  onUpdateSticker: (sticker: StickerWatermark) => void;
  onDeleteSticker: (id: string) => void;
  onToggleSticker?: (id: string) => void;
  currentTheme?: AestheticTheme;
  onSelectTheme?: (themeId: string) => void;
}

export const SpaceCustomizer: React.FC<SpaceCustomizerProps> = ({
  profile,
  onUpdateProfile,
  stickers,
  onAddSticker,
  onUpdateSticker,
  onDeleteSticker,
  onToggleSticker,
  currentTheme = AESTHETIC_THEMES[0],
  onSelectTheme = () => {},
}) => {
  const [activeCategory, setActiveCategory] = useState<'stickers' | 'theme' | 'identity' | 'wallpapers'>('stickers');
  const [stickerFilter, setStickerFilter] = useState<'all' | 'sports' | 'music' | 'faith' | 'culinary' | 'aesthetic' | 'custom'>('all');

  // Custom Sticker Creator State
  const [customLabel, setCustomLabel] = useState('');
  const [customEmoji, setCustomEmoji] = useState('✨');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [customPosition, setCustomPosition] = useState<StickerWatermark['position']>('top-right');
  const [customOpacity, setCustomOpacity] = useState(0.2);
  const [customScale, setCustomScale] = useState(1.0);
  const [showCreator, setShowCreator] = useState(false);

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
      onUpdateSticker({ ...existing, active: true });
      return;
    }
    const newStk: StickerWatermark = {
      id: uid('stk'),
      label,
      emoji,
      category,
      opacity: 0.18,
      position,
      scale: 1.0,
      active: true,
    };
    onAddSticker(newStk);
  };

  const filteredStickers = stickerFilter === 'all'
    ? stickers
    : stickers.filter((s) => s.category === stickerFilter);

  return (
    <div className="flex h-full flex-col bg-[#13141E] text-white select-none overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-6 py-4 bg-[#10111A]">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-indigo-500/30 border border-fuchsia-500/30">
              <Sparkles className="h-4 w-4 text-fuchsia-400" />
            </span>
            <h2 className="font-display text-lg font-semibold text-white">Sovereign Space Customizer</h2>
          </div>
          <p className="text-xs text-white/45 mt-0.5">
            Personalize your workspace overlay, sticker watermarks, sports emblems, and sound profile (MySpace-style).
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-black/30 p-1">
          <button
            onClick={() => setActiveCategory('stickers')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === 'stickers'
                ? 'bg-white/12 text-white shadow-sm'
                : 'text-white/45 hover:text-white'
            }`}
          >
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span>Stickers & Badges ({stickers.length})</span>
          </button>

          <button
            onClick={() => setActiveCategory('wallpapers')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === 'wallpapers'
                ? 'bg-white/12 text-white shadow-sm'
                : 'text-white/45 hover:text-white'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5 text-sky-400" />
            <span>Wallpapers</span>
          </button>

          <button
            onClick={() => setActiveCategory('identity')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === 'identity'
                ? 'bg-white/12 text-white shadow-sm'
                : 'text-white/45 hover:text-white'
            }`}
          >
            <Music className="h-3.5 w-3.5 text-fuchsia-400" />
            <span>Profile Song & Quote</span>
          </button>

          <button
            onClick={() => setActiveCategory('theme')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === 'theme'
                ? 'bg-white/12 text-white shadow-sm'
                : 'text-white/45 hover:text-white'
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
                {(['all', 'sports', 'music', 'faith', 'culinary', 'aesthetic', 'custom'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setStickerFilter(cat)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition ${
                      stickerFilter === cat
                        ? 'bg-[var(--m-accent)] text-white shadow-sm'
                        : 'border border-white/8 bg-white/[0.03] text-white/50 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowCreator(!showCreator)}
                className="flex items-center gap-1.5 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/15 px-3 py-1.5 text-xs font-medium text-fuchsia-300 hover:bg-fuchsia-500/25 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Custom Sticker</span>
              </button>
            </div>

            {/* Custom Sticker Creator Drawer */}
            {showCreator && (
              <div className="rounded-2xl border border-fuchsia-500/30 bg-[#161726] p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-fuchsia-400" />
                    <h3 className="text-sm font-semibold text-white">Create Custom Space Sticker</h3>
                  </div>
                  <span className="text-[11px] text-white/40 font-mono">Live Watermark Engine</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1">
                      Label / Name
                    </label>
                    <input
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="e.g. Denver Broncos, Daft Punk, Sacred Heart"
                      className="w-full rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-fuchsia-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1">
                      Emoji Icon
                    </label>
                    <input
                      value={customEmoji}
                      onChange={(e) => setCustomEmoji(e.target.value)}
                      placeholder="✨, 🐴, 🪩, 🕊️, 🍵"
                      className="w-full rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-fuchsia-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1">
                      Image URL (Optional)
                    </label>
                    <input
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="https://...png"
                      className="w-full rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-fuchsia-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1">
                      Position Preset
                    </label>
                    <select
                      value={customPosition}
                      onChange={(e) => setCustomPosition(e.target.value as StickerWatermark['position'])}
                      className="w-full rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-fuchsia-400"
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
                    <div className="flex justify-between text-[11px] uppercase tracking-wider text-white/50 mb-1">
                      <span>Opacity</span>
                      <span className="font-mono text-fuchsia-300">{Math.round(customOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={0.6}
                      step={0.01}
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
                      Place on Space
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
            <div className="rounded-2xl border border-white/8 bg-[#161724]/80 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Your Placed Space Stickers</h3>
                  <p className="text-xs text-white/40">Manage active watermarks and badges floating on your workspace.</p>
                </div>
                <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-[11px] font-mono text-white/60">
                  {stickers.filter((s) => s.active).length} Active on Canvas
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredStickers.map((sticker) => (
                  <div
                    key={sticker.id}
                    className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                      sticker.active
                        ? 'border-white/16 bg-white/[0.04] shadow-sm'
                        : 'border-white/6 bg-white/[0.01] opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{sticker.emoji ?? '✨'}</span>
                        <div>
                          <p className="text-xs font-semibold text-white">{sticker.label}</p>
                          <p className="text-[10px] uppercase font-mono tracking-wider text-white/40">
                            {sticker.position} • {Math.round(sticker.opacity * 100)}%
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onUpdateSticker({ ...sticker, active: !sticker.active })}
                          title={sticker.active ? 'Hide sticker' : 'Show sticker'}
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
                          title="Remove sticker"
                          className="rounded-lg p-1.5 text-xs text-rose-400/60 hover:bg-rose-500/20 hover:text-rose-300 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Position & Opacity quick adjustments */}
                    <div className="mt-3 pt-2.5 border-t border-white/6 grid grid-cols-2 gap-2 text-[10px]">
                      <select
                        value={sticker.position}
                        onChange={(e) => onUpdateSticker({ ...sticker, position: e.target.value as StickerWatermark['position'] })}
                        className="rounded-md border border-white/8 bg-black/40 px-2 py-1 text-[10px] text-white/70"
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
                        <span className="text-white/40">Scale:</span>
                        <select
                          value={sticker.scale}
                          onChange={(e) => onUpdateSticker({ ...sticker, scale: parseFloat(e.target.value) })}
                          className="rounded-md border border-white/8 bg-black/40 px-2 py-1 text-[10px] text-white/70"
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
            </div>

            {/* Quick Catalog / Add from Presets */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white/80">Browse Space Badge Catalog</h3>

              {/* Sports Teams */}
              <div className="rounded-2xl border border-white/8 bg-[#161724]/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Sports Franchises</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SPORTS_TEAMS.map((team) => {
                    const isAdded = stickers.some((s) => s.label === team && s.active);
                    return (
                      <button
                        key={team}
                        onClick={() => handleAddPresetSticker(team, '🐴', 'sports', 'top-right')}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                          isAdded
                            ? 'border-amber-400/50 bg-amber-400/15 text-amber-200'
                            : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <span>{team}</span>
                        {isAdded ? <Check className="h-3 w-3 text-amber-300" /> : <Plus className="h-3 w-3 opacity-40" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bands & Music Badges */}
              <div className="rounded-2xl border border-white/8 bg-[#161724]/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-fuchsia-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Music & Band Badges</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {MUSIC_BAND_PRESETS.map((m) => {
                    const isAdded = stickers.some((s) => s.label === m.name && s.active);
                    return (
                      <button
                        key={m.name}
                        onClick={() => handleAddPresetSticker(m.name, m.emoji, 'music', 'bottom-right')}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                          isAdded
                            ? 'border-fuchsia-400/50 bg-fuchsia-400/15 text-fuchsia-200'
                            : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white'
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

              {/* Faith & Solace Symbols */}
              <div className="rounded-2xl border border-white/8 bg-[#161724]/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-sky-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Faith & Inner Peace Symbols</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {FAITH_SYMBOLS.map((f) => {
                    const isAdded = stickers.some((s) => s.label === f.name && s.active);
                    return (
                      <button
                        key={f.name}
                        onClick={() => handleAddPresetSticker(f.name, f.emoji, 'faith', 'bottom-left')}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                          isAdded
                            ? 'border-sky-400/50 bg-sky-400/15 text-sky-200'
                            : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white'
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

              {/* Culinary & Wellness */}
              <div className="rounded-2xl border border-white/8 bg-[#161724]/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Culinary & Wellness Badges</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CULINARY_LIFESTYLE.map((c) => {
                    const isAdded = stickers.some((s) => s.label === c.name && s.active);
                    return (
                      <button
                        key={c.name}
                        onClick={() => handleAddPresetSticker(c.name, c.emoji, 'culinary', 'top-left')}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                          isAdded
                            ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-200'
                            : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white'
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
              <p className="text-xs text-white/45">Choose an atmospheric canvas texture for your executive stage.</p>
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
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{w.label}</span>
                      {isSelected && (
                        <span className="rounded-full bg-[var(--m-accent)] p-1 text-white shadow-md">
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
              <p className="text-xs text-white/45">Set your space anthem, daily anchor quote, and personal affirmation.</p>
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
              <p className="text-xs text-white/45">Instantly calibrate typography, ambient hues, and surface colors.</p>
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
                      <p className="text-xs text-white/45 mt-1.5 leading-relaxed">{theme.description}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3 text-[11px]">
                      <span className="font-mono text-white/40" style={{ color: theme.accentSoft }}>
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
