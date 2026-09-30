import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Search, Check, Plus, Wrench, Shield, Sparkles, Filter,
  Terminal, Layers, CheckCheck, RefreshCw, Cpu, BookOpen, ExternalLink, Zap
} from 'lucide-react';
import { AGENT_SKILLS, SKILL_CATEGORIES, type AgentSkill, type SkillCategory } from '@/data/skills';
import {
  loadRegistry,
  toggleSkill,
  connectAllEngineeringSkills,
  disconnectAllSkills,
  subscribeToSkills,
  type SkillInstallState
} from '@/lib/skillRegistry';
import Icon from '@/components/common/Icon';

interface SkillsConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachSkillToPrompt?: (skill: AgentSkill) => void;
  isLight: boolean;
}

export const SkillsConnectionModal: React.FC<SkillsConnectionModalProps> = ({
  isOpen,
  onClose,
  onAttachSkillToPrompt,
  isLight,
}) => {
  const [registry, setRegistry] = useState<SkillInstallState>(loadRegistry);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToSkills((nextState) => {
      setRegistry(nextState);
    });
  }, []);

  const filteredSkills = useMemo(() => {
    return AGENT_SKILLS.filter((skill) => {
      const matchesCategory =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'engineering'
          ? skill.category.startsWith('engineering-')
          : skill.category === selectedCategory;

      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        skill.name.toLowerCase().includes(q) ||
        skill.summary.toLowerCase().includes(q) ||
        skill.capabilities.some((c) => c.toLowerCase().includes(q)) ||
        (skill.directives && skill.directives.some((d) => d.toLowerCase().includes(q)));

      return matchesCategory && matchesQuery;
    });
  }, [query, selectedCategory]);

  const connectedCount = registry.installed.length;
  const engineeringCount = AGENT_SKILLS.filter((s) => s.category.startsWith('engineering-')).length;
  const connectedEngineeringCount = AGENT_SKILLS.filter(
    (s) => s.category.startsWith('engineering-') && registry.installed.includes(s.id)
  ).length;

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="skills-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Backdrop closer */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative z-10 flex h-[90vh] max-h-[820px] w-full max-w-4xl flex-col rounded-2xl border shadow-2xl overflow-hidden ${
          isLight
            ? 'border-rose-200 bg-white/95 text-slate-900 shadow-rose-950/20'
            : 'border-white/12 bg-zinc-950/95 text-white shadow-black/80'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between border-b px-5 py-3.5 ${
            isLight ? 'border-rose-100 bg-rose-50/50' : 'border-white/8 bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-500/15 text-purple-400">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h2 id="skills-modal-title" className="text-base font-bold tracking-tight">
                Connected Skills Registry
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                {connectedCount} of {AGENT_SKILLS.length} skills connected · Accessible by Chat, Coding &amp; Browser Agents
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => connectAllEngineeringSkills()}
              title="Connect all 20 specialized engineering skills"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                isLight
                  ? 'bg-purple-100 text-purple-900 hover:bg-purple-200'
                  : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30'
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Connect All Engineering</span>
              <span className="sm:hidden">All Eng</span>
              <span className="text-[10px] opacity-75 font-mono">({connectedEngineeringCount}/{engineeringCount})</span>
            </button>

            <button
              onClick={() => disconnectAllSkills()}
              title="Disconnect all currently connected skills"
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              Disconnect All
            </button>

            <button
              onClick={onClose}
              className={`rounded-lg p-1.5 transition cursor-pointer ${
                isLight ? 'text-slate-500 hover:bg-rose-100 hover:text-slate-900' : 'text-white/40 hover:bg-white/10 hover:text-white'
              }`}
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div
          className={`border-b px-5 py-2.5 space-y-2.5 ${
            isLight ? 'border-rose-100 bg-white' : 'border-white/6 bg-zinc-900/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-1.5 text-xs ${
                isLight
                  ? 'border-slate-200 bg-slate-50 focus-within:border-purple-400 focus-within:bg-white'
                  : 'border-white/10 bg-white/[0.04] focus-within:border-purple-400 focus-within:bg-white/[0.07]'
              }`}
            >
              <Search className="h-3.5 w-3.5 opacity-40 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search skills by name, directive, or capability (e.g., TDD, Security, Tailwind, Scaffolding)..."
                className="w-full bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-white/30 text-xs"
              />
              {query && (
                <button onClick={() => setQuery('')} className="opacity-40 hover:opacity-100">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 m-scroll text-[11px]">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 rounded-lg px-2.5 py-1 font-medium transition cursor-pointer ${
                selectedCategory === 'all'
                  ? isLight
                    ? 'bg-purple-600 text-white font-semibold shadow-xs'
                    : 'bg-purple-600 text-white font-semibold'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              All Skills ({AGENT_SKILLS.length})
            </button>

            <button
              onClick={() => setSelectedCategory('engineering')}
              className={`shrink-0 rounded-lg px-2.5 py-1 font-medium transition cursor-pointer flex items-center gap-1 ${
                selectedCategory === 'engineering'
                  ? isLight
                    ? 'bg-purple-600 text-white font-semibold shadow-xs'
                    : 'bg-purple-600 text-white font-semibold'
                  : isLight
                  ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                  : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/30'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>All Engineering (20)</span>
            </button>

            {SKILL_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = AGENT_SKILLS.filter((s) => s.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 rounded-lg px-2.5 py-1 font-medium transition cursor-pointer ${
                    isSelected
                      ? isLight
                        ? 'bg-purple-600 text-white font-semibold shadow-xs'
                        : 'bg-purple-600 text-white font-semibold'
                      : isLight
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="ml-1 opacity-60 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Skills Grid / List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 m-scroll">
          {filteredSkills.length === 0 ? (
            <div
              className={`rounded-2xl border p-8 text-center ${
                isLight ? 'border-dashed border-slate-200 text-slate-500' : 'border-dashed border-white/10 text-white/40'
              }`}
            >
              <p className="text-sm font-semibold">No skills matching "{query}"</p>
              <p className="text-xs mt-1">Try another search keyword or clear category filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSkills.map((skill) => {
                const isConnected = registry.installed.includes(skill.id);
                const isExpanded = expandedSkillId === skill.id;
                const catObj = SKILL_CATEGORIES.find((c) => c.id === skill.category);
                const isEng = skill.category.startsWith('engineering-');

                return (
                  <div
                    key={skill.id}
                    className={`flex flex-col rounded-xl border p-3.5 transition-all ${
                      isConnected
                        ? isLight
                          ? 'border-purple-300 bg-purple-50/40 shadow-xs'
                          : 'border-purple-500/40 bg-purple-500/[0.06] shadow-sm'
                        : isLight
                        ? 'border-slate-200 bg-white hover:border-slate-300'
                        : 'border-white/8 bg-white/[0.02] hover:border-white/15'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${
                            isConnected
                              ? isLight
                                ? 'border-purple-300 bg-purple-100 text-purple-700'
                                : 'border-purple-400/40 bg-purple-500/20 text-purple-300'
                              : isLight
                              ? 'border-slate-200 bg-slate-50 text-slate-600'
                              : 'border-white/10 bg-white/5 text-white/60'
                          }`}
                        >
                          <Icon name={skill.icon} className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {skill.name}
                            </h3>
                            {isEng && (
                              <span className="rounded bg-sky-500/10 px-1.5 py-0.2 text-[9px] font-mono font-bold text-sky-400 border border-sky-500/20">
                                ENG
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">v{skill.version}</span>
                          </div>
                          <span
                            className="inline-block mt-0.5 text-[10px] font-medium"
                            style={{ color: catObj?.color || '#8B5FBF' }}
                          >
                            {catObj?.label || skill.category}
                          </span>
                        </div>
                      </div>

                      {/* Connect / Disconnect Toggle Button */}
                      <button
                        onClick={() => toggleSkill(skill.id)}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition shrink-0 cursor-pointer ${
                          isConnected
                            ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-500'
                            : isLight
                            ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                            : 'border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {isConnected ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Connected</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            <span>Connect</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Summary */}
                    <p className={`mt-2 text-xs leading-relaxed line-clamp-2 ${isLight ? 'text-slate-600' : 'text-white/65'}`}>
                      {skill.summary}
                    </p>

                    {/* Agent Tags */}
                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                        Utilized by:
                      </span>
                      {(!skill.applicableAgents || skill.applicableAgents.includes('coding')) && (
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-500 border border-amber-500/20">
                          Coding Agent
                        </span>
                      )}
                      {(!skill.applicableAgents || skill.applicableAgents.includes('chat')) && (
                        <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-purple-400 border border-purple-500/20">
                          Chat Agent
                        </span>
                      )}
                      {(!skill.applicableAgents || skill.applicableAgents.includes('browser')) && (
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                          Browser Agent
                        </span>
                      )}
                    </div>

                    {/* Expandable Details: Directives & Capabilities */}
                    {isExpanded && (
                      <div className={`mt-3 pt-3 border-t space-y-2 text-xs ${isLight ? 'border-slate-200/80' : 'border-white/8'}`}>
                        {skill.directives && skill.directives.length > 0 && (
                          <div>
                            <span className="font-semibold text-[11px] text-purple-400 uppercase tracking-wider font-mono">
                              Operational Directives:
                            </span>
                            <ul className="mt-1 space-y-1 list-disc list-inside text-[11px] opacity-80">
                              {skill.directives.map((dir, i) => (
                                <li key={i}>{dir}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div>
                          <span className="font-semibold text-[11px] text-sky-400 uppercase tracking-wider font-mono">
                            Capabilities:
                          </span>
                          <ul className="mt-1 space-y-1 list-disc list-inside text-[11px] opacity-80">
                            {skill.capabilities.map((cap, i) => (
                              <li key={i}>{cap}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Card Footer: Expand toggle & Attach to prompt */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                      <button
                        onClick={() => setExpandedSkillId(isExpanded ? null : skill.id)}
                        className={`text-[11px] font-medium transition cursor-pointer ${
                          isLight ? 'text-purple-700 hover:text-purple-900' : 'text-purple-300 hover:text-white'
                        }`}
                      >
                        {isExpanded ? 'Hide directives' : 'View directives & capabilities'}
                      </button>

                      {onAttachSkillToPrompt && (
                        <button
                          type="button"
                          onClick={() => {
                            onAttachSkillToPrompt(skill);
                            onClose();
                          }}
                          className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-semibold transition cursor-pointer ${
                            isLight
                              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                          title="Attach this skill directly to the current chat prompt"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Attach to Prompt</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`flex items-center justify-between border-t px-5 py-3 ${
            isLight ? 'border-rose-100 bg-rose-50/40 text-slate-600' : 'border-white/8 bg-zinc-900/40 text-white/50'
          } text-xs`}
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Connected skills are dynamically injected into active agent execution loops across Web, Cloud, and DOM runners.
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-purple-500 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
