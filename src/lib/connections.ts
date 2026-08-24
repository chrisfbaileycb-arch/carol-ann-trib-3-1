/**
 * Device-local registry for the Connections hub: MCP servers, API keys,
 * connectors (GitHub, Zapier, …) and saved artifacts.
 * Nothing here ever leaves the browser — keys are stored in localStorage and
 * the operator can reveal, rotate or delete any of them.
 */

export interface McpServer {
  id: string;
  name: string;
  url: string;
  transport: 'sse' | 'stdio' | 'http';
  /** Comma-free list of tool names this server exposes. */
  tools: string[];
  enabled: boolean;
}

export interface ApiKeyRecord {
  id: string;
  label: string;
  service: string;
  value: string;
  createdAt: string;
}

export interface ConnectorDef {
  key: string;
  name: string;
  blurb: string;
  scopes: string[];
  accent: string;
}

export interface ConnectorState {
  key: string;
  connected: boolean;
  account: string;
  connectedAt: string | null;
}

export interface Artifact {
  id: string;
  title: string;
  kind: 'note' | 'snippet' | 'plan' | 'doc';
  body: string;
  createdAt: string;
}

const MCP_KEY = 'maggie.mcp.v1';
const KEYS_KEY = 'maggie.apikeys.v1';
const CONN_KEY = 'maggie.connectors.v1';
const ART_KEY = 'maggie.artifacts.v1';

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, v: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* best effort */ }
};

/** Connectors offered out of the box. */
export const CONNECTORS: ConnectorDef[] = [
  { key: 'github', name: 'GitHub', blurb: 'Repos, issues and pull requests for the coding agent.', scopes: ['repo', 'read:user'], accent: '#8B949E' },
  { key: 'zapier', name: 'Zapier', blurb: 'Fire any of 7,000+ Zaps from an agent step.', scopes: ['zap:write'], accent: '#FF4F00' },
  { key: 'google-calendar', name: 'Google Calendar', blurb: 'Read availability, hold slots for appointment agents.', scopes: ['calendar.events'], accent: '#4285F4' },
  { key: 'slack', name: 'Slack', blurb: 'Post agent digests into a private channel.', scopes: ['chat:write'], accent: '#611F69' },
  { key: 'notion', name: 'Notion', blurb: 'Write artifacts straight into a workspace database.', scopes: ['databases.write'], accent: '#E6E6E6' },
  { key: 'gmail', name: 'Gmail', blurb: 'Draft (never send) confirmation emails for bookings.', scopes: ['gmail.compose'], accent: '#EA4335' },
  { key: 'stripe', name: 'Stripe', blurb: 'Read payouts and subscriptions for the finance agent.', scopes: ['read_only'], accent: '#635BFF' },
  { key: 'twilio', name: 'Twilio', blurb: 'Text yourself a reminder when a schedule fires.', scopes: ['sms:send'], accent: '#F22F46' },
];

export const DEFAULT_MCPS: McpServer[] = [
  { id: 'mcp_filesystem', name: 'Filesystem', url: 'stdio://mcp-server-filesystem', transport: 'stdio', tools: ['read_file', 'write_file', 'list_dir'], enabled: true },
  { id: 'mcp_browser', name: 'Browser sandbox', url: 'https://mcp.local/browser', transport: 'sse', tools: ['navigate', 'click', 'extract'], enabled: true },
  { id: 'mcp_memory', name: 'Agent memory', url: 'https://mcp.local/memory', transport: 'http', tools: ['recall', 'store'], enabled: false },
];

/* ------------------------------- MCP servers ------------------------------- */
export const loadMcps = (): McpServer[] => {
  const stored = read<McpServer[] | null>(MCP_KEY, null);
  return stored && stored.length ? stored : DEFAULT_MCPS;
};
export const saveMcps = (rows: McpServer[]) => write(MCP_KEY, rows);
export const blankMcp = (): McpServer => ({
  id: uid('mcp'), name: '', url: '', transport: 'sse', tools: [], enabled: true,
});

/* -------------------------------- API keys -------------------------------- */
export const loadKeys = (): ApiKeyRecord[] => read<ApiKeyRecord[]>(KEYS_KEY, []);
export const saveKeys = (rows: ApiKeyRecord[]) => write(KEYS_KEY, rows);
export const addKey = (label: string, service: string, value: string): ApiKeyRecord[] => {
  const rows = [
    { id: uid('key'), label: label.trim() || service, service: service.trim(), value: value.trim(), createdAt: new Date().toISOString() },
    ...loadKeys(),
  ];
  saveKeys(rows);
  return rows;
};
export const maskKey = (v: string) => (v.length <= 8 ? '••••••' : `${v.slice(0, 4)}••••••${v.slice(-4)}`);

/* ------------------------------- Connectors -------------------------------- */
export const loadConnectors = (): ConnectorState[] => {
  const stored = read<ConnectorState[]>(CONN_KEY, []);
  const byKey = new Map(stored.map((c) => [c.key, c]));
  return CONNECTORS.map((c) => byKey.get(c.key) ?? { key: c.key, connected: false, account: '', connectedAt: null });
};
export const saveConnectors = (rows: ConnectorState[]) => write(CONN_KEY, rows);

/* -------------------------------- Artifacts -------------------------------- */
export const loadArtifacts = (): Artifact[] => read<Artifact[]>(ART_KEY, []);
export const saveArtifacts = (rows: Artifact[]) => write(ART_KEY, rows);
export const addArtifact = (title: string, kind: Artifact['kind'], body: string): Artifact[] => {
  const rows = [{ id: uid('art'), title: title.trim() || 'Untitled artifact', kind, body, createdAt: new Date().toISOString() }, ...loadArtifacts()];
  saveArtifacts(rows);
  return rows;
};
