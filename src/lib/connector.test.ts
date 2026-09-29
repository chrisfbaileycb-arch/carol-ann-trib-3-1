import { describe, it, expect, vi, beforeEach } from 'vitest';

const store = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => store.set(k, String(v)),
  removeItem: (k: string) => store.delete(k),
  clear: () => store.clear(),
  get length() {
    return store.size;
  },
  key: (i: number) => Array.from(store.keys())[i] ?? null,
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

import {
  BaseConnector,
  ApiKeyConnector,
  OAuthConnector,
  EnterpriseConnector,
  WebhookConnector,
  ConnectorError,
  connectorRegistry,
  type ConnectorStatus,
} from './connector';
import type { SaaSConnector } from '@/data/saasConnectors';

const mockApiFetch = vi.fn();
vi.mock('@/lib/apiClient', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

const sampleDef: SaaSConnector = {
  id: 'test-service',
  name: 'Test Service',
  category: 'crm_sales',
  categoryLabel: 'CRM & Sales',
  description: 'Test service description',
  vendor: 'Test Corp',
  accentColor: '#4F46E5',
  authType: 'API Key',
  capabilities: ['read_contacts', 'write_contacts'],
  endpointUrl: 'https://api.testservice.com/v1',
};

describe('Modular Connector Interface & Implementations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('BaseConnector lifecycle, authentication & status tracking', () => {
    it('initializes with metadata and idle status', () => {
      const conn = new BaseConnector(sampleDef);
      expect(conn.id).toBe('test-service');
      expect(conn.name).toBe('Test Service');
      expect(conn.category).toBe('crm_sales');
      expect(conn.authType).toBe('API Key');
      expect(conn.getStatus()).toBe('idle');
      expect(conn.isAuthenticated()).toBe(false);
      expect(conn.getLastHealthCheck()).toBeNull();
    });

    it('manages authentication credentials and headers', () => {
      const conn = new BaseConnector(sampleDef);
      conn.setCredentials({ apiKey: 'secret-key-123', account: 'test-account' });

      expect(conn.isAuthenticated()).toBe(true);
      expect(conn.getCredentials()?.apiKey).toBe('secret-key-123');
      expect(conn.getCredentials()?.account).toBe('test-account');
      expect(conn.getAuthHeaders()).toEqual({
        Authorization: 'Bearer secret-key-123',
      });

      conn.clearCredentials();
      expect(conn.isAuthenticated()).toBe(false);
      expect(conn.getCredentials()).toBeNull();
    });

    it('supports reactive status subscriptions', () => {
      const conn = new BaseConnector(sampleDef);
      const listener = vi.fn();
      const unsub = conn.subscribe(listener);

      // Trigger ping failure to observe status change
      mockApiFetch.mockRejectedValueOnce(new Error('Connection timeout'));

      return conn.ping().then((health) => {
        expect(health.healthy).toBe(false);
        expect(health.status).toBe('error');
        expect(listener).toHaveBeenCalledWith('connecting', null, undefined);
        expect(listener).toHaveBeenCalledWith(
          'error',
          health,
          expect.objectContaining({ code: 'CONNECTION_FAILED' })
        );

        unsub();
        listener.mockClear();
        conn.setCredentials({ apiKey: 'key' });
        expect(listener).not.toHaveBeenCalled();
      });
    });

    it('performs successful health check ping', async () => {
      const conn = new BaseConnector(sampleDef);
      mockApiFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          connected: true,
          verified: true,
          latencyMs: 42,
          httpStatus: 200,
          note: 'Handshake active',
        }),
      });

      const health = await conn.ping();
      expect(health.healthy).toBe(true);
      expect(health.status).toBe('connected');
      expect(health.latencyMs).toBe(42);
      expect(conn.getStatus()).toBe('connected');
    });

    it('handles HTTP error during ping without faking success', async () => {
      const conn = new BaseConnector(sampleDef);
      mockApiFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Invalid API key credentials' }),
      });

      const health = await conn.ping();
      expect(health.healthy).toBe(false);
      expect(health.status).toBe('error');
      expect(health.httpStatus).toBe(403);
      expect(health.error?.code).toBe('HTTP_403');
      expect(health.error?.message).toBe('Invalid API key credentials');
      expect(conn.getStatus()).toBe('error');
    });

    it('executes external service action with proper payload and receipt', async () => {
      const conn = new BaseConnector(sampleDef);
      mockApiFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          status: 'executed',
          receiptId: 'EXEC-TEST-998877',
          latencyMs: 55,
          result: {
            success: true,
            data: { contactId: 'c_123', status: 'created' },
          },
        }),
      });

      const result = await conn.execute({
        action: 'write_contacts',
        params: { name: 'Alice Smith', email: 'alice@example.com' },
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('executed');
      expect(result.receiptId).toBe('EXEC-TEST-998877');
      expect(result.data).toEqual({ contactId: 'c_123', status: 'created' });
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/connectors/execute',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"action":"write_contacts"'),
        })
      );
    });

    it('accurately reports external execution failures with error details', async () => {
      const conn = new BaseConnector(sampleDef);
      mockApiFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
        }),
      });

      const result = await conn.execute({ action: 'read_contacts' });
      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.httpStatus).toBe(429);
      expect(result.error?.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.error?.retryable).toBe(true);
      expect(conn.getStatus()).toBe('error');
    });

    it('throws ConnectorError when action is missing', async () => {
      const conn = new BaseConnector(sampleDef);
      await expect(conn.execute({ action: '' })).rejects.toThrow(ConnectorError);
    });

    it('connects and disconnects managing persistent state', async () => {
      const conn = new BaseConnector(sampleDef);
      mockApiFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, connected: true, verified: true }),
      });

      const health = await conn.connect({ apiKey: 'my-token' });
      expect(health.healthy).toBe(true);
      expect(conn.getStatus()).toBe('connected');

      await conn.disconnect();
      expect(conn.getStatus()).toBe('disconnected');
    });
  });

  describe('Specialized Connector Subclasses', () => {
    it('ApiKeyConnector attaches API key to Authorization and X-API-Key', () => {
      const conn = new ApiKeyConnector(sampleDef);
      conn.setCredentials({ apiKey: 'live_test_api_key' });
      const headers = conn.getAuthHeaders();
      expect(headers['Authorization']).toBe('Bearer live_test_api_key');
      expect(headers['X-API-Key']).toBe('live_test_api_key');
    });

    it('OAuthConnector constructs authorization URL and attaches bearer token', () => {
      const oauthDef: SaaSConnector = {
        ...sampleDef,
        id: 'hubspot-oauth',
        authType: 'OAuth 2.0',
        endpointUrl: 'https://api.hubapi.com/crm/v3',
      };
      const conn = new OAuthConnector(oauthDef);
      conn.setCredentials({ clientId: 'my-hubspot-client-id', token: 'oauth-token-xyz' });

      const authUrl = conn.getAuthUrl('https://app.local/oauth/callback', 'state-123');
      expect(authUrl).toContain('client_id=my-hubspot-client-id');
      expect(authUrl).toContain('redirect_uri=https%3A%2F%2Fapp.local%2Foauth%2Fcallback');
      expect(authUrl).toContain('state=state-123');

      const headers = conn.getAuthHeaders();
      expect(headers['Authorization']).toBe('Bearer oauth-token-xyz');
    });

    it('EnterpriseConnector sets isEnterpriseWork and custom enterprise token', () => {
      const entDef: SaaSConnector = {
        ...sampleDef,
        id: 'sap-erp',
        isEnterpriseWork: true,
        authType: 'Enterprise SSO',
      };
      const conn = new EnterpriseConnector(entDef);
      expect(conn.isEnterpriseWork).toBe(true);
      conn.setCredentials({ apiKey: 'sso-saml-token' });
      const headers = conn.getAuthHeaders();
      expect(headers['X-Enterprise-Token']).toBe('sso-saml-token');
    });

    it('WebhookConnector manages webhook destination and delivery headers', () => {
      const hookDef: SaaSConnector = {
        ...sampleDef,
        id: 'custom-webhook',
        authType: 'Webhook',
      };
      const conn = new WebhookConnector(hookDef);
      conn.setCredentials({ webhookUrl: 'https://webhook.site/abc' });
      expect(conn.getWebhookDestination()).toBe('https://webhook.site/abc');
      const headers = conn.getAuthHeaders();
      expect(headers['X-Webhook-Delivery-Id']).toMatch(/^dlv_\d+_/);
    });
  });

  describe('CentralConnectorRegistry managing 206 connectors', () => {
    it('initializes all 206 connectors', () => {
      const all = connectorRegistry.getAllConnectors();
      expect(all.length).toBe(206);
    });

    it('retrieves connectors by ID and category', () => {
      const github = connectorRegistry.getConnector('github');
      expect(github).toBeDefined();
      expect(github?.name).toBe('GitHub');

      const crmConnectors = connectorRegistry.getConnectorsByCategory('crm_sales');
      expect(crmConnectors.length).toBeGreaterThan(0);
      expect(crmConnectors.every((c) => c.category === 'crm_sales')).toBe(true);
    });

    it('notifies registry subscribers when connector status changes', () => {
      const listener = vi.fn();
      const unsub = connectorRegistry.subscribe(listener);

      const conn = connectorRegistry.getConnector('salesforce');
      expect(conn).toBeDefined();

      mockApiFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, connected: true, verified: true }),
      });

      return conn!.connect().then(() => {
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            connectorId: 'salesforce',
          })
        );
        unsub();
      });
    });
  });
});
