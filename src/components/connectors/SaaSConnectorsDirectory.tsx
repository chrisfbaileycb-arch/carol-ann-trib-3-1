import React, { useState, useMemo } from 'react';
import {
  Search, Check, ShieldCheck, Zap, Power, ExternalLink,
  Terminal, Play, Sparkles, Database, Copy,
  CheckCircle2, Building, RefreshCw, X, Code2, Server
} from 'lucide-react';
import {
  SAAS_CONNECTORS_DIRECTORY,
  SAAS_CONNECTOR_CATEGORIES,
  type SaaSConnector,
  type SaaSConnectorCategoryKey,
  loadConnectedSaasIds,
  toggleConnectedSaas,
} from '@/data/saasConnectors';
import { apiFetch } from '@/lib/apiClient';

interface SaaSConnectorsDirectoryProps {
  isLight?: boolean;
  onConnectorToggled?: (connectedIds: string[]) => void;
  compact?: boolean;
}

export const SaaSConnectorsDirectory: React.FC<SaaSConnectorsDirectoryProps> = ({
  isLight = false,
  onConnectorToggled,
  compact = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SaaSConnectorCategoryKey | 'all' | 'connected' | 'enterprise'>('all');
  const [connectedIds, setConnectedIds] = useState<string[]>(() => loadConnectedSaasIds());
  const [inspectingConnector, setInspectingConnector] = useState<SaaSConnector | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testingPing, setTestingPing] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Handle connect / disconnect
  const handleToggle = (connectorId: string) => {
    const updated = toggleConnectedSaas(connectorId);
    setConnectedIds(updated);
    if (onConnectorToggled) {
      onConnectorToggled(updated);
    }
  };

  // Filter connectors
  const filteredConnectors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return SAAS_CONNECTORS_DIRECTORY.filter((item) => {
      // Status & Category filters
      if (selectedCategory === 'connected') {
        if (!connectedIds.includes(item.id)) return false;
      } else if (selectedCategory === 'enterprise') {
        if (!item.isEnterpriseWork) return false;
      } else if (selectedCategory !== 'all') {
        if (item.category !== selectedCategory) return false;
      }

      // Search query
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.vendor.toLowerCase().includes(q) ||
        item.capabilities.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery, connectedIds]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: SAAS_CONNECTORS_DIRECTORY.length,
      connected: connectedIds.length,
      enterprise: SAAS_CONNECTORS_DIRECTORY.filter((c) => c.isEnterpriseWork).length,
    };
    SAAS_CONNECTOR_CATEGORIES.forEach((cat) => {
      counts[cat.key] = SAAS_CONNECTORS_DIRECTORY.filter((c) => c.category === cat.key).length;
    });
    return counts;
  }, [connectedIds]);

  const handleTestPing = async (conn: SaaSConnector) => {
    setTestingPing(true);
    setTestResult(null);
    try {
      const resp = await apiFetch('/api/connectors/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectorId: conn.id,
          authState: 'ANONYMOUS_SANDBOX', // demo sandbox — nothing here is authenticated
          capabilities: conn.capabilities,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setTestResult(JSON.stringify(data, null, 2));
      } else {
        throw new Error('Ping failed');
      }
    } catch {
      setTestResult(JSON.stringify({
        status: 'ping_failed',
        connector: conn.id,
        demo: true,
        simulated: true,
        error: 'The simulated ping did not return. Sign in and try again.',
      }, null, 2));
    } finally {
      setTestingPing(false);
    }
  };

  const handleCopySchema = (conn: SaaSConnector) => {
    const schema = {
      $schema: 'https://modelcontextprotocol.io/schema/2024-11-05',
      name: conn.name,
      id: conn.id,
      vendor: conn.vendor,
      auth: conn.authType,
      tools: conn.capabilities.map((cap) => ({
        name: `${conn.id.replace(/-/g, '_')}_${cap}`,
        description: `Execute ${cap} on ${conn.name}`,
        inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
      })),
    };
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Directory Banner — honest demo framing */}
      {!compact && (
        <div className={`relative overflow-hidden rounded-2xl border p-5 transition ${
          isLight
            ? 'border-amber-200/90 bg-amber-50/70 text-slate-900 shadow-sm'
            : 'border-amber-500/25 bg-amber-950/20 text-white'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Demo directory — no live connections</span>
                </span>
              </div>
              <h3 className="font-display text-base font-bold">
                SaaS Connector Directory
              </h3>
              <p className={`text-xs max-w-3xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                Browse the integrations Carol Ann is designed to work with. "Demo connect" only shortlists an
                integration for preview — no accounts are linked, no data is exchanged, and no service is contacted.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setSelectedCategory('enterprise')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-xs transition ${
                  selectedCategory === 'enterprise'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : isLight
                    ? 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Enterprise Suite ({categoryCounts.enterprise})</span>
              </button>
              <button
                onClick={() => setSelectedCategory('connected')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-xs transition ${
                  selectedCategory === 'connected'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : isLight
                    ? 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Demo shortlist ({connectedIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Category Pills Bar */}
      <div className={`rounded-2xl border p-4 space-y-3.5 ${
        isLight ? 'border-rose-200/80 bg-white/95 shadow-sm' : 'border-white/10 bg-white/[0.02]'
      }`}>
        {/* Search row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className={`relative flex-1 w-full rounded-xl border flex items-center px-3.5 py-2 transition ${
            isLight
              ? 'border-slate-200 bg-slate-50/70 focus-within:bg-white focus-within:border-indigo-400'
              : 'border-white/10 bg-black/40 focus-within:border-indigo-500'
          }`}>
            <Search className={`h-4 w-4 shrink-0 mr-2.5 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 170+ connectors (e.g., Salesforce, HubSpot, Stripe, Jira, Linear, SAP, Snowflake, Guesty)..."
              className={`w-full bg-transparent text-xs outline-none ${isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-white/35'}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
              Showing <strong className={isLight ? 'text-slate-800' : 'text-white'}>{filteredConnectors.length}</strong> of {SAAS_CONNECTORS_DIRECTORY.length}
            </span>
          </div>
        </div>

        {/* Scrollable Categories Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 m-scroll">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition ${
              selectedCategory === 'all'
                ? isLight ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-900 font-semibold'
                : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-white/5 text-white/55 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>All Connectors</span>
            <span className="rounded-full bg-black/10 dark:bg-white/20 px-1.5 py-0.2 text-[9px]">
              {categoryCounts.all}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory('connected')}
            className={`flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition ${
              selectedCategory === 'connected'
                ? isLight ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-slate-950 font-bold'
                : isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>Connected</span>
            <span className="rounded-full bg-black/10 dark:bg-white/20 px-1.5 py-0.2 text-[9px]">
              {categoryCounts.connected}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory('enterprise')}
            className={`flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition ${
              selectedCategory === 'enterprise'
                ? isLight ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white font-bold'
                : isLight ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
            }`}
          >
            <ShieldCheck className="h-3 w-3" />
            <span>Enterprise Work</span>
            <span className="rounded-full bg-black/10 dark:bg-white/20 px-1.5 py-0.2 text-[9px]">
              {categoryCounts.enterprise}
            </span>
          </button>

          <div className="h-4 w-px bg-slate-300 dark:bg-white/15 mx-1 shrink-0" />

          {SAAS_CONNECTOR_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`flex items-center gap-1 shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition whitespace-nowrap ${
                selectedCategory === cat.key
                  ? isLight ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-900 font-semibold'
                  : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-white/5 text-white/55 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{cat.label}</span>
              <span className="rounded-full bg-black/10 dark:bg-white/20 px-1.5 py-0.2 text-[9px]">
                {categoryCounts[cat.key] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredConnectors.map((conn) => {
          const isConnected = connectedIds.includes(conn.id);

          return (
            <div
              key={conn.id}
              className={`group flex flex-col justify-between rounded-2xl border p-4 transition duration-200 ${
                isLight
                  ? isConnected
                    ? 'border-emerald-300 bg-emerald-50/30 shadow-sm hover:border-emerald-400 hover:shadow-md'
                    : 'border-slate-200/90 bg-white shadow-xs hover:border-indigo-300 hover:shadow-md'
                  : isConnected
                    ? 'border-emerald-500/40 bg-emerald-950/15 hover:border-emerald-400/60'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
              }`}
            >
              <div>
                {/* Header with Monogram / Icon and Badge */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display font-bold text-white shadow-xs text-sm"
                      style={{ backgroundColor: conn.accentColor }}
                    >
                      {conn.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className={`truncate font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {conn.name}
                        </h4>
                        {conn.isEnterpriseWork && (
                          <span
                            title="Enterprise demo listing"
                            className="rounded bg-indigo-500/15 border border-indigo-500/30 px-1 py-0.2 text-[8.5px] font-semibold text-indigo-500"
                          >
                            Enterprise
                          </span>
                        )}
                      </div>
                      <p className={`truncate text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                        {conn.vendor}
                      </p>
                    </div>
                  </div>

                  {isConnected ? (
                    <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9.5px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Linked</span>
                    </span>
                  ) : (
                    <span className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                      isLight ? 'border-slate-200 text-slate-400 bg-slate-50' : 'border-white/10 text-white/40 bg-black/20'
                    }`}>
                      {conn.authType}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className={`mt-2.5 text-[11px] leading-relaxed line-clamp-2 ${
                  isLight ? 'text-slate-600' : 'text-white/60'
                }`}>
                  {conn.description}
                </p>

                {/* Capabilities pills */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {conn.capabilities.slice(0, 3).map((cap) => (
                    <span
                      key={cap}
                      className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${
                        isLight
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-white/5 text-white/50 border border-white/8'
                      }`}
                    >
                      {cap}
                    </span>
                  ))}
                  {conn.capabilities.length > 3 && (
                    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${
                      isLight ? 'text-slate-400' : 'text-white/35'
                    }`}>
                      +{conn.capabilities.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/8 flex items-center justify-between gap-2">
                <button
                  onClick={() => setInspectingConnector(conn)}
                  className={`text-[11px] font-medium transition flex items-center gap-1 ${
                    isLight ? 'text-slate-500 hover:text-indigo-600' : 'text-white/45 hover:text-white'
                  }`}
                >
                  <Code2 className="h-3 w-3" />
                  <span>Inspect</span>
                </button>

                <button
                  onClick={() => handleToggle(conn.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    isConnected
                      ? isLight
                        ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                        : 'border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                      : isLight
                        ? 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-700'
                        : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  <Power className="h-3 w-3" />
                  <span>{isConnected ? 'Remove from demo' : 'Demo connect'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredConnectors.length === 0 && (
        <div className={`text-center py-16 rounded-2xl border ${
          isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/[0.02]'
        }`}>
          <Database className="mx-auto h-8 w-8 text-slate-400 dark:text-white/30" />
          <h4 className="mt-3 font-display font-semibold text-sm">No connectors match "{searchQuery}"</h4>
          <p className={`mt-1 text-xs ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
            Try searching for another service like Salesforce, HubSpot, Stripe, Notion, Jira, or SAP.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
            className="mt-4 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Protocol & Tool Schema Inspector Modal */}
      {inspectingConnector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className={`relative w-full max-w-2xl rounded-2xl border p-6 shadow-2xl overflow-hidden ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-neutral-900 border-white/15 text-white'
          }`}>
            {/* Close button */}
            <button
              onClick={() => { setInspectingConnector(null); setTestResult(null); }}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div
                className="grid h-12 w-12 place-items-center rounded-xl font-display font-bold text-white text-base shadow-sm"
                style={{ backgroundColor: inspectingConnector.accentColor }}
              >
                {inspectingConnector.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold">{inspectingConnector.name}</h3>
                  <span className="rounded bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-mono text-indigo-500">
                    {inspectingConnector.authType}
                  </span>
                  {connectedIds.includes(inspectingConnector.id) && (
                    <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  )}
                </div>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  {inspectingConnector.categoryLabel} · Vendor: {inspectingConnector.vendor}
                </p>
              </div>
            </div>

            <p className={`mt-4 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
              {inspectingConnector.description}
            </p>

            {/* Capability tools list */}
            <div className="mt-5 space-y-2">
              <h5 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Agent Executable Capabilities ({inspectingConnector.capabilities.length})
              </h5>
              <div className="grid gap-2 sm:grid-cols-2">
                {inspectingConnector.capabilities.map((cap) => (
                  <div
                    key={cap}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 ${
                      isLight ? 'border-slate-200 bg-slate-50' : 'border-white/8 bg-white/[0.02]'
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold truncate">{cap}</p>
                      <p className={`text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                        Deterministic MCP RPC action
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Ping Sandbox */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Protocol Connectivity & Verification
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopySchema(inspectingConnector)}
                    className={`flex items-center gap-1 text-[11px] font-medium ${
                      isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {copiedSchema ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedSchema ? 'Copied Schema' : 'Copy MCP Schema'}</span>
                  </button>
                  <button
                    onClick={() => handleTestPing(inspectingConnector)}
                    disabled={testingPing}
                    className="flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {testingPing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                    <span>Test Ping</span>
                  </button>
                </div>
              </div>

              {testResult && (
                <pre className={`rounded-xl border p-3 font-mono text-[11px] overflow-x-auto max-h-36 ${
                  isLight ? 'bg-slate-900 text-emerald-400 border-slate-800' : 'bg-black/70 text-emerald-400 border-white/10'
                }`}>
                  {testResult}
                </pre>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-between border-t pt-4 border-slate-200 dark:border-white/10">
              <button
                onClick={() => handleToggle(inspectingConnector.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  connectedIds.includes(inspectingConnector.id)
                    ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                <Power className="h-3.5 w-3.5" />
                <span>
                  {connectedIds.includes(inspectingConnector.id)
                    ? 'Disconnect from Carol Ann OS'
                    : 'Link Connector to Workspace'}
                </span>
              </button>

              <button
                onClick={() => { setInspectingConnector(null); setTestResult(null); }}
                className={`rounded-xl px-4 py-2 text-xs font-semibold ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/10 hover:bg-white/15 text-white'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
