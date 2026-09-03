import React, { useState } from 'react';
import {
  MessageSquare, Plus, Pin, Sparkles, Shield, Bookmark,
  ChevronDown, ChevronRight, Palette, Tag, Check, Trash2,
  Calendar, Dumbbell, Brain, Heart, Briefcase, ShoppingBag,
  Cpu, Users, Trophy, Music, Image as ImageIcon, Sliders
} from 'lucide-react';
import type { DomainId, MemoryEntry, StickerWatermark, UserProfile } from '@/data/schemas';
import { AESTHETIC_THEMES, type AestheticTheme } from '@/data/intake';
import AgentAvatar from '@/components/agents/AgentAvatar';
import { AGENT_PRESETS } from '@/data/agents';

export interface ChatThread {
  id: string;
  title: string;
  domain: DomainId;
  updatedAt: string;
  agentId?: string;
}

interface LeftRailProps {
  threads: ChatThread[];
  activeThreadId: string;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  onDeleteThread: (id: string) => void;
  memories: MemoryEntry[];
  profile: UserProfile;
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  theme: AestheticTheme;
  stickers: StickerWatermark[];
  onToggleSticker: (id: string) => void;
  onOpenAgentRoster: () => void;
  onOpenTab?: (tabType: 'chat' | 'agent' | 'connectors' | 'ledger' | 'customizer' | 'theme', meta?: { agentId?: string }) => void;
}

export const LeftRail: React.FC<LeftRailProps> = ({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  memories,
  profile,
  onUpdateProfile,
  theme,
  stickers,
  onToggleSticker,
  onOpenAgentRoster,
  onOpenTab,
}) => {
  const [sectionOpen, setSectionOpen] = useState<{
    threads: boolean;
    connectors: boolean;
    agents: boolean;
    memories: boolean;
    customizer: boolean;
  }>({
    threads: true,
    connectors: true,
    agents: true,
    memories: false,
    customizer: false,
  });

  const [memoryFilter, setMemoryFilter] = useState<string>('all');

  const toggleSection = (key: keyof typeof sectionOpen) => {
    setSectionOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredMemories = memoryFilter === 'all'
    ? memories
    : memories.filter((m) => m.category === memoryFilter || m.tags.includes(memoryFilter));

  return (
    <div className="flex h-full flex-col bg-[#12131A] text-white select-none">
      {/* Header with New Thread Action */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-4 py-3 bg-[#0F1017]">
        <div
          onClick={() => onOpenTab?.('chat')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg m-gradient-bg shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold leading-none text-white group-hover:text-[var(--m-accent-soft)] transition">
              Magdalene OS
            </p>
            <p className="text-[9px] uppercase tracking-wider text-white/40">Sovereign Executive</p>
          </div>
        </div>
        <button
          onClick={onNewThread}
          title="Start a new conversational thread"
          className="flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-medium text-white/80 transition hover:border-[var(--m-accent)]/50 hover:bg-white/10 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Scrollable Rail Content */}
      <div className="m-scroll flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {/* Section 1: Active Conversational Threads */}
        <div>
          <button
            onClick={() => toggleSection('threads')}
            className="flex w-full items-center justify-between py-1 text-[11px] font-semibold uppercase tracking-wider text-white/45 hover:text-white/70"
          >
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-sky-400" /> Active Threads ({threads.length})
            </span>
            {sectionOpen.threads ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>

          {sectionOpen.threads && (
            <div className="mt-1.5 space-y-1">
              {threads.map((t) => {
                const isActive = t.id === activeThreadId;
                const agent = t.agentId ? AGENT_PRESETS.find((a) => a.id === t.agentId) : null;

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      onSelectThread(t.id);
                      onOpenTab?.('chat');
                    }}
                    className={`group relative flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-[12px] transition ${
                      isActive
                        ? 'border border-[var(--m-accent)]/50 bg-[var(--m-accent)]/15 text-white font-medium shadow-sm'
                        : 'border border-transparent text-white/65 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {agent ? (
                        <AgentAvatar skin={agent.skin} size={18} />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-[var(--m-accent-soft)]" />
                      )}
                      <span className="truncate">{t.title}</span>
                    </div>
                    {threads.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteThread(t.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-rose-400 transition"
                        title="Delete thread"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: MCP Connectors & Bridge */}
        <div className="border-t border-white/8 pt-3">
          <button
            onClick={() => toggleSection('connectors')}
            className="flex w-full items-center justify-between py-1 text-[11px] font-semibold uppercase tracking-wider text-white/45 hover:text-white/70"
          >
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-emerald-400" /> MCP Connectors (4)
            </span>
            {sectionOpen.connectors ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>

          {sectionOpen.connectors && (
            <div className="mt-1.5 space-y-1">
              <button
                onClick={() => onOpenTab?.('connectors')}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[11.5px] text-white/70 hover:bg-white/[0.04] hover:text-white transition"
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Local Filesystem MCP</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">4ms</span>
              </button>

              <button
                onClick={() => onOpenTab?.('connectors')}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[11.5px] text-white/70 hover:bg-white/[0.04] hover:text-white transition"
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Browser Automation Bridge</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">12ms</span>
              </button>

              <button
                onClick={() => onOpenTab?.('connectors')}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[11.5px] text-white/70 hover:bg-white/[0.04] hover:text-white transition"
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Executive Calendar MCP</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">18ms</span>
              </button>

              <button
                onClick={() => onOpenTab?.('connectors')}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[11.5px] text-white/70 hover:bg-white/[0.04] hover:text-white transition"
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Sovereign Local Store MCP</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">2ms</span>
              </button>
            </div>
          )}
        </div>

        {/* Section 3: Sub-Agent Registry */}
        <div className="border-t border-white/8 pt-3">
          <button
            onClick={() => toggleSection('agents')}
            className="flex w-full items-center justify-between py-1 text-[11px] font-semibold uppercase tracking-wider text-white/45 hover:text-white/70"
          >
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-fuchsia-400" /> Sub-Agent Workstations
            </span>
            {sectionOpen.agents ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>

          {sectionOpen.agents && (
            <div className="mt-1.5 space-y-1">
              {AGENT_PRESETS.map((ag) => (
                <button
                  key={ag.id}
                  onClick={() => onOpenTab?.('agent', { agentId: ag.id })}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[11.5px] text-white/70 hover:bg-white/[0.04] hover:text-white transition"
                >
                  <div className="flex items-center gap-2 truncate">
                    <AgentAvatar skin={ag.skin} size={16} />
                    <span className="truncate font-medium text-white/85">{ag.name}</span>
                  </div>
                  <span className="text-[9.5px] text-white/35 font-mono capitalize">{ag.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Space Customizer & Stickers (MySpace-Style) */}
        <div className="border-t border-white/8 pt-3">
          <button
            onClick={() => toggleSection('customizer')}
            className="flex w-full items-center justify-between py-1 text-[11px] font-semibold uppercase tracking-wider text-white/45 hover:text-white/70"
          >
            <span className="flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-amber-400" /> MySpace Customizer
            </span>
            {sectionOpen.customizer ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>

          {sectionOpen.customizer && (
            <div className="mt-2 space-y-2">
              <button
                onClick={() => onOpenTab?.('customizer')}
                className="flex w-full items-center justify-between rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-2.5 text-left text-xs font-semibold text-fuchsia-200 hover:bg-fuchsia-500/20 transition"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-fuchsia-400" />
                  <span>Open Space Customizer</span>
                </span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              <div className="space-y-1">
                <p className="text-[10px] uppercase font-mono tracking-wider text-white/40 px-1">
                  Active Stickers ({stickers.filter((s) => s.active).length})
                </p>
                {stickers.slice(0, 4).map((st) => (
                  <button
                    key={st.id}
                    onClick={() => onToggleSticker(st.id)}
                    className={`flex w-full items-center justify-between rounded-lg border px-2 py-1.5 text-[11px] transition ${
                      st.active
                        ? 'border-[var(--m-accent-soft)]/50 bg-[var(--m-accent-soft)]/10 text-white'
                        : 'border-white/8 bg-white/[0.02] text-white/40 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span>{st.emoji}</span>
                      <span className="truncate">{st.label}</span>
                    </span>
                    {st.active && <Check className="h-3 w-3 text-emerald-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Pinned Sovereign Memories */}
        <div className="border-t border-white/8 pt-3">
          <button
            onClick={() => toggleSection('memories')}
            className="flex w-full items-center justify-between py-1 text-[11px] font-semibold uppercase tracking-wider text-white/45 hover:text-white/70"
          >
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-400" /> Memory Ledger ({memories.length})
            </span>
            {sectionOpen.memories ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>

          {sectionOpen.memories && (
            <div className="mt-2 space-y-2">
              <button
                onClick={() => onOpenTab?.('ledger')}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-left text-[11px] text-white/70 hover:text-white hover:border-white/20 transition"
              >
                <span>Inspect Full Memory Vault</span>
                <ChevronRight className="h-3 w-3" />
              </button>

              <div className="space-y-1.5">
                {filteredMemories.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="rounded-lg border border-white/8 bg-white/[0.02] p-2 text-[11px] leading-relaxed text-white/70 hover:border-white/20 transition"
                  >
                    <p className="line-clamp-2">{m.content}</p>
                    <div className="mt-1 flex items-center justify-between text-[9px] text-white/35">
                      <span className="uppercase font-mono tracking-wider">{m.category}</span>
                      <span>{m.tags.join(' · ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Sovereign Guarantee */}
      <div className="shrink-0 border-t border-white/8 p-3 bg-black/20">
        <div className="flex items-center justify-between text-[10px] text-white/40">
          <span className="flex items-center gap-1 text-emerald-300/80">
            <Shield className="h-3 w-3" /> Local Sovereign Vault
          </span>
          <button
            onClick={() => onOpenTab?.('theme')}
            className="text-[10px] font-medium text-[var(--m-accent-soft)] hover:underline"
          >
            Theme Matrix
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeftRail;

