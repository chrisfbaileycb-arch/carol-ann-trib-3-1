import React, { useCallback, useMemo, useState } from 'react';
import {
  Plus, Trash2, MessageSquare, ShieldCheck, Sparkles, Eraser, Save, Palette, Clock,
  Search, X, Brain, Check,
} from 'lucide-react';
import AgentAvatar from '@/components/agents/AgentAvatar';
import {
  AGENT_CATEGORIES, AGENT_DISCLAIMER, TONE_PRESETS, VOICE_OPTIONS, toneByKey,
  type AgentCategory,
} from '@/data/agents';
import {
  type AgentConfig, loadAgents, saveAgents, blankAgent, purgeAgent, clearMemory,
  loadMemory, addMemory, removeMemory, detectTimeZone, timeZoneLabel,
} from '@/lib/agentStore';

const SKIN_SWATCHES: [string, string][] = [
  ['#F472B6', '#A855F7'], ['#38BDF8', '#818CF8'], ['#34D399', '#22D3EE'],
  ['#F97316', '#EF4444'], ['#FBBF24', '#F472B6'], ['#A78BFA', '#6366F1'],
  ['#06B6D4', '#3B82F6'], ['#10B981', '#059669'], ['#F59E0B', '#D97706'],
];
const PROPS = ['hat', 'cap', 'bow', 'halo', 'headset', 'glasses', 'visor'] as const;

/** Agent Studio: build, style, tune and delete your own little agents. */
const AgentStudio: React.FC<{ onOpenChat: (agentId: string) => void }> = ({ onOpenChat }) => {
  const [agents, setAgents] = useState<AgentConfig[]>(() => loadAgents());
  const [filter, setFilter] = useState<AgentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMemoryNote, setNewMemoryNote] = useState('');
  const [memoryRev, setMemoryRev] = useState(0);
  const [flash, setFlash] = useState('');

  const persist = useCallback((next: AgentConfig[]) => {
    setAgents(next);
    saveAgents(next);
  }, []);

  const patch = useCallback((id: string, p: Partial<AgentConfig>) => {
    persist(agents.map((a) => (a.id === id ? { ...a, ...p } : a)));
  }, [agents, persist]);

  const editing = useMemo(() => agents.find((a) => a.id === editingId) ?? null, [agents, editingId]);

  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return agents.filter((a) => {
      const matchCat = filter === 'all' || a.category === filter;
      if (!matchCat) return false;
      if (!q) return true;
      const vendor = (a as unknown as { vendor?: string }).vendor || '';
      return (
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.subject.toLowerCase().includes(q) ||
        a.blurb.toLowerCase().includes(q) ||
        vendor.toLowerCase().includes(q)
      );
    });
  }, [agents, filter, searchQuery]);

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

  const handleAddMemory = () => {
    if (!editing || !newMemoryNote.trim()) return;
    addMemory(editing.id, newMemoryNote.trim());
    setNewMemoryNote('');
    setMemoryRev((r) => r + 1);
    say('New workflow memory recorded.');
  };

  const handleRemoveMemory = (memId: string) => {
    if (!editing) return;
    removeMemory(editing.id, memId);
    setMemoryRev((r) => r + 1);
    say('Memory item removed.');
  };

  const handleClearMemory = () => {
    if (!editing) return;
    clearMemory(editing.id);
    setMemoryRev((r) => r + 1);
    say(`${editing.name}'s memory cleared.`);
  };

  const editingMemories = useMemo(() => {
    if (!editing) return [];
    // Dependency on memoryRev forces refresh when items are added/cleared
    void memoryRev;
    return loadMemory(editing.id);
  }, [editing, memoryRev]);

  return (
    <div className="m-scroll h-full overflow-y-auto bg-zinc-950/40 backdrop-blur-md text-white">
      <div className="mx-auto max-w-[1600px] px-5 py-5">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">Agent Studio Roster</p>
              <span className="rounded-full border border-sky-400/25 bg-sky-400/10 px-2 py-0.5 text-[9.5px] font-medium text-sky-200">
                {agents.length} Specialists Ready
              </span>
            </div>
            <h2 className="mt-0.5 font-display text-2xl font-semibold text-white">Your Little Agents</h2>
            <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-white/50">
              Each specialist keeps its own isolated workflow memory, calibrated personality, voice, and animated character icon. Sourced from the top daily agent rankings across Vercel, Anthropic, Microsoft, Matt Pocock, Supabase, Prisma, and Cloudflare.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.03] px-2.5 py-1.5 text-[10.5px] text-white/50">
              <Clock className="h-3 w-3 text-white/40" /> {detectTimeZone()} · {timeZoneLabel()}
            </span>
            <button onClick={createAgent} className="flex items-center gap-1.5 rounded-lg m-gradient-bg px-3 py-2 text-[11.5px] font-semibold text-white transition hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> Build a custom agent
            </button>
          </div>
        </div>

        {/* Sovereignty banner */}
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] px-4 py-2.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-200">
            <ShieldCheck className="h-3.5 w-3.5" /> Sovereign Workflow Memory & Cloud Agent Execution
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-white/50">{AGENT_DISCLAIMER.join(' ')}</p>
        </div>

        {flash && (
          <p className="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-[11.5px] text-emerald-200">{flash}</p>
        )}

        {/* Search & Filter Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5">
            {([{ key: 'all', label: 'All agents' }, ...AGENT_CATEGORIES] as { key: AgentCategory | 'all'; label: string }[]).map((c) => {
              const count = c.key === 'all' ? agents.length : agents.filter((x) => x.category === c.key).length;
              return (
                <button
                  key={c.key}
                  onClick={() => setFilter(c.key)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                    filter === c.key ? 'border-[var(--m-accent)]/60 bg-[var(--m-accent)]/20 text-white shadow-sm' : 'border-white/10 bg-white/[0.02] text-white/50 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <span>{c.label}</span>
                  <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[9.5px] font-mono text-white/60">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, role, vendor..."
              className="w-full rounded-xl border border-white/12 bg-white/[0.04] py-1.5 pl-8.5 pr-8 text-[12px] text-white outline-none placeholder:text-white/35 focus:border-[var(--m-accent)]/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-white/40 hover:text-white"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-2 text-[11px] text-white/40">
          Showing {visible.length} of {agents.length} agents
        </div>

        <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_390px]">
          {/* Gallery Grid */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((a) => {
              const memCount = loadMemory(a.id).length;
              const vendor = (a as unknown as { vendor?: string }).vendor;
              const wis = (a as unknown as { wis?: number }).wis;

              return (
                <div
                  key={a.id}
                  className={`m-agent-glow relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 transition ${
                    editingId === a.id ? 'border-[var(--m-accent)]/80 bg-white/[0.07] ring-1 ring-[var(--m-accent)]/40' : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <span
                    className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-20 blur-2xl"
                    style={{ background: `linear-gradient(135deg, ${a.skin.body[0]}, ${a.skin.body[1]})` }}
                  />

                  <div>
                    <div className="flex items-start gap-3">
                      <AgentAvatar skin={a.skin} size={54} active={a.disclaimerAccepted} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="truncate text-[13.5px] font-semibold text-white">{a.name || 'Unnamed agent'}</p>
                          {wis && (
                            <span className="shrink-0 rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.2 text-[9px] font-mono text-white/60">
                              WIS {wis.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[10.5px] text-[var(--m-accent-soft)]">{a.role}</p>
                        {vendor && (
                          <p className="mt-0.5 text-[9.5px] font-mono uppercase tracking-wider text-white/40">
                            {vendor}
                          </p>
                        )}
                        <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-white/50">{a.blurb}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9.5px] text-white/50">{toneByKey(a.toneKey).label}</span>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9.5px] text-white/50">{VOICE_OPTIONS.find((v) => v.key === a.voiceKey)?.label}</span>
                      <span className="flex items-center gap-1 rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-[9.5px] text-purple-200">
                        <Brain className="h-2.5 w-2.5" /> {memCount} mem
                      </span>
                      {!a.disclaimerAccepted && (
                        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9.5px] text-amber-200">Needs OK</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 border-t border-white/6 pt-2.5">
                    <button
                      onClick={() => onOpenChat(a.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg m-gradient-bg py-2 text-[11px] font-semibold text-white transition hover:opacity-90"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Chat
                    </button>
                    <button
                      onClick={() => setEditingId(editingId === a.id ? null : a.id)}
                      className={`rounded-lg border px-3 text-[11px] font-medium transition ${
                        editingId === a.id ? 'border-[var(--m-accent)] bg-[var(--m-accent)]/20 text-white' : 'border-white/12 text-white/60 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      Tune
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Editor Drawer */}
          <aside className="sticky top-4 max-h-[calc(100vh-2.5rem)] overflow-y-auto m-scroll rounded-2xl border border-white/12 bg-[#12131A] p-4.5 shadow-xl">
            {!editing ? (
              <div className="py-12 text-center">
                <Sparkles className="mx-auto h-6 w-6 text-white/30" />
                <p className="mt-3 text-[13px] font-semibold text-white/80">Pick “Tune” on any agent</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-white/45 max-w-xs mx-auto">
                  Edit its memory variables, personality tone, voice, and little character icon — or inspect its domain knowledge.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-white/8 pb-3">
                  <div className="flex items-center gap-3">
                    <AgentAvatar skin={editing.skin} size={50} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-white">Tuning {editing.name}</p>
                      <p className="text-[10px] text-white/40">{editing.custom ? 'Custom agent' : 'Preset specialist (edits stay local)'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-white/10 p-1 text-white/40 hover:text-white"
                    title="Close editor"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {[
                  { k: 'name' as const, label: 'Name' },
                  { k: 'role' as const, label: 'Role' },
                  { k: 'subject' as const, label: 'Memory subject scope (isolated)' },
                ].map((f) => (
                  <label key={f.k} className="block">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">{f.label}</span>
                    <input
                      value={editing[f.k]}
                      onChange={(e) => patch(editing.id, { [f.k]: e.target.value } as Partial<AgentConfig>)}
                      className="mt-1 w-full rounded-lg border border-white/12 bg-black/40 px-2.5 py-1.5 text-[12px] text-white outline-none focus:border-[var(--m-accent)]/60"
                    />
                  </label>
                ))}

                <label className="block">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">Blurb / Description</span>
                  <textarea
                    value={editing.blurb}
                    onChange={(e) => patch(editing.id, { blurb: e.target.value })}
                    rows={2}
                    className="mt-1 w-full resize-none rounded-lg border border-white/12 bg-black/40 px-2.5 py-1.5 text-[12px] text-white outline-none focus:border-[var(--m-accent)]/60"
                  />
                </label>

                {/* Personality Tone */}
                <div>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">Personality Tone</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {TONE_PRESETS.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => patch(editing.id, { toneKey: t.key })}
                        title={t.hint}
                        className={`rounded-full border px-2.5 py-1 text-[10.5px] transition ${
                          editing.toneKey === t.key ? 'border-[var(--m-accent)]/60 bg-[var(--m-accent)]/20 text-white font-medium' : 'border-white/12 text-white/50 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <input
                    value={editing.toneNote}
                    onChange={(e) => patch(editing.id, { toneNote: e.target.value })}
                    placeholder="Extra personality nuance (optional)…"
                    className="mt-2 w-full rounded-lg border border-white/12 bg-black/40 px-2.5 py-1.5 text-[11.5px] text-white outline-none placeholder:text-white/30 focus:border-[var(--m-accent)]/60"
                  />
                </div>

                {/* Gemini Voice */}
                <div>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">Voice Timbre</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {VOICE_OPTIONS.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => patch(editing.id, { voiceKey: v.key })}
                        className={`rounded-full border px-2.5 py-1 text-[10.5px] transition ${
                          editing.voiceKey === v.key ? 'border-[var(--m-accent)]/60 bg-[var(--m-accent)]/20 text-white font-medium' : 'border-white/12 text-white/50 hover:text-white'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Character visual props & colors */}
                <div>
                  <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-white/40">
                    <Palette className="h-3 w-3" /> Little Character Icon & Props
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {SKIN_SWATCHES.map((s) => (
                      <button
                        key={s.join()}
                        onClick={() => patch(editing.id, { skin: { ...editing.skin, body: s } })}
                        className={`h-6 w-6 rounded-full border-2 transition ${editing.skin.body.join() === s.join() ? 'border-white scale-110' : 'border-white/20 hover:border-white/50'}`}
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
                          editing.skin.prop === p ? 'border-[var(--m-accent)]/60 bg-[var(--m-accent)]/15 text-white font-medium' : 'border-white/12 text-white/40 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Workflow Memory Ledger Inspector */}
                <div className="rounded-xl border border-purple-400/20 bg-purple-400/[0.04] p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10.5px] font-semibold text-purple-200">
                      <Brain className="h-3.5 w-3.5" /> Isolated Workflow Memory ({editingMemories.length})
                    </span>
                    {editingMemories.length > 0 && (
                      <button
                        onClick={handleClearMemory}
                        className="text-[10px] text-amber-300/70 hover:text-amber-200 transition"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-white/40">
                    Specific facts, principles, and conventions remembered exclusively for {editing.name}.
                  </p>

                  <div className="mt-2.5 max-h-36 space-y-1.5 overflow-y-auto pr-1">
                    {editingMemories.length === 0 ? (
                      <p className="py-2 text-center text-[10.5px] text-white/35">No memories captured yet.</p>
                    ) : (
                      editingMemories.map((m) => (
                        <div
                          key={m.id}
                          className="group flex items-start justify-between gap-2 rounded-lg border border-white/8 bg-black/30 p-2 text-[11px] text-white/75"
                        >
                          <span className="line-clamp-2 leading-relaxed">{m.content}</span>
                          <button
                            onClick={() => handleRemoveMemory(m.id)}
                            className="text-white/20 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition"
                            title="Delete memory item"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add memory input */}
                  <div className="mt-2 flex gap-1.5">
                    <input
                      type="text"
                      value={newMemoryNote}
                      onChange={(e) => setNewMemoryNote(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddMemory(); }}
                      placeholder="Add memory fact or rule..."
                      className="flex-1 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] text-white outline-none placeholder:text-white/30 focus:border-purple-400/50"
                    />
                    <button
                      onClick={handleAddMemory}
                      className="rounded-lg border border-purple-400/30 bg-purple-400/20 px-2.5 py-1 text-[11px] font-medium text-purple-200 hover:bg-purple-400/30 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Disclaimer state */}
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="text-[10.5px] font-semibold text-white/70">Execution Authorization</p>
                  <p className="mt-0.5 text-[10.5px] leading-relaxed text-white/40">
                    {editing.disclaimerAccepted ? 'Authorized — permitted to execute agent workflows.' : 'Pending — will require agreement before running.'}
                  </p>
                  <button
                    onClick={() => patch(editing.id, { disclaimerAccepted: !editing.disclaimerAccepted })}
                    className="mt-2 w-full rounded-lg border border-white/12 py-1.5 text-[10.5px] font-medium text-white/75 transition hover:border-[var(--m-accent)]/50 hover:text-white"
                  >
                    {editing.disclaimerAccepted ? 'Revoke authorization' : 'Authorize specialist'}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => removeAgent(editing)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 py-2 text-[11px] font-medium text-rose-300 transition hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Specialist
                  </button>
                  <button
                    onClick={() => { onOpenChat(editing.id); say('Opened in workspace chat.'); }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg m-gradient-bg py-2 text-[11.5px] font-semibold text-white transition hover:opacity-90"
                  >
                    <Save className="h-3.5 w-3.5" /> Open in Chat
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AgentStudio;
