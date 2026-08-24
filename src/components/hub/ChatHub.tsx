import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, Globe, ChevronLeft, ChevronRight, Users, Bot, Send } from 'lucide-react';
import AgentAvatar from '@/components/agents/AgentAvatar';
import AgentChat from '@/components/agents/AgentChat';
import AISettingsPanel from '@/components/hub/AISettingsPanel';
import BrowserViewport from '@/components/command/BrowserViewport';
import CopilotChat from '@/components/command/CopilotChat';
import { delegateToCopilot } from '@/lib/copilotSession';
import {
  type AgentConfig, type AISettings,
  loadAgents, saveAgents, loadAISettings, saveAISettings,
} from '@/lib/agentStore';


/**
 * The main hub chat page: AI settings on the left, the agent conversation in the
 * middle (kept deliberately uncluttered) and the browser agent sandbox on the right.
 */
const ChatHub: React.FC<{
  activeAgentId: string | null;
  onSelectAgent: (id: string) => void;
  onOpenStudio: () => void;
}> = ({ activeAgentId, onSelectAgent, onOpenStudio }) => {
  const [agents, setAgents] = useState<AgentConfig[]>(() => loadAgents());
  const [settings, setSettings] = useState<AISettings>(() => loadAISettings());
  const [leftOpen, setLeftOpen] = useState(true);
  const [railTab, setRailTab] = useState<'copilot' | 'sandbox'>('copilot');
  const [handoff, setHandoff] = useState('');

  useEffect(() => { setAgents(loadAgents()); }, [activeAgentId]);

  const agent = useMemo(
    () => agents.find((a) => a.id === activeAgentId) ?? agents[0] ?? null,
    [agents, activeAgentId],
  );

  const patchSettings = useCallback((patch: Partial<AISettings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      saveAISettings(next);
      return next;
    });
  }, []);

  const accept = useCallback(() => {
    if (!agent) return;
    const next = agents.map((a) => (a.id === agent.id ? { ...a, disclaimerAccepted: true } : a));
    setAgents(next);
    saveAgents(next);
  }, [agent, agents]);

  return (
    <div className="flex h-full min-h-0 flex-col xl:flex-row">
      {/* Left — AI settings */}
      <aside
        className={`shrink-0 border-b border-white/8 bg-[#131319]/70 transition-all xl:border-b-0 xl:border-r ${
          leftOpen ? 'xl:w-[270px]' : 'xl:w-[52px]'
        }`}
      >
        <div className="flex items-center justify-between px-3 py-2 xl:border-b xl:border-white/8">
          <span className={`flex items-center gap-1.5 text-[10.5px] font-semibold text-white/55 ${leftOpen ? '' : 'xl:hidden'}`}>
            <SlidersHorizontal className="h-3.5 w-3.5" /> AI settings
          </span>
          <button
            onClick={() => setLeftOpen((v) => !v)}
            className="hidden rounded-lg border border-white/12 p-1 text-white/40 transition hover:text-white xl:block"
            title={leftOpen ? 'Collapse settings' : 'Expand settings'}
          >
            {leftOpen ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className={`h-[240px] xl:h-[calc(100%-2.5rem)] ${leftOpen ? '' : 'hidden xl:hidden'}`}>
          <AISettingsPanel settings={settings} onChange={patchSettings} />
        </div>
      </aside>

      {/* Center — the work area */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Agent switcher strip */}
        <div className="m-scroll flex shrink-0 items-center gap-2 overflow-x-auto border-b border-white/8 px-3 py-2">
          {agents.filter((a) => a.enabled).map((a) => (
            <button
              key={a.id}
              onClick={() => onSelectAgent(a.id)}
              title={a.role}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 transition ${
                agent?.id === a.id ? 'border-[var(--m-accent)]/60 bg-[var(--m-accent)]/12' : 'border-white/10 hover:border-white/25'
              }`}
            >
              <AgentAvatar skin={a.skin} size={22} />
              <span className={`text-[11px] ${agent?.id === a.id ? 'text-white' : 'text-white/50'}`}>{a.name}</span>
            </button>
          ))}
          <button
            onClick={onOpenStudio}
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border border-white/12 px-2.5 py-1.5 text-[10.5px] text-white/55 transition hover:text-white"
          >
            <Users className="h-3.5 w-3.5" /> Agent studio
          </button>
        </div>

        {/* Hand a job to the browser co-pilot — it does the actual booking, step by step */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/8 px-3 py-2">
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-white/35">
            <Bot className="h-3 w-3" /> Hand to co-pilot
          </span>
          <input
            value={handoff}
            onChange={(e) => setHandoff(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || !handoff.trim()) return;
              delegateToCopilot(handoff, { agentId: agent?.id ?? null, agentName: agent?.name, from: 'desktop' });
              setHandoff('');
              setRailTab('copilot');
              if (!settings.sandboxOpen) patchSettings({ sandboxOpen: true });
            }}
            placeholder={agent ? `e.g. ${agent.starters[0] ?? 'Book my usual slot'}` : 'Book my usual slot'}
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11.5px] text-white placeholder:text-white/25 outline-none focus:border-[var(--m-accent)]/60"
          />
          <button
            onClick={() => {
              if (!handoff.trim()) return;
              delegateToCopilot(handoff, { agentId: agent?.id ?? null, agentName: agent?.name, from: 'desktop' });
              setHandoff('');
              setRailTab('copilot');
              if (!settings.sandboxOpen) patchSettings({ sandboxOpen: true });
            }}
            className="flex items-center gap-1.5 rounded-lg m-gradient-bg px-2.5 py-1.5 text-[11px] font-semibold text-white"
          >
            <Send className="h-3 w-3" /> Send
          </button>
        </div>

        <div className="min-h-0 flex-1">
          {agent ? (
            <AgentChat agent={agent} onAcceptDisclaimer={accept} />
          ) : (
            <div className="grid h-full place-items-center text-[12px] text-white/40">
              No agents yet — build one in the Agent Studio.
            </div>
          )}
        </div>
      </section>

      {/* Right — the browser co-pilot: its own chat + the sandbox it drives */}
      {settings.sandboxOpen && (
        <aside className="flex h-[52vh] shrink-0 flex-col border-t border-white/8 bg-[#0F1016] xl:h-auto xl:w-[420px] xl:border-l xl:border-t-0">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/8 px-3 py-2">
            <div className="flex items-center gap-1 rounded-full border border-white/12 p-0.5">
              <button
                onClick={() => setRailTab('copilot')}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium transition ${
                  railTab === 'copilot' ? 'bg-[var(--m-accent)]/18 text-white' : 'text-white/45 hover:text-white'
                }`}
              >
                <Bot className="h-3 w-3" /> Co-pilot
              </button>
              <button
                onClick={() => setRailTab('sandbox')}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium transition ${
                  railTab === 'sandbox' ? 'bg-[var(--m-accent)]/18 text-white' : 'text-white/45 hover:text-white'
                }`}
              >
                <Globe className="h-3 w-3" /> Sandbox
              </button>
            </div>
            <button
              onClick={() => patchSettings({ sandboxOpen: false })}
              className="rounded-lg border border-white/12 px-2 py-1 text-[10px] text-white/40 transition hover:text-white"
            >
              Hide
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            {railTab === 'copilot' ? <CopilotChat surface="desktop" /> : <BrowserViewport />}
          </div>
        </aside>
      )}

    </div>
  );
};

export default ChatHub;
