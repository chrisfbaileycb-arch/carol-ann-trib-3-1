import type {
  UserProfile,
  MyDaySession,
  CheckInRecord,
  MemoryEntry,
  ConversationMessage,
  ErrandTask,
  SavedMessage,
  FeedbackEntry,
  StickerWatermark,
  HydrateFormAction,
} from '@/data/schemas';
import { DEFAULT_PROFILE } from '@/data/intake';

const NS = 'carol_ann_v1';

export const KEYS = {
  profile: `${NS}_profile`,
  sessions: `${NS}_sessions`,
  checkIns: `${NS}_checkins`,
  memories: `${NS}_memories`,
  messages: `${NS}_messages`,
  errands: `${NS}_errands`,
  saved: `${NS}_saved`,
  feedback: `${NS}_feedback`,
  canvas: `${NS}_canvas`,
  skills: `${NS}_skills`,
  stickers: `${NS}_stickers`,
  scratchpad: `${NS}_scratchpad`,
  actions: `${NS}_actions`,
  device: `${NS}_device_key`,
};

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* browser storage cache fallback */
  }
}

import { getFirebaseAuthToken } from './firebase';

// Cloud State Synchronization Helpers
export async function fetchCloudState(userId = 'default'): Promise<Record<string, unknown> | null> {
  try {
    const token = await getFirebaseAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`/api/cloud/state?userId=${encodeURIComponent(userId)}`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.state as Record<string, unknown>) || null;
  } catch {
    return null;
  }
}

export async function sendCloudSync(state: Record<string, unknown>, userId = 'default'): Promise<boolean> {
  try {
    const token = await getFirebaseAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch('/api/cloud/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, state }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const getDeviceKey = (): string => {
  let k = '';
  try {
    k = localStorage.getItem(KEYS.device) ?? '';
  } catch {
    k = '';
  }
  if (!k) {
    k = uid('device');
    write(KEYS.device, k);
    try {
      localStorage.setItem(KEYS.device, k);
    } catch {
      /* noop */
    }
  }
  return k.replace(/"/g, '');
};

// --- Seed data (Strictly empty defaults - no fabricated identity or content) ---

export const SEED_MEMORIES: MemoryEntry[] = [];

export const SEED_CHECKINS: CheckInRecord[] = [];

export const SEED_MESSAGES: ConversationMessage[] = [];

export const SEED_ERRANDS: ErrandTask[] = [];

export const isFakeMemory = (m: Partial<MemoryEntry>): boolean => {
  if (!m || typeof m !== 'object') return true;
  const content = (m.content || '').toLowerCase();
  const tags = Array.isArray(m.tags) ? m.tags.join(' ').toLowerCase() : '';
  const id = (m.id || '').toLowerCase();
  return (
    id.includes('seed') ||
    id.includes('fake') ||
    content.includes('volleyball') ||
    content.includes('whey') ||
    (content.includes('protein') && (content.includes('powder') || content.includes('shake') || content.includes('isolate') || content.includes('bar'))) ||
    tags.includes('volleyball') ||
    tags.includes('whey')
  );
};

export const isFakeMessage = (m: Partial<ConversationMessage>): boolean => {
  if (!m || typeof m !== 'object') return true;
  const id = (m.id || '').toLowerCase();
  const content = (m.content || '').toLowerCase();
  return (
    id.includes('seed') ||
    id.includes('fake') ||
    id.startsWith('msg_seed') ||
    id.startsWith('seed_') ||
    content.includes('carol ann orchestrator online') ||
    content.includes('fabricated') ||
    id === 'msg_init_1' ||
    id === 'msg_init_2' ||
    id === 'msg_seed_1' ||
    id === 'msg_seed_2' ||
    id === 'msg_welcome'
  );
};

// --- Typed accessors ---------------------------------------------------------

export const loadProfile = (): UserProfile => read<UserProfile>(KEYS.profile, DEFAULT_PROFILE);
export const saveProfile = (p: UserProfile) => write(KEYS.profile, p);

export const loadSessions = (): MyDaySession[] => read<MyDaySession[]>(KEYS.sessions, []);
export const saveSessions = (s: MyDaySession[]) => write(KEYS.sessions, s);

export const loadCheckIns = (): CheckInRecord[] => read<CheckInRecord[]>(KEYS.checkIns, SEED_CHECKINS);
export const saveCheckIns = (c: CheckInRecord[]) => write(KEYS.checkIns, c);

export const loadMemories = (): MemoryEntry[] => {
  const raw = read<MemoryEntry[]>(KEYS.memories, SEED_MEMORIES);
  if (!Array.isArray(raw)) return [];
  const clean = raw.filter((m) => !isFakeMemory(m));
  if (clean.length !== raw.length) {
    write(KEYS.memories, clean);
  }
  return clean;
};

export const saveMemories = (m: MemoryEntry[]) => {
  const clean = Array.isArray(m) ? m.filter((entry) => !isFakeMemory(entry)) : [];
  write(KEYS.memories, clean);
};

export const loadMessages = (): ConversationMessage[] => {
  const raw = read<ConversationMessage[]>(KEYS.messages, SEED_MESSAGES);
  if (!Array.isArray(raw)) return [];
  const clean = raw.filter((msg) => !isFakeMessage(msg));
  if (clean.length !== raw.length) {
    write(KEYS.messages, clean);
  }
  return clean;
};

export const saveMessages = (m: ConversationMessage[]) => {
  const clean = Array.isArray(m) ? m.filter((msg) => !isFakeMessage(msg)) : [];
  write(KEYS.messages, clean);
};

export const loadErrands = (): ErrandTask[] => read<ErrandTask[]>(KEYS.errands, SEED_ERRANDS);
export const saveErrands = (e: ErrandTask[]) => write(KEYS.errands, e);

export const DEFAULT_STICKERS: StickerWatermark[] = [];

export const loadStickers = (): StickerWatermark[] => read<StickerWatermark[]>(KEYS.stickers, DEFAULT_STICKERS);
export const saveStickers = (s: StickerWatermark[]) => write(KEYS.stickers, s);

export const DEFAULT_SCRATCHPAD = '';

export const loadScratchpad = (): string => read<string>(KEYS.scratchpad, DEFAULT_SCRATCHPAD);
export const saveScratchpad = (text: string) => write(KEYS.scratchpad, text);

export const loadActions = (): HydrateFormAction[] => read<HydrateFormAction[]>(KEYS.actions, []);
export const saveActions = (a: HydrateFormAction[]) => write(KEYS.actions, a);

export const loadSaved = (): SavedMessage[] => read<SavedMessage[]>(KEYS.saved, []);
export const saveSaved = (s: SavedMessage[]) => write(KEYS.saved, s);

export const loadFeedback = (): FeedbackEntry[] => read<FeedbackEntry[]>(KEYS.feedback, []);
export const saveFeedback = (f: FeedbackEntry[]) => write(KEYS.feedback, f);

/**
 * Wipe every local ledger key on this device. The device key itself is kept so
 * the surfaces can keep pairing, but all personal content is destroyed.
 */
export const clearLocalLedger = () => {
  const wipe = [
    KEYS.profile, KEYS.sessions, KEYS.checkIns, KEYS.memories, KEYS.messages,
    KEYS.errands, KEYS.saved, KEYS.feedback, KEYS.canvas, KEYS.skills,
  ];
  wipe.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* noop */
    }
  });
};


// --- Sovereign export --------------------------------------------------------

export interface SovereignArchive {
  exportedAt: string;
  deviceKey: string;
  profile: UserProfile;
  sessions: MyDaySession[];
  checkIns: CheckInRecord[];
  memories: MemoryEntry[];
  messages: ConversationMessage[];
  errands: ErrandTask[];
  savedMessages: SavedMessage[];
  feedback: FeedbackEntry[];
}

export const buildArchive = (): SovereignArchive => ({
  exportedAt: new Date().toISOString(),
  deviceKey: getDeviceKey(),
  profile: loadProfile(),
  sessions: loadSessions(),
  checkIns: loadCheckIns(),
  memories: loadMemories(),
  messages: loadMessages(),
  errands: loadErrands(),
  savedMessages: loadSaved(),
  feedback: loadFeedback(),
});

export const archiveToMarkdown = (a: SovereignArchive): string => {
  const lines: string[] = [];
  lines.push(`# Carol Sovereign Archive`);
  lines.push(`\n_Exported ${new Date(a.exportedAt).toLocaleString()}_\n`);
  lines.push(`## Profile\n`);
  lines.push(`- **Name:** ${a.profile.name || '—'}`);
  lines.push(`- **Identity:** ${a.profile.identity || '—'}`);
  lines.push(`- **Aesthetic:** ${a.profile.aesthetic}`);
  lines.push(`- **Teams:** ${a.profile.sportsTeams.join(', ') || '—'}`);
  lines.push(`- **Wellness goal:** ${a.profile.wellnessGoal || '—'}`);
  lines.push(`\n## My Day Sessions\n`);
  a.sessions.forEach((s) => {
    lines.push(`### ${s.date}`);
    lines.push(`- Intention: ${s.intention}`);
    lines.push(`- Mood ${s.mood_score}/10 · Energy ${s.energy_level}/10`);
    s.reflections.forEach((r) => lines.push(`  - ${r}`));
  });
  lines.push(`\n## Check-Ins\n`);
  a.checkIns.forEach((c) =>
    lines.push(`- **[${c.type}] ${c.label}** — ${c.notes} _(${new Date(c.timestamp).toLocaleString()})_`),
  );
  lines.push(`\n## Memory Ledger\n`);
  a.memories.forEach((m) => lines.push(`- **[${m.category}]** ${m.content} \`${m.tags.join(' ')}\``));
  lines.push(`\n## Conversations\n`);
  a.messages.forEach((m) => lines.push(`- **${m.role}** _(${m.domain})_: ${m.content}`));
  lines.push(`\n## Errand Ledger\n`);
  a.errands.forEach((e) => lines.push(`- **${e.title}** [${e.status}] — ${e.items.join(', ')}`));
  return lines.join('\n');
};

export const downloadFile = (filename: string, content: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

export const exportJSON = () => {
  const a = buildArchive();
  downloadFile(`carol-ann-archive-${a.exportedAt.slice(0, 10)}.json`, JSON.stringify(a, null, 2), 'application/json');
};

export const exportMarkdown = () => {
  const a = buildArchive();
  downloadFile(`carol-ann-archive-${a.exportedAt.slice(0, 10)}.md`, archiveToMarkdown(a), 'text/markdown');
};
