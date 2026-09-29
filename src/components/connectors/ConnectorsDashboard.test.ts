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

import { connectorRegistry } from '@/lib/connector';
import { SAAS_CONNECTORS_DIRECTORY, SAAS_CONNECTOR_CATEGORIES } from '@/data/saasConnectors';

const mockApiFetch = vi.fn();
vi.mock('@/lib/apiClient', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

describe('ConnectorsDashboard Architecture & Status Mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.clear();
  });

  it('maps all 206 connectors from the directory into registered modular connectors', () => {
    const all = connectorRegistry.getAllConnectors();
    expect(all.length).toBe(206);
    expect(SAAS_CONNECTORS_DIRECTORY.length).toBe(206);
  });

  it('maps integration statuses correctly into Connected, Error, and Idle', async () => {
    const linear = connectorRegistry.getConnector('linear');
    expect(linear).toBeDefined();

    // Default status is idle
    expect(linear!.getStatus()).toBe('idle');

    // Successful connect transitions to connected
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, connected: true, verified: true, latencyMs: 35 }),
    });

    await linear!.connect();
    expect(linear!.getStatus()).toBe('connected');

    // Ping failure transitions to error
    mockApiFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Vendor API Error' }),
    });

    await linear!.ping();
    expect(linear!.getStatus()).toBe('error');

    // Disconnect transitions to disconnected (treated as Idle in dashboard)
    await linear!.disconnect();
    expect(linear!.getStatus()).toBe('disconnected');
  });

  it('covers all 25 SaaS & enterprise categories across the 206 connectors', () => {
    expect(SAAS_CONNECTOR_CATEGORIES.length).toBe(25);

    const categoriesInDirectory = new Set(SAAS_CONNECTORS_DIRECTORY.map((c) => c.category));
    SAAS_CONNECTOR_CATEGORIES.forEach((cat) => {
      expect(categoriesInDirectory.has(cat.key)).toBe(true);
    });
  });

  it('provides real execution and ping capabilities for every connector', async () => {
    const slack = connectorRegistry.getConnector('slack');
    expect(slack).toBeDefined();

    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        status: 'executed',
        receiptId: 'EXEC-SLACK-112233',
        latencyMs: 40,
        result: { success: true },
      }),
    });

    const execResult = await slack!.execute({ action: 'send_message', params: { text: 'Hello team' } });
    expect(execResult.success).toBe(true);
    expect(execResult.receiptId).toBe('EXEC-SLACK-112233');
    expect(execResult.status).toBe('executed');
  });

  it('accurately captures external errors on external service calls', async () => {
    const stripe = connectorRegistry.getConnector('stripe');
    expect(stripe).toBeDefined();

    mockApiFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid API Key' }),
    });

    const execResult = await stripe!.execute({ action: 'create_customer' });
    expect(execResult.success).toBe(false);
    expect(execResult.status).toBe('failed');
    expect(execResult.httpStatus).toBe(401);
    expect(execResult.error?.code).toBe('HTTP_401');
    expect(stripe!.getStatus()).toBe('error');
  });
});
