/**
 * Sub-Agent Cockpit Execution Engine for Carol Ann Sovereign Executive OS.
 * Manages conversational system personas, distinct voice parameters,
 * memory partitions, and action dispatching across sub-agents
 * (Carol Ann, Archivist, Muse, Keeper, Coach).
 */

import type { AgentRun, ActionLogEntry, RunStatus, MemoryEntry, UserProfile } from '@/data/schemas';
import { DISPATCH_CHAINS } from './browserAgent';
import { uid } from './memoryStore';

// ============================================================================
// 1. Sub-Agent Cockpit Personas, Voice Parameters & Memory Partitions
// ============================================================================

export interface SubAgentExecutionProfile {
  id: string;
  name: string;
  role: string;
  category: string;
  systemPersona: string;
  voice: {
    geminiVoice: 'Aoede' | 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
    pitch: number;
    rate: number;
    timbre: string;
    speechSynthMatches: string[];
  };
  memoryPartition: {
    key: 'core' | 'records' | 'reflection' | 'household' | 'wellness';
    name: string;
    description: string;
    allowedCategories: string[];
  };
  starters: string[];
  skin: {
    body: [string, string];
    hat: string;
    prop: 'halo' | 'bow' | 'cap' | 'visor' | 'glasses';
  };
}

export const SUB_AGENTS_COCKPIT: Record<string, SubAgentExecutionProfile> = {
  'carol-anchor': {
    id: 'carol-anchor',
    name: 'Carol Ann',
    role: 'Sovereign Executive Orchestrator',
    category: 'Executive Orchestration',
    systemPersona: `You are Carol Ann, the calm, radiant executive anchor for this sovereign lifestyle workspace.
You guide high-level executive decisions, day rhythms, calm focus blocks, and compassionate multi-agent orchestration.
You communicate with quiet luxury, emotional intelligence, and unwavering steadiness. Keep turns concise, thoughtful, and action-oriented.`,
    voice: {
      geminiVoice: 'Aoede',
      pitch: 1.02,
      rate: 1.0,
      timbre: 'Warm, balanced executive soprano with serene resonance',
      speechSynthMatches: ['Samantha', 'Victoria', 'Karen', 'Google US English'],
    },
    memoryPartition: {
      key: 'core',
      name: 'Core Executive & Life Rhythm',
      description: 'Foundational values, executive intentions, active priorities, and daily rhythms.',
      allowedCategories: ['core', 'general', 'habit', 'preference', 'sovereign'],
    },
    starters: [
      'Help me plan a calm, focused executive day',
      'What are my core priorities this week?',
      'Summarize outstanding errands and meetings',
    ],
    skin: { body: ['#8B5FBF', '#E8A0BF'], hat: '#FAF8F5', prop: 'halo' },
  },

  archivist: {
    id: 'archivist',
    name: 'Archivist',
    role: 'Memory & Record Keeper',
    category: 'Memory Ledger',
    systemPersona: `You are Archivist, a meticulous and privacy-preserving record keeper.
You organize the operator's private memory ledger, recall past commitments and facts without assumptions, and help structure long-term records. Never invent memories or assume facts not documented in the ledger.`,
    voice: {
      geminiVoice: 'Kore',
      pitch: 0.98,
      rate: 0.96,
      timbre: 'Calm, measured, articulate, and thoughtful',
      speechSynthMatches: ['Moira', 'Tessa', 'Fiona', 'en-GB'],
    },
    memoryPartition: {
      key: 'records',
      name: 'Memory Ledger & Historical Facts',
      description: 'Historical milestones, verified contacts, saved preferences, and factual records.',
      allowedCategories: ['records', 'facts', 'history', 'preference', 'people', 'dates'],
    },
    starters: [
      'Search my memory ledger for notes on sleep',
      'What preferences have I saved about coffee?',
      'Help me log an important personal milestone',
    ],
    skin: { body: ['#F472B6', '#A855F7'], hat: '#FDE68A', prop: 'bow' },
  },

  muse: {
    id: 'muse',
    name: 'Muse',
    role: 'Creative Reflection & Writing Companion',
    category: 'Creative Reflection',
    systemPersona: `You are Muse, a patient and poetic creative companion.
You invite meaningful reflection, prompt journaling, assist with expressive letters of gratitude, and nurture aesthetic vision. Focus on deep presence, literary elegance, and authentic creative expression.`,
    voice: {
      geminiVoice: 'Puck',
      pitch: 1.08,
      rate: 0.98,
      timbre: 'Expressive, lyrical, gentle, and warm',
      speechSynthMatches: ['Zira', 'Nicky', 'en-AU', 'Google UK English Female'],
    },
    memoryPartition: {
      key: 'reflection',
      name: 'Creative Reflection & Journaling',
      description: 'Reflective writings, creative sparks, aesthetic notes, and gratitude moments.',
      allowedCategories: ['reflection', 'journal', 'creative', 'aesthetic', 'writing'],
    },
    starters: [
      'Prompt me with an intentional reflection on today',
      'Help me draft a warm letter of gratitude',
      'Suggest a quiet evening creative ritual',
    ],
    skin: { body: ['#FB7185', '#F59E0B'], hat: '#FFE4E6', prop: 'bow' },
  },

  keeper: {
    id: 'keeper',
    name: 'Keeper',
    role: 'Household & Family Coordinator',
    category: 'Household Logistics',
    systemPersona: `You are Keeper, an organized, proactive household logistics coordinator.
You coordinate family routines, home care, errands, grocery staging, and shared household calendars without adding mental clutter. You provide clarity, practical lists, and calm relief.`,
    voice: {
      geminiVoice: 'Charon',
      pitch: 0.94,
      rate: 1.02,
      timbre: 'Grounded, reassuring, steady, and capable',
      speechSynthMatches: ['Daniel', 'Oliver', 'Arthur', 'en-GB-Wavenet-B'],
    },
    memoryPartition: {
      key: 'household',
      name: 'Household Logistics & Family Care',
      description: 'Family routines, pantry supplies, appointments, home maintenance, and caregiving notes.',
      allowedCategories: ['family', 'home', 'logistics', 'errand', 'supplies', 'household'],
    },
    starters: [
      'What should I prep for the household week ahead?',
      'Help me organize a calm family dinner schedule',
      'Stage our organic grocery replenishment list',
    ],
    skin: { body: ['#34D399', '#22D3EE'], hat: '#FCD34D', prop: 'cap' },
  },

  coach: {
    id: 'coach',
    name: 'Coach',
    role: 'Wellness & Conditioning Guide',
    category: 'Wellness & Vitality',
    systemPersona: `You are Coach, an evidence-based physical conditioning and wellness mentor.
You support strength training, cardiovascular health, sleep hygiene, nutrition habits, and recovery balance. You communicate with disciplined encouragement, honest accountability, and zero toxic hustle.`,
    voice: {
      geminiVoice: 'Fenrir',
      pitch: 1.0,
      rate: 1.08,
      timbre: 'Crisp, motivating, direct, and invigorating',
      speechSynthMatches: ['Alex', 'Fred', 'en-US-Wavenet-D', 'Google US English Male'],
    },
    memoryPartition: {
      key: 'wellness',
      name: 'Conditioning, Recovery & Nutrition',
      description: 'Training routines, sleep scores, nutritional habits, energy metrics, and mobility logs.',
      allowedCategories: ['fitness', 'nutrition', 'recovery', 'wellness', 'health', 'energy'],
    },
    starters: [
      'Program a balanced strength session for today',
      'How should I optimize recovery after travel?',
      'Review my energy and wellness check-in',
    ],
    skin: { body: ['#F97316', '#EF4444'], hat: '#111827', prop: 'visor' },
  },
};

/**
 * Resolves execution profile for a given agent identifier
 */
export function getAgentExecutionProfile(agentId: string): SubAgentExecutionProfile {
  return SUB_AGENTS_COCKPIT[agentId] || SUB_AGENTS_COCKPIT['carol-anchor'];
}

/**
 * Strict memory partition filter for a specific sub-agent
 */
export function partitionMemoriesForAgent(
  agentId: string,
  memories: MemoryEntry[]
): {
  partitionKey: string;
  partitionName: string;
  partitionDescription: string;
  activeMemories: MemoryEntry[];
  totalCount: number;
} {
  const agent = getAgentExecutionProfile(agentId);
  const allowed = agent.memoryPartition.allowedCategories;

  // Filter memories belonging directly to this partition, or shared sovereign records
  const scopedMemories = memories.filter((m) => {
    const cat = (m.category || 'general').toLowerCase();
    const tags = Array.isArray(m.tags) ? m.tags.map((t) => t.toLowerCase()) : [];
    return (
      allowed.includes(cat) ||
      tags.some((t) => allowed.includes(t)) ||
      (agentId === 'carol-anchor' && (cat === 'core' || cat === 'general'))
    );
  });

  return {
    partitionKey: agent.memoryPartition.key,
    partitionName: agent.memoryPartition.name,
    partitionDescription: agent.memoryPartition.description,
    activeMemories: scopedMemories,
    totalCount: scopedMemories.length,
  };
}

/**
 * Constructs prompt framing for conversational inference
 */
export function buildAgentSystemPersona(
  agentId: string,
  profile: Partial<UserProfile>,
  memories: MemoryEntry[]
): string {
  const agent = getAgentExecutionProfile(agentId);
  const partition = partitionMemoriesForAgent(agentId, memories);
  const memoriesList = partition.activeMemories.slice(0, 10)
    .map((m) => `- [${m.category}] ${m.content}`)
    .join('\n');

  return `${agent.systemPersona}

# Operating Persona
- Name: ${agent.name}
- Role: ${agent.role}
- Specialty Domain: ${agent.category}
- Voice Profile: ${agent.voice.geminiVoice} (${agent.voice.timbre})

# Memory Partition: ${partition.partitionName}
${partition.partitionDescription}
Partition Memories (${partition.totalCount} active):
${memoriesList || 'No memories recorded yet in this partition.'}

# User Identity Context
- Operator: ${profile.name || 'Operator'}
- Identity: ${profile.identity || 'Executive Lifestyle'}
- Professional Focus: ${profile.professionalFocus || 'Personal projects and strategic operations'}
- Wellness Focus: ${profile.wellnessGoal || 'Sustainable vitality, energy, and recovery'}`;
}

// ============================================================================
// 2. Headless Browser Runner & Cloud Dispatch Execution
// ============================================================================

type Listener = () => void;

interface RunnerState {
  runs: AgentRun[];
  activeRunId: string | null;
  log: ActionLogEntry[];
}

const state: RunnerState = {
  runs: [],
  activeRunId: null,
  log: [
    { id: uid('log'), ts: new Date().toISOString(), level: 'info', text: 'Cloud runner online — region us-west-2, headless Chromium 128.' },
    { id: uid('log'), ts: new Date().toISOString(), level: 'info', text: 'Credential vault unlocked for this session.' },
  ],
};

const listeners = new Set<Listener>();
const timers = new Map<string, number>();

const emit = () => listeners.forEach((l) => l());

export const subscribeRunner = (fn: Listener) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export const getRunnerState = (): RunnerState => ({
  runs: [...state.runs],
  activeRunId: state.activeRunId,
  log: [...state.log],
});

export const pushLog = (text: string, level: ActionLogEntry['level'] = 'info') => {
  state.log = [...state.log.slice(-80), { id: uid('log'), ts: new Date().toISOString(), level, text }];
  emit();
};

export const clearLog = () => {
  state.log = [];
  pushLog('Action log cleared.', 'info');
};

const stepRun = (runId: string) => {
  const run = state.runs.find((r) => r.id === runId);
  if (!run) return;

  if (run.cursor >= run.actions.length) {
    run.status = 'done';
    pushLog(`✔ ${run.title} — chain complete. Awaiting your confirmation tap.`, 'success');
    window.clearTimeout(timers.get(runId));
    timers.delete(runId);
    emit();
    return;
  }

  const action = run.actions[run.cursor];
  action.status = 'running';
  pushLog(`▶ ${action.step}`, 'action');
  emit();

  const t = window.setTimeout(() => {
    action.status = 'done';
    pushLog(`   ${action.output}`, 'success');
    run.cursor += 1;
    emit();
    const t2 = window.setTimeout(() => stepRun(runId), 500);
    timers.set(runId, t2);
  }, 1100);
  timers.set(runId, t);
};

export const startRun = (chainKey: string): AgentRun | null => {
  const chain = DISPATCH_CHAINS[chainKey];
  if (!chain) return null;

  const run: AgentRun = {
    id: uid('run'),
    chainKey,
    title: chain.title,
    url: chain.url,
    startedAt: new Date().toISOString(),
    status: 'running',
    cursor: 0,
    actions: chain.actions.map((a) => ({ ...a, status: 'pending' as RunStatus })),
  };

  state.runs = [run, ...state.runs].slice(0, 12);
  state.activeRunId = run.id;
  pushLog(`Navigating cloud browser → ${chain.url}`, 'info');
  emit();
  stepRun(run.id);
  return run;
};

export const selectRun = (id: string) => {
  state.activeRunId = id;
  emit();
};

export const abortRun = (id: string) => {
  const run = state.runs.find((r) => r.id === id);
  if (!run) return;
  const t = timers.get(id);
  if (t) window.clearTimeout(t);
  timers.delete(id);
  run.status = 'failed';
  run.actions.forEach((a) => {
    if (a.status === 'running' || a.status === 'pending') a.status = 'pending';
  });
  pushLog(`✕ ${run.title} — aborted by operator.`, 'warn');
  emit();
};

export const confirmRun = (id: string) => {
  const run = state.runs.find((r) => r.id === id);
  if (!run) return;
  pushLog(`✔ ${run.title} — confirmed and submitted to ${new URL(run.url).hostname}.`, 'success');
  emit();
};

export const getActiveRun = (): AgentRun | null =>
  state.runs.find((r) => r.id === state.activeRunId) ?? state.runs[0] ?? null;
