import React, { useState } from 'react';
import { Download, Package, Upload, CheckCircle2, Layers, Terminal, FileJson } from 'lucide-react';
import { AGENT_STACKS, AGENT_SKILLS, getSkill } from '@/data/skills';
import { loadRegistry, installStack, exportStackBundle, saveRegistry } from '@/lib/skillRegistry';

export const AgentStackStore: React.FC = () => {
  const [registry, setRegistry] = useState(loadRegistry);
  const [importText, setImportText] = useState('');
  const [notice, setNotice] = useState('');

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText) as { servers?: Array<{ id: string }> };
      const ids = (parsed.servers ?? []).map((s) => s.id).filter((id) => AGENT_SKILLS.some((s) => s.id === id));
      if (!ids.length) {
        setNotice('No recognized skill ids found in that bundle.');
        return;
      }
      const next = { ...registry, installed: Array.from(new Set([...registry.installed, ...ids])) };
      saveRegistry(next);
      setRegistry(next);
      setNotice(`Loaded ${ids.length} skill${ids.length > 1 ? 's' : ''} from bundle.`);
      setImportText('');
    } catch {
      setNotice('That is not valid MCP bundle JSON.');
    }
  };

  return (
    <div className="m-scroll h-full overflow-y-auto p-4 sm:p-6">
      <h2 className="font-display text-2xl font-semibold text-white">Downloadable Agent Stacks</h2>
      <p className="text-xs text-white/40">Curated bundles of skills. Install to arm the cloud runner, or export as portable MCP config.</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {AGENT_STACKS.map((stack) => {
          const installed = stack.skillIds.every((id) => registry.installed.includes(id));
          return (
            <div key={stack.id} className="m-lift rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl m-gradient-bg text-white">
                  <Package className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-semibold text-white">{stack.name}</h3>
                  <p className="text-[11px] text-white/40">{stack.description}</p>
                </div>
                <span className="shrink-0 text-[10px] text-white/25">{stack.downloads} installs</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {stack.skillIds.map((id) => (
                  <span key={id} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-white/50">
                    {getSkill(id)?.name ?? id}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setRegistry(installStack(stack.id))}
                  disabled={installed}
                  className="flex items-center gap-1.5 rounded-lg m-gradient-bg px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                >
                  {installed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
                  {installed ? 'Installed' : 'Install stack'}
                </button>
                <button
                  onClick={() => exportStackBundle(stack.skillIds, `${stack.id}.mcp.json`)}
                  className="flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-2 text-xs text-white/65 transition hover:border-white/30 hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" /> Download bundle
                </button>
                <span className="ml-auto text-[10px] text-white/25">by {stack.author}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="flex items-center gap-1.5 font-display text-base font-semibold text-white">
            <Upload className="h-4 w-4" /> Load a custom stack
          </p>
          <p className="mt-1 text-[11px] text-white/40">Paste a <code className="font-mono">maggie.mcp/v1</code> bundle to register its skills locally.</p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={6}
            placeholder='{"spec":"maggie.mcp/v1","servers":[{"id":"home-ops"}]}'
            className="m-scroll mt-3 w-full resize-none rounded-xl border border-white/12 bg-black/30 p-3 font-mono text-[11px] text-white placeholder:text-white/20 outline-none focus:border-[var(--m-accent)]"
          />
          <div className="mt-2 flex items-center gap-2">
            <button onClick={handleImport} className="flex items-center gap-1.5 rounded-lg m-gradient-bg px-3 py-2 text-xs font-semibold text-white">
              <FileJson className="h-3.5 w-3.5" /> Load bundle
            </button>
            {notice && <span className="text-[11px] text-white/45">{notice}</span>}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="flex items-center gap-1.5 font-display text-base font-semibold text-white">
            <Terminal className="h-4 w-4" /> Active registry manifest
          </p>
          <pre className="m-scroll mt-3 max-h-56 overflow-auto rounded-xl border border-white/10 bg-black/35 p-3 font-mono text-[10.5px] leading-relaxed text-emerald-300/80">
{JSON.stringify(
  {
    spec: 'maggie.mcp/v1',
    servers: registry.installed.map((id) => ({
      id,
      endpoint: getSkill(id)?.mcpEndpoint ?? `mcp://maggie.skills/${id}`,
      version: getSkill(id)?.version ?? '1.0.0',
    })),
  },
  null,
  2,
)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AgentStackStore;
