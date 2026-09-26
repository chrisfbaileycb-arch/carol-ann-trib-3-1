import React, { useState, useMemo, useEffect, Component, type ErrorInfo } from 'react';
import {
  Code2, Eye, Columns, Sparkles, ChevronDown, Check,
  Bot, RefreshCw, Layers, Shield, FileCode2, Database,
  ArrowRight, Play, Wand2, Terminal, Plug, X, Search,
  Zap, Plus, ExternalLink, CheckCircle2, RotateCcw
} from 'lucide-react';
import CodeEditorPane from './CodeEditorPane';
import LiveSandboxPane from './LiveSandboxPane';
import AgentAvatar from '@/components/agents/AgentAvatar';
import { useAgentRouting, type CanvasFileKey, type CanvasViewMode } from '@/contexts/AgentRoutingContext';
import { AGENT_PRESETS, CORE_AGENT_PRESETS } from '@/data/agents';
import { isLightTheme } from '@/data/intake';
import { useCarol } from '@/contexts/CarolContext';
import { SAAS_CONNECTORS_DIRECTORY, loadConnectedSaasIds, toggleConnectedSaas, type SaaSConnector } from '@/data/saasConnectors';

// Fail-safe Error Boundary component to prevent blank screen
interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Workspace Canvas Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
          <div className="max-w-md rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 space-y-4">
            <h2 className="text-lg font-bold text-rose-300">Canvas Recovery Mode</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              The canvas encountered an unexpected runtime error. Your code buffer is safely saved in local storage.
            </p>
            <pre className="text-left font-mono text-[10px] bg-black/50 p-2.5 rounded border border-white/10 text-rose-200 overflow-x-auto">
              {this.state.error?.message || 'Unknown runtime error'}
            </pre>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:opacity-90"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reload Canvas
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const WorkspaceCanvas: React.FC = () => {
  const {
    activeAgentContext,
    setActiveAgent,
    viewMode,
    setViewMode,
    activeFile,
    setActiveFile,
    codeBuffers,
    setCodeBuffer,
    resetCodeBuffer,
    setActiveTab,
  } = useAgentRouting();

  const { profile } = useCarol();
  const isLight = isLightTheme(profile);

  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
  const [connectorsModalOpen, setConnectorsModalOpen] = useState(false);
  const [connectorSearch, setConnectorSearch] = useState('');
  const [connectedIds, setConnectedIds] = useState<string[]>(() => loadConnectedSaasIds());
  const [plugNotice, setPlugNotice] = useState<string | null>(null);

  // Active code buffer for current file
  const currentCode = codeBuffers[activeFile] || '';

  const handleCodeChange = (newCode: string) => {
    setCodeBuffer(activeFile, newCode);
  };

  const handleReset = () => {
    resetCodeBuffer(activeFile);
  };

  // Switch agent directly from dropdown
  const handleSelectAgent = (agentId: string) => {
    const found = AGENT_PRESETS.find((a) => a.id === agentId);
    if (!found) return;

    setActiveAgent({
      id: found.id,
      name: found.name,
      personaName: found.name,
      role: found.role,
      systemPrompt: found.systemPrompt,
      avatar: { skin: found.skin, size: 36 },
      category: found.category,
      geminiVoice: found.geminiVoice,
      vendor: found.vendor,
      blurb: found.blurb,
      starters: found.starters,
    });
    setAgentDropdownOpen(false);
  };

  // Toggle connector connection
  const handleToggleConnector = (connectorId: string) => {
    const next = toggleConnectedSaas(connectorId);
    setConnectedIds(next);
  };

  // Plug Connector into Active Code
  const handlePlugConnectorIntoCode = (connector: SaaSConnector) => {
    let snippet = '';

    if (activeFile === 'Component.tsx') {
      snippet = `
// [Connected Service: ${connector.name} (${connector.categoryLabel})]
// Auth: ${connector.authType} · Vendor: ${connector.vendor}
const ${connector.id.replace(/[^a-zA-Z0-9]/g, '_')}_client = {
  connectorId: '${connector.id}',
  vendor: '${connector.vendor}',
  status: 'connected',
  isMock: true,
  badge: 'DEMO',
  capabilities: ${JSON.stringify(connector.capabilities)},
};
`;
      // Inject before export or at top of component
      const updatedCode = currentCode.replace(
        /export default function/,
        `${snippet}\nexport default function`
      );
      setCodeBuffer(activeFile, updatedCode || (currentCode + snippet));
    } else if (activeFile === 'endpoint.ts') {
      snippet = `
/**
 * [Connector Bridge: ${connector.name}]
 * Endpoint dispatch for ${connector.vendor} with fail-closed Bearer auth
 */
router.post('/api/connectors/${connector.id}/dispatch', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'AUTH_BEARER_MISSING',
      message: 'Fail-closed guard: ${connector.name} requires valid session token.',
    });
  }

  // Non-negotiable honesty receipts:
  return res.status(200).json({
    success: true,
    connector: '${connector.id}',
    receipt: {
      receiptId: \`SIM-\${Date.now()}\`,
      status: 'simulated',
      isMock: true,
      badge: 'DEMO',
      note: 'Simulated connector execution — no live external network call made.',
    },
  });
});
`;
      setCodeBuffer(activeFile, currentCode + snippet);
    } else {
      snippet = `
-- [Table for ${connector.name} Data Sync]
CREATE TABLE IF NOT EXISTS connector_${connector.id.replace(/[^a-zA-Z0-9]/g, '_')}_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(128) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_mock BOOLEAN NOT NULL DEFAULT true,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;
      setCodeBuffer(activeFile, currentCode + snippet);
    }

    setPlugNotice(`Plugged ${connector.name} into ${activeFile}`);
    setTimeout(() => setPlugNotice(null), 3500);
  };

  const fileTabs: { key: CanvasFileKey; label: string; icon: React.ElementType }[] = [
    { key: 'Component.tsx', label: 'Component.tsx', icon: Code2 },
    { key: 'endpoint.ts', label: 'endpoint.ts', icon: Terminal },
    { key: 'schema.sql', label: 'schema.sql', icon: Database },
  ];

  const filteredConnectors = useMemo(() => {
    const q = connectorSearch.trim().toLowerCase();
    if (!q) return SAAS_CONNECTORS_DIRECTORY.slice(0, 36);
    return SAAS_CONNECTORS_DIRECTORY.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.vendor.toLowerCase().includes(q) ||
        c.categoryLabel.toLowerCase().includes(q)
    ).slice(0, 36);
  }, [connectorSearch]);

  return (
    <CanvasErrorBoundary>
      <div className={`relative flex h-full w-full flex-col overflow-hidden transition-colors ${
        isLight ? 'bg-slate-100 text-slate-800' : 'bg-[#090a10] text-white'
      }`}>
        {/* Top Workspace Controller Bar */}
        <header className={`relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2 backdrop-blur-md ${
          isLight ? 'border-rose-200/60 bg-white/80 shadow-xs' : 'border-white/10 bg-zinc-950/80'
        }`}>
          {/* Left: Active Persona Display & Quick Switcher */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setAgentDropdownOpen(!agentDropdownOpen)}
                className={`flex items-center gap-2 rounded-xl border p-1.5 pr-2.5 transition ${
                  isLight
                    ? 'border-rose-200 bg-white hover:bg-rose-50/50 shadow-xs'
                    : 'border-white/12 bg-white/[0.04] hover:bg-white/[0.08]'
                }`}
              >
                <AgentAvatar skin={activeAgentContext.avatar?.skin} size={28} active />
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-rose-400">
                      {activeAgentContext.personaName || activeAgentContext.name}
                    </span>
                    <span className={`rounded-full border px-1.5 py-0.2 text-[8.5px] font-mono ${
                      activeAgentContext.roleType === 'ui'
                        ? 'border-pink-400/30 bg-pink-400/10 text-pink-300'
                        : 'border-sky-400/30 bg-sky-400/10 text-sky-300'
                    }`}>
                      {activeAgentContext.roleType === 'ui' ? 'UI Agent' : 'Systems Agent'}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 max-w-[140px] truncate">
                    {activeAgentContext.role}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-white/40 ml-1" />
              </button>

              {/* Dropdown to switch personas */}
              {agentDropdownOpen && (
                <div className={`absolute left-0 top-full mt-2 w-72 rounded-2xl border p-2 shadow-2xl backdrop-blur-2xl z-50 ${
                  isLight ? 'border-rose-200 bg-white text-slate-900' : 'border-white/15 bg-[#141520] text-white'
                }`}>
                  <div className="px-2 py-1.5 text-[10px] uppercase font-semibold text-white/40 tracking-wider">
                    Select Active Persona
                  </div>
                  <div className="max-h-64 overflow-y-auto m-scroll space-y-1">
                    {CORE_AGENT_PRESETS.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => handleSelectAgent(a.id)}
                        className={`flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition ${
                          activeAgentContext.id === a.id
                            ? isLight ? 'bg-rose-50 text-slate-900 font-semibold' : 'bg-white/10 text-white font-semibold'
                            : isLight ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-white/[0.04] text-white/70'
                        }`}
                      >
                        <AgentAvatar skin={a.skin} size={24} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs">{a.name}</div>
                          <div className="truncate text-[10px] text-white/40">{a.role}</div>
                        </div>
                        {activeAgentContext.id === a.id && <Check className="h-3.5 w-3.5 text-rose-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-white/8 mt-1.5 pt-1.5 px-2">
                    <button
                      onClick={() => {
                        setAgentDropdownOpen(false);
                        setActiveTab('roster');
                      }}
                      className="flex w-full items-center justify-between text-[11px] text-rose-400 hover:underline"
                    >
                      <span>Browse all 100+ Specialists</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* File Key Tabs */}
            <div className={`flex items-center rounded-xl p-0.5 border ${
              isLight ? 'border-slate-200 bg-slate-100' : 'border-white/10 bg-white/[0.03]'
            }`}>
              {fileTabs.map((t) => {
                const isActive = activeFile === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveFile(t.key)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-mono transition ${
                      isActive
                        ? isLight
                          ? 'bg-white text-slate-900 font-semibold shadow-xs'
                          : 'bg-white/15 text-white font-semibold shadow-xs'
                        : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <t.icon className="h-3 w-3" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Connectors Bridge & View Controller */}
          <div className="flex items-center gap-2">
            {/* Connectors Dock Trigger */}
            <button
              onClick={() => setConnectorsModalOpen(true)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                isLight
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 shadow-xs'
                  : 'border-emerald-400/35 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20'
              }`}
              title="Browse and plug third-party SaaS & MCP Connectors into code"
            >
              <Plug className="h-3.5 w-3.5 text-emerald-500" />
              <span>Connectors</span>
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9.5px] font-mono">
                {connectedIds.length}
              </span>
            </button>

            {/* Persistent View Mode Toggle */}
            <div className={`flex items-center rounded-xl p-0.5 border ${
              isLight ? 'border-slate-200 bg-slate-100' : 'border-white/10 bg-white/[0.03]'
            }`}>
              <button
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  viewMode === 'split'
                    ? isLight
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'bg-white/20 text-white font-semibold shadow-xs'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Split View (Code left, preview right)"
              >
                <Columns className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Split View</span>
              </button>

              <button
                onClick={() => setViewMode('editor')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  viewMode === 'editor'
                    ? isLight
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'bg-white/20 text-white font-semibold shadow-xs'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Full Code Editor"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Code Only</span>
              </button>

              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  viewMode === 'preview'
                    ? isLight
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'bg-white/20 text-white font-semibold shadow-xs'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Full Preview Canvas"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Preview Only</span>
              </button>
            </div>
          </div>
        </header>

        {/* Plug Notice Toast */}
        {plugNotice && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-emerald-400/40 bg-emerald-950/90 px-4 py-2 text-xs font-semibold text-emerald-200 shadow-xl backdrop-blur-md flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{plugNotice}</span>
          </div>
        )}

        {/* Main Split-Pane Architecture Stage */}
        <main className="relative min-h-0 flex-1 overflow-hidden">
          {viewMode === 'split' && (
            <div className="grid h-full grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
              {/* Left Pane: Editor & Controller */}
              <div className="h-full min-h-0 overflow-hidden">
                <CodeEditorPane
                  activeFile={activeFile}
                  code={currentCode}
                  onChange={handleCodeChange}
                  onReset={handleReset}
                  onOpenConnectors={() => setConnectorsModalOpen(true)}
                />
              </div>

              {/* Right Pane: Live Preview Sandbox */}
              <div className="h-full min-h-0 overflow-hidden">
                <LiveSandboxPane
                  activeFile={activeFile}
                  code={currentCode}
                  onChangeCode={handleCodeChange}
                />
              </div>
            </div>
          )}

          {viewMode === 'editor' && (
            <div className="h-full w-full overflow-hidden">
              <CodeEditorPane
                activeFile={activeFile}
                code={currentCode}
                onChange={handleCodeChange}
                onReset={handleReset}
                onOpenConnectors={() => setConnectorsModalOpen(true)}
              />
            </div>
          )}

          {viewMode === 'preview' && (
            <div className="h-full w-full overflow-hidden">
              <LiveSandboxPane
                activeFile={activeFile}
                code={currentCode}
                onChangeCode={handleCodeChange}
              />
            </div>
          )}
        </main>

        {/* CONNECTORS MODAL & CODE PLUGGER */}
        {connectorsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
              isLight ? 'border-rose-200 bg-white text-slate-800' : 'border-white/12 bg-[#12131D] text-white'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Plug className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-sm">SaaS & MCP Connectors Directory</h3>
                    <p className="text-[11px] text-white/50">
                      Plug real API contracts & client code directly into {activeFile}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setConnectorsModalOpen(false)}
                  className="rounded-lg p-1 text-white/40 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-white/8">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-white/40" />
                  <input
                    type="text"
                    value={connectorSearch}
                    onChange={(e) => setConnectorSearch(e.target.value)}
                    placeholder="Search 170+ Connectors (Stripe, Google Workspace, GitHub, Slack, Supabase, Postgres)..."
                    className="w-full rounded-xl border border-white/12 bg-white/[0.04] py-2 pl-9 pr-4 text-xs text-white outline-none placeholder:text-white/35 focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* List of Connectors */}
              <div className="min-h-0 flex-1 overflow-y-auto m-scroll p-4 grid gap-3 sm:grid-cols-2">
                {filteredConnectors.map((c) => {
                  const isConnected = connectedIds.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      className={`flex flex-col justify-between rounded-xl border p-3.5 transition ${
                        isConnected
                          ? 'border-emerald-400/40 bg-emerald-400/[0.04]'
                          : 'border-white/8 bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-white">{c.name}</span>
                          <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded border ${
                            isConnected
                              ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                              : 'border-white/10 text-white/40'
                          }`}>
                            {isConnected ? 'Connected' : 'Available'}
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-400/80 mt-0.5">{c.categoryLabel}</p>
                        <p className="text-[11px] text-white/50 mt-1.5 line-clamp-2 leading-relaxed">
                          {c.description}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-white/6 pt-2.5 gap-2">
                        <button
                          onClick={() => handleToggleConnector(c.id)}
                          className={`text-[10.5px] font-medium px-2 py-1 rounded transition ${
                            isConnected
                              ? 'text-white/40 hover:text-rose-400'
                              : 'text-emerald-400 hover:underline'
                          }`}
                        >
                          {isConnected ? 'Disconnect' : 'Connect'}
                        </button>

                        <button
                          onClick={() => handlePlugConnectorIntoCode(c)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition"
                        >
                          <Zap className="h-3 w-3" />
                          <span>Plug into Code</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-white/8 px-5 py-3 text-xs text-white/50 bg-black/20">
                <span>{connectedIds.length} connectors connected</span>
                <button
                  onClick={() => setConnectorsModalOpen(false)}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white hover:bg-white/10"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CanvasErrorBoundary>
  );
};

export default WorkspaceCanvas;
