import React, { useState } from 'react';
import {
  Users, Bot, Sparkles, Volume2, ShieldCheck, Terminal, Cpu,
  Code2, Calendar, FileText, CheckCircle2, ChevronRight, Play,
  Sliders, Link2, Database, Globe
} from 'lucide-react';
import { AGENT_PRESETS, GEMINI_VOICE_OPTIONS, HYDRATE_FORM_TOOL_DEFINITION, SOVEREIGN_ORCHESTRATOR_PROMPT, voiceByName } from '@/data/agents';
import AgentAvatar from '@/components/agents/AgentAvatar';

interface AgentRosterMCPProps {
  onSelectAgentForChat: (agentId: string) => void;
}

export const AgentRosterMCP: React.FC<AgentRosterMCPProps> = ({ onSelectAgentForChat }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('magdalene');
  const [testSpeaking, setTestSpeaking] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'orchestrator_prompt' | 'tool_schema' | 'mcp_connectors'>('roster');

  const selectedAgent = AGENT_PRESETS.find((a) => a.id === selectedAgentId) ?? AGENT_PRESETS[0];
  const voiceMeta = voiceByName(selectedAgent.geminiVoice);

  const testPlayVoice = (agentName: string, voiceName: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (testSpeaking === agentName) {
      window.speechSynthesis.cancel();
      setTestSpeaking(null);
      return;
    }

    window.speechSynthesis.cancel();
    const v = voiceByName(voiceName);
    const utterance = new SpeechSynthesisUtterance(
      `Hello, I am ${agentName}. Ready to assist with sovereign execution and multimodal voice interaction.`
    );
    utterance.pitch = v.pitch;
    utterance.rate = v.rate;

    const voices = window.speechSynthesis.getVoices();
    const hit = voices.find((sv) =>
      v.speechSynthMatch.some((m) => sv.name.toLowerCase().includes(m.toLowerCase()))
    );
    if (hit) utterance.voice = hit;

    utterance.onend = () => setTestSpeaking(null);
    utterance.onerror = () => setTestSpeaking(null);

    setTestSpeaking(agentName);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex h-full flex-col bg-[#11121A] text-white select-none overflow-hidden">
      {/* Sub-Navigation Strip */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 bg-[#151622] px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl m-gradient-bg">
            <Users className="h-4 w-4 text-white" />
          </span>
          <div>
            <h1 className="font-display text-sm font-semibold">Agent Roster & MCP Architecture</h1>
            <p className="text-[10px] text-white/45">7 Sub-Agent Specialists · Gemini Multimodal Live Voices · Tool Schema</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 p-1">
          <button
            onClick={() => setActiveSubTab('roster')}
            className={`rounded-lg px-3 py-1 text-[11px] font-medium transition ${
              activeSubTab === 'roster' ? 'bg-white/15 text-white shadow' : 'text-white/50 hover:text-white'
            }`}
          >
            Sub-Agents ({AGENT_PRESETS.length})
          </button>
          <button
            onClick={() => setActiveSubTab('orchestrator_prompt')}
            className={`rounded-lg px-3 py-1 text-[11px] font-medium transition ${
              activeSubTab === 'orchestrator_prompt' ? 'bg-white/15 text-white shadow' : 'text-white/50 hover:text-white'
            }`}
          >
            Sovereign Orchestrator
          </button>
          <button
            onClick={() => setActiveSubTab('tool_schema')}
            className={`rounded-lg px-3 py-1 text-[11px] font-medium transition ${
              activeSubTab === 'tool_schema' ? 'bg-white/15 text-white shadow' : 'text-white/50 hover:text-white'
            }`}
          >
            Tool-Calling Schema
          </button>
          <button
            onClick={() => setActiveSubTab('mcp_connectors')}
            className={`rounded-lg px-3 py-1 text-[11px] font-medium transition ${
              activeSubTab === 'mcp_connectors' ? 'bg-white/15 text-white shadow' : 'text-white/50 hover:text-white'
            }`}
          >
            MCP Connectors
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="m-scroll flex-1 overflow-y-auto p-6">
        {/* VIEW 1: Sub-Agent Roster Grid & Inspector */}
        {activeSubTab === 'roster' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 max-w-7xl mx-auto">
            {/* Left Column: Agents Grid */}
            <div className="space-y-3 lg:col-span-7">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                Specialized Agents & Voice Bindings
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AGENT_PRESETS.map((agent) => {
                  const isSelected = agent.id === selectedAgentId;
                  return (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                        isSelected
                          ? 'border-[var(--m-accent)] bg-[var(--m-accent)]/15 shadow-md ring-1 ring-[var(--m-accent)]/30'
                          : 'border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <AgentAvatar skin={agent.skin} size={32} />
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9.5px] font-mono text-white/60">
                          {agent.geminiVoice}
                        </span>
                      </div>

                      <h3 className="mt-3 font-display text-sm font-semibold text-white">
                        {agent.name}
                      </h3>
                      <p className="text-[10.5px] text-[var(--m-accent-soft)] line-clamp-1">{agent.role}</p>
                      <p className="mt-2 text-[11px] text-white/55 line-clamp-2 leading-relaxed">
                        {agent.blurb}
                      </p>

                      <div className="mt-3 flex items-center justify-between border-t border-white/6 pt-2 text-[10px]">
                        <span className="text-white/40 capitalize">{agent.category}</span>
                        <span className="text-[var(--m-accent-soft)] flex items-center gap-0.5">
                          View details <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Selected Agent Deep Inspector */}
            <div className="space-y-4 lg:col-span-5">
              <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 backdrop-blur-md sticky top-0">
                <div className="flex items-center gap-3">
                  <AgentAvatar skin={selectedAgent.skin} size={42} />
                  <div>
                    <h2 className="font-display text-base font-bold text-white">
                      {selectedAgent.name}
                    </h2>
                    <p className="text-[11.5px] text-white/60">{selectedAgent.role}</p>
                  </div>
                </div>

                {/* Gemini Live Voice Badge & Test Trigger */}
                <div className="mt-4 rounded-xl border border-white/8 bg-black/30 p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/40">Gemini Live Voice</p>
                    <p className="text-xs font-semibold text-white mt-0.5">
                      {voiceMeta.name} ({voiceMeta.gender} · {voiceMeta.timbre})
                    </p>
                    <p className="text-[10.5px] text-white/50">{voiceMeta.description}</p>
                  </div>
                  <button
                    onClick={() => testPlayVoice(selectedAgent.name, selectedAgent.geminiVoice)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/15 transition"
                    title="Test Voice Sample"
                  >
                    <Volume2
                      className={`h-4 w-4 ${testSpeaking === selectedAgent.name ? 'text-[var(--m-accent-soft)] animate-pulse' : ''}`}
                    />
                  </button>
                </div>

                {/* System Prompt */}
                <div className="mt-4">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                    Agent Instruction & Scope
                  </p>
                  <div className="rounded-xl border border-white/8 bg-black/40 p-3 text-[11px] leading-relaxed text-white/75 max-h-36 overflow-y-auto">
                    {selectedAgent.systemPrompt}
                  </div>
                </div>

                {/* Starter Prompts */}
                <div className="mt-4">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                    Starter Capabilities
                  </p>
                  <div className="space-y-1.5">
                    {selectedAgent.starters.map((s, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-white/6 bg-white/[0.02] p-2 text-[11px] text-white/70"
                      >
                        "{s}"
                      </div>
                    ))}
                  </div>
                </div>

                {/* Direct Action: Jump into Chat with this Agent */}
                <button
                  onClick={() => onSelectAgentForChat(selectedAgent.id)}
                  className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl m-gradient-bg py-2.5 text-xs font-semibold text-white shadow-md hover:brightness-110 transition"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Open Dialogue with {selectedAgent.name}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Sovereign Orchestrator System Prompt (System Prompt 1) */}
        {activeSubTab === 'orchestrator_prompt' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/8">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-600/30 text-purple-300">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-base font-bold">System Prompt 1: The Sovereign Orchestrator</h2>
                  <p className="text-xs text-white/50">Google AI Studio Central Router & Behavioral Mandates</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-xs text-emerald-300/90 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {SOVEREIGN_ORCHESTRATOR_PROMPT}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-[11px]">
                  <p className="font-semibold text-white">Local-First Privacy</p>
                  <p className="text-white/50 text-[10.5px] mt-0.5">Memories stay on device. Zero external data transmission without consent.</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-[11px]">
                  <p className="font-semibold text-white">Adaptive Execution</p>
                  <p className="text-white/50 text-[10.5px] mt-0.5">Calibrates strictly against sovereign intake without demographic guessing.</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-[11px]">
                  <p className="font-semibold text-white">Sub-Agent Dispatch</p>
                  <p className="text-white/50 text-[10.5px] mt-0.5">Single conversational thread seamlessly routed to domain specialists.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: Tool-Calling & Dynamic Form Hydration Schema (System Prompt 2) */}
        {activeSubTab === 'tool_schema' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/8">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-600/30 text-sky-300">
                  <Terminal className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-base font-bold">System Prompt 2: Tool-Calling & Dynamic Form Hydration</h2>
                  <p className="text-xs text-white/50">Tool definition schema for real-time automated voice & chat hydration</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-xs text-sky-300/90 leading-relaxed overflow-x-auto">
                <pre>{JSON.stringify(HYDRATE_FORM_TOOL_DEFINITION, null, 2)}</pre>
              </div>

              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11.5px] text-amber-200">
                <strong>Affirmative Confirmation Guarantee:</strong> Any tool invocation with <code>requires_user_confirmation: true</code> displays a dedicated interactive authorization card and will not perform external side-effects without explicit affirmative click.
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: MCP (Model Context Protocol) Connectors */}
        {activeSubTab === 'mcp_connectors' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/8">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600/30 text-emerald-300">
                  <Cpu className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-base font-bold">Model Context Protocol (MCP) Connectors</h2>
                  <p className="text-xs text-white/50">Local-first connectors providing deterministic tool execution</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: 'Local Sovereign Filesystem MCP', desc: 'Read/write encrypted JSON archives and local Markdown memory ledger.', status: 'Active (Local-First)' },
                  { name: 'Browser Automation Runner MCP', desc: 'Dispatches staged errand actions to Whole Foods, Amazon, and delivery portals.', status: 'Active (Isolated Sandboxed)' },
                  { name: 'Executive Calendar MCP', desc: 'Syncs buffered slots with Coco and alerts on schedule overlaps.', status: 'Active (Simulated + API Ready)' },
                  { name: 'Supabase Sovereign Storage MCP', desc: 'Optional end-to-end encrypted backup using your isolated environment credentials.', status: 'Configured' },
                ].map((mcp, idx) => (
                  <div key={idx} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-xs text-white">{mcp.name}</h4>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> {mcp.status}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-white/55 leading-relaxed">{mcp.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentRosterMCP;
