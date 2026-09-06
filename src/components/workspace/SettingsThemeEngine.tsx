import React, { useState, useMemo } from 'react';
import {
  Palette, Sparkles, Check, Plus, Trash2, Sliders,
  Volume2, Type, Image as ImageIcon, Sun, Eye,
  Compass, RefreshCw, Wand2, Star, Grid, Waves, Moon
} from 'lucide-react';
import type { StickerWatermark, UserProfile, ThemeMood } from '@/data/schemas';
import {
  AESTHETIC_THEMES,
  WALLPAPER_PRESETS,
  FONT_OPTIONS,
  BRIGHT_ACCENTS,
  CARD_BRIGHTNESS_OPTIONS,
  isLightTheme,
  type AestheticTheme,
  type WallpaperPreset,
  type FontOption,
} from '@/data/intake';
import { voiceByName } from '@/data/agents';
import { loadStickers, saveStickers, uid } from '@/lib/memoryStore';

interface SettingsThemeEngineProps {
  profile: UserProfile;
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  currentTheme: AestheticTheme;
}

const THEME_MOODS: { id: ThemeMood; label: string; sub: string; icon: string; emoji: string }[] = [
  { id: 'light', label: 'Light', sub: 'Gardenia & Sunlit Cream', icon: 'Sun', emoji: '☀️' },
  { id: 'pastel', label: 'Pastel', sub: 'Blush Peony & Lavender', icon: 'Sparkles', emoji: '🌸' },
  { id: 'warm-dark', label: 'Warm Dark', sub: 'Cosmic Aurora & Glow', icon: 'Moon', emoji: '🌙' },
  { id: 'oled-black', label: 'OLED Black', sub: 'Classic Noir & Minimal', icon: 'Eye', emoji: '🖤' },
];

export const SettingsThemeEngine: React.FC<SettingsThemeEngineProps> = ({
  profile,
  onUpdateProfile,
  currentTheme,
}) => {
  const [stickers, setStickers] = useState<StickerWatermark[]>(() => loadStickers());
  const [newStickerLabel, setNewStickerLabel] = useState('');
  const [newStickerEmoji, setNewStickerEmoji] = useState('🌟');
  const [newStickerPos, setNewStickerPos] = useState<StickerWatermark['position']>('top-right');
  const [newStickerOpacity, setNewStickerOpacity] = useState<number>(0.18);
  const [isAddingSticker, setIsAddingSticker] = useState(false);
  const [testVoiceSpeaking, setTestVoiceSpeaking] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState(profile.wallpaperCustomImage || '');
  const [activeTab, setActiveTab] = useState<'wallpaper' | 'fonts' | 'colors' | 'themes' | 'stickers' | 'voice'>('wallpaper');
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<'all' | 'curated-light' | 'warm-dark' | 'oled'>('all');

  const isLight = isLightTheme(profile);
  const currentMood: ThemeMood = profile.themeMode || (isLight ? 'pastel' : 'warm-dark');

  const currentFont = FONT_OPTIONS.find((f) => f.id === profile.fontFamily) || FONT_OPTIONS[0];
  const activeWallpaper = WALLPAPER_PRESETS.find((w) => w.id === profile.wallpaperPreset) || WALLPAPER_PRESETS[0];

  const filteredPresets = useMemo(() => {
    if (presetCategoryFilter === 'curated-light') {
      return WALLPAPER_PRESETS.filter((w) => w.mood === 'light' || w.mood === 'pastel');
    }
    if (presetCategoryFilter === 'warm-dark') {
      return WALLPAPER_PRESETS.filter((w) => w.mood === 'warm-dark');
    }
    if (presetCategoryFilter === 'oled') {
      return WALLPAPER_PRESETS.filter((w) => w.mood === 'oled-black');
    }
    return WALLPAPER_PRESETS;
  }, [presetCategoryFilter]);

  const handleToggleSticker = (id: string) => {
    const updated = stickers.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    setStickers(updated);
    saveStickers(updated);
  };

  const handleUpdateStickerOpacity = (id: string, opacity: number) => {
    const updated = stickers.map((s) => (s.id === id ? { ...s, opacity } : s));
    setStickers(updated);
    saveStickers(updated);
  };

  const handleAddCustomSticker = () => {
    if (!newStickerLabel.trim()) return;
    const newStk: StickerWatermark = {
      id: uid('stk'),
      label: newStickerLabel.trim(),
      emoji: newStickerEmoji,
      category: 'custom',
      opacity: newStickerOpacity,
      position: newStickerPos,
      scale: 1.0,
      active: true,
    };
    const updated = [newStk, ...stickers];
    setStickers(updated);
    saveStickers(updated);
    setNewStickerLabel('');
    setIsAddingSticker(false);
  };

  const handleDeleteSticker = (id: string) => {
    const updated = stickers.filter((s) => s.id !== id);
    setStickers(updated);
    saveStickers(updated);
  };

  const playVoiceSample = (voiceKey: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (testVoiceSpeaking === voiceKey) {
      window.speechSynthesis.cancel();
      setTestVoiceSpeaking(null);
      return;
    }

    window.speechSynthesis.cancel();
    const v = voiceByName(voiceKey);
    const utterance = new SpeechSynthesisUtterance(
      `This is the ${v.name} voice profile. Low latency, sovereign executive ready.`
    );
    utterance.pitch = v.pitch;
    utterance.rate = v.rate;

    const voices = window.speechSynthesis.getVoices();
    const hit = voices.find((sv) =>
      v.speechSynthMatch.some((m) => sv.name.toLowerCase().includes(m.toLowerCase()))
    );
    if (hit) utterance.voice = hit;

    utterance.onend = () => setTestVoiceSpeaking(null);
    utterance.onerror = () => setTestVoiceSpeaking(null);

    setTestVoiceSpeaking(voiceKey);
    window.speechSynthesis.speak(utterance);
  };

  const handleSelectWallpaper = (wp: WallpaperPreset) => {
    onUpdateProfile({
      wallpaperPreset: wp.id,
      wallpaperGlowColor: wp.glowColor,
      wallpaperPattern: wp.pattern,
      wallpaperIntensity: wp.glowIntensity,
      themeMode: wp.mood,
    });
  };

  const handleSelectThemeMood = (mood: ThemeMood) => {
    // If the active preset doesn't naturally match this mood, automatically switch to the leading curated preset
    let targetPresetId = profile.wallpaperPreset;
    if (mood === 'pastel') {
      if (activeWallpaper.mood !== 'pastel') targetPresetId = 'blush-peony';
    } else if (mood === 'light') {
      if (activeWallpaper.mood !== 'light') targetPresetId = 'sunlit-champagne';
    } else if (mood === 'oled-black') {
      if (activeWallpaper.mood !== 'oled-black') targetPresetId = 'classic-noir';
    } else if (mood === 'warm-dark') {
      if (activeWallpaper.mood !== 'warm-dark') targetPresetId = 'aurora';
    }

    const targetPreset = WALLPAPER_PRESETS.find((w) => w.id === targetPresetId) ?? activeWallpaper;
    onUpdateProfile({
      themeMode: mood,
      wallpaperPreset: targetPreset.id,
      wallpaperGlowColor: targetPreset.glowColor,
      wallpaperPattern: targetPreset.pattern,
      wallpaperIntensity: targetPreset.glowIntensity,
    });
  };

  const handleApplyCustomImage = () => {
    onUpdateProfile({ wallpaperCustomImage: customImageUrl.trim() || undefined });
  };

  return (
    <div
      className={`flex h-full flex-col select-none overflow-hidden transition-colors duration-300 ${
        isLight ? 'text-slate-800' : 'text-white'
      }`}
    >
      {/* Top Banner */}
      <div
        className={`flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-6 py-3.5 backdrop-blur-md transition-colors duration-300 ${
          isLight
            ? 'border-rose-200/60 bg-white/80 shadow-xs'
            : 'border-white/10 bg-zinc-950/75'
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`grid h-9 w-9 place-items-center rounded-xl border transition-all ${
              isLight
                ? 'bg-gradient-to-br from-rose-400/20 to-violet-400/20 text-rose-600 border-rose-200/70 shadow-xs'
                : 'bg-gradient-to-br from-pink-500/25 to-violet-500/25 text-pink-300 border-white/10'
            }`}
          >
            <Palette className="h-4.5 w-4.5" />
          </span>
          <div>
            <h1
              className={`font-display text-sm font-semibold tracking-wide flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Design & Aesthetic Studio
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                  isLight
                    ? 'bg-rose-100 text-rose-700 border-rose-200 shadow-xs'
                    : 'bg-white/10 text-pink-300 border-white/10'
                }`}
              >
                {isLight ? 'Luminous Canvas' : 'OLED Dark Canvas'}
              </span>
            </h1>
            <p className={`text-[10.5px] ${isLight ? 'text-slate-600' : 'text-white/55'}`}>
              Full-Bleed Wallpapers · Light & Pastel Glass · Warm Dark & OLED Obsidian · Adaptive Panels
            </p>
          </div>
        </div>

        {/* Navigation sub-tabs */}
        <div
          className={`flex items-center gap-1 rounded-xl p-1 border backdrop-blur-md ${
            isLight
              ? 'bg-rose-50/70 border-rose-200/60'
              : 'bg-white/[0.05] border-white/10'
          }`}
        >
          <button
            onClick={() => setActiveTab('wallpaper')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'wallpaper'
                ? isLight
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'bg-white/15 text-white font-semibold shadow'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5 text-pink-500" />
            <span>Wallpaper</span>
          </button>
          <button
            onClick={() => setActiveTab('fonts')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'fonts'
                ? isLight
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'bg-white/15 text-white font-semibold shadow'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Type className="h-3.5 w-3.5 text-violet-500" />
            <span>Fonts</span>
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'colors'
                ? isLight
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'bg-white/15 text-white font-semibold shadow'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span>Brights & Colors</span>
          </button>
          <button
            onClick={() => setActiveTab('themes')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'themes'
                ? isLight
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'bg-white/15 text-white font-semibold shadow'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Wand2 className="h-3.5 w-3.5 text-sky-500" />
            <span>Palettes</span>
          </button>
          <button
            onClick={() => setActiveTab('stickers')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'stickers'
                ? isLight
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'bg-white/15 text-white font-semibold shadow'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            <span>Watermarks</span>
          </button>
        </div>
      </div>

      {/* Main Content Scroll Area */}
      <div className="m-scroll flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* GLOBAL THEME MOOD TOGGLE BAR */}
        <div
          className={`p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
            isLight
              ? 'bg-white/75 border-rose-200/70 shadow-sm'
              : 'bg-white/[0.04] border-white/12'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
            <div>
              <h2
                className={`font-display text-sm font-semibold flex items-center gap-2 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                <Sun className="h-4 w-4 text-[var(--m-accent)]" />
                Global Theme Foundation & Mood
              </h2>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                Switch between luminous feminine pastels, warm daylight, cosmic depth, or obsidian OLED black.
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium border ${
                isLight
                  ? 'bg-rose-100/80 border-rose-300 text-rose-900 shadow-xs'
                  : 'bg-white/10 border-white/15 text-white/80'
              }`}
            >
              Active Foundation:{' '}
              <strong className={isLight ? 'text-rose-700' : 'text-[var(--m-accent-soft)]'}>
                {THEME_MOODS.find((m) => m.id === currentMood)?.label || 'Warm Dark'}
              </strong>
            </span>
          </div>

          {/* 4 Mood Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {THEME_MOODS.map((mood) => {
              const isCurrent = currentMood === mood.id;
              return (
                <button
                  key={mood.id}
                  onClick={() => handleSelectThemeMood(mood.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 ${
                    isCurrent
                      ? isLight
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-600 shadow-md ring-2 ring-rose-200'
                        : 'bg-white text-zinc-950 border-white shadow-lg ring-2 ring-white/30'
                      : isLight
                      ? 'bg-white/65 border-rose-100/80 text-slate-700 hover:bg-white hover:border-rose-300'
                      : 'bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <span className="text-xl shrink-0">{mood.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold leading-tight truncate">{mood.label}</div>
                    <div
                      className={`text-[10px] leading-tight truncate mt-0.5 ${
                        isCurrent
                          ? isLight
                            ? 'text-rose-100'
                            : 'text-zinc-600'
                          : isLight
                          ? 'text-slate-500'
                          : 'text-white/45'
                      }`}
                    >
                      {mood.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: WALLPAPER BACKGROUND STUDIO */}
        {activeTab === 'wallpaper' && (
          <div className="space-y-6">
            {/* Header Description Card */}
            <div
              className={`rounded-2xl border p-5 backdrop-blur-xl transition-colors ${
                isLight
                  ? 'bg-white/75 border-rose-200/70 shadow-sm'
                  : 'bg-white/[0.04] border-white/12'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2
                    className={`font-display text-base font-semibold flex items-center gap-2 ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    <Sparkles className="h-4 w-4 text-[var(--m-accent)]" />
                    Atmospheric Wallpaper Presets
                  </h2>
                  <p
                    className={`mt-1 text-xs max-w-2xl leading-relaxed ${
                      isLight ? 'text-slate-600' : 'text-white/65'
                    }`}
                  >
                    Select from radiant floral pastels, botanical gardenias, sunlit creams, or cosmic noir. Each preset injects full-bleed CSS color gradients and ambient light glows across your whole display.
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    isLight
                      ? 'border-rose-200 bg-rose-50 text-slate-800'
                      : 'border-white/15 bg-white/10 text-white'
                  }`}
                >
                  Active Preset:{' '}
                  <span className={isLight ? 'text-rose-600' : 'text-[var(--m-accent-soft)]'}>
                    {activeWallpaper.label}
                  </span>
                </span>
              </div>
            </div>

            {/* Wallpaper Presets Category Filter */}
            <div>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <h3
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    isLight ? 'text-slate-500' : 'text-white/50'
                  }`}
                >
                  Curated Presets Gallery
                </h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'all' as const, label: 'All Presets' },
                    { id: 'curated-light' as const, label: '🌸 Curated Light & Pastel' },
                    { id: 'warm-dark' as const, label: '🌙 Warm Dark & Cosmic' },
                    { id: 'oled' as const, label: '🖤 OLED Black' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setPresetCategoryFilter(cat.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                        presetCategoryFilter === cat.id
                          ? isLight
                            ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                            : 'bg-white text-zinc-900 border-white shadow'
                          : isLight
                          ? 'bg-white/60 text-slate-600 border-rose-100 hover:bg-white hover:text-slate-900'
                          : 'bg-white/[0.03] text-white/60 border-white/10 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Presets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredPresets.map((wp) => {
                  const isSelected = profile.wallpaperPreset === wp.id;
                  const isPresetLight = wp.textColorScheme === 'dark' || wp.mood === 'light' || wp.mood === 'pastel';
                  return (
                    <div
                      key={wp.id}
                      onClick={() => handleSelectWallpaper(wp)}
                      className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
                        isSelected
                          ? isLight
                            ? 'border-rose-400 bg-white/90 shadow-[0_0_24px_-4px_rgba(244,114,182,0.4)] ring-2 ring-rose-200'
                            : 'border-[var(--m-accent)] bg-white/[0.08] shadow-[0_0_28px_-6px_var(--m-accent)]'
                          : isLight
                          ? 'border-rose-100/80 bg-white/60 hover:border-rose-300 hover:bg-white/80 shadow-xs'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]'
                      }`}
                    >
                      {/* Visual Wallpaper Preview Thumbnail with True Foundation Color */}
                      <div
                        className="relative mb-3 h-20 w-full overflow-hidden rounded-xl border shadow-inner transition-transform duration-300 group-hover:scale-[1.01]"
                        style={{
                          backgroundColor: wp.foundationColor,
                          borderColor: isPresetLight ? 'rgba(244, 114, 182, 0.3)' : 'rgba(255, 255, 255, 0.12)',
                        }}
                      >
                        <div
                          className="absolute inset-0 transition-opacity duration-300"
                          style={{
                            background: wp.css,
                            opacity: Math.max(0.85, wp.glowIntensity * 2),
                          }}
                        />
                        <div
                          className="absolute -top-3 -left-3 h-14 w-14 rounded-full blur-xl"
                          style={{ background: wp.glowColor, opacity: 0.7 }}
                        />
                        <div className="absolute inset-0 flex items-center justify-between px-3">
                          <span
                            className={`text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full border backdrop-blur-md ${
                              wp.textColorScheme === 'dark'
                                ? 'bg-white/85 text-slate-800 border-rose-200 shadow-xs font-semibold'
                                : 'bg-black/60 text-white/80 border-white/10'
                            }`}
                          >
                            {wp.mood}
                          </span>
                          <span
                            className={`text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full border backdrop-blur-md ${
                              wp.textColorScheme === 'dark'
                                ? 'bg-white/85 text-slate-700 border-rose-200 shadow-xs'
                                : 'bg-black/60 text-white/70 border-white/10'
                            }`}
                          >
                            {wp.pattern}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start justify-between">
                        <div>
                          <p
                            className={`font-semibold text-xs transition ${
                              isLight
                                ? 'text-slate-900 group-hover:text-rose-600'
                                : 'text-white group-hover:text-[var(--m-accent-soft)]'
                            }`}
                          >
                            {wp.label}
                          </p>
                          <p
                            className={`mt-1 text-[11px] leading-relaxed line-clamp-2 ${
                              isLight ? 'text-slate-600' : 'text-white/50'
                            }`}
                          >
                            {wp.description}
                          </p>
                        </div>
                        {isSelected && (
                          <span
                            className={`grid h-5 w-5 place-items-center rounded-full shrink-0 ml-2 border ${
                              isLight
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Atmosphere Controls */}
            <div
              className={`rounded-2xl border p-5 space-y-4 backdrop-blur-xl ${
                isLight
                  ? 'bg-white/75 border-rose-200/70 shadow-sm'
                  : 'bg-white/[0.04] border-white/12'
              }`}
            >
              <h3
                className={`font-display text-sm font-semibold ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Fine-Tune Wallpaper Atmosphere & Glow
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Glow Intensity Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className={isLight ? 'text-slate-700 font-medium' : 'text-white/70 font-medium'}>
                      Ambient Glow Intensity
                    </span>
                    <span className={`font-mono ${isLight ? 'text-slate-900 font-semibold' : 'text-white'}`}>
                      {Math.round((profile.wallpaperIntensity ?? activeWallpaper.glowIntensity ?? 0.35) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.08"
                    max="0.65"
                    step="0.02"
                    value={profile.wallpaperIntensity ?? activeWallpaper.glowIntensity ?? 0.35}
                    onChange={(e) => onUpdateProfile({ wallpaperIntensity: parseFloat(e.target.value) })}
                    className="w-full accent-[var(--m-accent)] cursor-pointer"
                  />
                  <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
                    Controls the radiance of the soft atmospheric glow across the background canvas.
                  </p>
                </div>

                {/* Pattern Overlay Selector */}
                <div className="space-y-2">
                  <label className={`text-xs font-medium block ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                    Atmospheric Pattern Overlay
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'bloom', label: 'Floral Bloom', icon: Sparkles },
                      { id: 'aurora', label: 'Aurora Waves', icon: Waves },
                      { id: 'starlight', label: 'Star Dust', icon: Star },
                      { id: 'grid', label: 'Matrix Grid', icon: Grid },
                      { id: 'dots', label: 'Constellations', icon: Sparkles },
                      { id: 'none', label: 'Minimal Clean', icon: Eye },
                    ].map((pat) => {
                      const isCur = (profile.wallpaperPattern ?? activeWallpaper.pattern) === pat.id;
                      const Icon = pat.icon;
                      return (
                        <button
                          key={pat.id}
                          onClick={() => onUpdateProfile({ wallpaperPattern: pat.id as UserProfile['wallpaperPattern'] })}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            isCur
                              ? isLight
                                ? 'border-rose-400 bg-rose-500 text-white font-semibold shadow-xs'
                                : 'border-[var(--m-accent)] bg-[var(--m-accent)]/20 text-white font-semibold'
                              : isLight
                              ? 'border-rose-100 bg-white/70 text-slate-700 hover:bg-white hover:border-rose-300'
                              : 'border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:border-white/20'
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          <span>{pat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Custom Atmospheric Glow Color */}
              <div className={`border-t pt-4 space-y-2 ${isLight ? 'border-rose-100' : 'border-white/8'}`}>
                <label className={`text-xs font-medium block ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                  Custom Ambient Glow Color
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {BRIGHT_ACCENTS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => onUpdateProfile({ wallpaperGlowColor: c.hex })}
                      className={`group relative flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition ${
                        isLight
                          ? 'border-rose-100 bg-white/70 text-slate-800 hover:border-rose-300'
                          : 'border-white/12 bg-white/[0.04] text-white hover:border-white/30'
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full shadow-sm"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.label}</span>
                    </button>
                  ))}
                  <div className="flex items-center gap-2 ml-auto">
                    <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      Custom Hex:
                    </span>
                    <input
                      type="color"
                      value={profile.wallpaperGlowColor || '#FF4D8D'}
                      onChange={(e) => onUpdateProfile({ wallpaperGlowColor: e.target.value })}
                      className="h-7 w-7 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Wallpaper Image URL with Adaptive Overlay */}
              <div className={`border-t pt-4 space-y-2 ${isLight ? 'border-rose-100' : 'border-white/8'}`}>
                <label className={`text-xs font-medium block ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                  Custom Wallpaper Image URL (Full Bleed)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... (optional custom wallpaper)"
                    className={`flex-1 rounded-xl border px-3.5 py-2 text-xs outline-none focus:border-[var(--m-accent)] ${
                      isLight
                        ? 'border-rose-200 bg-white text-slate-800 placeholder:text-slate-400'
                        : 'border-white/12 bg-black/60 text-white placeholder:text-white/30'
                    }`}
                  />
                  <button
                    onClick={handleApplyCustomImage}
                    className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                      isLight
                        ? 'border-rose-300 bg-rose-500 text-white hover:bg-rose-600 shadow-xs'
                        : 'border-white/15 bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Apply Image
                  </button>
                  {profile.wallpaperCustomImage && (
                    <button
                      onClick={() => {
                        setCustomImageUrl('');
                        onUpdateProfile({ wallpaperCustomImage: undefined });
                      }}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/20 transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
                  {isLight
                    ? 'Images are layered under a soft luminous frosted sheen for pristine typography readability.'
                    : 'Images are layered under an atmospheric dark tint to ensure high contrast and clear legibility.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FONTS & TYPOGRAPHY */}
        {activeTab === 'fonts' && (
          <div className="space-y-5">
            <div
              className={`rounded-2xl border p-5 backdrop-blur-xl ${
                isLight
                  ? 'bg-white/75 border-rose-200/70 shadow-sm'
                  : 'bg-white/[0.04] border-white/12'
              }`}
            >
              <h2
                className={`font-display text-base font-semibold flex items-center gap-2 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                <Type className="h-4 w-4 text-[var(--m-accent)]" />
                Sovereign Typography Pairings
              </h2>
              <p
                className={`mt-1 text-xs max-w-2xl leading-relaxed ${
                  isLight ? 'text-slate-600' : 'text-white/65'
                }`}
              >
                Personalize the typography of your workspace. Each selection pairs a distinct display font for headlines and tabs with a comfortable, high-readability body font.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FONT_OPTIONS.map((f) => {
                const isSelected = (profile.fontFamily || 'soft-rounded') === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => {
                      onUpdateProfile({
                        fontFamily: f.id,
                        fontDisplay: f.displayFont,
                      });
                    }}
                    className={`cursor-pointer rounded-2xl border p-5 transition-all duration-200 ${
                      isSelected
                        ? isLight
                          ? 'border-rose-400 bg-white/90 shadow-[0_0_24px_-4px_rgba(244,114,182,0.4)] ring-2 ring-rose-200'
                          : 'border-[var(--m-accent)] bg-white/[0.08] shadow-[0_0_24px_-6px_var(--m-accent)]'
                        : isLight
                        ? 'border-rose-100 bg-white/60 hover:border-rose-300 hover:bg-white/80 shadow-xs'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {f.name}
                      </h3>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
                          <Check className="h-3.5 w-3.5" /> Active
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mb-3.5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                      {f.description}
                    </p>
                    
                    {/* Live typography sample block */}
                    <div
                      className={`rounded-xl border p-3 ${
                        isLight
                          ? 'border-rose-100 bg-rose-50/50'
                          : 'border-white/8 bg-black/60'
                      }`}
                    >
                      <p
                        className={`text-base font-semibold tracking-wide mb-1 ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                        style={{ fontFamily: f.displayFont }}
                      >
                        {f.sample}
                      </p>
                      <p
                        className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-white/60'}`}
                        style={{ fontFamily: f.bodyFont }}
                      >
                        Quick brown fox jumps over the lazy cloud agent. 12:45 PM · 100% Sovereign.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: BRIGHTS & COMFORTABLE COLORS */}
        {activeTab === 'colors' && (
          <div className="space-y-6">
            <div
              className={`rounded-2xl border p-5 backdrop-blur-xl ${
                isLight
                  ? 'bg-white/75 border-rose-200/70 shadow-sm'
                  : 'bg-white/[0.04] border-white/12'
              }`}
            >
              <h2
                className={`font-display text-base font-semibold flex items-center gap-2 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                <Sun className="h-4 w-4 text-amber-500" />
                Bright, Softer & Comfortable Color Accents
              </h2>
              <p
                className={`mt-1 text-xs max-w-2xl leading-relaxed ${
                  isLight ? 'text-slate-600' : 'text-white/65'
                }`}
              >
                Choose vibrant, luminous accents that contrast comfortably against the wallpaper canvas. These accents style highlights, active indicators, interactive pills, and ambient glow reflections.
              </p>
            </div>

            {/* Curated Bright Swatches */}
            <div>
              <h3
                className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                  isLight ? 'text-slate-500' : 'text-white/50'
                }`}
              >
                Luminous Accent Swatches
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BRIGHT_ACCENTS.map((c) => {
                  const isSelected = profile.accentColor === c.hex;
                  return (
                    <div
                      key={c.hex}
                      onClick={() => onUpdateProfile({ accentColor: c.hex })}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                        isSelected
                          ? isLight
                            ? 'border-rose-400 bg-white/90 shadow-md ring-2 ring-rose-200'
                            : 'border-white bg-white/[0.09] shadow-lg'
                          : isLight
                          ? 'border-rose-100 bg-white/60 hover:border-rose-300'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="h-5 w-5 rounded-full shadow-md"
                          style={{ backgroundColor: c.hex, boxShadow: `0 0 12px ${c.hex}` }}
                        />
                        {isSelected && <Check className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <p className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {c.label}
                      </p>
                      <p className={`text-[10.5px] font-mono ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                        {c.hex}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card Surface Comfort & Brightness */}
            <div
              className={`rounded-2xl border p-5 space-y-4 ${
                isLight
                  ? 'bg-white/75 border-rose-200/70 shadow-sm'
                  : 'bg-white/[0.04] border-white/12'
              }`}
            >
              <h3
                className={`font-display text-sm font-semibold ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Card Comfort & Contrast Feel
              </h3>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                Adjust how bright and translucent the panels, cards, and dialogue bubbles feel over the background.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CARD_BRIGHTNESS_OPTIONS.map((opt) => {
                  const isSelected = (profile.cardBrightness || 'bright') === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => onUpdateProfile({ cardBrightness: opt.id })}
                      className={`cursor-pointer rounded-xl border p-4 transition-all ${
                        isSelected
                          ? isLight
                            ? 'border-rose-400 bg-white/90 shadow-md ring-2 ring-rose-200'
                            : 'border-[var(--m-accent)] bg-white/[0.09] shadow-md'
                          : isLight
                          ? 'border-rose-100 bg-white/60 hover:border-rose-300'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {opt.label}
                        </p>
                        {isSelected && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                      </div>
                      <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                        {opt.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COMPLETE PALETTES */}
        {activeTab === 'themes' && (
          <div className="space-y-4">
            <div
              className={`rounded-2xl border p-5 backdrop-blur-xl ${
                isLight
                  ? 'bg-white/75 border-rose-200/70 shadow-sm'
                  : 'bg-white/[0.04] border-white/12'
              }`}
            >
              <h2
                className={`font-display text-base font-semibold flex items-center gap-2 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                <Wand2 className="h-4 w-4 text-[var(--m-accent)]" />
                Holistic Aesthetic Palettes
              </h2>
              <p className={`mt-1 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/65'}`}>
                One-click palettes configured with soft luminous accents, harmonized foundations, and matched font displays.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {AESTHETIC_THEMES.map((theme) => {
                const isSelected = profile.theme === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() =>
                      onUpdateProfile({
                        theme: theme.id,
                        accentColor: theme.accent,
                        aesthetic: theme.label,
                      })
                    }
                    className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                      isSelected
                        ? isLight
                          ? 'border-rose-400 bg-white/90 shadow-md ring-2 ring-rose-200'
                          : 'border-[var(--m-accent)] bg-[var(--m-accent)]/15 shadow-[0_0_24px_-6px_var(--m-accent)]'
                        : isLight
                        ? 'border-rose-100 bg-white/60 hover:border-rose-300'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-4 w-4 rounded-full shadow"
                          style={{ backgroundColor: theme.accent }}
                        />
                        <span
                          className="h-3 w-3 rounded-full shadow opacity-70"
                          style={{ backgroundColor: theme.accentSoft }}
                        />
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                    </div>
                    <h3 className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {theme.label}
                    </h3>
                    <p className={`text-[11px] mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                      {theme.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: WATERMARKS & STICKERS */}
        {activeTab === 'stickers' && (
          <div
            className={`rounded-2xl border p-5 space-y-4 ${
              isLight
                ? 'bg-white/75 border-rose-200/70 shadow-sm'
                : 'bg-white/[0.03] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`font-display text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Aesthetic Sticker & Crest Watermarks
                </h2>
                <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                  Subtle emblems rendered across your workspace with opacity & placement controls
                </p>
              </div>
              <button
                onClick={() => setIsAddingSticker(!isAddingSticker)}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                  isLight
                    ? 'bg-rose-500 text-white shadow-xs hover:bg-rose-600'
                    : 'm-gradient-bg text-white shadow'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Watermark</span>
              </button>
            </div>

            {/* New Custom Sticker Form Drawer */}
            {isAddingSticker && (
              <div
                className={`rounded-xl border p-4 space-y-3 ${
                  isLight
                    ? 'border-rose-300 bg-rose-50/80 text-slate-800'
                    : 'border-[var(--m-accent)]/40 bg-[var(--m-accent)]/10 text-white'
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    value={newStickerLabel}
                    onChange={(e) => setNewStickerLabel(e.target.value)}
                    placeholder="Watermark Label (e.g. Peony Seal)"
                    className={`rounded-lg border px-3 py-1.5 text-xs outline-none ${
                      isLight
                        ? 'border-rose-200 bg-white text-slate-800 placeholder:text-slate-400'
                        : 'border-white/10 bg-black/40 text-white placeholder:text-white/30'
                    }`}
                  />
                  <input
                    value={newStickerEmoji}
                    onChange={(e) => setNewStickerEmoji(e.target.value)}
                    placeholder="Emoji Badge (e.g. 🌸, 🌿, 💎)"
                    className={`rounded-lg border px-3 py-1.5 text-xs outline-none ${
                      isLight
                        ? 'border-rose-200 bg-white text-slate-800 placeholder:text-slate-400'
                        : 'border-white/10 bg-black/40 text-white placeholder:text-white/30'
                    }`}
                  />
                  <select
                    value={newStickerPos}
                    onChange={(e) => setNewStickerPos(e.target.value as StickerWatermark['position'])}
                    className={`rounded-lg border px-3 py-1.5 text-xs outline-none ${
                      isLight
                        ? 'border-rose-200 bg-white text-slate-800'
                        : 'border-white/10 bg-black/40 text-white'
                    }`}
                  >
                    <option value="top-right">Top Right</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="header-accent">Header Accent</option>
                    <option value="sidebar-badge">Sidebar Badge</option>
                    <option value="chat-backdrop">Chat Backdrop</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                      Opacity:
                    </span>
                    <input
                      type="range"
                      min="0.05"
                      max="0.5"
                      step="0.02"
                      value={newStickerOpacity}
                      onChange={(e) => setNewStickerOpacity(parseFloat(e.target.value))}
                      className="w-24 accent-[var(--m-accent)]"
                    />
                    <span className={`text-[11px] font-mono ${isLight ? 'text-slate-800 font-semibold' : 'text-white/80'}`}>
                      {Math.round(newStickerOpacity * 100)}%
                    </span>
                  </div>
                  <button
                    onClick={handleAddCustomSticker}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold shadow-xs ${
                      isLight
                        ? 'bg-rose-500 text-white hover:bg-rose-600'
                        : 'bg-white text-black hover:bg-white/90'
                    }`}
                  >
                    Save Watermark
                  </button>
                </div>
              </div>
            )}

            {/* Sticker List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {stickers.map((st) => (
                <div
                  key={st.id}
                  className={`flex flex-col justify-between rounded-xl border p-3 transition ${
                    st.active
                      ? isLight
                        ? 'border-rose-200 bg-white/80 shadow-xs'
                        : 'border-white/20 bg-white/[0.04]'
                      : isLight
                      ? 'border-rose-100 bg-white/30 opacity-50'
                      : 'border-white/6 bg-white/[0.01] opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{st.emoji}</span>
                      <div>
                        <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                          {st.label}
                        </p>
                        <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                          {st.position}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleSticker(st.id)}
                      className={`h-5 w-9 rounded-full transition-colors p-0.5 ${
                        st.active ? 'bg-[var(--m-accent)]' : isLight ? 'bg-slate-300' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full bg-white transition-transform ${
                          st.active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {st.active && (
                    <div
                      className={`mt-3 flex items-center justify-between border-t pt-2 ${
                        isLight ? 'border-rose-100' : 'border-white/6'
                      }`}
                    >
                      <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                        Opacity
                      </span>
                      <input
                        type="range"
                        min="0.05"
                        max="0.4"
                        step="0.02"
                        value={st.opacity}
                        onChange={(e) => handleUpdateStickerOpacity(st.id, parseFloat(e.target.value))}
                        className="w-20 accent-[var(--m-accent)]"
                      />
                      <button
                        onClick={() => handleDeleteSticker(st.id)}
                        className={`transition ${isLight ? 'text-slate-400 hover:text-rose-500' : 'text-white/30 hover:text-rose-400'}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsThemeEngine;
