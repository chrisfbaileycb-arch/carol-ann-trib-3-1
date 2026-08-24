import { AGENT_PRESETS, toneByKey, voiceByKey, type AgentCategory, type AgentSkin } from '@/data/agents';

/**
 * Device-local store for the Agent Studio.
 * Every agent has an isolated workflow memory keyed by its own id — subjects never mix.
 * Everything here is the operator's to clear or delete (see AGENT_DISCLAIMER).
 */

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  subject: string;
  category: AgentCategory;
  blurb: string;
  starters: string[];
  skin: AgentSkin;
  caution?: string;
  toneKey: string;
  /** Extra personality instructions typed by the operator. */
  toneNote: string;
  voiceKey: string;
  custom: boolean;
  disclaimerAccepted: boolean;
  enabled: boolean;
  createdAt: string;
}

export interface AgentMemoryEntry {
  id: string;
  agentId: string;
  content: string;
  createdAt: string;
}

export interface AgentMessage {
  id: string;
  agentId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

const AGENTS_KEY = 'maggie.agents.v1';
const MEM_KEY = 'maggie.agents.memory.v1';
const THREAD_KEY = 'maggie.agents.threads.v1';
const AI_KEY = 'maggie.ai.settings.v1';

export const newId = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

/** Auto-detected IANA time zone for the current device. */
export const detectTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

/** Current UTC offset label, e.g. "GMT-5". */
export const timeZoneLabel = (): string => {
  const offset = -new Date().getTimezoneOffset() / 60;
  const sign = offset >= 0 ? '+' : '−';
  return `GMT${sign}${Math.abs(offset) % 1 === 0 ? Math.abs(offset) : Math.abs(offset).toFixed(1)}`;
};

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — stay silent, this layer is best-effort */
  }
};

const fromPreset = (id: string): AgentConfig | null => {
  const p = AGENT_PRESETS.find((a) => a.id === id);
  if (!p) return null;
  return {
    ...p,
    toneKey: p.category === 'work' ? 'teacher' : p.category === 'wellness' ? 'hype' : 'friendly',
    toneNote: '',
    voiceKey: 'female-warm',
    custom: false,
    disclaimerAccepted: false,
    enabled: true,
    createdAt: new Date().toISOString(),
  };
};

/** All agents: presets (with any operator edits applied) plus custom ones. */
export const loadAgents = (): AgentConfig[] => {
  const stored = read<AgentConfig[]>(AGENTS_KEY, []);
  const byId = new Map(stored.map((a) => [a.id, a]));
  const presets = AGENT_PRESETS.map((p) => {
    const saved = byId.get(p.id);
    byId.delete(p.id);
    const base = fromPreset(p.id)!;
    return saved ? { ...base, ...saved, skin: saved.skin ?? base.skin, custom: false } : base;
  });
  const customs = [...byId.values()].filter((a) => a.custom !== false);
  return [...presets, ...customs];
};

export const saveAgents = (agents: AgentConfig[]) => write(AGENTS_KEY, agents);

export const blankAgent = (): AgentConfig => ({
  id: newId('agent'),
  name: '',
  role: '',
  subject: '',
  category: 'custom',
  blurb: '',
  starters: [],
  skin: { body: ['#A78BFA', '#22D3EE'], hat: '#0F172A', prop: 'hat' },
  toneKey: 'friendly',
  toneNote: '',
  voiceKey: 'female-warm',
  custom: true,
  disclaimerAccepted: false,
  enabled: true,
  createdAt: new Date().toISOString(),
});

/* ---------------- per-agent workflow memory (isolated by agent id) ------------- */

export const loadMemory = (agentId: string): AgentMemoryEntry[] =>
  read<AgentMemoryEntry[]>(MEM_KEY, []).filter((m) => m.agentId === agentId);

export const addMemory = (agentId: string, content: string): AgentMemoryEntry[] => {
  const all = read<AgentMemoryEntry[]>(MEM_KEY, []);
  const entry: AgentMemoryEntry = { id: newId('am'), agentId, content: content.trim(), createdAt: new Date().toISOString() };
  const next = [entry, ...all].slice(0, 500);
  write(MEM_KEY, next);
  return next.filter((m) => m.agentId === agentId);
};

export const removeMemory = (agentId: string, id: string): AgentMemoryEntry[] => {
  const next = read<AgentMemoryEntry[]>(MEM_KEY, []).filter((m) => m.id !== id);
  write(MEM_KEY, next);
  return next.filter((m) => m.agentId === agentId);
};

export const clearMemory = (agentId: string): AgentMemoryEntry[] => {
  const next = read<AgentMemoryEntry[]>(MEM_KEY, []).filter((m) => m.agentId !== agentId);
  write(MEM_KEY, next);
  return [];
};

/* ---------------- per-agent chat thread ------------- */

export const loadThread = (agentId: string): AgentMessage[] =>
  read<AgentMessage[]>(THREAD_KEY, []).filter((m) => m.agentId === agentId);

export const appendThread = (agentId: string, role: 'user' | 'assistant', content: string): AgentMessage[] => {
  const all = read<AgentMessage[]>(THREAD_KEY, []);
  const msg: AgentMessage = { id: newId('at'), agentId, role, content, createdAt: new Date().toISOString() };
  const next = [...all, msg].slice(-400);
  write(THREAD_KEY, next);
  return next.filter((m) => m.agentId === agentId);
};

export const clearThread = (agentId: string): AgentMessage[] => {
  const next = read<AgentMessage[]>(THREAD_KEY, []).filter((m) => m.agentId !== agentId);
  write(THREAD_KEY, next);
  return [];
};

/** Full wipe of one agent's footprint (used by "Delete agent"). */
export const purgeAgent = (agentId: string) => {
  write(MEM_KEY, read<AgentMemoryEntry[]>(MEM_KEY, []).filter((m) => m.agentId !== agentId));
  write(THREAD_KEY, read<AgentMessage[]>(THREAD_KEY, []).filter((m) => m.agentId !== agentId));
};

/* ---------------- global AI settings (left rail of the hub) ------------- */

export interface AISettings {
  model: string;
  creativity: number;
  replyLength: 'short' | 'balanced' | 'deep';
  useMemory: boolean;
  speakReplies: boolean;
  autoTimeZone: boolean;
  timeZone: string;
  sandboxOpen: boolean;
  confirmBeforeSubmit: boolean;
  /** Bright white + sage canvas with purple lining (welcome default). */
  brightCanvas: boolean;
}

export const MODEL_OPTIONS = [
  { key: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash', hint: 'balanced default' },
  { key: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', hint: 'deep reasoning' },
  { key: 'gpt-5.4-mini', label: 'GPT-5.4 mini', hint: 'fast + capable' },
  { key: 'anthropic/claude-sonnet-4.6', label: 'Claude Sonnet 4.6', hint: 'long form' },
];

export const defaultAISettings = (): AISettings => ({
  model: MODEL_OPTIONS[0].key,
  creativity: 0.7,
  replyLength: 'balanced',
  useMemory: true,
  speakReplies: false,
  autoTimeZone: true,
  timeZone: detectTimeZone(),
  sandboxOpen: true,
  confirmBeforeSubmit: true,
  brightCanvas: true,
});

/** Push (or remove) the bright canvas class on the document root. */
export const applyBrightCanvas = (on: boolean) => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('m-bright', on);
};


export const loadAISettings = (): AISettings => {
  const s = read<Partial<AISettings>>(AI_KEY, {});
  const base = defaultAISettings();
  const merged = { ...base, ...s };
  // Auto time zone always re-detects on load so travel is handled silently.
  if (merged.autoTimeZone) merged.timeZone = detectTimeZone();
  return merged;
};

export const saveAISettings = (s: AISettings) => write(AI_KEY, s);

/** Build the system-side context string for one agent (memory stays scoped). */
export const buildAgentContext = (agent: AgentConfig, memory: AgentMemoryEntry[]): string =>
  memory.slice(0, 12).map((m) => `- ${m.content}`).join('\n') || '';

/** Speak a reply using the agent's configured voice. */
export const speak = (text: string, voiceKey: string) => {
  const v = voiceByKey(voiceKey);
  if (v.key === 'silent' || typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    const u = new SpeechSynthesisUtterance(text.slice(0, 480));
    const voices = window.speechSynthesis.getVoices();
    const hit = voices.find((sv) => v.match.some((m) => sv.name.toLowerCase().includes(m)));
    if (hit) u.voice = hit;
    u.pitch = v.pitch;
    u.rate = v.rate;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* speech unsupported — silent fallback */
  }
};

export const tonePromptFor = (agent: AgentConfig): string =>
  [toneByKey(agent.toneKey).prompt, agent.toneNote.trim()].filter(Boolean).join(' ');
