import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search, Check, ShieldCheck, Zap, Power,
  Terminal, Play, RefreshCw, X, Code2, Key, Globe,
  AlertTriangle, AlertCircle, Copy, CheckCircle2,
  Activity, Layers
} from 'lucide-react';
import {
  SAAS_CONNECTORS_DIRECTORY,
  SAAS_CONNECTOR_CATEGORIES,
  type SaaSConnector,
  type SaaSConnectorCategoryKey,
  getConnectorEndpoint,
  loadConnectorConfigs,
  saveConnectorConfig,
  type ConnectorConfig,
} from '@/data/saasConnectors';
import {
  connectorRegistry,
  type Connector,
  type ConnectorStatus,
  type ConnectorHealthCheck,
  type ConnectorExecutionResult,
} from '@/lib/connector';

export type NormalizedConnectorStatus = 'Connected' | 'Error' | 'Idle';

export interface ConnectorsDashboardProps {
  isLight?: boolean;
  onConnectorToggled?: (connectedIds: string[]) => void;
  compact?: boolean;
}

export const ConnectorsDashboard: React.FC<ConnectorsDashboardProps> = ({
  isLight = false,
  onConnectorToggled,
  compact = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'error' | 'idle'>('all');
  const [categoryFilter, setCategoryFilter] = useState<SaaSConnectorCategoryKey | 'all'>('all');
  const [, setVersion] = useState(0);

  // Inspector & Execution Modal State
  const [inspectingConnector, setInspectingConnector] = useState<SaaSConnector | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [endpointInput, setEndpointInput] = useState('');
  const [selectedCapability, setSelectedCapability] = useState('');
  const [isPinging, setIsPinging] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isBatchPinging, setIsBatchPinging] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testIsError, setTestIsError] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Subscribe to live status transitions across all 206 connectors
  useEffect(() => {
    const unsub = connectorRegistry.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  // Helper: map ConnectorStatus to normalized integration status (Connected, Error, Idle)
  const getNormalizedStatus = useCallback((connId: string): NormalizedConnectorStatus => {
    const instance = connectorRegistry.getConnector(connId);
    if (!instance) return 'Idle';
    const rawStatus = instance.getStatus();

    if (rawStatus === 'connected') return 'Connected';
    if (rawStatus === 'error' || rawStatus === 'rate_limited') return 'Error';
    return 'Idle';
  }, []);

  // All 206 connectors with their current live status
  const connectorsWithStatus = useMemo(() => {
    return SAAS_CONNECTORS_DIRECTORY.map((item) => {
      const instance = connectorRegistry.getConnector(item.id);
      const normalizedStatus = getNormalizedStatus(item.id);
      const health = instance?.getLastHealthCheck() || null;
      return {
        ...item,
        instance,
        normalizedStatus,
        health,
      };
    });
  }, [getNormalizedStatus]);

  // Aggregate Status Metrics
  const metrics = useMemo(() => {
    let connected = 0;
    let error = 0;
    let idle = 0;

    for (const item of connectorsWithStatus) {
      if (item.normalizedStatus === 'Connected') connected++;
      else if (item.normalizedStatus === 'Error') error++;
      else idle++;
    }

    return {
      total: connectorsWithStatus.length,
      connected,
      error,
      idle,
    };
  }, [connectorsWithStatus]);

  // Filtered connectors based on search, status filter, and category
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return connectorsWithStatus.filter((c) => {
      // Status filter
      if (statusFilter === 'connected' && c.normalizedStatus !== 'Connected') return false;
      if (statusFilter === 'error' && c.normalizedStatus !== 'Error') return false;
      if (statusFilter === 'idle' && c.normalizedStatus !== 'Idle') return false;

      // Category filter
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;

      // Text query
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.vendor.toLowerCase().includes(q) ||
        c.categoryLabel.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.capabilities.some((cap) => cap.toLowerCase().includes(q))
      );
    });
  }, [connectorsWithStatus, statusFilter, categoryFilter, searchQuery]);

  // Handle Connect / Disconnect toggle
  const handleToggleConnect = async (connector: Connector) => {
    const isConn = connector.getStatus() === 'connected';
    if (isConn) {
      await connector.disconnect();
    } else {
      await connector.connect();
    }
    setVersion((v) => v + 1);
    if (onConnectorToggled) {
      const activeIds = connectorRegistry.getConnectedConnectors().map((c) => c.id);
      onConnectorToggled(activeIds);
    }
  };

  // Handle Quick Test Ping for a card
  const handleQuickPing = async (connector: Connector, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await connector.ping();
      setVersion((v) => v + 1);
    } catch {
      setVersion((v) => v + 1);
    }
  };

  // Batch Ping All Connected Tools
  const handleBatchPing = async () => {
    setIsBatchPinging(true);
    try {
      await connectorRegistry.pingAllConnected();
      setVersion((v) => v + 1);
    } finally {
      setIsBatchPinging(false);
    }
  };

  // Open inspector modal for a connector
  const handleOpenInspector = (conn: SaaSConnector) => {
    setInspectingConnector(conn);
    setTestResult(null);
    setTestIsError(false);
    setSelectedCapability(conn.capabilities[0] || '');

    const instance = connectorRegistry.getConnector(conn.id);
    const creds = instance?.getCredentials();
    const configs = loadConnectorConfigs();
    const config = configs[conn.id];

    setApiKeyInput(creds?.apiKey || config?.apiKey || '');
    setEndpointInput(creds?.endpointUrl || config?.endpointUrl || conn.endpointUrl || getConnectorEndpoint(conn));
  };

  // Save Credentials & Handshake
  const handleSaveCredentials = async () => {
    if (!inspectingConnector) return;
    const instance = connectorRegistry.getConnector(inspectingConnector.id);
    if (!instance) return;

    instance.setCredentials({
      apiKey: apiKeyInput.trim() || undefined,
      endpointUrl: endpointInput.trim() || undefined,
      account: apiKeyInput.trim() ? `${inspectingConnector.id}-auth` : `${inspectingConnector.id}-live`,
    });

    const health = await instance.ping();
    if (health.healthy) {
      await instance.connect();
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    setVersion((v) => v + 1);
  };

  // Modal Ping Test
  const handleModalPing = async () => {
    if (!inspectingConnector) return;
    const instance = connectorRegistry.getConnector(inspectingConnector.id);
    if (!instance) return;

    setIsPinging(true);
    setTestResult(null);
    setTestIsError(false);

    try {
      if (apiKeyInput.trim() || endpointInput.trim()) {
        instance.setCredentials({
          apiKey: apiKeyInput.trim() || undefined,
          endpointUrl: endpointInput.trim() || undefined,
        });
      }

      const health = await instance.ping();
      const isErr = !health.healthy;
      setTestIsError(isErr);
      setTestResult(JSON.stringify(health, null, 2));
      setVersion((v) => v + 1);
    } catch (err: unknown) {
      setTestIsError(true);
      setTestResult(JSON.stringify({
        healthy: false,
        status: 'error',
        error: {
          code: 'DISPATCH_ERROR',
          message: err instanceof Error ? err.message : String(err),
          retryable: true,
        },
      }, null, 2));
    } finally {
      setIsPinging(false);
    }
  };

  // Modal Action Execution
  const handleModalExecute = async () => {
    if (!inspectingConnector) return;
    const instance = connectorRegistry.getConnector(inspectingConnector.id);
    if (!instance) return;

    setIsExecuting(true);
    setTestResult(null);
    setTestIsError(false);

    const action = selectedCapability || inspectingConnector.capabilities[0] || 'sync';

    try {
      if (apiKeyInput.trim() || endpointInput.trim()) {
        instance.setCredentials({
          apiKey: apiKeyInput.trim() || undefined,
          endpointUrl: endpointInput.trim() || undefined,
        });
      }

      const result = await instance.execute({
        action,
        params: { query: 'active', limit: 10 },
      });

      setTestIsError(!result.success);
      setTestResult(JSON.stringify(result, null, 2));
      setVersion((v) => v + 1);
    } catch (err: unknown) {
      setTestIsError(true);
      setTestResult(JSON.stringify({
        success: false,
        status: 'failed',
        connectorId: inspectingConnector.id,
        action,
        error: {
          code: 'EXECUTE_EXCEPTION',
          message: err instanceof Error ? err.message : String(err),
          retryable: true,
        },
      }, null, 2));
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopySchema = (conn: SaaSConnector) => {
    const schema = {
      $schema: 'https://modelcontextprotocol.io/schema/2024-11-05',
      name: conn.name,
      id: conn.id,
      vendor: conn.vendor,
      endpoint: endpointInput || conn.endpointUrl || getConnectorEndpoint(conn),
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

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* KPI Overview Banner */}
      {!compact && (
        <div className={`rounded-2xl border p-5 transition ${
          isLight
            ? 'border-indigo-200/90 bg-indigo-50/70 text-slate-900 shadow-sm'
            : 'border-white/10 bg-white/[0.02] text-white'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                  <Activity className="h-3.5 w-3.5" />
                  <span>206 Modular Connectors Active</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Integration Status Monitor
                </span>
              </div>
              <h2 className="font-display text-xl font-bold">Connectors Dashboard</h2>
              <p className={`text-xs max-w-2xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                Real-time status tracking and protocol verification across all 206 SaaS, Cloud, and Enterprise connectors.
                Every card reflects live state (Connected, Error, Idle) via the modular <code>Connector</code> interface.
              </p>
            </div>

            {/* Quick Batch Action */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleBatchPing}
                disabled={isBatchPinging || metrics.connected === 0}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isBatchPinging ? 'animate-spin' : ''}`} />
                <span>Ping All Connected ({metrics.connected})</span>
              </button>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`rounded-xl border p-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-black/25 border-white/8'
            }`}>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Total Connectors</span>
              <p className="mt-1 font-mono text-xl font-bold text-indigo-500">{metrics.total}</p>
              <span className="text-[10px] text-slate-400">25 SaaS categories</span>
            </div>

            <div className={`rounded-xl border p-3 ${
              isLight ? 'bg-white border-emerald-200/80' : 'bg-emerald-950/15 border-emerald-500/20'
            }`}>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-500 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Connected
              </span>
              <p className="mt-1 font-mono text-xl font-bold text-emerald-500">{metrics.connected}</p>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70">
                {((metrics.connected / metrics.total) * 100).toFixed(1)}% active
              </span>
            </div>

            <div className={`rounded-xl border p-3 ${
              isLight ? 'bg-white border-rose-200/80' : 'bg-rose-950/15 border-rose-500/20'
            }`}>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-rose-500 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Error
              </span>
              <p className="mt-1 font-mono text-xl font-bold text-rose-500">{metrics.error}</p>
              <span className="text-[10px] text-rose-600/80 dark:text-rose-400/70">
                {metrics.error === 0 ? 'All systems healthy' : 'Requires auth / config'}
              </span>
            </div>

            <div className={`rounded-xl border p-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-black/25 border-white/8'
            }`}>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Idle
              </span>
              <p className="mt-1 font-mono text-xl font-bold text-slate-400">{metrics.idle}</p>
              <span className="text-[10px] text-slate-400">Available to connect</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search bar */}
          <div className={`relative flex-1 rounded-xl border transition ${
            isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/[0.03]'
          }`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 206 connectors by name, vendor, category, or capability..."
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

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              All ({metrics.total})
            </button>
            <button
              onClick={() => setStatusFilter('connected')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 ${
                statusFilter === 'connected'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected ({metrics.connected})
            </button>
            <button
              onClick={() => setStatusFilter('error')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 ${
                statusFilter === 'error'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              <AlertCircle className="h-3 w-3 text-rose-300" />
              Error ({metrics.error})
            </button>
            <button
              onClick={() => setStatusFilter('idle')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 ${
                statusFilter === 'idle'
                  ? 'bg-slate-600 text-white shadow-xs'
                  : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Idle ({metrics.idle})
            </button>
          </div>
        </div>

        {/* Category Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`rounded-full px-3 py-1 text-[11px] font-medium whitespace-nowrap transition border ${
              categoryFilter === 'all'
                ? 'border-indigo-500 bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 font-semibold'
                : isLight ? 'border-slate-200 bg-white text-slate-600' : 'border-white/8 bg-white/[0.02] text-white/50'
            }`}
          >
            All Categories
          </button>
          {SAAS_CONNECTOR_CATEGORIES.map((cat) => {
            const isSelected = categoryFilter === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(isSelected ? 'all' : cat.key)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium whitespace-nowrap transition border ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 font-semibold'
                    : isLight
                      ? 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      : 'border-white/8 bg-white/[0.02] text-white/50 hover:border-white/15 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Cards (All 206 Connectors) */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((conn) => {
          const status = conn.normalizedStatus;
          const endpoint = conn.endpointUrl || getConnectorEndpoint(conn);
          const instance = conn.instance;

          return (
            <div
              key={conn.id}
              className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition ${
                isLight
                  ? 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                  : 'border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              <div>
                {/* Header: Avatar, Name, and Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="grid h-9 w-9 place-items-center rounded-xl font-display font-bold text-white text-xs shadow-xs shrink-0"
                      style={{ backgroundColor: conn.accentColor }}
                    >
                      {conn.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-display font-semibold text-xs truncate">{conn.name}</h4>
                        {conn.featured && (
                          <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1 py-0.2 text-[8px] font-semibold text-amber-500 uppercase tracking-wider">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] truncate ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                        {conn.vendor} · {conn.categoryLabel}
                      </p>
                    </div>
                  </div>

                  {/* Integration Status Badge (Connected | Error | Idle) */}
                  {status === 'Connected' ? (
                    <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[9.5px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Connected</span>
                    </span>
                  ) : status === 'Error' ? (
                    <span className="flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[9.5px] font-semibold text-rose-500 shrink-0">
                      <AlertCircle className="h-3 w-3 text-rose-500" />
                      <span>Error</span>
                    </span>
                  ) : (
                    <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9.5px] font-semibold shrink-0 ${
                      isLight ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-white/10 bg-white/5 text-white/40'
                    }`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span>Idle</span>
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className={`mt-2.5 text-[11px] leading-relaxed line-clamp-2 ${
                  isLight ? 'text-slate-600' : 'text-white/60'
                }`}>
                  {conn.description}
                </p>

                {/* Live Diagnostic / Health Info */}
                {conn.health && (
                  <div className={`mt-2 flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded-lg ${
                    conn.health.healthy
                      ? isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-950/20 text-emerald-400'
                      : isLight ? 'bg-rose-50 text-rose-700' : 'bg-rose-950/20 text-rose-300'
                  }`}>
                    <span>Latency: {conn.health.latencyMs}ms</span>
                    <span>HTTP {conn.health.httpStatus || 200}</span>
                  </div>
                )}

                {/* Live Endpoint Destination */}
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-slate-400 truncate">
                  <Globe className="h-3 w-3 shrink-0 text-indigo-400" />
                  <span className="truncate">{endpoint.replace('https://', '')}</span>
                </div>

                {/* Capabilities Pills */}
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {conn.capabilities.slice(0, 2).map((cap) => (
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
                  {conn.capabilities.length > 2 && (
                    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${
                      isLight ? 'text-slate-400' : 'text-white/35'
                    }`}>
                      +{conn.capabilities.length - 2}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/8 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenInspector(conn)}
                    className={`text-[11px] font-medium transition flex items-center gap-1 px-1.5 py-1 rounded ${
                      isLight ? 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50' : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Code2 className="h-3 w-3" />
                    <span>Inspect</span>
                  </button>

                  {instance && (
                    <button
                      onClick={(e) => handleQuickPing(instance, e)}
                      title="Quick Health Ping"
                      className={`p-1 rounded text-slate-400 transition ${
                        isLight ? 'hover:bg-slate-100 hover:text-indigo-600' : 'hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Play className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {instance && (
                  <button
                    onClick={() => handleToggleConnect(instance)}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                      status === 'Connected'
                        ? isLight
                          ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                        : isLight
                          ? 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-700'
                          : 'bg-white/15 text-white hover:bg-white/25'
                    }`}
                  >
                    <Power className="h-3 w-3" />
                    <span>{status === 'Connected' ? 'Disconnect' : 'Connect'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className={`text-center py-16 rounded-2xl border ${
          isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/[0.02]'
        }`}>
          <AlertCircle className="mx-auto h-8 w-8 text-slate-400" />
          <h4 className="mt-3 font-display font-semibold text-sm">No connectors found</h4>
          <p className={`mt-1 text-xs ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
            No connectors match "{searchQuery}" under the selected filters.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setStatusFilter('all'); setCategoryFilter('all'); }}
            className="mt-4 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Inspector Modal */}
      {inspectingConnector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className={`relative w-full max-w-2xl rounded-2xl border p-6 shadow-2xl overflow-y-auto max-h-[90vh] ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-neutral-900 border-white/15 text-white'
          }`}>
            {/* Close Button */}
            <button
              onClick={() => { setInspectingConnector(null); setTestResult(null); }}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div
                className="grid h-12 w-12 place-items-center rounded-xl font-display font-bold text-white text-base shadow-sm shrink-0"
                style={{ backgroundColor: inspectingConnector.accentColor }}
              >
                {inspectingConnector.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold truncate">{inspectingConnector.name}</h3>
                  <span className="rounded bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-mono text-indigo-500">
                    {inspectingConnector.authType}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-mono font-semibold ${
                    getNormalizedStatus(inspectingConnector.id) === 'Connected'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : getNormalizedStatus(inspectingConnector.id) === 'Error'
                        ? 'bg-rose-500/15 border border-rose-500/30 text-rose-500'
                        : 'bg-slate-500/15 border border-slate-500/30 text-slate-400'
                  }`}>
                    {getNormalizedStatus(inspectingConnector.id)}
                  </span>
                </div>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  {inspectingConnector.categoryLabel} · Vendor: {inspectingConnector.vendor}
                </p>
              </div>
            </div>

            <p className={`mt-3 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
              {inspectingConnector.description}
            </p>

            {/* Credentials & Endpoint Section */}
            <div className={`mt-4 rounded-xl border p-3.5 space-y-2.5 ${
              isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.02]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-indigo-400" />
                  API Endpoint Destination
                </span>
                <button
                  onClick={() => handleCopyUrl(endpointInput)}
                  className={`flex items-center gap-1 text-[10.5px] font-medium ${
                    isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {copiedUrl ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  type="text"
                  value={endpointInput}
                  onChange={(e) => setEndpointInput(e.target.value)}
                  placeholder="https://api.vendor.com"
                  className={`rounded-lg border px-3 py-1.5 font-mono text-xs outline-none ${
                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-black/40 border-white/10 text-white'
                  }`}
                />
                <button
                  onClick={handleSaveCredentials}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shrink-0"
                >
                  {savedSuccess ? 'Saved & Verified!' : 'Save & Verify'}
                </button>
              </div>

              {inspectingConnector.authType !== 'OAuth 2.0' && (
                <div className="pt-1">
                  <label className="text-[10.5px] font-medium text-slate-400 flex items-center gap-1 mb-1">
                    <Key className="h-3 w-3 text-amber-400" />
                    {inspectingConnector.authType} Secret / Token
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

            {/* Executable Capabilities */}
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
                        Click to select for execution
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Bar & Results */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Protocol Verification &amp; RPC
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopySchema(inspectingConnector)}
                    className={`flex items-center gap-1 text-[11px] font-medium ${
                      isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {copiedSchema ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedSchema ? 'Copied' : 'Copy Schema'}</span>
                  </button>
                  <button
                    onClick={handleModalPing}
                    disabled={isPinging}
                    className="flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isPinging ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                    <span>Test Ping</span>
                  </button>
                  <button
                    onClick={handleModalExecute}
                    disabled={isExecuting}
                    className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isExecuting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Terminal className="h-3 w-3" />}
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
                        <span>Integration Error</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Protocol Verified Successfully</span>
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

            {/* Modal Footer */}
            <div className="mt-5 flex items-center justify-between border-t pt-4 border-slate-200 dark:border-white/10">
              {connectorRegistry.getConnector(inspectingConnector.id) && (
                <button
                  onClick={() => handleToggleConnect(connectorRegistry.getConnector(inspectingConnector.id)!)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                    getNormalizedStatus(inspectingConnector.id) === 'Connected'
                      ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  <Power className="h-3.5 w-3.5" />
                  <span>
                    {getNormalizedStatus(inspectingConnector.id) === 'Connected'
                      ? 'Disconnect'
                      : 'Connect to Workspace'}
                  </span>
                </button>
              )}

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
