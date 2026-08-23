import React, { useMemo, useState } from 'react';
import { Search, Power, Settings2, Download, CheckCircle2, Play } from 'lucide-react';
import { AGENT_SKILLS, SKILL_CATEGORIES, type SkillCategory } from '@/data/skills';
import { loadRegistry, toggleSkill, setSkillConfig, exportStackBundle } from '@/lib/skillRegistry';
import { startRun } from '@/lib/agentRunner';
import Icon from '@/components/common/Icon';

const SKILL_RUNS: Record<string, string> = {
  'school-scheduler': 'school-sync',
  'appointment-booker': 'appointment-book',
  'grocery-runner': 'whole-foods',
  'tutor-coordinator': 'school-sync',
  'home-ops': 'dry-cleaning',
};

export const SkillsEngine: React.FC<{ onRunAgent?: () => void }> = ({ onRunAgent }) => {
  const [registry, setRegistry] = useState(loadRegistry);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<SkillCategory | 'all'>('all');
  const [openConfig, setOpenConfig] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      AGENT_SKILLS.filter(
        (s) =>
          (cat === 'all' || s.category === cat) &&
          (s.name.toLowerCase().includes(query.toLowerCase()) ||
            s.summary.toLowerCase().includes(query.toLowerCase())),
      ),
    [query, cat],
  );

  const installedCount = registry.installed.length;

  return (
    <div className="m-scroll h-full overflow-y-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">Family &amp; Life Skills Engine</h2>
          <p className="text-xs text-white/40">
            {installedCount} of {AGENT_SKILLS.length} skills active · each exposes an MCP endpoint the cloud runner can call.
          </p>
        </div>
        <button
          onClick={() => exportStackBundle(registry.installed, 'maggie-active-stack.mcp.json')}
          className="flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-2 text-xs font-medium text-white/70 transition hover:border-white/30 hover:text-white"
        >
          <Download className="h-3.5 w-3.5" /> Export active stack
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
          <Search className="h-3.5 w-3.5 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills…"
            className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 outline-none"
          />
        </div>
        <button
          onClick={() => setCat('all')}
          className={`rounded-full border px-2.5 py-1.5 text-[11px] transition ${cat === 'all' ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 text-white/45'}`}
        >
          All
        </button>
        {SKILL_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className="rounded-full border px-2.5 py-1.5 text-[11px] transition"
            style={{
              borderColor: cat === c.id ? `${c.color}88` : 'rgba(255,255,255,0.1)',
              background: cat === c.id ? `${c.color}22` : 'transparent',
              color: cat === c.id ? c.color : 'rgba(255,255,255,0.45)',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {filtered.map((s) => {
          const on = registry.installed.includes(s.id);
          const color = SKILL_CATEGORIES.find((c) => c.id === s.category)?.color ?? '#8B5FBF';
          return (
            <div key={s.id} className="m-lift rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: `${color}22`, color }}>
                  <Icon name={s.icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-semibold text-white">{s.name}</h3>
                  <p className="text-[11px] leading-snug text-white/40">{s.summary}</p>
                </div>
                <button
                  onClick={() => setRegistry(toggleSkill(s.id))}
                  className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${on ? 'border-emerald-400/40 bg-emerald-400/12 text-emerald-300' : 'border-white/12 text-white/35 hover:text-white'}`}
                >
                  <Power className="h-3 w-3" /> {on ? 'On' : 'Off'}
                </button>
              </div>

              <ul className="mt-3 space-y-1">
                {s.capabilities.map((c) => (
                  <li key={c} className="flex items-start gap-1.5 text-[11px] text-white/50">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" style={{ color }} /> {c}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/8 pt-3">
                <code className="truncate rounded bg-black/35 px-2 py-1 font-mono text-[10px] text-white/35">{s.mcpEndpoint}</code>
                <span className="text-[10px] text-white/25">v{s.version}</span>
                <button
                  onClick={() => setOpenConfig(openConfig === s.id ? null : s.id)}
                  className="ml-auto flex items-center gap-1 rounded-lg border border-white/12 px-2 py-1 text-[11px] text-white/60 transition hover:text-white"
                >
                  <Settings2 className="h-3 w-3" /> Configure
                </button>
                {SKILL_RUNS[s.id] && (
                  <button
                    onClick={() => { startRun(SKILL_RUNS[s.id]); onRunAgent?.(); }}
                    className="flex items-center gap-1 rounded-lg m-gradient-bg px-2 py-1 text-[11px] font-semibold text-white"
                  >
                    <Play className="h-3 w-3" /> Run
                  </button>
                )}
              </div>

              {openConfig === s.id && (
                <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-black/25 p-3">
                  {s.fields.map((f) => (
                    <label key={f.key} className="block text-[10px] uppercase tracking-wider text-white/35">
                      {f.label}
                      {f.type === 'textarea' ? (
                        <textarea
                          rows={2}
                          value={registry.config[s.id]?.[f.key] ?? ''}
                          onChange={(e) => setRegistry(setSkillConfig(s.id, f.key, e.target.value))}
                          placeholder={f.placeholder}
                          className="mt-1 w-full resize-none rounded-lg border border-white/12 bg-[#1B1C24] px-2.5 py-1.5 text-xs normal-case text-white placeholder:text-white/20 outline-none focus:border-[var(--m-accent)]"
                        />
                      ) : (
                        <input
                          type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                          value={registry.config[s.id]?.[f.key] ?? ''}
                          onChange={(e) => setRegistry(setSkillConfig(s.id, f.key, e.target.value))}
                          placeholder={f.placeholder}
                          className="mt-1 w-full rounded-lg border border-white/12 bg-[#1B1C24] px-2.5 py-1.5 text-xs normal-case text-white placeholder:text-white/20 outline-none focus:border-[var(--m-accent)]"
                        />
                      )}
                    </label>
                  ))}
                  <button
                    onClick={() => exportStackBundle([s.id], `${s.id}.mcp.json`)}
                    className="flex items-center gap-1.5 rounded-lg border border-white/12 px-2.5 py-1.5 text-[11px] text-white/60 transition hover:text-white"
                  >
                    <Download className="h-3 w-3" /> Export this skill config
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillsEngine;
