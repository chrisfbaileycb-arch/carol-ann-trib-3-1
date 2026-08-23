import React, { useMemo, useState } from 'react';
import {
  Sparkles, Trophy, GripVertical, Plus, Pin, Download, FileJson, FileText,
  Cloud, Loader2, Palette, Check,
} from 'lucide-react';
import { COMPANION_DOMAINS, getDomain } from '@/data/domains';
import { AESTHETIC_THEMES, SPORTS_TEAMS, ACCENT_PALETTES } from '@/data/intake';
import { useMaggie } from '@/contexts/MaggieContext';
import { exportJSON, exportMarkdown } from '@/lib/memoryStore';
import Icon from '@/components/common/Icon';

const MOOD_TAGS = ['Focused', 'Restoring', 'Momentum', 'Quiet', 'Ambitious', 'Grateful'];

export const PersonalSpace: React.FC = () => {
  const { profile, updateProfile, theme, checkIns, memories, sessions, addCheckIn, syncToCloud, syncing, lastSync, syncError } = useMaggie();

  const [order, setOrder] = useState<string[]>(() => COMPANION_DOMAINS.map((d) => d.id));
  const [dragging, setDragging] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [mood, setMood] = useState('Focused');
  const [note, setNote] = useState('');

  const today = sessions[0];
  const cards = useMemo(() => order.map((id) => getDomain(id)), [order]);

  const handleDrop = (targetId: string) => {
    if (!dragging || dragging === targetId) return;
    setOrder((prev) => {
      const next = prev.filter((id) => id !== dragging);
      next.splice(next.indexOf(targetId), 0, dragging);
      return next;
    });
    setDragging(null);
  };

  const logMood = () => {
    addCheckIn({ type: 'mindset', label: `Mood: ${mood}`, notes: note || 'Logged from the personal canvas.' });
    setNote('');
  };

  return (
    <div className="m-scroll h-full overflow-y-auto p-4 sm:p-6">
      {/* Banner */}
      <div
        className="relative overflow-hidden rounded-3xl border p-6 shadow-2xl sm:p-8"
        style={{ borderColor: `${theme.accent}44`, backgroundColor: theme.surfaceAlt, backgroundImage: theme.texture }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: theme.accentSoft }}>
              <Sparkles className="h-3.5 w-3.5" /> Personal Space &amp; Reflection Canvas
            </div>
            {editing ? (
              <input
                value={profile.name}
                onChange={(e) => updateProfile({ name: e.target.value })}
                placeholder="Your name"
                className="mt-2 w-full max-w-sm rounded-lg border border-white/15 bg-black/25 px-3 py-2 font-display text-2xl text-white outline-none"
              />
            ) : (
              <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
                {profile.name ? `${profile.name}'s Sanctuary` : 'Your Sanctuary'}
              </h1>
            )}
            {editing ? (
              <textarea
                value={profile.affirmation}
                onChange={(e) => updateProfile({ affirmation: e.target.value })}
                rows={2}
                className="mt-2 w-full max-w-lg rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm italic text-white/85 outline-none"
              />
            ) : (
              <p className="mt-2 max-w-xl font-display text-sm italic text-white/70">&ldquo;{profile.affirmation}&rdquo;</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => setEditing((v) => !v)}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {editing ? 'Done editing' : 'Edit canvas'}
            </button>
            <div className="flex flex-wrap justify-end gap-2">
              {profile.sportsTeams.map((t) => (
                <span key={t} className="m-lift flex items-center gap-1.5 rounded-full border border-orange-400/40 bg-orange-400/12 px-3 py-1.5 text-[11px] font-semibold text-orange-200">
                  <Trophy className="h-3 w-3" /> {t}
                </span>
              ))}
              <span
                className="m-lift rounded-full border px-3 py-1.5 text-[11px] font-semibold"
                style={{ borderColor: `${theme.accent}66`, background: `${theme.accent}22`, color: theme.accentSoft }}
              >
                {theme.label}
              </span>
              {profile.interests.slice(0, 3).map((i) => (
                <span key={i} className="m-lift rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/65">
                  {i}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Mood strip */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">Mood status</span>
          {MOOD_TAGS.map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className="rounded-full border px-2.5 py-1 text-[11px] transition"
              style={{
                borderColor: mood === m ? `${theme.accent}88` : 'rgba(255,255,255,0.12)',
                background: mood === m ? `${theme.accent}26` : 'transparent',
                color: mood === m ? theme.accentSoft : 'rgba(255,255,255,0.5)',
              }}
            >
              {m}
            </button>
          ))}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note to this mood…"
            className="min-w-[180px] flex-1 rounded-lg border border-white/12 bg-black/25 px-3 py-1.5 text-xs text-white placeholder:text-white/25 outline-none focus:border-white/30"
          />
          <button onClick={logMood} className="flex items-center gap-1 rounded-lg m-gradient-bg px-3 py-1.5 text-xs font-semibold text-white">
            <Plus className="h-3 w-3" /> Log
          </button>
        </div>
      </div>

      {/* Theme editor */}
      {editing && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
            <Palette className="h-3.5 w-3.5" /> Aesthetic &amp; affinity
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {AESTHETIC_THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => updateProfile({ theme: t.id, aesthetic: t.label, accentColor: t.accent })}
                className="rounded-xl border p-3 text-left transition"
                style={{
                  borderColor: profile.theme === t.id ? `${t.accent}99` : 'rgba(255,255,255,0.1)',
                  background: profile.theme === t.id ? `${t.accent}18` : 'rgba(255,255,255,0.02)',
                }}
              >
                <span className="flex items-center gap-2 text-xs font-semibold text-white">
                  <span className="h-3 w-3 rounded-full" style={{ background: t.accent }} />
                  {t.label}
                  {profile.theme === t.id && <Check className="ml-auto h-3.5 w-3.5" style={{ color: t.accent }} />}
                </span>
                <span className="mt-1 block text-[10px] text-white/40">{t.description}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Affinity badges</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SPORTS_TEAMS.map((t) => {
              const on = profile.sportsTeams.includes(t);
              return (
                <button
                  key={t}
                  onClick={() =>
                    updateProfile({
                      sportsTeams: on ? profile.sportsTeams.filter((x) => x !== t) : [...profile.sportsTeams, t],
                    })
                  }
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition ${on ? 'border-orange-400/50 bg-orange-400/15 text-orange-200' : 'border-white/12 text-white/45 hover:text-white'}`}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Accent palette</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACCENT_PALETTES.map((a) => (
              <button
                key={a.id}
                onClick={() => updateProfile({ accentColor: a.value })}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${profile.accentColor === a.value ? 'border-white/40 text-white' : 'border-white/12 text-white/45'}`}
              >
                <span className="h-3 w-3 rounded-full" style={{ background: a.value }} /> {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stat strip */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Today\'s intention', value: today?.intention ? 'Set' : 'Unset', detail: today?.intention || 'Open the rail and set one.' },
          { label: 'Mood / Energy', value: `${today?.mood_score ?? 6} · ${today?.energy_level ?? 6}`, detail: 'out of 10, logged today' },
          { label: 'Check-ins', value: String(checkIns.length), detail: 'physical, mindset, routine' },
          { label: 'Memory ledger', value: String(memories.length), detail: 'long-term recall entries' },
        ].map((s) => (
          <div key={s.label} className="m-lift rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-white">{s.value}</p>
            <p className="mt-1 line-clamp-2 text-[11px] text-white/40">{s.detail}</p>
          </div>
        ))}
      </div>

      {/* Reorderable domain cards */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-white">Modular canvas</h2>
        <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">Drag cards to rearrange</span>
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((domain) => (
          <div
            key={domain.id}
            draggable
            onDragStart={() => setDragging(domain.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(domain.id)}
            className={`m-lift group rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-lg ${dragging === domain.id ? 'opacity-40' : ''}`}
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-md" style={{ background: domain.color }}>
                <Icon name={domain.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-semibold text-white">{domain.label}</h3>
                <p className="text-[11px] leading-snug text-white/40">{domain.tagline}</p>
              </div>
              <GripVertical className="h-4 w-4 cursor-grab text-white/15 group-hover:text-white/40" />
            </div>
            <div className="mt-3 space-y-1.5">
              {domain.quickPrompts.map((p) => (
                <div key={p} className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-[11px] text-white/55">
                  <Pin className="h-3 w-3 shrink-0 opacity-40" /> {p}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sovereign export */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-white">Sovereign export &amp; sync</h3>
            <p className="text-[11px] text-white/40">
              Everything lives locally first. Export the complete archive or push an encrypted snapshot to your cloud ledger.
              {lastSync && <span className="ml-1 text-emerald-300/70">Last sync {new Date(lastSync).toLocaleTimeString()}.</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportJSON} className="flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-2 text-xs font-medium text-white/70 transition hover:border-white/30 hover:text-white">
              <FileJson className="h-3.5 w-3.5" /> Export JSON
            </button>
            <button onClick={exportMarkdown} className="flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-2 text-xs font-medium text-white/70 transition hover:border-white/30 hover:text-white">
              <FileText className="h-3.5 w-3.5" /> Export Markdown
            </button>
            <button onClick={() => void syncToCloud()} disabled={syncing} className="flex items-center gap-1.5 rounded-lg m-gradient-bg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
              {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Cloud className="h-3.5 w-3.5" />}
              {syncing ? 'Syncing…' : 'Sync to cloud'}
            </button>
          </div>
        </div>
        {syncError && (
          <p className="mt-3 rounded-lg border border-amber-400/25 bg-amber-400/8 px-3 py-2 text-[11px] text-amber-200/85">
            {syncError}
          </p>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {memories.slice(0, 6).map((m) => (
            <div key={m.id} className="rounded-xl border border-white/8 bg-black/20 p-3">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: theme.accentSoft }}>{m.category}</span>
              <p className="mt-1 text-[11px] leading-snug text-white/60">{m.content}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 pb-4 text-[10px] text-white/25">
        <Download className="h-3 w-3" /> Local-first storage active · {checkIns.length + memories.length + sessions.length} records retained on this device
      </div>
    </div>
  );
};

export default PersonalSpace;
