import React, { useMemo, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import AgentAvatar from '@/components/agents/AgentAvatar';
import AgentChat from '@/components/agents/AgentChat';
import { type AgentConfig, loadAgents, saveAgents } from '@/lib/agentStore';

/**
 * Phone surface for the agent roster: a scrollable row of little characters that
 * opens a full-screen chat sheet for the tapped agent.
 */
const MobileAgentDock: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [agents, setAgents] = useState<AgentConfig[]>(() => loadAgents());
  const [openId, setOpenId] = useState<string | null>(null);

  const active = useMemo(() => agents.find((a) => a.id === openId) ?? null, [agents, openId]);

  const accept = () => {
    if (!active) return;
    const next = agents.map((a) => (a.id === active.id ? { ...a, disclaimerAccepted: true } : a));
    setAgents(next);
    saveAgents(next);
  };

  return (
    <div className={className}>
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-white/30">
        <Sparkles className="h-3 w-3" /> Your agents
      </p>
      <div className="m-scroll -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
        {agents.filter((a) => a.enabled).map((a) => (
          <button
            key={a.id}
            onClick={() => setOpenId(a.id)}
            className="m-lift flex w-[104px] shrink-0 flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-2.5"
          >
            <AgentAvatar skin={a.skin} size={44} active={a.disclaimerAccepted} />
            <span className="w-full truncate text-center text-[11px] font-semibold text-white">{a.name}</span>
            <span className="line-clamp-2 text-center text-[9.5px] leading-tight text-white/35">{a.role}</span>
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-[#101118]">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <span className="flex items-center gap-2">
              <AgentAvatar skin={active.skin} size={30} />
              <span className="text-[13px] font-semibold text-white">{active.name}</span>
            </span>
            <button onClick={() => setOpenId(null)} className="rounded-full border border-white/15 p-2 text-white/60">
              <X className="h-4 w-4" />
            </button>
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
