/**
 * Modular Connector Interface and Registry for Carol Ann OS.
 * Manages all 206 SaaS, Cloud, and Enterprise connectors with:
 * - Unified Authentication (API Key, OAuth 2.0, Enterprise SSO, Webhooks)
 * - Reactive Status Tracking (idle, connecting, connected, error, rate_limited)
 * - Resilient Error Handling (timeouts, vendor status codes, retry policies)
 * - Live Outbound Network Execution & Protocol Receipts
 */

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/apiClient';
import {
  SAAS_CONNECTORS_DIRECTORY,
  CONNECTOR_ENDPOINT_MAP,
  getConnectorEndpoint,
  loadConnectedSaasIds,
  loadConnectorConfigs,
  saveConnectorConfig,
  saveConnectedSaasIds,
  type SaaSConnector,
  type ConnectorConfig,
} from '@/data/saasConnectors';

export type AuthType = 'OAuth 2.0' | 'API Key' | 'Enterprise SSO' | 'Webhook' | 'Bearer Token' | 'Basic Auth';

export type ConnectorStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'disconnected'
  | 'rate_limited';

export interface ConnectorAuthCredentials {
  apiKey?: string;
  token?: string;
  clientId?: string;
  clientSecret?: string;
  webhookUrl?: string;
  customHeaders?: Record<string, string>;
  endpointUrl?: string;
  account?: string;
}

export interface ConnectorExecutionRequest<TParams = Record<string, unknown>> {
  action: string;
  params?: TParams;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export interface ConnectorErrorDetails {
  code: string;
  message: string;
  statusCode?: number;
  details?: unknown;
  retryable?: boolean;
}

export interface ConnectorExecutionResult<TData = unknown> {
  success: boolean;
  connectorId: string;
  action: string;
  receiptId: string;
  status: 'executed' | 'failed' | 'timeout';
  data?: TData;
  error?: ConnectorErrorDetails;
  latencyMs: number;
  httpStatus?: number;
  timestamp: string;
  endpointUrl: string;
}

export interface ConnectorHealthCheck {
  healthy: boolean;
  latencyMs: number;
  status: ConnectorStatus;
  httpStatus?: number;
  message: string;
  checkedAt: string;
  capabilities?: string[];
  endpointUrl: string;
  error?: ConnectorErrorDetails;
}

export type StatusChangeListener = (
  status: ConnectorStatus,
  health: ConnectorHealthCheck | null,
  error?: ConnectorErrorDetails
) => void;

/**
 * Modular Connector Interface
 * Defines standard lifecycle, authentication, status tracking, and error handling.
 */
export interface Connector {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly categoryLabel: string;
  readonly vendor: string;
  readonly endpointUrl: string;
  readonly authType: AuthType;
  readonly capabilities: string[];
  readonly accentColor: string;
  readonly isEnterpriseWork?: boolean;
  readonly featured?: boolean;

  // Status tracking
  getStatus(): ConnectorStatus;
  getLastHealthCheck(): ConnectorHealthCheck | null;
  subscribe(listener: StatusChangeListener): () => void;

  // Authentication
  setCredentials(credentials: ConnectorAuthCredentials): void;
  getCredentials(): ConnectorAuthCredentials | null;
  clearCredentials(): void;
  isAuthenticated(): boolean;
  getAuthHeaders(): Record<string, string>;

  // External Service Calls
  ping(): Promise<ConnectorHealthCheck>;
  execute<TData = unknown, TParams = Record<string, unknown>>(
    request: ConnectorExecutionRequest<TParams>
  ): Promise<ConnectorExecutionResult<TData>>;

  // Lifecycle
  connect(credentials?: ConnectorAuthCredentials): Promise<ConnectorHealthCheck>;
  disconnect(): Promise<void>;
}

/**
 * Custom Error Class for External Connector Invocations
 */
export class ConnectorError extends Error {
  readonly code: string;
  readonly statusCode?: number;
  readonly details?: unknown;
  readonly retryable: boolean;

  constructor(details: ConnectorErrorDetails) {
    super(details.message);
    this.name = 'ConnectorError';
    this.code = details.code;
    this.statusCode = details.statusCode;
    this.details = details.details;
    this.retryable = Boolean(details.retryable);
  }

  toJSON(): ConnectorErrorDetails {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      retryable: this.retryable,
    };
  }
}

/**
 * Base Modular Connector Implementation
 * Provides concrete authentication storage, state machine, pub/sub,
 * reachability verification, and protocol-level dispatching.
 */
export class BaseConnector implements Connector {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly categoryLabel: string;
  readonly vendor: string;
  readonly endpointUrl: string;
  readonly authType: AuthType;
  readonly capabilities: string[];
  readonly accentColor: string;
  readonly isEnterpriseWork?: boolean;
  readonly featured?: boolean;

  private status: ConnectorStatus = 'idle';
  private lastHealthCheck: ConnectorHealthCheck | null = null;
  private credentials: ConnectorAuthCredentials | null = null;
  private listeners = new Set<StatusChangeListener>();

  constructor(definition: SaaSConnector) {
    this.id = definition.id;
    this.name = definition.name;
    this.category = definition.category;
    this.categoryLabel = definition.categoryLabel;
    this.vendor = definition.vendor;
    this.endpointUrl = definition.endpointUrl || getConnectorEndpoint(definition);
    this.authType = (definition.authType as AuthType) || 'API Key';
    this.capabilities = [...definition.capabilities];
    this.accentColor = definition.accentColor || '#6366F1';
    this.isEnterpriseWork = definition.isEnterpriseWork;
    this.featured = definition.featured;

    // Load persisted state
    this.hydrateFromStorage();
  }

  private hydrateFromStorage(): void {
    const connectedIds = loadConnectedSaasIds();
    const configs = loadConnectorConfigs();
    const config = configs[this.id];

    if (config) {
      this.credentials = {
        apiKey: config.apiKey,
        token: config.apiKey,
        endpointUrl: config.endpointUrl,
        account: config.account,
        webhookUrl: config.webhookUrl,
      };
      if (connectedIds.includes(this.id)) {
        this.status = config.status === 'error' ? 'error' : 'connected';
      } else {
        this.status = 'idle';
      }
    } else if (connectedIds.includes(this.id)) {
      this.status = 'connected';
    }
  }

  getStatus(): ConnectorStatus {
    return this.status;
  }

  getLastHealthCheck(): ConnectorHealthCheck | null {
    return this.lastHealthCheck;
  }

  subscribe(listener: StatusChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  protected setStatus(status: ConnectorStatus, error?: ConnectorErrorDetails): void {
    this.status = status;
    this.listeners.forEach((listener) => {
      try {
        listener(status, this.lastHealthCheck, error);
      } catch (err) {
        console.error(`[Connector:${this.id}] Listener error:`, err);
      }
    });
  }

  setCredentials(credentials: ConnectorAuthCredentials): void {
    this.credentials = { ...this.credentials, ...credentials };
    const configs = loadConnectorConfigs();
    const current = configs[this.id] || {
      connectorId: this.id,
      isConnected: this.status === 'connected',
      connectedAt: new Date().toISOString(),
    };

    const updated: ConnectorConfig = {
      ...current,
      apiKey: credentials.apiKey || credentials.token || current.apiKey,
      endpointUrl: credentials.endpointUrl || current.endpointUrl || this.endpointUrl,
      webhookUrl: credentials.webhookUrl || current.webhookUrl,
      account: credentials.account || current.account || `${this.id}-live`,
    };

    saveConnectorConfig(updated);
  }

  getCredentials(): ConnectorAuthCredentials | null {
    return this.credentials;
  }

  clearCredentials(): void {
    this.credentials = null;
    const configs = loadConnectorConfigs();
    delete configs[this.id];
    try {
      localStorage.setItem('carol-ann.connector-configs.v1', JSON.stringify(configs));
    } catch {
      // ignore
    }
  }

  isAuthenticated(): boolean {
    if (this.authType === 'OAuth 2.0') {
      return Boolean(this.credentials?.token || this.credentials?.apiKey);
    }
    return Boolean(this.credentials?.apiKey || this.credentials?.token);
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.credentials?.apiKey || this.credentials?.token) {
      headers['Authorization'] = `Bearer ${this.credentials.apiKey || this.credentials.token}`;
    }
    if (this.credentials?.customHeaders) {
      Object.assign(headers, this.credentials.customHeaders);
    }
    return headers;
  }

  /**
   * Ping external service endpoint via cloud proxy to verify reachability,
   * SSL integrity, and protocol handshake.
   */
  async ping(): Promise<ConnectorHealthCheck> {
    const startTime = performance.now();
    const now = new Date().toISOString();
    const effectiveEndpoint = this.credentials?.endpointUrl || this.endpointUrl;

    try {
      this.setStatus('connecting');

      const response = await apiFetch('/api/connectors/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectorId: this.id,
          endpointUrl: effectiveEndpoint,
          apiKey: this.credentials?.apiKey || this.credentials?.token,
          capabilities: this.capabilities,
        }),
      });

      const latencyMs = Math.max(1, Math.round(performance.now() - startTime));

      if (!response.ok) {
        let errorMsg = `Endpoint unreachable (HTTP ${response.status})`;
        try {
          const errData = await response.json();
          if (errData.error?.message) errorMsg = errData.error.message;
          else if (errData.error) errorMsg = String(errData.error);
        } catch {
          // ignore json parse
        }

        const health: ConnectorHealthCheck = {
          healthy: false,
          latencyMs,
          status: response.status === 429 ? 'rate_limited' : 'error',
          httpStatus: response.status,
          message: errorMsg,
          checkedAt: now,
          capabilities: this.capabilities,
          endpointUrl: effectiveEndpoint,
          error: {
            code: `HTTP_${response.status}`,
            message: errorMsg,
            statusCode: response.status,
            retryable: response.status === 429 || response.status >= 500,
          },
        };

        this.lastHealthCheck = health;
        this.setStatus(health.status, health.error);
        return health;
      }

      const data = await response.json();

      if (!data.ok || data.status === 'error' || data.connected === false) {
        const errorMsg = data.error?.message || data.error || data.note || 'Connector verification failed';
        const health: ConnectorHealthCheck = {
          healthy: false,
          latencyMs: data.latencyMs || latencyMs,
          status: 'error',
          httpStatus: data.httpStatus || 502,
          message: errorMsg,
          checkedAt: now,
          capabilities: data.capabilities_ready || this.capabilities,
          endpointUrl: effectiveEndpoint,
          error: {
            code: data.error?.code || 'VERIFICATION_FAILED',
            message: errorMsg,
            statusCode: data.httpStatus || 502,
            retryable: true,
          },
        };

        this.lastHealthCheck = health;
        this.setStatus('error', health.error);
        return health;
      }

      const health: ConnectorHealthCheck = {
        healthy: Boolean(data.verified ?? true),
        latencyMs: data.latencyMs || latencyMs,
        status: 'connected',
        httpStatus: data.httpStatus || 200,
        message: data.note || 'Live connector verification complete. Protocol handshake active.',
        checkedAt: now,
        capabilities: data.capabilities_ready || this.capabilities,
        endpointUrl: effectiveEndpoint,
      };

      this.lastHealthCheck = health;
      this.setStatus('connected');
      return health;
    } catch (err: unknown) {
      const latencyMs = Math.max(1, Math.round(performance.now() - startTime));
      const message = err instanceof Error ? err.message : String(err);

      const health: ConnectorHealthCheck = {
        healthy: false,
        latencyMs,
        status: 'error',
        httpStatus: 503,
        message: `Connection failed: ${message}`,
        checkedAt: now,
        capabilities: this.capabilities,
        endpointUrl: effectiveEndpoint,
        error: {
          code: 'CONNECTION_FAILED',
          message,
          retryable: true,
        },
      };

      this.lastHealthCheck = health;
      this.setStatus('error', health.error);
      return health;
    }
  }

  /**
   * Execute an action on the external service with comprehensive error handling,
   * authentication headers, and audit receipt generation.
   */
  async execute<TData = unknown, TParams = Record<string, unknown>>(
    request: ConnectorExecutionRequest<TParams>
  ): Promise<ConnectorExecutionResult<TData>> {
    const startTime = performance.now();
    const now = new Date().toISOString();
    const effectiveEndpoint = this.credentials?.endpointUrl || this.endpointUrl;
    const receiptPrefix = `EXEC-${this.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)}`;
    const fallbackReceiptId = `${receiptPrefix}-${Date.now().toString().slice(-6)}`;

    if (!request.action) {
      throw new ConnectorError({
        code: 'INVALID_ACTION',
        message: 'Action parameter is required for external service execution.',
        statusCode: 400,
      });
    }

    try {
      const authHeaders = this.getAuthHeaders();
      const combinedHeaders = {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(request.headers || {}),
      };

      const response = await apiFetch('/api/connectors/execute', {
        method: 'POST',
        headers: combinedHeaders,
        body: JSON.stringify({
          connectorId: this.id,
          action: request.action,
          params: request.params || {},
          endpointUrl: effectiveEndpoint,
          apiKey: this.credentials?.apiKey || this.credentials?.token,
        }),
      });

      const latencyMs = Math.max(1, Math.round(performance.now() - startTime));

      if (!response.ok) {
        let errMessage = `External service call failed with HTTP ${response.status}`;
        let errCode = `HTTP_${response.status}`;
        try {
          const body = await response.json();
          if (body.error?.message) errMessage = body.error.message;
          else if (body.error) errMessage = String(body.error);
          if (body.error?.code) errCode = body.error.code;
        } catch {
          // ignore
        }

        const errorDetails: ConnectorErrorDetails = {
          code: errCode,
          message: errMessage,
          statusCode: response.status,
          retryable: response.status === 429 || response.status >= 500,
        };

        const result: ConnectorExecutionResult<TData> = {
          success: false,
          connectorId: this.id,
          action: request.action,
          receiptId: fallbackReceiptId,
          status: 'failed',
          error: errorDetails,
          latencyMs,
          httpStatus: response.status,
          timestamp: now,
          endpointUrl: effectiveEndpoint,
        };
        this.setStatus('error', errorDetails);
        return result;
      }

      const body = await response.json();

      if (!body.ok || body.status === 'failed' || body.result?.success === false) {
        const errorDetails: ConnectorErrorDetails = {
          code: body.error?.code || 'EXECUTION_FAILED',
          message: body.error?.message || body.result?.error || 'External call failed',
          statusCode: body.httpStatus || 500,
          retryable: false,
        };
        const result: ConnectorExecutionResult<TData> = {
          success: false,
          connectorId: this.id,
          action: request.action,
          receiptId: body.receiptId || fallbackReceiptId,
          status: 'failed',
          error: errorDetails,
          latencyMs: body.latencyMs || latencyMs,
          httpStatus: body.httpStatus || 500,
          timestamp: now,
          endpointUrl: effectiveEndpoint,
        };
        this.setStatus('error', errorDetails);
        return result;
      }

      return {
        success: true,
        connectorId: this.id,
        action: request.action,
        receiptId: body.receiptId || fallbackReceiptId,
        status: 'executed',
        data: (body.result?.data || body.result || body) as TData,
        latencyMs: body.latencyMs || latencyMs,
        httpStatus: 200,
        timestamp: now,
        endpointUrl: effectiveEndpoint,
      };
    } catch (err: unknown) {
      const latencyMs = Math.max(1, Math.round(performance.now() - startTime));
      const message = err instanceof Error ? err.message : String(err);
      const errorDetails: ConnectorErrorDetails = {
        code: 'NETWORK_ERROR',
        message: `Network error dispatching to ${this.id}: ${message}`,
        retryable: true,
      };

      const result: ConnectorExecutionResult<TData> = {
        success: false,
        connectorId: this.id,
        action: request.action,
        receiptId: fallbackReceiptId,
        status: 'failed',
        error: errorDetails,
        latencyMs,
        httpStatus: 503,
        timestamp: now,
        endpointUrl: effectiveEndpoint,
      };
      this.setStatus('error', errorDetails);
      return result;
    }
  }

  /**
   * Connect and activate this connector
   */
  async connect(credentials?: ConnectorAuthCredentials): Promise<ConnectorHealthCheck> {
    if (credentials) {
      this.setCredentials(credentials);
    }

    const health = await this.ping();
    const connectedIds = loadConnectedSaasIds();
    if (!connectedIds.includes(this.id)) {
      saveConnectedSaasIds([...connectedIds, this.id]);
    }

    const now = new Date().toISOString();
    const config: ConnectorConfig = {
      connectorId: this.id,
      isConnected: true,
      connectedAt: now,
      lastHandshakeAt: now,
      lastLatencyMs: health.latencyMs,
      endpointUrl: health.endpointUrl,
      apiKey: this.credentials?.apiKey || this.credentials?.token,
      account: this.credentials?.account || `${this.id}-live`,
      status: health.healthy ? 'connected' : 'error',
    };
    saveConnectorConfig(config);

    return health;
  }

  /**
   * Disconnect and deactivate this connector
   */
  async disconnect(): Promise<void> {
    const connectedIds = loadConnectedSaasIds();
    saveConnectedSaasIds(connectedIds.filter((id) => id !== this.id));

    const configs = loadConnectorConfigs();
    if (configs[this.id]) {
      configs[this.id].isConnected = false;
      configs[this.id].status = 'disconnected';
      saveConnectorConfig(configs[this.id]);
    }

    this.setStatus('disconnected');
  }
}

// ----------------------------------------------------------------------------
// Specialized Subclasses for Diverse Auth Architectures
// ----------------------------------------------------------------------------

export class OAuthConnector extends BaseConnector {
  getAuthUrl(redirectUri: string, state?: string): string {
    const base = this.endpointUrl.replace(/\/api.*$/, '');
    return `${base}/oauth/authorize?client_id=${encodeURIComponent(this.getCredentials()?.clientId || this.id)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${encodeURIComponent(state || 'carol_ann_state')}`;
  }

  override getAuthHeaders(): Record<string, string> {
    const headers = super.getAuthHeaders();
    const token = this.getCredentials()?.token || this.getCredentials()?.apiKey;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }
}

export class ApiKeyConnector extends BaseConnector {
  override getAuthHeaders(): Record<string, string> {
    const headers = super.getAuthHeaders();
    const key = this.getCredentials()?.apiKey || this.getCredentials()?.token;
    if (key) {
      headers['Authorization'] = `Bearer ${key}`;
      headers['X-API-Key'] = key;
    }
    return headers;
  }
}

export class EnterpriseConnector extends BaseConnector {
  readonly isEnterpriseWork = true;

  override getAuthHeaders(): Record<string, string> {
    const headers = super.getAuthHeaders();
    const creds = this.getCredentials();
    const token = creds?.apiKey || creds?.token;
    if (token) {
      headers['X-Enterprise-Token'] = token;
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }
}

export class WebhookConnector extends BaseConnector {
  getWebhookDestination(): string {
    return this.getCredentials()?.webhookUrl || `${this.endpointUrl}/webhooks/carol-ann`;
  }

  override getAuthHeaders(): Record<string, string> {
    const headers = super.getAuthHeaders();
    headers['X-Webhook-Delivery-Id'] = `dlv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    return headers;
  }
}

// ----------------------------------------------------------------------------
// Central Connector Registry Managing All 206 Integrations
// ----------------------------------------------------------------------------

export type RegistryEventListener = (event: {
  type: 'status_changed' | 'connected' | 'disconnected';
  connectorId: string;
  connector: Connector;
}) => void;

class CentralConnectorRegistry {
  private connectorMap = new Map<string, Connector>();
  private listeners = new Set<RegistryEventListener>();
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.initialized) return;

    for (const def of SAAS_CONNECTORS_DIRECTORY) {
      let instance: Connector;
      if (def.isEnterpriseWork) {
        instance = new EnterpriseConnector(def);
      } else if (def.authType === 'OAuth 2.0') {
        instance = new OAuthConnector(def);
      } else if (def.authType === 'Webhook') {
        instance = new WebhookConnector(def);
      } else {
        instance = new ApiKeyConnector(def);
      }

      // Bubble status changes to registry listeners
      instance.subscribe((status) => {
        this.emit({
          type: status === 'connected' ? 'connected' : status === 'disconnected' ? 'disconnected' : 'status_changed',
          connectorId: instance.id,
          connector: instance,
        });
      });

      this.connectorMap.set(def.id, instance);
    }

    this.initialized = true;
  }

  subscribe(listener: RegistryEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: { type: 'status_changed' | 'connected' | 'disconnected'; connectorId: string; connector: Connector }): void {
    this.listeners.forEach((l) => {
      try {
        l(event);
      } catch (err) {
        console.error('[Registry Event Error]', err);
      }
    });
  }

  getConnector(id: string): Connector | undefined {
    return this.connectorMap.get(id);
  }

  getAllConnectors(): Connector[] {
    return Array.from(this.connectorMap.values());
  }

  getConnectedConnectors(): Connector[] {
    const connectedIds = new Set(loadConnectedSaasIds());
    return this.getAllConnectors().filter((c) => connectedIds.has(c.id));
  }

  getConnectorsByCategory(category: string): Connector[] {
    return this.getAllConnectors().filter((c) => c.category === category);
  }

  async connect(id: string, credentials?: ConnectorAuthCredentials): Promise<ConnectorHealthCheck> {
    const connector = this.getConnector(id);
    if (!connector) {
      throw new ConnectorError({
        code: 'CONNECTOR_NOT_FOUND',
        message: `Connector "${id}" is not registered in the directory.`,
        statusCode: 404,
      });
    }
    return connector.connect(credentials);
  }

  async disconnect(id: string): Promise<void> {
    const connector = this.getConnector(id);
    if (!connector) return;
    await connector.disconnect();
  }

  /**
   * Batch ping all connected tools to monitor ecosystem health
   */
  async pingAllConnected(): Promise<Record<string, ConnectorHealthCheck>> {
    const connected = this.getConnectedConnectors();
    const results: Record<string, ConnectorHealthCheck> = {};

    await Promise.all(
      connected.map(async (conn) => {
        try {
          results[conn.id] = await conn.ping();
        } catch (err) {
          results[conn.id] = {
            healthy: false,
            latencyMs: 0,
            status: 'error',
            message: err instanceof Error ? err.message : String(err),
            checkedAt: new Date().toISOString(),
            endpointUrl: conn.endpointUrl,
            error: {
              code: 'BATCH_PING_FAILED',
              message: err instanceof Error ? err.message : String(err),
              retryable: true,
            },
          };
        }
      })
    );

    return results;
  }
}

export const connectorRegistry = new CentralConnectorRegistry();

// ----------------------------------------------------------------------------
// React Hooks for Clean UI Integration & Status Tracking
// ----------------------------------------------------------------------------

export function useConnector(connectorId: string | null | undefined) {
  const [connector, setConnector] = useState<Connector | null>(() =>
    connectorId ? connectorRegistry.getConnector(connectorId) || null : null
  );
  const [status, setStatus] = useState<ConnectorStatus>(() =>
    connector ? connector.getStatus() : 'idle'
  );
  const [health, setHealth] = useState<ConnectorHealthCheck | null>(() =>
    connector ? connector.getLastHealthCheck() : null
  );
  const [error, setError] = useState<ConnectorErrorDetails | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connectorId) {
      setConnector(null);
      setStatus('idle');
      setHealth(null);
      setError(undefined);
      return;
    }

    const conn = connectorRegistry.getConnector(connectorId);
    setConnector(conn || null);
    if (!conn) return;

    setStatus(conn.getStatus());
    setHealth(conn.getLastHealthCheck());

    const unsubscribe = conn.subscribe((newStatus, newHealth, newError) => {
      setStatus(newStatus);
      if (newHealth) setHealth(newHealth);
      setError(newError);
    });

    return unsubscribe;
  }, [connectorId]);

  const ping = useCallback(async () => {
    if (!connector) throw new Error('Connector not found');
    setLoading(true);
    try {
      return await connector.ping();
    } finally {
      setLoading(false);
    }
  }, [connector]);

  const execute = useCallback(
    async <TData = unknown, TParams = Record<string, unknown>>(
      req: ConnectorExecutionRequest<TParams>
    ) => {
      if (!connector) throw new Error('Connector not found');
      setLoading(true);
      try {
        return await connector.execute<TData, TParams>(req);
      } finally {
        setLoading(false);
      }
    },
    [connector]
  );

  const connect = useCallback(
    async (creds?: ConnectorAuthCredentials) => {
      if (!connector) throw new Error('Connector not found');
      setLoading(true);
      try {
        return await connector.connect(creds);
      } finally {
        setLoading(false);
      }
    },
    [connector]
  );

  const disconnect = useCallback(async () => {
    if (!connector) return;
    setLoading(true);
    try {
      await connector.disconnect();
    } finally {
      setLoading(false);
    }
  }, [connector]);

  return {
    connector,
    status,
    health,
    error,
    loading,
    ping,
    execute,
    connect,
    disconnect,
  };
}

export function useConnectorRegistry() {
  const [connectedCount, setConnectedCount] = useState<number>(
    () => connectorRegistry.getConnectedConnectors().length
  );

  useEffect(() => {
    const unsub = connectorRegistry.subscribe(() => {
      setConnectedCount(connectorRegistry.getConnectedConnectors().length);
    });
    return unsub;
  }, []);

  return {
    registry: connectorRegistry,
    allConnectors: connectorRegistry.getAllConnectors(),
    connectedCount,
    totalCount: SAAS_CONNECTORS_DIRECTORY.length,
  };
}
