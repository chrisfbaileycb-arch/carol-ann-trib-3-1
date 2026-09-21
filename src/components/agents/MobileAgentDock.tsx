import React, { useMemo, useState } from 'react';
import {
  X, Sparkles, SlidersHorizontal, Check, Bot, Search, Users, ShieldCheck,
  MessageSquare, ChevronRight, Zap, Star
} from 'lucide-react';
import AgentAvatar from '@/components/agents/AgentAvatar';
import AgentChat from '@/components/agents/AgentChat';
import { type AgentConfig, loadAgents, saveAgents } from '@/lib/agentStore';
import { AGENT_CATEGORIES, type AgentCategory } from '@/data/agents';
import {
  CREW_LIMIT, loadCrew, toggleCrewMember, loadActiveCrewMember, saveActiveCrewMember,
  delegateToCopilot,
} from '@/lib/copilotSession';
import { useCarol } from '@/contexts/CarolContext';
import { isLightTheme } from '@/data/intake';

interface MobileAgentDockProps {
  className?: string;
  onHandOff?: () => void;
  isLight?: boolean;
  activeAgentId?: string | null;
  onSelectAgent?: (id: string) => void;
}

type TabKey = 'all' | 'crew' | AgentCategory;

const MobileAgentDock: React.FC<MobileAgentDockProps> = ({
  className = '',
  onHandOff,
  isLight,
  activeAgentId,
  onSelectAgent,
}) => {
  const { profile } = useCarol();
  const light = isLight !== undefined ? isLight : isLightTheme(profile);

  const [agents, setAgents] = useState<AgentConfig[]>(() => loadAgents());
  const [crew, setCrew] = useState<string[]>(() => loadCrew());
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(() => activeAgentId ?? loadActiveCrewMember());
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if (activeAgentId !== undefined && activeAgentId !== null) {
      setActiveRole(activeAgentId);
    }
  }, [activeAgentId]);

  const roster = useMemo(() => agents.filter((a) => a.enabled), [agents]);

  const crewAgents = useMemo(
    () => crew.map((id) => roster.find((a) => a.id === id)).filter(Boolean) as AgentConfig[],
    [crew, roster],
  );

  const active = useMemo(() => agents.find((a) => a.id === openId) ?? null, [agents, openId]);

  // Tab definitions with dynamic counts
  const tabs = useMemo(() => {
    const list: { key: TabKey; label: string; count: number }[] = [
      { key: 'all', label: 'All Agents', count: roster.length },
      { key: 'crew', label: 'Phone Crew', count: crewAgents.length },
    ];

    AGENT_CATEGORIES.forEach((cat) => {
      const count = roster.filter((a) => a.category === cat.key).length;
      if (count > 0) {
        list.push({ key: cat.key, label: cat.label, count });
      }
    });

    return list;
  }, [roster, crewAgents]);

  // Filtered agents based on active tab and search query
  const filteredAgents = useMemo(() => {
    let list = roster;
    if (activeTab === 'crew') {
      list = crewAgents;
    } else if (activeTab !== 'all') {
      list = roster.filter((a) => a.category === activeTab);
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    return list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.subject.toLowerCase().includes(q) ||
        a.blurb.toLowerCase().includes(q),
    );
  }, [roster, crewAgents, activeTab, searchQuery]);

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
    if (next) {
      onSelectAgent?.(next);
    }
  };

  const toggleCrew = (id: string) => {
    const next = toggleCrewMember(id);
    setCrew(next);
  };

  return (
    <div className={className}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className={`flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] font-extrabold ${light ? 'text-slate-800' : 'text-white/90'}`}>
            <Sparkles className="h-3.5 w-3.5 text-[var(--m-accent)]" /> Carol Ann OS Agents & Roster
          </p>
          <p className={`text-xs font-medium ${light ? 'text-slate-500' : 'text-white/60'}`}>
            {roster.length} specialized intelligence agents ready to assist
          </p>
        </div>

        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold border ${
          light ? 'border-slate-200 bg-white text-slate-800' : 'border-white/15 bg-white/10 text-white'
        }`}>
          {crewAgents.length}/{CREW_LIMIT} Carried
        </span>
      </div>

      {/* Carried Phone Crew Carousel (Fast Quick-Action Bar) */}
      {crewAgents.length > 0 && (
        <div className="mt-3">
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${light ? 'text-slate-500' : 'text-white/50'}`}>
            Carried On Phone (Fast Access)
          </p>
          <div className="m-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {crewAgents.map((a) => (
              <div
                key={a.id}
                className={`m-lift flex w-[124px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-2.5 py-2.5 shadow-sm transition ${
                  activeRole === a.id
                    ? light
                      ? 'border-[var(--m-accent)] bg-white shadow-md ring-2 ring-[var(--m-accent)]/25'
                      : 'border-[var(--m-accent)]/80 bg-[var(--m-accent)]/20 shadow-md ring-1 ring-[var(--m-accent)]'
                    : light
                      ? 'border-slate-200/90 bg-white/95 hover:bg-white'
                      : 'border-white/15 bg-zinc-900/80 hover:bg-zinc-800/90'
                }`}
              >
                <button onClick={() => setOpenId(a.id)} className="flex flex-col items-center gap-1 w-full">
                  <AgentAvatar skin={a.skin} size={42} active={a.disclaimerAccepted} />
                  <span className={`w-full truncate text-center text-xs font-bold ${light ? 'text-slate-900' : 'text-white'}`}>
                    {a.name}
                  </span>
                  <span className={`line-clamp-1 text-center text-[10px] font-medium leading-tight ${light ? 'text-slate-500' : 'text-white/60'}`}>
                    {a.role}
                  </span>
                </button>

                <div className="flex items-center gap-1 w-full mt-1">
                  <button
                    onClick={() => chooseRole(a.id)}
                    className={`flex-1 rounded-full border py-0.5 text-[9.5px] font-bold transition ${
                      activeRole === a.id
                        ? light
                          ? 'border-emerald-600/50 bg-emerald-50 text-emerald-900'
                          : 'border-emerald-400/40 bg-emerald-400/20 text-emerald-300'
                        : light
                          ? 'border-slate-300/80 bg-slate-50 text-slate-700'
                          : 'border-white/15 text-white/70'
                    }`}
                  >
                    {activeRole === a.id ? 'On duty' : 'Duty'}
                  </button>

                  <button
                    onClick={() => setOpenId(a.id)}
                    className="grid h-5 w-5 place-items-center rounded-full border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white"
                    title="Chat"
                  >
                    <MessageSquare className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="mt-3.5 relative">
        <Search className={`absolute left-3 top-2.5 h-3.5 w-3.5 ${light ? 'text-slate-400' : 'text-white/40'}`} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search all agents by name or role…"
          className={`w-full rounded-xl border pl-9 pr-8 py-2 text-xs font-medium outline-none transition shadow-sm ${
            light
              ? 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-[var(--m-accent)] focus:ring-2 focus:ring-[var(--m-accent)]/20'
              : 'border-white/15 bg-black/40 text-white placeholder:text-white/40 focus:border-[var(--m-accent)]/70'
          }`}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className={`absolute right-2.5 top-2.5 rounded-full p-0.5 ${light ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white'}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Category Tabs Scroll Bar */}
      <div className="m-scroll -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1.5">
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition shadow-sm ${
                isSelected
                  ? light
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-[var(--m-accent)] text-white shadow-md ring-1 ring-white/30'
                  : light
                    ? 'border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50'
                    : 'border border-white/15 bg-white/[0.06] text-white/80 hover:bg-white/12'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                  isSelected
                    ? light
                      ? 'bg-white/20 text-white'
                      : 'bg-black/30 text-white'
                    : light
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-white/10 text-white/60'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Agents Roster Cards Grid */}
      <div className="mt-3 space-y-2.5">
        {filteredAgents.length === 0 && (
          <div className={`rounded-2xl border p-5 text-center ${light ? 'border-slate-200 bg-white text-slate-500' : 'border-white/10 bg-black/30 text-white/50'}`}>
            <Users className="mx-auto h-6 w-6 opacity-40 mb-1" />
            <p className="text-xs font-semibold">No agents found matching &ldquo;{searchQuery}&rdquo;</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveTab('all'); }}
              className="mt-2 text-xs font-bold text-[var(--m-accent)] underline"
            >
              Show all agents
            </button>
          </div>
        )}

        {filteredAgents.map((a) => {
          const isCarried = crew.includes(a.id);
          const isOnDuty = activeRole === a.id;
          return (
            <div
              key={a.id}
              className={`rounded-2xl border p-3.5 transition-all shadow-sm ${
                isOnDuty
                  ? light
                    ? 'border-[var(--m-accent)] bg-white ring-2 ring-[var(--m-accent)]/20 shadow-md'
                    : 'border-[var(--m-accent)]/70 bg-[var(--m-accent)]/10 ring-1 ring-[var(--m-accent)]/50'
                  : light
                    ? 'border-slate-200/90 bg-white/95 hover:border-slate-300 hover:shadow-md'
                    : 'border-white/12 bg-zinc-900/75 hover:bg-zinc-800/90'
              }`}
            >
              <div className="flex items-start gap-3">
                <AgentAvatar skin={a.skin} size={42} active={a.disclaimerAccepted} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className={`text-sm font-extrabold truncate ${light ? 'text-slate-950' : 'text-white'}`}>
                        {a.name}
                      </h4>
                      {isOnDuty && (
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.2 text-[9px] font-black text-emerald-600 dark:text-emerald-300">
                          ON DUTY
                        </span>
                      )}
                    </div>

                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${
                      light ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-white/10 bg-white/5 text-white/60'
                    }`}>
                      {a.category}
                    </span>
                  </div>

                  <p className={`text-xs font-semibold mt-0.5 ${light ? 'text-slate-700' : 'text-white/80'}`}>
                    {a.role}
                  </p>

                  <p className={`text-[11px] leading-relaxed mt-1 line-clamp-2 ${light ? 'text-slate-500' : 'text-white/60'}`}>
                    {a.blurb}
                  </p>

                  {/* Sample starter prompt if available */}
                  {a.starters?.[0] && (
                    <button
                      onClick={() => {
                        setOpenId(a.id);
                      }}
                      className={`mt-2 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-left text-[10.5px] font-medium transition ${
                        light
                          ? 'border-slate-200 bg-slate-50/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                          : 'border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <Zap className="h-3 w-3 text-[var(--m-accent)] shrink-0" />
                      <span className="truncate">&ldquo;{a.starters[0]}&rdquo;</span>
                    </button>
                  )}

                  {/* Actions Row */}
                  <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleCrew(a.id)}
                        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition shadow-sm ${
                          isCarried
                            ? light
                              ? 'border-emerald-600/40 bg-emerald-50 text-emerald-900'
                              : 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300'
                            : light
                              ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              : 'border-white/15 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {isCarried ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" /> In Crew
                          </>
                        ) : (
                          <>
                            <Star className="h-3 w-3 opacity-60" /> Carry on Phone
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => chooseRole(a.id)}
                        className={`rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition shadow-sm ${
                          isOnDuty
                            ? light
                              ? 'border-[var(--m-accent)] bg-[var(--m-accent)]/15 text-[var(--m-accent)]'
                              : 'border-[var(--m-accent)] bg-[var(--m-accent)]/30 text-white'
                            : light
                              ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              : 'border-white/15 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {isOnDuty ? 'Active Duty' : 'Set on Duty'}
                      </button>
                    </div>

                    <button
                      onClick={() => setOpenId(a.id)}
                      className="flex items-center gap-1 rounded-full m-gradient-bg px-3 py-1 text-[11px] font-black text-white shadow-sm hover:brightness-110 active:scale-95 transition"
                    >
                      <span>Chat</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-Screen Agent Chat Modal */}
      {active && (
        <div className={`fixed inset-0 z-[70] flex flex-col ${light ? 'bg-white text-slate-900' : 'bg-[#101118] text-white'}`}>
          <div className={`flex items-center justify-between border-b px-4 py-3 ${light ? 'border-slate-200 bg-slate-50/95' : 'border-white/10 bg-black/40'}`}>
            <span className="flex items-center gap-2.5">
              <AgentAvatar skin={active.skin} size={32} />
              <div>
                <span className={`text-sm font-black block leading-tight ${light ? 'text-slate-950' : 'text-white'}`}>{active.name}</span>
                <span className={`text-[10px] font-semibold ${light ? 'text-slate-500' : 'text-white/60'}`}>{active.role}</span>
              </div>
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
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-sm transition ${
                  light
                    ? 'border-[var(--m-accent)]/50 bg-white text-slate-900 hover:bg-[var(--m-accent)]/10'
                    : 'border-[var(--m-accent)]/50 bg-[var(--m-accent)]/20 text-white'
                }`}
              >
                <Bot className="h-3.5 w-3.5 text-[var(--m-accent)]" /> Hand to co-pilot
              </button>

              <button
                onClick={() => setOpenId(null)}
                className={`rounded-full border p-2 transition ${
                  light ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100' : 'border-white/15 text-white/70 hover:text-white'
                }`}
              >
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
