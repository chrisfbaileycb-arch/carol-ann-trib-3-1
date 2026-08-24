import React, { useCallback, useMemo, useState } from 'react';
import {
  Plus, Trash2, MessageSquare, ShieldCheck, Sparkles, Eraser, Save, Palette, Clock,
} from 'lucide-react';
import AgentAvatar from '@/components/agents/AgentAvatar';
import {
  AGENT_CATEGORIES, AGENT_DISCLAIMER, TONE_PRESETS, VOICE_OPTIONS, toneByKey,
  type AgentCategory,
} from '@/data/agents';
import {
  type AgentConfig, loadAgents, saveAgents, blankAgent, purgeAgent, clearMemory,
  loadMemory, detectTimeZone, timeZoneLabel,
} from '@/lib/agentStore';

const SKIN_SWATCHES: [string, string][] = [
  ['#F472B6', '#A855F7'], ['#38BDF8', '#818CF8'], ['#34D399', '#22D3EE'],
  ['#F97316', '#EF4444'], ['#FBBF24', '#F472B6'], ['#A78BFA', '#6366F1'],
];
const PROPS = ['hat', 'cap', 'bow', 'halo', 'headset', 'glasses', 'visor'] as const;

/** Agent Studio: build, style, tune and delete your own little agents. */
const AgentStudio: React.FC<{ onOpenChat: (agentId: string) => void }> = ({ onOpenChat }) => {
  const [agents, setAgents] = useState<AgentConfig[]>(() => loadAgents());
  const [filter, setFilter] = useState<AgentCategory | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [flash, setFlash] = useState('');

  const persist = useCallback((next: AgentConfig[]) => {
    setAgents(next);
    saveAgents(next);
  }, []);

  const patch = useCallback((id: string, p: Partial<AgentConfig>) => {
    persist(agents.map((a) => (a.id === id ? { ...a, ...p } : a)));
  }, [agents, persist]);

  const editing = useMemo(() => agents.find((a) => a.id === editingId) ?? null, [agents, editingId]);
  const visible = useMemo(
    () => agents.filter((a) => filter === 'all' || a.category === filter),
    [agents, filter],
  );

  const say = (m: string) => { setFlash(m); window.setTimeout(() => setFlash(''), 2400); };

  const createAgent = () => {
    const a = blankAgent();
    a.name = 'New agent';
    a.role = 'Custom specialist';
    a.subject = 'Untitled subject';
    a.blurb = 'Describe what this agent owns so its memory stays on one subject.';
    persist([...agents, a]);
    setEditingId(a.id);
    setFilter('all');
  };

  const removeAgent = (a: AgentConfig) => {
    purgeAgent(a.id);
    persist(agents.filter((x) => x.id !== a.id));
    if (editingId === a.id) setEditingId(null);
    say(`${a.name} and all of its memory were deleted from this device.`);
  };

  return (
    <div className="m-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-[1500px] px-5 py-5">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">Agent studio</p>
            <h2 className="font-display text-2xl font-semibold text-white">Your little agents</h2>
            <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-white/45">
              Each agent keeps its own workflow memory locked to one subject — the salon agent never sees the
              school calendar. Tone, voice and character are yours to edit, and every agent is yours to clear or delete.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-white/12 px-2.5 py-1.5 text-[10.5px] text-white/45">
              <Clock className="h-3 w-3" /> {detectTimeZone()} · {timeZoneLabel()} (auto)
            </span>
            <button onClick={createAgent} className="flex items-center gap-1.5 rounded-lg m-gradient-bg px-3 py-2 text-[11.5px] font-semibold text-white">
              <Plus className="h-3.5 w-3.5" /> Build a custom agent
            </button>
          </div>
        </div>

        {/* Sovereignty banner */}
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-4 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-200">
            <ShieldCheck className="h-3.5 w-3.5" /> Your data, your call
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/50">{AGENT_DISCLAIMER.join(' ')}</p>
        </div>

        {flash && (
          <p className="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-400/8 px-3 py-2 text-[11.5px] text-emerald-200">{flash}</p>
        )}

        {/* Category filter */}
        <div className="mt-4 flex flex-wrap gap-2">
          {([{ key: 'all', label: 'All agents' }, ...AGENT_CATEGORIES] as { key: AgentCategory | 'all'; label: string }[]).map((c) => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                filter === c.key ? 'border-[var(--m-accent)]/60 bg-[var(--m-accent)]/15 text-white' : 'border-white/12 text-white/45 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
          {/* Gallery */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((a) => {
              const memCount = loadMemory(a.id).length;
              return (
                <div
                  key={a.id}
                  className={`m-agent-glow m-lift relative overflow-hidden rounded-2xl border p-4 transition ${
                    editingId === a.id ? 'border-[var(--m-accent)]/60 bg-white/[0.06]' : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  <span
                    className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25 blur-2xl"
                    style={{ background: `linear-gradient(135deg, ${a.skin.body[0]}, ${a.skin.body[1]})` }}
                  />
                  <div className="flex items-start gap-3">
                    <AgentAvatar skin={a.skin} size={58} active={a.disclaimerAccepted} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-white">{a.name || 'Unnamed agent'}</p>
                      <p className="truncate text-[10.5px] text-white/40">{a.role}</p>
                      <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-white/50">{a.blurb}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-white/12 px-2 py-0.5 text-[9.5px] text-white/45">{toneByKey(a.toneKey).label}</span>
                    <span className="rounded-full border border-white/12 px-2 py-0.5 text-[9.5px] text-white/45">{VOICE_OPTIONS.find((v) => v.key === a.voiceKey)?.label}</span>
                    <span className="rounded-full border border-white/12 px-2 py-0.5 text-[9.5px] text-white/45">{memCount} memories</span>
                    {!a.disclaimerAccepted && (
                      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9.5px] text-amber-200">Needs your OK</span>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => onOpenChat(a.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg m-gradient-bg py-2 text-[11px] font-semibold text-white"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Chat
                    </button>
                    <button
                      onClick={() => setEditingId(editingId === a.id ? null : a.id)}
                      className="rounded-lg border border-white/12 px-2.5 text-[11px] text-white/55 transition hover:border-[var(--m-accent)]/50 hover:text-white"
                    >
                      Tune
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Editor */}
          <aside className="h-fit rounded-2xl border border-white/10 bg-[#15161C]/70 p-4">
            {!editing ? (
              <div className="text-center">
                <Sparkles className="mx-auto h-5 w-5 text-white/25" />
                <p className="mt-2 text-[12px] font-semibold text-white/70">Pick “Tune” on any agent</p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/40">
                  Edit its name, subject, personality tone, voice and little character — or build one from scratch.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <AgentAvatar skin={editing.skin} size={52} />
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-white">Tuning {editing.name}</p>
                    <p className="text-[10px] text-white/35">{editing.custom ? 'Custom agent' : 'Preset agent (edits stay local)'}</p>
                  </div>
                </div>

                {[
                  { k: 'name' as const, label: 'Name' },
                  { k: 'role' as const, label: 'Role' },
                  { k: 'subject' as const, label: 'Memory subject (isolated)' },
                ].map((f) => (
                  <label key={f.k} className="block">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">{f.label}</span>
                    <input
                      value={editing[f.k]}
                      onChange={(e) => patch(editing.id, { [f.k]: e.target.value } as Partial<AgentConfig>)}
                      className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-2.5 py-1.5 text-[12px] text-white outline-none focus:border-[var(--m-accent)]/50"
                    />
                  </label>
                ))}

                <label className="block">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">Description behind the character</span>
                  <textarea
                    value={editing.blurb}
                    onChange={(e) => patch(editing.id, { blurb: e.target.value })}
                    rows={2}
                    className="mt-1 w-full resize-none rounded-lg border border-white/12 bg-black/30 px-2.5 py-1.5 text-[12px] text-white outline-none focus:border-[var(--m-accent)]/50"
                  />
                </label>

                <div>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">Personality tone</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {TONE_PRESETS.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => patch(editing.id, { toneKey: t.key })}
                        title={t.hint}
                        className={`rounded-full border px-2.5 py-1 text-[10.5px] transition ${
                          editing.toneKey === t.key ? 'border-[var(--m-accent)]/60 bg-[var(--m-accent)]/15 text-white' : 'border-white/12 text-white/45 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <input
                    value={editing.toneNote}
                    onChange={(e) => patch(editing.id, { toneNote: e.target.value })}
                    placeholder="Extra personality note (optional)…"
                    className="mt-2 w-full rounded-lg border border-white/12 bg-black/30 px-2.5 py-1.5 text-[11.5px] text-white outline-none placeholder:text-white/25 focus:border-[var(--m-accent)]/50"
                  />
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">Voice</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {VOICE_OPTIONS.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => patch(editing.id, { voiceKey: v.key })}
                        className={`rounded-full border px-2.5 py-1 text-[10.5px] transition ${
                          editing.voiceKey === v.key ? 'border-[var(--m-accent)]/60 bg-[var(--m-accent)]/15 text-white' : 'border-white/12 text-white/45 hover:text-white'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-white/30">
                    <Palette className="h-3 w-3" /> Character
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {SKIN_SWATCHES.map((s) => (
                      <button
                        key={s.join()}
                        onClick={() => patch(editing.id, { skin: { ...editing.skin, body: s } })}
                        className={`h-7 w-7 rounded-full border-2 ${editing.skin.body.join() === s.join() ? 'border-white' : 'border-white/15'}`}
                        style={{ background: `linear-gradient(135deg, ${s[0]}, ${s[1]})` }}
                        aria-label="Character colour"
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PROPS.map((p) => (
                      <button
                        key={p}
                        onClick={() => patch(editing.id, { skin: { ...editing.skin, prop: p } })}
                        className={`rounded-full border px-2 py-1 text-[10px] capitalize transition ${
                          editing.skin.prop === p ? 'border-[var(--m-accent)]/60 text-white' : 'border-white/12 text-white/40 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Disclaimer control */}
                <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <p className="text-[10.5px] font-semibold text-white/70">Disclaimer state</p>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-white/40">
                    {editing.disclaimerAccepted ? 'Accepted — this agent may run.' : 'Not accepted — the chat is gated until you agree.'}
                  </p>
                  <button
                    onClick={() => patch(editing.id, { disclaimerAccepted: !editing.disclaimerAccepted })}
                    className="mt-2 w-full rounded-lg border border-white/12 py-1.5 text-[10.5px] font-medium text-white/70 transition hover:border-[var(--m-accent)]/50 hover:text-white"
                  >
                    {editing.disclaimerAccepted ? 'Revoke acceptance' : 'Accept for this agent'}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { clearMemory(editing.id); say(`${editing.name}'s memory cleared.`); }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/12 py-2 text-[11px] font-medium text-white/65 transition hover:border-amber-400/40 hover:text-amber-200"
                  >
                    <Eraser className="h-3.5 w-3.5" /> Clear memory
                  </button>
                  <button
                    onClick={() => removeAgent(editing)}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-white/12 px-3 py-2 text-[11px] font-medium text-white/65 transition hover:border-rose-400/40 hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>

                <button
                  onClick={() => { onOpenChat(editing.id); say('Opened in the hub.'); }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg m-gradient-bg py-2 text-[11.5px] font-semibold text-white"
                >
                  <Save className="h-3.5 w-3.5" /> Saved — open in hub
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AgentStudio;
