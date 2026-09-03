import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Send, Loader2, Brain, Trash2, Volume2, ShieldAlert, Plus, X } from 'lucide-react';
import AgentAvatar from '@/components/agents/AgentAvatar';
import { useMaggie } from '@/contexts/MaggieContext';
import { AGENT_DISCLAIMER, toneByKey, voiceByKey } from '@/data/agents';
import {
  type AgentConfig, type AgentMessage, type AgentMemoryEntry,
  loadThread, appendThread, clearThread,
  loadMemory, addMemory, removeMemory, clearMemory,
  buildAgentContext, tonePromptFor, speak, loadAISettings,
} from '@/lib/agentStore';

/**
 * Chat surface for a single agent. The thread AND the memory are isolated per
 * agent id, so each subject keeps its own workflow context.
 */
const AgentChat: React.FC<{
  agent: AgentConfig;
  onAcceptDisclaimer: () => void;
  compact?: boolean;
}> = ({ agent, onAcceptDisclaimer, compact = false }) => {
  const { profile } = useMaggie();
  const [thread, setThread] = useState<AgentMessage[]>([]);
  const [memory, setMemory] = useState<AgentMemoryEntry[]>([]);
  const [draft, setDraft] = useState('');
  const [memoDraft, setMemoDraft] = useState('');
  const [memoOpen, setMemoOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const settings = useMemo(() => loadAISettings(), []);

  useEffect(() => {
    setThread(loadThread(agent.id));
    setMemory(loadMemory(agent.id));
    setError('');
  }, [agent.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread.length, busy]);

  const send = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    setDraft('');
    setBusy(true);
    setError('');
    const next = appendThread(agent.id, 'user', text);
    setThread(next);
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          agentId: agent.id,
          agentName: agent.name,
          agentRole: agent.role,
          agentSubject: agent.subject,
          tonePrompt: tonePromptFor(agent),
          voiceLabel: voiceByKey(agent.voiceKey).label,
          timezone: settings.timeZone,
          memoryContext: settings.useMemory ? buildAgentContext(agent, memory) : '',
          profile: { name: profile.name, identity: profile.identity },
          history: next.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error('The agent runner returned an error.');
      const data = await res.json();
      const reply = String(data?.reply ?? '').trim();
      if (!reply) throw new Error('The agent runner returned nothing. Try again in a moment.');
      setThread(appendThread(agent.id, 'assistant', reply));
      if (settings.speakReplies) speak(reply, agent.voiceKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That agent could not be reached.');
    } finally {
      setBusy(false);
    }
  }, [agent, busy, memory, profile.identity, profile.name, settings]);

  if (!agent.disclaimerAccepted) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <AgentAvatar skin={agent.skin} size={84} />
        <div className="max-w-md rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4 text-left">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-200">
            <ShieldAlert className="h-3.5 w-3.5" /> Before {agent.name || 'this agent'} starts
          </p>
          <ul className="mt-2 space-y-1.5">
            {AGENT_DISCLAIMER.map((d) => (
              <li key={d} className="text-[11px] leading-relaxed text-white/60">· {d}</li>
            ))}
            {agent.caution && <li className="text-[11px] leading-relaxed text-amber-200/85">· {agent.caution}</li>}
          </ul>
          <button
            onClick={onAcceptDisclaimer}
            className="mt-3 w-full rounded-lg m-gradient-bg py-2 text-[11.5px] font-semibold text-white"
          >
            I understand — this agent is mine to clear or delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Agent header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-white/8 px-4 py-2.5">
        <AgentAvatar skin={agent.skin} size={38} active={busy} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-white">{agent.name}</p>
          <p className="truncate text-[10px] text-white/40">
            {agent.role} · {toneByKey(agent.toneKey).label} · {voiceByKey(agent.voiceKey).label}
          </p>
        </div>
        <button
          onClick={() => setMemoOpen((v) => !v)}
          title="Workflow memory for this subject only"
          className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10.5px] font-medium transition ${memoOpen ? 'border-[var(--m-accent)]/50 text-white' : 'border-white/12 text-white/50 hover:text-white'}`}
        >
          <Brain className="h-3.5 w-3.5" /> Memory {memory.length}
        </button>
        <button
          onClick={() => setThread(clearThread(agent.id))}
          title="Clear this conversation"
          className="rounded-lg border border-white/12 p-1.5 text-white/40 transition hover:border-rose-400/40 hover:text-rose-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Isolated memory drawer */}
      {memoOpen && (
        <div className="shrink-0 border-b border-white/8 bg-black/25 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/30">
            Workflow memory · {agent.subject}
          </p>
          <div className="mt-2 flex gap-2">
            <input
              value={memoDraft}
              onChange={(e) => setMemoDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && memoDraft.trim()) {
                  setMemory(addMemory(agent.id, memoDraft));
                  setMemoDraft('');
                }
              }}
              placeholder="Remember for this subject only…"
              className="flex-1 rounded-lg border border-white/12 bg-black/30 px-2.5 py-1.5 text-[11.5px] text-white outline-none placeholder:text-white/25 focus:border-[var(--m-accent)]/50"
            />
            <button
              onClick={() => { if (memoDraft.trim()) { setMemory(addMemory(agent.id, memoDraft)); setMemoDraft(''); } }}
              className="rounded-lg m-gradient-bg px-2.5 text-white"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="m-scroll mt-2 max-h-32 space-y-1.5 overflow-y-auto">
            {memory.length === 0 && <p className="text-[11px] text-white/25">Nothing stored for this subject yet.</p>}
            {memory.map((m) => (
              <div key={m.id} className="flex items-start gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1.5">
                <span className="flex-1 text-[11px] leading-relaxed text-white/65">{m.content}</span>
                <button onClick={() => setMemory(removeMemory(agent.id, m.id))} className="text-white/25 hover:text-rose-300">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          {memory.length > 0 && (
            <button
              onClick={() => setMemory(clearMemory(agent.id))}
              className="mt-2 text-[10.5px] font-medium text-rose-300/80 hover:text-rose-300"
            >
              Clear all memory for {agent.name}
            </button>
          )}
        </div>
      )}

      {/* Thread */}
      <div className="m-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {thread.length === 0 && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 m-agent-glow">
            <div className="flex items-center gap-3">
              <AgentAvatar skin={agent.skin} size={54} />
              <p className="text-[12px] leading-relaxed text-white/55">{agent.blurb || agent.role}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(agent.starters.length ? agent.starters : ['What can you do for me?']).map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/65 transition hover:border-[var(--m-accent)]/50 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {thread.map((m) => (
          <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && <AgentAvatar skin={agent.skin} size={30} className="mt-0.5 shrink-0" />}
            <div
              className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[var(--m-accent)]/22 text-white'
                  : 'border border-white/8 bg-white/[0.04] text-white/80'
              }`}
            >
              {m.content}
              {m.role === 'assistant' && (
                <button
                  onClick={() => speak(m.content, agent.voiceKey)}
                  className="ml-2 inline-flex align-middle text-white/30 transition hover:text-white"
                  title="Read aloud"
                >
                  <Volume2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ))}

        {busy && (
          <p className="flex items-center gap-2 text-[11.5px] text-white/40">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {agent.name} is working…
          </p>
        )}
        {error && <p className="text-[11.5px] text-rose-300">{error}</p>}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-white/8 px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-black/30 px-3 py-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void send(draft)}
            placeholder={`Talk to ${agent.name || 'your agent'}…`}
            className="flex-1 bg-transparent text-[12.5px] text-white outline-none placeholder:text-white/25"
          />
          <button onClick={() => void send(draft)} disabled={busy} className="grid h-8 w-8 place-items-center rounded-lg m-gradient-bg disabled:opacity-50">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white" /> : <Send className="h-3.5 w-3.5 text-white" />}
          </button>
        </div>
        {!compact && (
          <p className="mt-1.5 text-[10px] text-white/25">
            Memory is scoped to “{agent.subject}”. Yours to clear or delete at any time.
          </p>
        )}
      </div>
    </div>
  );
};

export default AgentChat;
