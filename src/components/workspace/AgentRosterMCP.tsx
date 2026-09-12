import React, { useState, useMemo } from 'react';
import {
  Users, Bot, Sparkles, Volume2, ShieldCheck, Terminal, Cpu,
  Code2, Calendar, FileText, CheckCircle2, ChevronRight, Play,
  Sliders, Link2, Database, Globe, Search, X, Brain
} from 'lucide-react';
import { AGENT_PRESETS, AGENT_CATEGORIES, GEMINI_VOICE_OPTIONS, HYDRATE_FORM_TOOL_DEFINITION, SOVEREIGN_ORCHESTRATOR_PROMPT, voiceByName, type AgentCategory } from '@/data/agents';
import { isLightTheme } from '@/data/intake';
import type { UserProfile } from '@/data/schemas';
import AgentAvatar from '@/components/agents/AgentAvatar';

interface AgentRosterMCPProps {
  onSelectAgentForChat: (agentId: string) => void;
  profile?: UserProfile;
}

export const AgentRosterMCP: React.FC<AgentRosterMCPProps> = ({ onSelectAgentForChat, profile }) => {
  const isLight = isLightTheme(profile);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('carol-anchor');
  const [testSpeaking, setTestSpeaking] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'orchestrator_prompt' | 'tool_schema' | 'mcp_connectors'>('roster');
  const [categoryFilter, setCategoryFilter] = useState<AgentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedAgent = AGENT_PRESETS.find((a) => a.id === selectedAgentId) ?? AGENT_PRESETS[0];
  const voiceMeta = voiceByName(selectedAgent.geminiVoice);

  const visibleAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return AGENT_PRESETS.filter((a) => {
      const matchCat = categoryFilter === 'all' || a.category === categoryFilter;
      if (!matchCat) return false;
      if (!q) return true;
      const vendor = a.vendor || '';
      return (
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.subject.toLowerCase().includes(q) ||
        a.blurb.toLowerCase().includes(q) ||
        vendor.toLowerCase().includes(q)
      );
    });
  }, [categoryFilter, searchQuery]);

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
    <div className={`flex h-full flex-col bg-transparent select-none overflow-hidden transition-colors ${
      isLight ? 'text-slate-800' : 'text-white'
    }`}>
      {/* Sub-Navigation Strip */}
      <div className={`flex shrink-0 items-center justify-between border-b px-6 py-3 backdrop-blur-md ${
        isLight ? 'border-rose-200/60 bg-white/75' : 'border-white/8 bg-zinc-950/75'
      }`}>
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl m-gradient-bg shadow-sm">
            <Users className="h-4 w-4 text-white" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`font-display text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Agent Roster & MCP Architecture
              </h1>
              <span className={`rounded-full border px-2 py-0.2 text-[9px] font-medium ${
                isLight ? 'border-rose-200 bg-rose-50 text-slate-700' : 'border-sky-400/25 bg-sky-400/10 text-sky-200'
              }`}>
                {AGENT_PRESETS.length} Specialists Loaded
              </span>
            </div>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
              Best-Skills Daily Rankings · Multimodal Gemini Live Voices · Sovereign Routing
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className={`flex items-center gap-1.5 rounded-xl border p-1 ${
          isLight ? 'border-rose-200/80 bg-white/80' : 'border-white/10 bg-black/40'
        }`}>
          <button
            onClick={() => setActiveSubTab('roster')}
            className={`rounded-lg px-3 py-1 text-[11px] font-medium transition ${
              activeSubTab === 'roster'
                ? isLight ? 'bg-rose-500/15 text-slate-900 font-semibold shadow-xs' : 'bg-white/15 text-white shadow'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/50 hover:text-white'
            }`}
          >
            Sub-Agents ({AGENT_PRESETS.length})
          </button>
          <button
            onClick={() => setActiveSubTab('orchestrator_prompt')}
            className={`rounded-lg px-3 py-1 text-[11px] font-medium transition ${
              activeSubTab === 'orchestrator_prompt'
                ? isLight ? 'bg-rose-500/15 text-slate-900 font-semibold shadow-xs' : 'bg-white/15 text-white shadow'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/50 hover:text-white'
            }`}
          >
            Sovereign Orchestrator
          </button>
          <button
            onClick={() => setActiveSubTab('tool_schema')}
            className={`rounded-lg px-3 py-1 text-[11px] font-medium transition ${
              activeSubTab === 'tool_schema'
                ? isLight ? 'bg-rose-500/15 text-slate-900 font-semibold shadow-xs' : 'bg-white/15 text-white shadow'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/50 hover:text-white'
            }`}
          >
            Tool-Calling Schema
          </button>
          <button
            onClick={() => setActiveSubTab('mcp_connectors')}
            className={`rounded-lg px-3 py-1 text-[11px] font-medium transition ${
              activeSubTab === 'mcp_connectors'
                ? isLight ? 'bg-rose-500/15 text-slate-900 font-semibold shadow-xs' : 'bg-white/15 text-white shadow'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/50 hover:text-white'
            }`}
          >
            MCP Connectors
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`m-scroll flex-1 overflow-y-auto p-6 backdrop-blur-md ${
        isLight ? 'bg-white/60' : 'bg-zinc-950/40'
      }`}>
        {/* VIEW 1: Sub-Agent Roster Grid & Inspector */}
        {activeSubTab === 'roster' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 max-w-7xl mx-auto">
            {/* Left Column: Agents Grid */}
            <div className="space-y-3.5 lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isLight ? 'text-slate-500' : 'text-white/50'
                }`}>
                  Specialized Agents & Voice Bindings ({visibleAgents.length})
                </span>

                {/* Search Bar */}
                <div className="relative w-full sm:w-60">
                  <Search className={`pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 ${
                    isLight ? 'text-slate-400' : 'text-white/40'
                  }`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search agents & vendors..."
                    className={`w-full rounded-lg border py-1 pl-8 pr-7 text-[11px] outline-none transition ${
                      isLight
                        ? 'border-rose-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-rose-400'
                        : 'border-white/12 bg-white/[0.04] text-white placeholder:text-white/35 focus:border-[var(--m-accent)]/60'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className={`absolute right-2 top-1.5 ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white'}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="flex flex-wrap gap-1">
                {([{ key: 'all', label: 'All' }, ...AGENT_CATEGORIES] as { key: AgentCategory | 'all'; label: string }[]).map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCategoryFilter(c.key)}
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition ${
                      categoryFilter === c.key
                        ? isLight
                          ? 'border-rose-400 bg-rose-100 text-slate-900 font-semibold'
                          : 'border-[var(--m-accent)]/60 bg-[var(--m-accent)]/20 text-white'
                        : isLight
                        ? 'border-rose-200 bg-white/70 text-slate-600 hover:text-slate-900 hover:border-rose-300'
                        : 'border-white/10 text-white/45 hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[720px] overflow-y-auto pr-1">
                {visibleAgents.map((agent) => {
                  const isSelected = agent.id === selectedAgentId;
                  return (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={`cursor-pointer rounded-2xl border p-3.5 transition-all duration-200 flex flex-col justify-between ${
                        isSelected
                          ? isLight
                            ? 'border-rose-400 bg-white shadow-md ring-1 ring-rose-400/50'
                            : 'border-[var(--m-accent)] bg-[var(--m-accent)]/15 shadow-md ring-1 ring-[var(--m-accent)]/40'
                          : isLight
                          ? 'border-rose-200/70 bg-white/80 hover:border-rose-300 hover:bg-white'
                          : 'border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <AgentAvatar skin={agent.skin} size={32} />
                          <div className="flex items-center gap-1.5">
                            {agent.wis && (
                              <span className={`rounded border px-1.5 py-0.2 text-[8.5px] font-mono ${
                                isLight ? 'border-rose-200 bg-rose-50 text-slate-600' : 'border-white/8 bg-white/[0.04] text-white/50'
                              }`}>
                                WIS {agent.wis.toFixed(1)}
                              </span>
                            )}
                            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-mono ${
                              isLight ? 'border-rose-200 bg-rose-50 text-slate-700' : 'border-white/10 bg-white/[0.04] text-white/60'
                            }`}>
                              {agent.geminiVoice}
                            </span>
                          </div>
                        </div>

                        <h3 className={`mt-2.5 font-display text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {agent.name}
                        </h3>
                        <p className={`text-[10px] line-clamp-1 ${isLight ? 'text-rose-600' : 'text-[var(--m-accent-soft)]'}`}>{agent.role}</p>
                        {agent.vendor && (
                          <p className={`text-[9px] font-mono uppercase tracking-wider mt-0.5 ${isLight ? 'text-slate-400' : 'text-white/35'}`}>
                            {agent.vendor}
                          </p>
                        )}
                        <p className={`mt-1.5 text-[10.5px] line-clamp-2 leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                          {agent.blurb}
                        </p>
                      </div>

                      <div className={`mt-3 flex items-center justify-between border-t pt-2 text-[10px] ${
                        isLight ? 'border-rose-100' : 'border-white/6'
                      }`}>
                        <span className={`capitalize ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{agent.category}</span>
                        <span className={`flex items-center gap-0.5 font-medium ${isLight ? 'text-rose-600' : 'text-[var(--m-accent-soft)]'}`}>
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
              <div className={`rounded-2xl border p-5 backdrop-blur-md sticky top-0 ${
                isLight ? 'border-rose-200/80 bg-white/90 shadow-md text-slate-800' : 'border-white/12 bg-white/[0.03] text-white'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AgentAvatar skin={selectedAgent.skin} size={42} />
                    <div>
                      <h2 className={`font-display text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {selectedAgent.name}
                      </h2>
                      <p className={`text-[11.5px] ${isLight ? 'text-slate-600' : 'text-white/60'}`}>{selectedAgent.role}</p>
                    </div>
                  </div>

                  {selectedAgent.wis && (
                    <span className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-2 py-1 text-[10px] font-mono text-sky-700 dark:text-sky-200">
                      WIS {selectedAgent.wis.toFixed(1)}
                    </span>
                  )}
                </div>

                {selectedAgent.vendor && (
                  <div className={`mt-3 flex items-center justify-between rounded-xl border px-3 py-2 text-[11px] ${
                    isLight ? 'border-rose-100 bg-rose-50/40 text-slate-700' : 'border-white/8 bg-black/30'
                  }`}>
                    <span className={isLight ? 'text-slate-500' : 'text-white/40'}>Sourced Origin</span>
                    <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-white/80'}`}>{selectedAgent.vendor}</span>
                  </div>
                )}

                {/* Gemini Live Voice Badge & Test Trigger */}
                <div className={`mt-3 rounded-xl border p-3.5 flex items-center justify-between ${
                  isLight ? 'border-rose-100 bg-rose-50/40 text-slate-800' : 'border-white/8 bg-black/30'
                }`}>
                  <div>
                    <p className={`text-[10px] uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Gemini Live Voice</p>
                    <p className={`text-xs font-semibold mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {voiceMeta.name} ({voiceMeta.gender} · {voiceMeta.timbre})
                    </p>
                    <p className={`text-[10.5px] ${isLight ? 'text-slate-600' : 'text-white/50'}`}>{voiceMeta.description}</p>
                  </div>
                  <button
                    onClick={() => testPlayVoice(selectedAgent.name, selectedAgent.geminiVoice)}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${
                      isLight
                        ? 'border-rose-200 bg-white text-slate-700 hover:bg-rose-50'
                        : 'border-white/15 bg-white/5 text-white hover:bg-white/15'
                    }`}
                    title="Test Voice Sample"
                  >
                    <Volume2
                      className={`h-4 w-4 ${testSpeaking === selectedAgent.name ? 'text-rose-500 animate-pulse' : ''}`}
                    />
                  </button>
                </div>

                {/* System Prompt */}
                <div className="mt-3.5">
                  <p className={`text-[10.5px] font-semibold uppercase tracking-wider mb-1.5 ${
                    isLight ? 'text-slate-500' : 'text-white/40'
                  }`}>
                    Agent Instruction & Scope
                  </p>
                  <div className={`rounded-xl border p-3 text-[11px] leading-relaxed max-h-36 overflow-y-auto ${
                    isLight ? 'border-rose-100 bg-rose-50/30 text-slate-700' : 'border-white/8 bg-black/40 text-white/75'
                  }`}>
                    {selectedAgent.systemPrompt}
                  </div>
                </div>

                {/* Starter Prompts */}
                <div className="mt-3.5">
                  <p className={`text-[10.5px] font-semibold uppercase tracking-wider mb-1.5 ${
                    isLight ? 'text-slate-500' : 'text-white/40'
                  }`}>
                    Starter Capabilities
                  </p>
                  <div className="space-y-1.5">
                    {selectedAgent.starters.map((s, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg border p-2 text-[11px] ${
                          isLight ? 'border-rose-100 bg-white/80 text-slate-700' : 'border-white/6 bg-white/[0.02] text-white/70'
                        }`}
                      >
                        "{s}"
                      </div>
                    ))}
                  </div>
                </div>

                {/* Direct Action: Jump into Chat with this Agent */}
                <button
                  onClick={() => onSelectAgentForChat(selectedAgent.id)}
                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl m-gradient-bg py-2.5 text-xs font-semibold text-white shadow-md hover:brightness-110 transition"
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
            <div className={`rounded-2xl border p-6 ${
              isLight ? 'border-rose-200/80 bg-white/90 shadow-md text-slate-800' : 'border-white/12 bg-white/[0.03]'
            }`}>
              <div className={`flex items-center gap-3 pb-4 border-b ${isLight ? 'border-rose-100' : 'border-white/8'}`}>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-600/20 text-purple-600 dark:text-purple-300">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <h2 className={`font-display text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    System Prompt 1: The Sovereign Orchestrator
                  </h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    Google AI Studio Central Router & Behavioral Mandates
                  </p>
                </div>
              </div>

              <div className={`mt-4 rounded-xl border p-4 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap ${
                isLight ? 'border-rose-200 bg-rose-50/50 text-slate-800' : 'border-white/10 bg-black/50 text-emerald-300/90'
              }`}>
                {SOVEREIGN_ORCHESTRATOR_PROMPT}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className={`rounded-xl border p-3 text-[11px] ${
                  isLight ? 'border-rose-100 bg-rose-50/40' : 'border-white/8 bg-white/[0.02]'
                }`}>
                  <p className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Cloud-Agent Architecture</p>
                  <p className={`text-[10.5px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Memories and states managed by cloud agents, synchronized across your deployed sessions.</p>
                </div>
                <div className={`rounded-xl border p-3 text-[11px] ${
                  isLight ? 'border-rose-100 bg-rose-50/40' : 'border-white/8 bg-white/[0.02]'
                }`}>
                  <p className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Adaptive Execution</p>
                  <p className={`text-[10.5px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Calibrates strictly against sovereign intake without demographic guessing.</p>
                </div>
                <div className={`rounded-xl border p-3 text-[11px] ${
                  isLight ? 'border-rose-100 bg-rose-50/40' : 'border-white/8 bg-white/[0.02]'
                }`}>
                  <p className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Sub-Agent Dispatch</p>
                  <p className={`text-[10.5px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Single conversational thread seamlessly routed to domain specialists.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: Tool-Calling & Dynamic Form Hydration Schema (System Prompt 2) */}
        {activeSubTab === 'tool_schema' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className={`rounded-2xl border p-6 ${
              isLight ? 'border-rose-200/80 bg-white/90 shadow-md text-slate-800' : 'border-white/12 bg-white/[0.03]'
            }`}>
              <div className={`flex items-center gap-3 pb-4 border-b ${isLight ? 'border-rose-100' : 'border-white/8'}`}>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-600/20 text-sky-600 dark:text-sky-300">
                  <Terminal className="h-5 w-5" />
                </span>
                <div>
                  <h2 className={`font-display text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    System Prompt 2: Tool-Calling & Dynamic Form Hydration
                  </h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    Tool definition schema for real-time automated voice & chat hydration
                  </p>
                </div>
              </div>

              <div className={`mt-4 rounded-xl border p-4 font-mono text-xs leading-relaxed overflow-x-auto ${
                isLight ? 'border-rose-200 bg-rose-50/50 text-slate-800' : 'border-white/10 bg-black/50 text-sky-300/90'
              }`}>
                <pre>{JSON.stringify(HYDRATE_FORM_TOOL_DEFINITION, null, 2)}</pre>
              </div>

              <div className={`mt-4 rounded-xl border p-3 text-[11.5px] ${
                isLight ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-amber-500/20 bg-amber-500/10 text-amber-200'
              }`}>
                <strong>Affirmative Confirmation Guarantee:</strong> Any tool invocation with <code>requires_user_confirmation: true</code> displays a dedicated interactive authorization card and will not perform external side-effects without explicit affirmative click.
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: MCP (Model Context Protocol) Connectors */}
        {activeSubTab === 'mcp_connectors' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className={`rounded-2xl border p-6 ${
              isLight ? 'border-rose-200/80 bg-white/90 shadow-md text-slate-800' : 'border-white/12 bg-white/[0.03]'
            }`}>
              <div className={`flex items-center gap-3 pb-4 border-b ${isLight ? 'border-rose-100' : 'border-white/8'}`}>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600/20 text-emerald-600 dark:text-emerald-300">
                  <Cpu className="h-5 w-5" />
                </span>
                <div>
                  <h2 className={`font-display text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Model Context Protocol (MCP) Connectors
                  </h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    Cloud-native connectors providing deterministic agent execution
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: 'Cloud Workspace Storage MCP', desc: 'Read/write structured JSON archives and cloud memory vault.', status: 'Active (Cloud-Native)' },
                  { name: 'Browser Automation Runner MCP', desc: 'Dispatches staged errand actions to external portals with operator confirmation.', status: 'Active (Awaiting Operator Action)' },
                  { name: 'Executive Calendar MCP', desc: 'Syncs buffered slots with Coco and alerts on schedule overlaps.', status: 'Active (Cloud Agent Ready)' },
                  { name: 'Supabase Sovereign Storage MCP', desc: 'Optional end-to-end encrypted backup using your isolated environment credentials.', status: 'Configured' },
                ].map((mcp, idx) => (
                  <div key={idx} className={`rounded-xl border p-4 ${
                    isLight ? 'border-rose-100 bg-rose-50/40 text-slate-800' : 'border-white/8 bg-white/[0.02] text-white'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h4 className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>{mcp.name}</h4>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> {mcp.status}
                      </span>
                    </div>
                    <p className={`mt-2 text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/55'}`}>{mcp.desc}</p>
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
