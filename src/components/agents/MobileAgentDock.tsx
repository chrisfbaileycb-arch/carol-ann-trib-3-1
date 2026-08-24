import React, { useMemo, useState } from 'react';
import { X, Sparkles, SlidersHorizontal, Check, Bot } from 'lucide-react';
import AgentAvatar from '@/components/agents/AgentAvatar';
import AgentChat from '@/components/agents/AgentChat';
import { type AgentConfig, loadAgents, saveAgents } from '@/lib/agentStore';
import {
  CREW_LIMIT, loadCrew, toggleCrewMember, loadActiveCrewMember, saveActiveCrewMember,
  delegateToCopilot,
} from '@/lib/copilotSession';

/**
 * Phone surface for the agent roster.
 *
 * The phone carries up to four preloaded roles chosen from the master profile —
 * the gym one, the art-class one, the cooking one — so whoever you need while
 * you are out is one tap away. Any of them can hand a job to the browser
 * co-pilot, which still asks permission for every step.
 */
const MobileAgentDock: React.FC<{ className?: string; onHandOff?: () => void }> = ({ className = '', onHandOff }) => {
  const [agents, setAgents] = useState<AgentConfig[]>(() => loadAgents());
  const [crew, setCrew] = useState<string[]>(() => loadCrew());
  const [openId, setOpenId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [activeRole, setActiveRole] = useState<string | null>(() => loadActiveCrewMember());

  const roster = useMemo(() => agents.filter((a) => a.enabled), [agents]);
  const crewAgents = useMemo(
    () => crew.map((id) => roster.find((a) => a.id === id)).filter(Boolean) as AgentConfig[],
    [crew, roster],
  );
  const active = useMemo(() => agents.find((a) => a.id === openId) ?? null, [agents, openId]);

  const accept = () => {
    if (!active) return;
    const next = agents.map((a) => (a.id === active.id ? { ...a, disclaimerAccepted: true } : a));
    setAgents(next);
    saveAgents(next);
  };

  const chooseRole = (id: string) => {
    const next = activeRole === id ? null : id;
    setActiveRole(next);
    saveActiveCrewMember(next);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-white/30">
          <Sparkles className="h-3 w-3" /> Phone crew · {crewAgents.length}/{CREW_LIMIT}
        </p>
        <button
          onClick={() => setPicking((v) => !v)}
          className="flex items-center gap-1 rounded-full border border-white/12 px-2 py-1 text-[10px] text-white/50"
        >
          <SlidersHorizontal className="h-3 w-3" /> {picking ? 'Done' : 'Choose'}
        </button>
      </div>

      {/* Crew picker — pulled from the master agent profile */}
      {picking && (
        <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
          <p className="text-[10px] leading-relaxed text-white/40">
            Pick up to {CREW_LIMIT} roles to carry with you. Choosing a fifth drops the oldest.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {roster.map((a) => {
              const on = crew.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => setCrew(toggleCrewMember(a.id))}
                  className={`flex items-center gap-1.5 rounded-xl border px-2 py-1.5 text-left transition ${
                    on ? 'border-[var(--m-accent)]/55 bg-[var(--m-accent)]/12' : 'border-white/10'
                  }`}
                >
                  <AgentAvatar skin={a.skin} size={22} />
                  <span className="min-w-0 flex-1 truncate text-[11px] text-white">{a.name}</span>
                  {on && <Check className="h-3 w-3 shrink-0 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* The four carried roles */}
      <div className="m-scroll -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
        {crewAgents.length === 0 && (
          <p className="text-[11px] text-white/30">No roles carried yet — tap Choose.</p>
        )}
        {crewAgents.map((a) => (
          <div
            key={a.id}
            className={`m-lift flex w-[112px] shrink-0 flex-col items-center gap-1 rounded-2xl border px-2 py-2.5 ${
              activeRole === a.id ? 'border-[var(--m-accent)]/60 bg-[var(--m-accent)]/12' : 'border-white/10 bg-white/[0.04]'
            }`}
          >
            <button onClick={() => setOpenId(a.id)} className="flex flex-col items-center gap-1">
              <AgentAvatar skin={a.skin} size={44} active={a.disclaimerAccepted} />
              <span className="w-full truncate text-center text-[11px] font-semibold text-white">{a.name}</span>
              <span className="line-clamp-2 text-center text-[9.5px] leading-tight text-white/35">{a.role}</span>
            </button>
            <button
              onClick={() => chooseRole(a.id)}
              className={`mt-0.5 w-full rounded-full border px-1.5 py-0.5 text-[9px] ${
                activeRole === a.id ? 'border-emerald-400/40 text-emerald-300' : 'border-white/12 text-white/40'
              }`}
            >
              {activeRole === a.id ? 'On duty' : 'Set on duty'}
            </button>
          </div>
        ))}
      </div>

      {/* Full-screen agent chat */}
      {active && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-[#101118]">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <span className="flex items-center gap-2">
              <AgentAvatar skin={active.skin} size={30} />
              <span className="text-[13px] font-semibold text-white">{active.name}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  delegateToCopilot(active.starters[0] ?? `Book something for ${active.name}`, {
                    agentId: active.id,
                    agentName: active.name,
                    from: 'mobile',
                  });
                  setOpenId(null);
                  onHandOff?.();
                }}
                className="flex items-center gap-1 rounded-full border border-[var(--m-accent)]/45 bg-[var(--m-accent)]/12 px-2.5 py-1.5 text-[10.5px] font-semibold text-white"
              >
                <Bot className="h-3 w-3" /> Hand to co-pilot
              </button>
              <button onClick={() => setOpenId(null)} className="rounded-full border border-white/15 p-2 text-white/60">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <AgentChat agent={active} onAcceptDisclaimer={accept} compact />
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileAgentDock;
