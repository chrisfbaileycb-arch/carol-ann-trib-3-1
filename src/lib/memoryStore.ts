import type {
  UserProfile,
  MyDaySession,
  CheckInRecord,
  MemoryEntry,
  ConversationMessage,
  ErrandTask,
  SavedMessage,
  FeedbackEntry,
} from '@/data/schemas';
import { DEFAULT_PROFILE } from '@/data/intake';

const NS = 'maggie_v1';

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
    /* storage full or unavailable — local-first degrades gracefully */
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

// --- Seed data ---------------------------------------------------------------

const today = new Date().toISOString().slice(0, 10);

export const SEED_MEMORIES: MemoryEntry[] = [
  { id: 'mem_1', category: 'fitness', content: 'Trains 5x/week — pull days feel strongest on Tuesdays.', tags: ['gym', 'cadence'], last_recalled: today },
  { id: 'mem_2', category: 'nutrition', content: 'Prefers high-protein breakfast before 7:30am, no dairy.', tags: ['kitchen', 'diet'], last_recalled: today },
  { id: 'mem_3', category: 'habit', content: 'Evening reflection lands better after a 10 minute walk.', tags: ['core', 'ritual'], last_recalled: today },
  { id: 'mem_4', category: 'family', content: 'Ava has volleyball Tue/Thu 5–7pm; carpool with the Ruiz family.', tags: ['school', 'logistics'], last_recalled: today },
  { id: 'mem_5', category: 'preference', content: 'Delivery windows before 10am only — afternoons are deep work.', tags: ['errands'], last_recalled: today },
];

export const SEED_CHECKINS: CheckInRecord[] = [
  { id: 'ci_1', type: 'physical', label: 'Morning readiness', notes: 'Legs recovered, HRV steady at 62.', timestamp: new Date(Date.now() - 3600e3 * 5).toISOString() },
  { id: 'ci_2', type: 'mindset', label: 'Mid-day reset', notes: 'Focus held through the 10am block.', timestamp: new Date(Date.now() - 3600e3 * 2).toISOString() },
];

export const SEED_MESSAGES: ConversationMessage[] = [
  {
    id: 'msg_1',
    domain: 'core',
    role: 'assistant',
    content: "Good morning. Your canvas is synced across both surfaces. Yesterday was Upper Body & Shoulders — today reads as Leg Day & Core. I've also staged three errand chains awaiting your confirm.",
    source: 'desktop',
    timestamp: new Date(Date.now() - 3600e3 * 3).toISOString(),
  },
  {
    id: 'msg_2',
    domain: 'family',
    role: 'assistant',
    content: 'School portal shows an early release Thursday at 1:15pm. That collides with your 1:00 architecture review — want me to draft a reschedule?',
    source: 'desktop',
    timestamp: new Date(Date.now() - 3600e3 * 2).toISOString(),
  },
];

export const SEED_ERRANDS: ErrandTask[] = [
  { id: 'er_1', target: 'whole-foods', title: 'Weekly grocery delivery', items: ['Organic Eggs', 'Almond Milk', 'Grass-Fed Beef', 'Spinach'], status: 'queued', scheduled_time: 'Tomorrow 8:00–10:00 AM' },
  { id: 'er_2', target: 'dry-cleaning', title: 'Dry cleaning pickup', items: ['3 Blouses', '2 Slacks'], status: 'draft' },
  { id: 'er_3', target: 'amazon', title: 'Reorder whey isolate', items: ['Whey Isolate Vanilla 5lb'], status: 'draft' },
];

// --- Typed accessors ---------------------------------------------------------

export const loadProfile = (): UserProfile => read<UserProfile>(KEYS.profile, DEFAULT_PROFILE);
export const saveProfile = (p: UserProfile) => write(KEYS.profile, p);

export const loadSessions = (): MyDaySession[] =>
  read<MyDaySession[]>(KEYS.sessions, [
    {
      id: 'day_1',
      date: today,
      intention: 'Run the day from one surface. Move heavy, think clearly, stay kind.',
      mood_score: 7,
      energy_level: 8,
      reflections: ['Morning block was uninterrupted for 90 minutes.'],
      completed_tasks: ['Leg day warmup', 'School calendar sync'],
    },
  ]);
export const saveSessions = (s: MyDaySession[]) => write(KEYS.sessions, s);

export const loadCheckIns = (): CheckInRecord[] => read<CheckInRecord[]>(KEYS.checkIns, SEED_CHECKINS);
export const saveCheckIns = (c: CheckInRecord[]) => write(KEYS.checkIns, c);

export const loadMemories = (): MemoryEntry[] => read<MemoryEntry[]>(KEYS.memories, SEED_MEMORIES);
export const saveMemories = (m: MemoryEntry[]) => write(KEYS.memories, m);

export const loadMessages = (): ConversationMessage[] =>
  read<ConversationMessage[]>(KEYS.messages, SEED_MESSAGES);
export const saveMessages = (m: ConversationMessage[]) => write(KEYS.messages, m);

export const loadErrands = (): ErrandTask[] => read<ErrandTask[]>(KEYS.errands, SEED_ERRANDS);
export const saveErrands = (e: ErrandTask[]) => write(KEYS.errands, e);

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
  lines.push(`# Maggie Sovereign Archive`);
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
  downloadFile(`maggie-archive-${a.exportedAt.slice(0, 10)}.json`, JSON.stringify(a, null, 2), 'application/json');
};

export const exportMarkdown = () => {
  const a = buildArchive();
  downloadFile(`maggie-archive-${a.exportedAt.slice(0, 10)}.md`, archiveToMarkdown(a), 'text/markdown');
};
