import React, { useState } from 'react';
import {
  Palette, Sliders, Volume2, Shield, Plus, Check,
  Trash2, Sparkles, Image as ImageIcon, CheckCircle2, Lock
} from 'lucide-react';
import type { StickerWatermark, UserProfile } from '@/data/schemas';
import { AESTHETIC_THEMES, SPORTS_TEAMS, type AestheticTheme } from '@/data/intake';
import { GEMINI_VOICE_OPTIONS, voiceByName } from '@/data/agents';
import { loadStickers, saveStickers, getDeviceKey, uid } from '@/lib/memoryStore';

interface SettingsThemeEngineProps {
  profile: UserProfile;
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  currentTheme: AestheticTheme;
}

export const SettingsThemeEngine: React.FC<SettingsThemeEngineProps> = ({
  profile,
  onUpdateProfile,
  currentTheme,
}) => {
  const [stickers, setStickers] = useState<StickerWatermark[]>(() => loadStickers());
  const [newStickerLabel, setNewStickerLabel] = useState('');
  const [newStickerEmoji, setNewStickerEmoji] = useState('🌟');
  const [newStickerPos, setNewStickerPos] = useState<StickerWatermark['position']>('top-right');
  const [newStickerOpacity, setNewStickerOpacity] = useState<number>(0.15);
  const [isAddingSticker, setIsAddingSticker] = useState(false);
  const [testVoiceSpeaking, setTestVoiceSpeaking] = useState<string | null>(null);

  const deviceKey = getDeviceKey();

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
      `This is the ${v.name} voice profile. Low latency, multimodal execution ready.`
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

  return (
    <div className="flex h-full flex-col bg-[#11121A] text-white select-none overflow-hidden">
      {/* Top Banner */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 bg-[#151622] px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-pink-500/20 text-pink-300">
            <Palette className="h-4 w-4" />
          </span>
          <div>
            <h1 className="font-display text-sm font-semibold">Aesthetic Engine & Voice Customization Matrix</h1>
            <p className="text-[10px] text-white/45">Dynamic CSS Themes · Sticker Watermark Layers · Gemini Voice Engine</p>
          </div>
        </div>
      </div>

      {/* Main Content Scroll Area */}
      <div className="m-scroll flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Section 1: Aesthetic Theme Engine */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm font-bold text-white">Dynamic CSS Theme Engine</h2>
              <p className="text-[11px] text-white/50">Curated palettes with real-time accent variables and ambient warmth</p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold text-white shadow"
              style={{ backgroundColor: currentTheme.accent }}
            >
              Active: {currentTheme.label}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {AESTHETIC_THEMES.map((theme) => {
              const isSelected = profile.theme === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => onUpdateProfile({ theme: theme.id, accentColor: theme.accent })}
                  className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                    isSelected
                      ? 'border-[var(--m-accent)] bg-[var(--m-accent)]/15 shadow-md'
                      : 'border-white/8 bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="h-4 w-4 rounded-full shadow"
                      style={{ backgroundColor: theme.accent }}
                    />
                    {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                  </div>
                  <h3 className="mt-2.5 font-semibold text-xs text-white">{theme.label}</h3>
                  <p className="text-[10.5px] text-white/50 mt-1 leading-relaxed">{theme.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Sticker & Badge Watermark Customization */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm font-bold text-white">Aesthetic Sticker & Crest Watermarks</h2>
              <p className="text-[11px] text-white/50">
                Subtle background watermarks rendered on your workspace with opacity & placement controls
              </p>
            </div>
            <button
              onClick={() => setIsAddingSticker(!isAddingSticker)}
              className="flex items-center gap-1 rounded-lg m-gradient-bg px-3 py-1.5 text-[11px] font-semibold text-white shadow"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Watermark</span>
            </button>
          </div>

          {/* New Custom Sticker Form Drawer */}
          {isAddingSticker && (
            <div className="rounded-xl border border-[var(--m-accent)]/40 bg-[var(--m-accent)]/10 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  value={newStickerLabel}
                  onChange={(e) => setNewStickerLabel(e.target.value)}
                  placeholder="Watermark Label (e.g. Broncos Crest)"
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white outline-none"
                />
                <input
                  value={newStickerEmoji}
                  onChange={(e) => setNewStickerEmoji(e.target.value)}
                  placeholder="Emoji Badge (e.g. 🐴, 🌿, 💎)"
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white outline-none"
                />
                <select
                  value={newStickerPos}
                  onChange={(e) => setNewStickerPos(e.target.value as StickerWatermark['position'])}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white outline-none"
                >
                  <option value="top-right">Top Right</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="header-accent">Header Accent</option>
                  <option value="center-subtle">Center Subtle</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <span>Opacity: {Math.round(newStickerOpacity * 100)}%</span>
                  <input
                    type="range"
                    min="0.05"
                    max="0.4"
                    step="0.01"
                    value={newStickerOpacity}
                    onChange={(e) => setNewStickerOpacity(parseFloat(e.target.value))}
                    className="w-28 accent-[var(--m-accent-soft)]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddingSticker(false)}
                    className="px-3 py-1 text-xs text-white/50 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCustomSticker}
                    className="rounded-lg bg-emerald-500 px-3.5 py-1 text-xs font-semibold text-black"
                  >
                    Add Watermark
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Stickers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {stickers.map((stk) => (
              <div
                key={stk.id}
                className={`rounded-xl border p-3.5 transition ${
                  stk.active
                    ? 'border-white/20 bg-white/[0.04]'
                    : 'border-white/6 bg-white/[0.01] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{stk.emoji}</span>
                    <div>
                      <h4 className="font-semibold text-xs text-white">{stk.label}</h4>
                      <p className="text-[10px] text-white/40 capitalize">{stk.position.replace('-', ' ')}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={stk.active}
                    onChange={() => handleToggleSticker(stk.id)}
                    className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                  />
                </div>

                {stk.active && (
                  <div className="mt-3 flex items-center justify-between border-t border-white/6 pt-2 text-[10.5px]">
                    <span className="text-white/45">Opacity: {Math.round(stk.opacity * 100)}%</span>
                    <input
                      type="range"
                      min="0.05"
                      max="0.4"
                      step="0.01"
                      value={stk.opacity}
                      onChange={(e) => handleUpdateStickerOpacity(stk.id, parseFloat(e.target.value))}
                      className="w-20 accent-[var(--m-accent-soft)]"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Gemini Multimodal Live API Voice Matrix */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          <div>
            <h2 className="font-display text-sm font-bold text-white">Gemini Multimodal Live Voice Matrix</h2>
            <p className="text-[11px] text-white/50">
              Low-latency vocal identities mapped across the sovereign agent roster
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {GEMINI_VOICE_OPTIONS.map((v) => (
              <div
                key={v.key}
                className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5 space-y-2 hover:border-white/20 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-xs text-white">{v.name}</h4>
                    <p className="text-[10px] text-white/45">{v.gender} · {v.timbre}</p>
                  </div>
                  <button
                    onClick={() => playVoiceSample(v.name)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/15 transition"
                    title="Test Voice Sample"
                  >
                    <Volume2
                      className={`h-3.5 w-3.5 ${testVoiceSpeaking === v.name ? 'text-[var(--m-accent-soft)] animate-pulse' : 'text-white/70'}`}
                    />
                  </button>
                </div>
                <p className="text-[10.5px] text-white/60 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Sovereign Security & Supabase Sync */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Supabase Connection & Privacy Isolation
            </h3>
            <p className="text-[11px] text-white/60 mt-1 max-w-xl">
              All CRM tracking hooks have been deleted. Supabase credentials are bound exclusively via <code>.env</code> with zero inline leakage.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-400 font-mono">
              Secure Isolated
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsThemeEngine;
