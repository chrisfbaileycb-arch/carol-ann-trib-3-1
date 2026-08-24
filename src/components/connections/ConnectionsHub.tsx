import React, { useState } from 'react';
import {
  Plug, KeyRound, Server, FileCode2, Plus, Trash2, Eye, EyeOff, Check, ShieldCheck, Power,
} from 'lucide-react';
import {
  CONNECTORS, type McpServer, type ApiKeyRecord, type ConnectorState, type Artifact,
  loadMcps, saveMcps, blankMcp,
  loadKeys, saveKeys, addKey, maskKey,
  loadConnectors, saveConnectors,
  loadArtifacts, saveArtifacts, addArtifact,
} from '@/lib/connections';

type TabKey = 'connectors' | 'mcp' | 'keys' | 'artifacts';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'connectors', label: 'Connectors', icon: Plug },
  { key: 'mcp', label: 'MCP servers', icon: Server },
  { key: 'keys', label: 'API keys', icon: KeyRound },
  { key: 'artifacts', label: 'Artifacts', icon: FileCode2 },
];

const ConnectionsHub: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('connectors');
  const [mcps, setMcps] = useState<McpServer[]>(() => loadMcps());
  const [keys, setKeys] = useState<ApiKeyRecord[]>(() => loadKeys());
  const [connectors, setConnectors] = useState<ConnectorState[]>(() => loadConnectors());
  const [artifacts, setArtifacts] = useState<Artifact[]>(() => loadArtifacts());
  const [reveal, setReveal] = useState<string | null>(null);
  const [keyForm, setKeyForm] = useState({ label: '', service: '', value: '' });
  const [artForm, setArtForm] = useState({ title: '', body: '' });

  const putMcps = (rows: McpServer[]) => { setMcps(rows); saveMcps(rows); };
  const putConnectors = (rows: ConnectorState[]) => { setConnectors(rows); saveConnectors(rows); };

  const toggleConnector = (key: string) => {
    putConnectors(connectors.map((c) => (c.key === key
      ? { ...c, connected: !c.connected, account: !c.connected ? `${key}-workspace` : '', connectedAt: !c.connected ? new Date().toISOString() : null }
      : c)));
  };

  return (
    <div className="m-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-[1400px] px-5 py-5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">Skills · connections</p>
        <h2 className="font-display text-2xl font-semibold text-white">Connections & capabilities</h2>
        <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-white/45">
          Wire your agents into the tools you already use. Keys and server definitions stay on this device —
          reveal, rotate or delete any of them whenever you want.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                tab === t.key ? 'border-[var(--m-accent)]/60 bg-[var(--m-accent)]/15 text-white' : 'border-white/12 text-white/45 hover:text-white'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* Connectors */}
        {tab === 'connectors' && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {CONNECTORS.map((def) => {
              const state = connectors.find((c) => c.key === def.key)!;
              return (
                <div key={def.key} className="m-lift rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl text-[12px] font-bold text-white" style={{ background: def.accent }}>
                      {def.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-white">{def.name}</p>
                      <p className="truncate text-[10px] text-white/35">{def.scopes.join(' · ')}</p>
                    </div>
                    {state.connected && <Check className="h-4 w-4 text-emerald-400" />}
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-white/50">{def.blurb}</p>
                  {state.connected && <p className="mt-1.5 truncate text-[10px] text-emerald-300/80">Linked as {state.account}</p>}
                  <button
                    onClick={() => toggleConnector(def.key)}
                    className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold transition ${
                      state.connected ? 'border border-white/12 text-white/60 hover:border-rose-400/40 hover:text-rose-300' : 'm-gradient-bg text-white'
                    }`}
                  >
                    <Power className="h-3.5 w-3.5" /> {state.connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* MCP servers */}
        {tab === 'mcp' && (
          <div className="mt-4 space-y-3">
            <button
              onClick={() => putMcps([...mcps, { ...blankMcp(), name: 'New MCP server', url: 'https://' }])}
              className="flex items-center gap-1.5 rounded-lg m-gradient-bg px-3 py-2 text-[11.5px] font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Add MCP server
            </button>
            {mcps.map((m) => (
              <div key={m.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="grid gap-2 sm:grid-cols-[1fr_1.6fr_auto_auto]">
                  <input
                    value={m.name}
                    onChange={(e) => putMcps(mcps.map((x) => (x.id === m.id ? { ...x, name: e.target.value } : x)))}
                    placeholder="Server name"
                    className="rounded-lg border border-white/12 bg-black/30 px-2.5 py-1.5 text-[12px] text-white outline-none focus:border-[var(--m-accent)]/50"
                  />
                  <input
                    value={m.url}
                    onChange={(e) => putMcps(mcps.map((x) => (x.id === m.id ? { ...x, url: e.target.value } : x)))}
                    placeholder="https:// or stdio://"
                    className="rounded-lg border border-white/12 bg-black/30 px-2.5 py-1.5 font-mono text-[11.5px] text-white outline-none focus:border-[var(--m-accent)]/50"
                  />
                  <select
                    value={m.transport}
                    onChange={(e) => putMcps(mcps.map((x) => (x.id === m.id ? { ...x, transport: e.target.value as McpServer['transport'] } : x)))}
                    className="rounded-lg border border-white/12 bg-black/30 px-2 py-1.5 text-[11.5px] text-white outline-none"
                  >
                    <option value="sse">sse</option>
                    <option value="http">http</option>
                    <option value="stdio">stdio</option>
                  </select>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => putMcps(mcps.map((x) => (x.id === m.id ? { ...x, enabled: !x.enabled } : x)))}
                      className={`rounded-lg border px-2.5 py-1.5 text-[10.5px] font-semibold ${m.enabled ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-300' : 'border-white/12 text-white/45'}`}
                    >
                      {m.enabled ? 'Enabled' : 'Off'}
                    </button>
                    <button onClick={() => putMcps(mcps.filter((x) => x.id !== m.id))} className="rounded-lg border border-white/12 p-1.5 text-white/40 hover:border-rose-400/40 hover:text-rose-300">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <input
                  value={m.tools.join(', ')}
                  onChange={(e) => putMcps(mcps.map((x) => (x.id === m.id ? { ...x, tools: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) } : x)))}
                  placeholder="Tool names, comma separated"
                  className="mt-2 w-full rounded-lg border border-white/12 bg-black/30 px-2.5 py-1.5 text-[11.5px] text-white outline-none placeholder:text-white/25 focus:border-[var(--m-accent)]/50"
                />
              </div>
            ))}
          </div>
        )}

        {/* API keys */}
        {tab === 'keys' && (
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-white/75">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Stored locally, never synced
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
                <input value={keyForm.label} onChange={(e) => setKeyForm({ ...keyForm, label: e.target.value })} placeholder="Label" className="rounded-lg border border-white/12 bg-black/30 px-2.5 py-1.5 text-[12px] text-white outline-none focus:border-[var(--m-accent)]/50" />
                <input value={keyForm.service} onChange={(e) => setKeyForm({ ...keyForm, service: e.target.value })} placeholder="Service (github…)" className="rounded-lg border border-white/12 bg-black/30 px-2.5 py-1.5 text-[12px] text-white outline-none focus:border-[var(--m-accent)]/50" />
                <input value={keyForm.value} onChange={(e) => setKeyForm({ ...keyForm, value: e.target.value })} placeholder="Key value" type="password" className="rounded-lg border border-white/12 bg-black/30 px-2.5 py-1.5 font-mono text-[11.5px] text-white outline-none focus:border-[var(--m-accent)]/50" />
                <button
                  onClick={() => {
                    if (!keyForm.value.trim()) return;
                    setKeys(addKey(keyForm.label, keyForm.service, keyForm.value));
                    setKeyForm({ label: '', service: '', value: '' });
                  }}
                  className="rounded-lg m-gradient-bg px-3 py-1.5 text-[11.5px] font-semibold text-white"
                >
                  Save key
                </button>
              </div>
            </div>
            {keys.length === 0 && <p className="text-[11.5px] text-white/30">No keys stored yet.</p>}
            {keys.map((k) => (
              <div key={k.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <span className="text-[12px] font-semibold text-white">{k.label}</span>
                <span className="rounded-full border border-white/12 px-2 py-0.5 text-[10px] text-white/45">{k.service}</span>
                <code className="flex-1 truncate font-mono text-[11px] text-white/50">{reveal === k.id ? k.value : maskKey(k.value)}</code>
                <button onClick={() => setReveal(reveal === k.id ? null : k.id)} className="rounded-lg border border-white/12 p-1.5 text-white/45 hover:text-white">
                  {reveal === k.id ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => { const rows = keys.filter((x) => x.id !== k.id); setKeys(rows); saveKeys(rows); }}
                  className="rounded-lg border border-white/12 p-1.5 text-white/40 hover:border-rose-400/40 hover:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Artifacts */}
        {tab === 'artifacts' && (
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <input value={artForm.title} onChange={(e) => setArtForm({ ...artForm, title: e.target.value })} placeholder="Artifact title" className="w-full rounded-lg border border-white/12 bg-black/30 px-2.5 py-1.5 text-[12px] text-white outline-none focus:border-[var(--m-accent)]/50" />
              <textarea value={artForm.body} onChange={(e) => setArtForm({ ...artForm, body: e.target.value })} rows={3} placeholder="Paste a snippet, plan or note an agent produced…" className="mt-2 w-full resize-none rounded-lg border border-white/12 bg-black/30 px-2.5 py-1.5 text-[12px] text-white outline-none focus:border-[var(--m-accent)]/50" />
              <button
                onClick={() => {
                  if (!artForm.body.trim()) return;
                  setArtifacts(addArtifact(artForm.title, 'note', artForm.body));
                  setArtForm({ title: '', body: '' });
                }}
                className="mt-2 flex items-center gap-1.5 rounded-lg m-gradient-bg px-3 py-2 text-[11.5px] font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Save artifact
              </button>
            </div>
            {artifacts.length === 0 && <p className="text-[11.5px] text-white/30">No artifacts saved yet.</p>}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {artifacts.map((a) => (
                <div key={a.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12.5px] font-semibold text-white">{a.title}</p>
                    <button
                      onClick={() => { const rows = artifacts.filter((x) => x.id !== a.id); setArtifacts(rows); saveArtifacts(rows); }}
                      className="text-white/30 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <pre className="m-scroll mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-white/55">{a.body}</pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionsHub;
