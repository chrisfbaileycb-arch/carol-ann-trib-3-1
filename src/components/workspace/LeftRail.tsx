import React, { useState } from 'react';
import {
  MessageSquare, Plus, Pin, Sparkles, Shield, Bookmark,
  ChevronDown, ChevronRight, Palette, Tag, Check, Trash2,
  Calendar, Dumbbell, Brain, Heart, Briefcase, ShoppingBag,
  Cpu, Users, Trophy, Music, Image as ImageIcon, Sliders, Cloud,
  Zap, Layers, Globe
} from 'lucide-react';
import type { DomainId, MemoryEntry, StickerWatermark, UserProfile } from '@/data/schemas';
import { AESTHETIC_THEMES, type AestheticTheme, isLightTheme } from '@/data/intake';
import AgentAvatar from '@/components/agents/AgentAvatar';
import { AGENT_PRESETS } from '@/data/agents';
import { MCP_PLUGINS_DIRECTORY, loadInstalledPluginIds } from '@/data/mcpPlugins';

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
  installedPluginIds?: string[];
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
  installedPluginIds: propInstalledPluginIds,
}) => {
  const activeInstalledIds = propInstalledPluginIds ?? loadInstalledPluginIds();
  const installedPluginsList = MCP_PLUGINS_DIRECTORY.filter((p) => activeInstalledIds.includes(p.id));

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

  const isLight = isLightTheme(profile);

  const filteredMemories = memoryFilter === 'all'
    ? memories
    : memories.filter((m) => m.category === memoryFilter || m.tags.includes(memoryFilter));

  return (
    <div className={`flex h-full flex-col backdrop-blur-md select-none transition-colors ${
      isLight ? 'bg-white/75 text-slate-800' : 'bg-zinc-950/80 text-white'
    }`}>
      {/* Header with New Thread Action */}
      <div className={`flex shrink-0 items-center justify-between border-b px-4 py-3 backdrop-blur-md ${
        isLight ? 'border-rose-200/60 bg-white/70' : 'border-white/10 bg-zinc-950/60'
      }`}>
        <div
          onClick={() => onOpenTab?.('chat')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg m-gradient-bg shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </span>
          <div>
            <p className={`font-display text-sm font-semibold leading-none group-hover:text-[var(--m-accent-soft)] transition ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              Carol Ann OS
            </p>
            <p className={`text-[9px] uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Sovereign Executive</p>
          </div>
        </div>
        <button
          onClick={onNewThread}
          title="Start a new conversational thread"
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
            isLight
              ? 'border-rose-200/90 bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900 shadow-xs'
              : 'border-white/12 bg-white/[0.04] text-white/80 hover:border-[var(--m-accent)]/50 hover:bg-white/10 hover:text-white'
          }`}
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
            className={`flex w-full items-center justify-between py-1 text-xs font-semibold uppercase tracking-wider transition ${
              isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-sky-400" /> Active Threads ({threads.length})
            </span>
            {sectionOpen.threads ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
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
                    className={`group relative flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs transition ${
                      isActive
                        ? isLight
                          ? 'border border-[var(--m-accent)]/60 bg-[var(--m-accent)]/15 text-slate-900 font-medium shadow-xs'
                          : 'border border-[var(--m-accent)]/50 bg-[var(--m-accent)]/20 text-white font-medium shadow-sm'
                        : isLight
                        ? 'border border-transparent text-slate-700 hover:bg-rose-50/70 hover:text-slate-900'
                        : 'border border-transparent text-white/75 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {agent ? (
                        <AgentAvatar skin={agent.skin} size={20} />
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
                        className={`opacity-0 group-hover:opacity-100 p-1 transition ${
                          isLight ? 'text-slate-400 hover:text-rose-600' : 'text-white/40 hover:text-rose-400'
                        }`}
                        title="Delete thread"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: MCP Connectors & Connected Plugins */}
        <div className={`border-t pt-3 ${isLight ? 'border-rose-200/60' : 'border-white/8'}`}>
          <button
            onClick={() => toggleSection('connectors')}
            className={`flex w-full items-center justify-between py-1 text-xs font-semibold uppercase tracking-wider transition ${
              isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-emerald-500" /> Connected Plugins ({installedPluginsList.length})
            </span>
            {sectionOpen.connectors ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>

          {sectionOpen.connectors && (
            <div className="mt-1.5 space-y-1">
              {installedPluginsList.slice(0, 6).map((plugin) => (
                <button
                  key={plugin.id}
                  onClick={() => onOpenTab?.('connectors')}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                    isLight
                      ? 'text-slate-700 hover:bg-rose-50/70 hover:text-slate-900'
                      : 'text-white/80 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="truncate">{plugin.name}</span>
                  </div>
                  <span className="text-[10px] shrink-0 font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                    {plugin.tools.length} tools
                  </span>
                </button>
              ))}

              <button
                onClick={() => onOpenTab?.('connectors')}
                className={`mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[11px] font-semibold transition ${
                  isLight
                    ? 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50'
                    : 'border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Layers className="h-3 w-3 text-sky-400" />
                <span>Plugin & MCP Marketplace ({installedPluginsList.length} Active)</span>
              </button>
            </div>
          )}
        </div>

        {/* Section 3: Sub-Agent Registry */}
        <div className={`border-t pt-3 ${isLight ? 'border-rose-200/60' : 'border-white/8'}`}>
          <button
            onClick={() => toggleSection('agents')}
            className={`flex w-full items-center justify-between py-1 text-xs font-semibold uppercase tracking-wider transition ${
              isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-fuchsia-500" /> Sub-Agent Workstations
            </span>
            {sectionOpen.agents ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>

          {sectionOpen.agents && (
            <div className="mt-1.5 space-y-1">
              {AGENT_PRESETS.map((ag) => (
                <button
                  key={ag.id}
                  onClick={() => onOpenTab?.('agent', { agentId: ag.id })}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                    isLight
                      ? 'text-slate-700 hover:bg-rose-50/70 hover:text-slate-900'
                      : 'text-white/80 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <AgentAvatar skin={ag.skin} size={18} />
                    <span className={`truncate font-medium ${isLight ? 'text-slate-800' : 'text-white/90'}`}>{ag.name}</span>
                  </div>
                  <span className={`text-[10px] font-mono capitalize ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{ag.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Space Customizer & Stickers (MySpace-Style) */}
        <div className={`border-t pt-3 ${isLight ? 'border-rose-200/60' : 'border-white/8'}`}>
          <button
            onClick={() => toggleSection('customizer')}
            className={`flex w-full items-center justify-between py-1 text-xs font-semibold uppercase tracking-wider transition ${
              isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-amber-500" /> MySpace Customizer
            </span>
            {sectionOpen.customizer ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>

          {sectionOpen.customizer && (
            <div className="mt-2 space-y-2">
              <button
                onClick={() => onOpenTab?.('customizer')}
                className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                  isLight
                    ? 'border-rose-200 bg-rose-50/70 text-rose-900 hover:bg-rose-100/70'
                    : 'border-fuchsia-500/35 bg-fuchsia-500/15 text-fuchsia-200 hover:bg-fuchsia-500/25'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className={`h-4 w-4 ${isLight ? 'text-rose-500' : 'text-fuchsia-400'}`} />
                  <span>Open Space Customizer</span>
                </span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              <div className="space-y-1">
                <p className={`text-[10px] uppercase font-mono tracking-wider px-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  Active Stickers ({stickers.filter((s) => s.active).length})
                </p>
                {stickers.slice(0, 4).map((st) => (
                  <button
                    key={st.id}
                    onClick={() => onToggleSticker(st.id)}
                    className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition ${
                      st.active
                        ? isLight
                          ? 'border-[var(--m-accent)]/50 bg-[var(--m-accent)]/15 text-slate-800 font-semibold'
                          : 'border-[var(--m-accent-soft)]/50 bg-[var(--m-accent-soft)]/15 text-white font-medium'
                        : isLight
                        ? 'border-rose-100 bg-white/60 text-slate-700 hover:bg-white'
                        : 'border-white/10 bg-white/[0.03] text-white/60 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span>{st.emoji}</span>
                      <span className="truncate">{st.label}</span>
                    </span>
                    {st.active && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Pinned Sovereign Memories */}
        <div className={`border-t pt-3 ${isLight ? 'border-rose-200/60' : 'border-white/8'}`}>
          <button
            onClick={() => toggleSection('memories')}
            className={`flex w-full items-center justify-between py-1 text-xs font-semibold uppercase tracking-wider transition ${
              isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Cloud className="h-3.5 w-3.5 text-sky-500" /> Cloud Memory Vault ({memories.length})
            </span>
            {sectionOpen.memories ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>

          {sectionOpen.memories && (
            <div className="mt-2 space-y-2">
              <button
                onClick={() => onOpenTab?.('ledger')}
                className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-xs transition ${
                  isLight
                    ? 'border-rose-200/80 bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900'
                    : 'border-white/12 bg-white/[0.04] text-white/80 hover:text-white hover:border-white/25'
                }`}
              >
                <span>Inspect Full Memory Vault</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              <div className="space-y-1.5">
                {filteredMemories.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg border p-2.5 text-xs leading-relaxed transition ${
                      isLight
                        ? 'border-rose-100 bg-white/75 text-slate-700 shadow-xs'
                        : 'border-white/10 bg-white/[0.03] text-white/80 hover:border-white/25'
                    }`}
                  >
                    <p className="line-clamp-2">{m.content}</p>
                    <div className={`mt-1 flex items-center justify-between text-[10px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      <span className="uppercase font-mono tracking-wider font-medium">{m.category}</span>
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
      <div className={`shrink-0 border-t p-3 ${isLight ? 'border-rose-200/60 bg-white/70' : 'border-white/8 bg-black/30'}`}>
        <div className={`flex items-center justify-between text-xs ${isLight ? 'text-slate-600' : 'text-white/55'}`}>
          <span className="flex items-center gap-1.5 text-sky-500">
            <Cloud className="h-3.5 w-3.5" /> Cloud Agent Vault
          </span>
          <button
            onClick={() => onOpenTab?.('theme')}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--m-accent-soft)] hover:underline"
          >
            <Palette className="h-3 w-3" />
            <span>Wallpaper & Design</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeftRail;

