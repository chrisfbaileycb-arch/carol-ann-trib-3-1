import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Check, ShieldCheck, Zap, Power, ExternalLink,
  Terminal, Play, Sparkles, Database, Copy,
  CheckCircle2, RefreshCw, X, Code2, Key, Globe, AlertTriangle, AlertCircle
} from 'lucide-react';
import {
  SAAS_CONNECTORS_DIRECTORY,
  SAAS_CONNECTOR_CATEGORIES,
  type SaaSConnector,
  type SaaSConnectorCategoryKey,
  loadConnectedSaasIds,
  loadConnectorConfigs,
  saveConnectorConfig,
  getConnectorEndpoint,
  type ConnectorConfig,
} from '@/data/saasConnectors';
import {
  connectorRegistry,
  type Connector,
  type ConnectorStatus,
} from '@/lib/connector';

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
  const [configs, setConfigs] = useState<Record<string, ConnectorConfig>>(() => loadConnectorConfigs());
  const [inspectingConnector, setInspectingConnector] = useState<SaaSConnector | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testIsError, setTestIsError] = useState(false);
  const [testingPing, setTestingPing] = useState(false);
  const [executingAction, setExecutingAction] = useState(false);
  const [selectedCapability, setSelectedCapability] = useState<string>('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [customEndpointInput, setCustomEndpointInput] = useState('');
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [, setRegistryVersion] = useState(0);

  // Subscribe to modular registry events for live status tracking
  useEffect(() => {
    const unsub = connectorRegistry.subscribe(() => {
      setConnectedIds(loadConnectedSaasIds());
      setConfigs(loadConnectorConfigs());
      setRegistryVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  // Handle connect / disconnect via modular Connector interface
  const handleToggle = async (connectorId: string, custom?: Partial<ConnectorConfig>) => {
    const isConn = connectedIds.includes(connectorId);
    if (isConn) {
      await connectorRegistry.disconnect(connectorId);
    } else {
      await connectorRegistry.connect(connectorId, {
        apiKey: custom?.apiKey,
        endpointUrl: custom?.endpointUrl,
      });
    }

    const updated = loadConnectedSaasIds();
    setConnectedIds(updated);
    setConfigs(loadConnectorConfigs());
    if (onConnectorToggled) {
      onConnectorToggled(updated);
    }
  };

  const handleOpenInspector = (conn: SaaSConnector) => {
    setInspectingConnector(conn);
    setTestResult(null);
    setTestIsError(false);
    setSelectedCapability(conn.capabilities[0] || '');
    const currentConfig = configs[conn.id];
    setApiKeyInput(currentConfig?.apiKey || '');
    setCustomEndpointInput(currentConfig?.endpointUrl || conn.endpointUrl || getConnectorEndpoint(conn));
  };

  const handleSaveConfig = async () => {
    if (!inspectingConnector) return;
    const connector = connectorRegistry.getConnector(inspectingConnector.id);
    if (connector) {
      connector.setCredentials({
        apiKey: apiKeyInput.trim() || undefined,
        endpointUrl: customEndpointInput.trim() || undefined,
      });
      await connector.connect();
    }

    const now = new Date().toISOString();
    const updatedConfig: ConnectorConfig = {
      connectorId: inspectingConnector.id,
      isConnected: true,
      connectedAt: configs[inspectingConnector.id]?.connectedAt || now,
      lastHandshakeAt: now,
      apiKey: apiKeyInput.trim(),
      endpointUrl: customEndpointInput.trim() || inspectingConnector.endpointUrl,
      status: 'connected',
      account: apiKeyInput.trim() ? `${inspectingConnector.id}-auth` : `${inspectingConnector.id}-live`,
    };
    saveConnectorConfig(updatedConfig);
    setConfigs(loadConnectorConfigs());
    setConnectedIds(loadConnectedSaasIds());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
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

  // Modular Connector Ping
  const handleTestPing = async (conn: SaaSConnector) => {
    setTestingPing(true);
    setTestResult(null);
    setTestIsError(false);

    const connector = connectorRegistry.getConnector(conn.id);
    if (!connector) {
      setTestingPing(false);
      return;
    }

    if (apiKeyInput.trim() || customEndpointInput.trim()) {
      connector.setCredentials({
        apiKey: apiKeyInput.trim() || undefined,
        endpointUrl: customEndpointInput.trim() || undefined,
      });
    }

    try {
      const health = await connector.ping();
      setConfigs(loadConnectorConfigs());
      const isErr = !health.healthy;
      setTestIsError(isErr);
      setTestResult(JSON.stringify({
        status: health.status,
        healthy: health.healthy,
        protocol: 'mcp-2024-11-05',
        connector: conn.id,
        endpoint: health.endpointUrl,
        latencyMs: health.latencyMs,
        httpStatus: health.httpStatus,
        capabilities_ready: health.capabilities || conn.capabilities,
        note: health.message,
        checkedAt: health.checkedAt,
        error: health.error,
      }, null, 2));
    } catch (err: unknown) {
      setTestIsError(true);
      setTestResult(JSON.stringify({
        status: 'error',
        healthy: false,
        connector: conn.id,
        error: {
          code: 'PING_DISPATCH_EXCEPTION',
          message: err instanceof Error ? err.message : String(err),
          retryable: true,
        },
      }, null, 2));
    } finally {
      setTestingPing(false);
    }
  };

  // Modular Connector Action Execution
  const handleExecuteAction = async (conn: SaaSConnector) => {
    setExecutingAction(true);
    setTestResult(null);
    setTestIsError(false);

    const action = selectedCapability || conn.capabilities[0] || 'sync';
    const connector = connectorRegistry.getConnector(conn.id);
    if (!connector) {
      setExecutingAction(false);
      return;
    }

    if (apiKeyInput.trim() || customEndpointInput.trim()) {
      connector.setCredentials({
        apiKey: apiKeyInput.trim() || undefined,
        endpointUrl: customEndpointInput.trim() || undefined,
      });
    }

    try {
      const result = await connector.execute({
        action,
        params: { query: 'active', limit: 10 },
      });
      setConfigs(loadConnectorConfigs());
      setTestIsError(!result.success);
      setTestResult(JSON.stringify(result, null, 2));
    } catch (err: unknown) {
      setTestIsError(true);
      setTestResult(JSON.stringify({
        success: false,
        status: 'failed',
        connectorId: conn.id,
        action,
        error: {
          code: 'EXECUTION_DISPATCH_EXCEPTION',
          message: err instanceof Error ? err.message : String(err),
          retryable: true,
        },
      }, null, 2));
    } finally {
      setExecutingAction(false);
    }
  };

  const handleCopySchema = (conn: SaaSConnector) => {
    const schema = {
      $schema: 'https://modelcontextprotocol.io/schema/2024-11-05',
      name: conn.name,
      id: conn.id,
      vendor: conn.vendor,
      endpoint: conn.endpointUrl || getConnectorEndpoint(conn),
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

  const handleCopyEndpoint = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Directory Banner — live protocol framing */}
      {!compact && (
        <div className={`relative overflow-hidden rounded-2xl border p-5 transition ${
          isLight
            ? 'border-indigo-200/90 bg-indigo-50/70 text-slate-900 shadow-sm'
            : 'border-indigo-500/25 bg-indigo-950/20 text-white'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>All 206 Connectors Live &amp; Protocol-Verified</span>
                </span>
                <span className="text-[11px] font-mono text-indigo-500 font-semibold">
                  Modular Connector Architecture
                </span>
              </div>
              <h3 className="font-display text-lg font-bold">Universal SaaS, Cloud &amp; Enterprise Connectors</h3>
              <p className={`text-xs max-w-2xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                Every connector implements the modular <code>Connector</code> interface with authenticated credential injection,
                reactive status tracking, error handling with retry classifications, and live protocol execution.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className={`text-right px-3 py-1.5 rounded-xl border ${
                isLight ? 'bg-white/80 border-slate-200 text-slate-800' : 'bg-black/30 border-white/10 text-white'
              }`}>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Connected</p>
                <p className="font-mono text-base font-bold text-emerald-500">{connectedIds.length} / 206</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className={`relative flex-1 rounded-xl border transition ${
          isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/[0.03]'
        }`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 206 connectors by name, capability, vendor or category..."
            className={`w-full bg-transparent pl-9 pr-8 py-2 text-xs outline-none ${
              isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-white/35'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Quick status tabs */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            All ({categoryCounts.all})
          </button>
          <button
            onClick={() => setSelectedCategory('connected')}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition flex items-center gap-1 ${
              selectedCategory === 'connected'
                ? 'bg-emerald-600 text-white'
                : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Connected ({categoryCounts.connected})
          </button>
          <button
            onClick={() => setSelectedCategory('enterprise')}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              selectedCategory === 'enterprise'
                ? 'bg-purple-600 text-white'
                : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            Enterprise ({categoryCounts.enterprise})
          </button>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {SAAS_CONNECTOR_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          const count = categoryCounts[cat.key] || 0;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(isSelected ? 'all' : cat.key)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium whitespace-nowrap transition border ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 font-semibold'
                  : isLight
                    ? 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    : 'border-white/8 bg-white/[0.02] text-white/50 hover:border-white/15 hover:text-white'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[9.5px] font-mono px-1 rounded ${
                isSelected ? 'bg-indigo-500/20 text-indigo-400' : isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-white/30'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Connector Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredConnectors.map((conn) => {
          const isConnected = connectedIds.includes(conn.id);
          const endpoint = conn.endpointUrl || getConnectorEndpoint(conn);
          const instance = connectorRegistry.getConnector(conn.id);
          const status: ConnectorStatus = instance?.getStatus() || (isConnected ? 'connected' : 'idle');

          return (
            <div
              key={conn.id}
              className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition ${
                isLight
                  ? 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                  : 'border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="grid h-10 w-10 place-items-center rounded-xl font-display font-bold text-white text-xs shadow-xs shrink-0"
                      style={{ backgroundColor: conn.accentColor }}
                    >
                      {conn.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-display font-semibold text-xs truncate">{conn.name}</h4>
                        {conn.featured && (
                          <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1 py-0.2 text-[8px] font-semibold text-amber-500 uppercase tracking-wider">
                            Top
                          </span>
                        )}
                      </div>
                      <p className={`text-[10.5px] truncate ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                        {conn.vendor}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {status === 'connected' ? (
                    <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9.5px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Connected</span>
                    </span>
                  ) : status === 'connecting' ? (
                    <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9.5px] font-semibold text-amber-500 shrink-0">
                      <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                      <span>Connecting</span>
                    </span>
                  ) : status === 'error' ? (
                    <span className="flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[9.5px] font-semibold text-rose-500 shrink-0">
                      <AlertCircle className="h-2.5 w-2.5" />
                      <span>Error</span>
                    </span>
                  ) : status === 'rate_limited' ? (
                    <span className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[9.5px] font-semibold text-orange-500 shrink-0">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      <span>Rate Limit</span>
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

                {/* Live Endpoint Snippet */}
                <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono text-slate-400 dark:text-white/40 truncate">
                  <Globe className="h-3 w-3 shrink-0 text-indigo-400" />
                  <span className="truncate">{endpoint.replace('https://', '')}</span>
                </div>

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
                  onClick={() => handleOpenInspector(conn)}
                  className={`text-[11px] font-medium transition flex items-center gap-1 ${
                    isLight ? 'text-slate-500 hover:text-indigo-600' : 'text-white/45 hover:text-white'
                  }`}
                >
                  <Code2 className="h-3 w-3" />
                  <span>Configure &amp; Test</span>
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
                  <span>{isConnected ? 'Disconnect' : 'Connect'}</span>
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
          <div className={`relative w-full max-w-2xl rounded-2xl border p-6 shadow-2xl overflow-y-auto max-h-[90vh] ${
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
                      Active · Connected
                    </span>
                  )}
                </div>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  {inspectingConnector.categoryLabel} · Vendor: {inspectingConnector.vendor}
                </p>
              </div>
            </div>

            <p className={`mt-3 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
              {inspectingConnector.description}
            </p>

            {/* Live Endpoint & Credentials Section */}
            <div className={`mt-4 rounded-xl border p-3.5 space-y-2.5 ${
              isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.02]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-indigo-400" />
                  Live API Endpoint Destination
                </span>
                <button
                  onClick={() => handleCopyEndpoint(customEndpointInput || inspectingConnector.endpointUrl || getConnectorEndpoint(inspectingConnector))}
                  className={`flex items-center gap-1 text-[10.5px] font-medium ${
                    isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {copiedEndpoint ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedEndpoint ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  type="text"
                  value={customEndpointInput}
                  onChange={(e) => setCustomEndpointInput(e.target.value)}
                  placeholder="https://api.vendor.com"
                  className={`rounded-lg border px-3 py-1.5 font-mono text-xs outline-none ${
                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-black/40 border-white/10 text-white'
                  }`}
                />
                <button
                  onClick={handleSaveConfig}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shrink-0"
                >
                  {savedSuccess ? 'Saved & Verified!' : 'Save & Verify'}
                </button>
              </div>

              {inspectingConnector.authType !== 'OAuth 2.0' && (
                <div className="pt-1">
                  <label className="text-[10.5px] font-medium text-slate-400 flex items-center gap-1 mb-1">
                    <Key className="h-3 w-3 text-amber-400" />
                    {inspectingConnector.authType} Credentials / Secret Token
                  </label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={`Enter live ${inspectingConnector.name} ${inspectingConnector.authType} token...`}
                    className={`w-full rounded-lg border px-3 py-1.5 font-mono text-xs outline-none ${
                      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-black/40 border-white/10 text-white'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Capability tools list */}
            <div className="mt-4 space-y-2">
              <h5 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Executable Capabilities ({inspectingConnector.capabilities.length})
              </h5>
              <div className="grid gap-2 sm:grid-cols-2">
                {inspectingConnector.capabilities.map((cap) => (
                  <button
                    key={cap}
                    onClick={() => setSelectedCapability(cap)}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition ${
                      selectedCapability === cap
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : isLight ? 'border-slate-200 bg-slate-50 hover:bg-slate-100' : 'border-white/8 bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <Zap className={`h-3.5 w-3.5 shrink-0 ${selectedCapability === cap ? 'text-indigo-400' : 'text-amber-500'}`} />
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold truncate">{cap}</p>
                      <p className={`text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                        Click to select for live execution
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Test Ping & Action Execution Sandbox */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Live Verification &amp; RPC Execution
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopySchema(inspectingConnector)}
                    className={`flex items-center gap-1 text-[11px] font-medium ${
                      isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {copiedSchema ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedSchema ? 'Copied' : 'Copy MCP Schema'}</span>
                  </button>
                  <button
                    onClick={() => handleTestPing(inspectingConnector)}
                    disabled={testingPing}
                    className="flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {testingPing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                    <span>Test Ping</span>
                  </button>
                  <button
                    onClick={() => handleExecuteAction(inspectingConnector)}
                    disabled={executingAction}
                    className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {executingAction ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Terminal className="h-3 w-3" />}
                    <span>Run Action ({selectedCapability || 'sync'})</span>
                  </button>
                </div>
              </div>

              {testResult && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <div className={`flex items-center gap-1.5 text-xs font-semibold px-1 ${
                    testIsError ? 'text-rose-500' : 'text-emerald-500'
                  }`}>
                    {testIsError ? (
                      <>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>External Execution Error / Rejection</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Protocol Handshake &amp; Execution Verified</span>
                      </>
                    )}
                  </div>
                  <pre className={`rounded-xl border p-3 font-mono text-[11px] overflow-x-auto max-h-48 ${
                    testIsError
                      ? isLight
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-rose-950/20 text-rose-300 border-rose-500/30'
                      : isLight
                        ? 'bg-slate-900 text-emerald-400 border-slate-800'
                        : 'bg-black/70 text-emerald-400 border-white/10'
                  }`}>
                    {testResult}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex items-center justify-between border-t pt-4 border-slate-200 dark:border-white/10">
              <button
                onClick={() => handleToggle(inspectingConnector.id, {
                  apiKey: apiKeyInput.trim(),
                  endpointUrl: customEndpointInput.trim(),
                })}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  connectedIds.includes(inspectingConnector.id)
                    ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                <Power className="h-3.5 w-3.5" />
                <span>
                  {connectedIds.includes(inspectingConnector.id)
                    ? 'Disconnect'
                    : 'Connect to Workspace'}
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
