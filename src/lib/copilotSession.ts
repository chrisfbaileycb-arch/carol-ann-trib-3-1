import { DISPATCH_CHAINS, parseIntent } from './browserAgent';
import { publishBus, subscribeBus, type BusEvent } from './realtimeBus';
import { newId } from './agentStore';

/**
 * The browser co-pilot session.
 *
 * ONE co-pilot, TWO surfaces: the desktop sandbox rail and the phone both read
 * and write this same thread, so a permission asked for on the desktop can be
 * answered from the phone (and vice versa) through the realtime bus — the
 * messenger service between the two.
 *
 * Hard rule, identical for every agent that delegates here: the co-pilot never
 * advances a step on its own. Each step is proposed, then waits for an explicit
 * Allow / Deny. Nothing is ever submitted autonomously.
 */

export type CopilotSurface = 'desktop' | 'mobile' | 'cloud';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'copilot' | 'system';
  text: string;
  from: CopilotSurface;
  agentName?: string;
  ts: string;
}

export type CopilotStepStatus = 'pending' | 'awaiting' | 'running' | 'done' | 'denied';

export interface CopilotStep {
  id: string;
  label: string;
  command: string;
  output: string;
  status: CopilotStepStatus;
  /** Which surface answered the permission prompt. */
  decidedBy?: CopilotSurface;
}

export type CopilotTaskStatus = 'awaiting' | 'running' | 'done' | 'denied';

export interface CopilotTask {
  id: string;
  title: string;
  provider: string;
  url: string;
  /** Agent that handed the job over (null = typed straight at the co-pilot). */
  agentId: string | null;
  agentName: string;
  steps: CopilotStep[];
  cursor: number;
  status: CopilotTaskStatus;
  createdAt: string;
  updatedAt: string;
}

interface SessionState {
  messages: CopilotMessage[];
  tasks: CopilotTask[];
  activeTaskId: string | null;
}

const MSG_KEY = 'maggie.copilot.thread.v1';
const TASK_KEY = 'maggie.copilot.tasks.v1';
const CREW_KEY = 'maggie.copilot.crew.v1';
const ACTIVE_CREW_KEY = 'maggie.copilot.crew.active.v1';

export const CREW_LIMIT = 4;

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
    /* best effort only */
  }
};

const state: SessionState = {
  messages: read<CopilotMessage[]>(MSG_KEY, []),
  tasks: read<CopilotTask[]>(TASK_KEY, []),
  activeTaskId: null,
};

if (!state.messages.length) {
  state.messages = [
    {
      id: newId('cm'),
      role: 'system',
      text: 'Browser co-pilot online. I do the actual booking — but I stop and ask you before every single step, on whichever screen you are holding.',
      from: 'desktop',
      ts: new Date().toISOString(),
    },
  ];
}

type Listener = () => void;
const listeners = new Set<Listener>();
let wired = false;

const emit = () => {
  write(MSG_KEY, state.messages.slice(-120));
  write(TASK_KEY, state.tasks.slice(0, 12));
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      /* a bad subscriber must not break the session */
    }
  });
};

export const getCopilotState = (): SessionState => ({
  messages: [...state.messages],
  tasks: [...state.tasks],
  activeTaskId: state.activeTaskId ?? state.tasks[0]?.id ?? null,
});

export const getActiveTask = (): CopilotTask | null => {
  const s = getCopilotState();
  return s.tasks.find((t) => t.id === s.activeTaskId) ?? s.tasks[0] ?? null;
};

/** The step currently holding for a permission answer, if any. */
export const pendingStep = (task: CopilotTask | null): CopilotStep | null => {
  if (!task) return null;
  return task.steps.find((s) => s.status === 'awaiting') ?? null;
};

export const selectTask = (id: string) => {
  state.activeTaskId = id;
  emit();
};

/* ------------------------------------------------------------------ *
 * local mutations
 * ------------------------------------------------------------------ */

const applyMessage = (m: CopilotMessage) => {
  if (state.messages.some((x) => x.id === m.id)) return;
  state.messages = [...state.messages, m].slice(-120);
};

const applyTask = (t: CopilotTask) => {
  const existing = state.tasks.find((x) => x.id === t.id);
  if (existing && existing.updatedAt > t.updatedAt) return;
  state.tasks = [t, ...state.tasks.filter((x) => x.id !== t.id)].slice(0, 12);
  state.activeTaskId = t.id;
};

const touch = (task: CopilotTask): CopilotTask => ({ ...task, updatedAt: new Date().toISOString() });

/* ------------------------------------------------------------------ *
 * bus wiring — the messenger between phone and desktop
 * ------------------------------------------------------------------ */

const handleBus = (e: BusEvent) => {
  if (e.type !== 'copilot') return;
  const kind = e.payload.kind as string | undefined;
  if (kind === 'message' && e.payload.message) {
    applyMessage(e.payload.message as CopilotMessage);
    emit();
  } else if (kind === 'task' && e.payload.task) {
    applyTask(e.payload.task as CopilotTask);
    emit();
  }
};

export const subscribeCopilot = (fn: Listener) => {
  if (!wired) {
    wired = true;
    subscribeBus(handleBus);
  }
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

const broadcastMessage = (m: CopilotMessage) => {
  publishBus('copilot', { kind: 'message', message: m }, m.from === 'mobile' ? 'mobile' : 'desktop');
};

const broadcastTask = (t: CopilotTask, from: CopilotSurface) => {
  publishBus('copilot', { kind: 'task', task: t }, from === 'mobile' ? 'mobile' : 'desktop');
};

export const postCopilotMessage = (
  text: string,
  role: CopilotMessage['role'],
  from: CopilotSurface = 'desktop',
  agentName?: string,
): CopilotMessage => {
  const m: CopilotMessage = { id: newId('cm'), role, text, from, agentName, ts: new Date().toISOString() };
  applyMessage(m);
  emit();
  broadcastMessage(m);
  return m;
};

export const clearCopilotThread = () => {
  state.messages = [];
  state.tasks = [];
  state.activeTaskId = null;
  emit();
};

/* ------------------------------------------------------------------ *
 * task construction
 * ------------------------------------------------------------------ */

const genericSteps = (text: string, provider: string): Omit<CopilotStep, 'status' | 'output'>[] => [
  { id: newId('cs'), label: `Open ${provider} and sign in`, command: `browser.open("${provider}")` },
  { id: newId('cs'), label: 'Read the live availability', command: 'dom.scan("availability")' },
  { id: newId('cs'), label: `Fill the details for “${text.slice(0, 48)}”`, command: 'form.autofill(profile)' },
  { id: newId('cs'), label: 'Hold the best slot', command: 'slots.hold(best)' },
  { id: newId('cs'), label: 'Submit the booking', command: 'checkout.submit()' },
];

/**
 * Hand a job to the browser co-pilot. It builds the plan and immediately asks
 * permission for step one — it never runs ahead.
 */
export const delegateToCopilot = (
  text: string,
  opts: { agentId?: string | null; agentName?: string; from?: CopilotSurface } = {},
): CopilotTask => {
  const from = opts.from ?? 'desktop';
  const chain = parseIntent(text);
  const provider = chain?.provider ?? 'the provider site';
  const base = chain
    ? chain.actions.map((a) => ({ id: newId('cs'), label: a.step, command: a.command, seed: a.output }))
    : genericSteps(text, provider).map((s) => ({ ...s, seed: '' }));

  const task: CopilotTask = {
    id: newId('ct'),
    title: chain?.title ?? text.trim().slice(0, 70),
    provider,
    url: chain?.url ?? 'https://booking.local/session',
    agentId: opts.agentId ?? null,
    agentName: opts.agentName ?? 'You',
    steps: base.map((s, i) => ({
      id: s.id,
      label: s.label,
      command: s.command,
      output: (s as { seed?: string }).seed ?? '',
      status: i === 0 ? 'awaiting' : 'pending',
    })),
    cursor: 0,
    status: 'awaiting',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  applyTask(task);
  emit();
  broadcastTask(task, from);

  postCopilotMessage(
    `${opts.agentName ? `${opts.agentName} handed me: ` : ''}“${task.title}”. I built a ${task.steps.length}-step plan on ${provider}. Step 1 needs your permission: ${task.steps[0].label}.`,
    'copilot',
    from,
    opts.agentName,
  );
  return task;
};

/* ------------------------------------------------------------------ *
 * permission gate
 * ------------------------------------------------------------------ */

export const approveStep = (taskId: string, from: CopilotSurface = 'desktop') => {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;
  const idx = task.steps.findIndex((s) => s.status === 'awaiting');
  if (idx < 0) return;

  const steps = task.steps.map((s, i) => (i === idx ? { ...s, status: 'running' as CopilotStepStatus, decidedBy: from } : s));
  let next = touch({ ...task, steps, status: 'running', cursor: idx });
  applyTask(next);
  emit();
  broadcastTask(next, from);

  window.setTimeout(() => {
    const live = state.tasks.find((t) => t.id === taskId);
    if (!live) return;
    const done = live.steps.map((s, i) =>
      i === idx
        ? { ...s, status: 'done' as CopilotStepStatus, output: s.output || 'Completed on the remote browser.' }
        : i === idx + 1 && s.status === 'pending'
          ? { ...s, status: 'awaiting' as CopilotStepStatus }
          : s,
    );
    const finished = idx + 1 >= done.length;
    next = touch({ ...live, steps: done, cursor: idx + 1, status: finished ? 'done' : 'awaiting' });
    applyTask(next);
    emit();
    broadcastTask(next, from);
    postCopilotMessage(
      finished
        ? `Done — “${next.title}” is submitted on ${next.provider}. Confirmation will land in your inbox.`
        : `Step ${idx + 1} complete. Next up: ${done[idx + 1].label}. May I?`,
      'copilot',
      from,
    );
  }, 1200);
};

export const denyStep = (taskId: string, from: CopilotSurface = 'desktop') => {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;
  const idx = task.steps.findIndex((s) => s.status === 'awaiting');
  if (idx < 0) return;
  const steps = task.steps.map((s, i) => (i === idx ? { ...s, status: 'denied' as CopilotStepStatus, decidedBy: from } : s));
  const next = touch({ ...task, steps, status: 'denied' });
  applyTask(next);
  emit();
  broadcastTask(next, from);
  postCopilotMessage(`Stopped at “${task.steps[idx].label}”. Nothing was submitted — tell me what to change.`, 'copilot', from);
};

export const cancelTask = (taskId: string, from: CopilotSurface = 'desktop') => {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;
  const next = touch({ ...task, status: 'denied', steps: task.steps.map((s) => (s.status === 'awaiting' ? { ...s, status: 'denied' as CopilotStepStatus } : s)) });
  applyTask(next);
  emit();
  broadcastTask(next, from);
};

/** Typed straight at the co-pilot: chat, or a new booking plan if it reads like a job. */
export const sendToCopilot = (text: string, from: CopilotSurface = 'desktop') => {
  const clean = text.trim();
  if (!clean) return;
  postCopilotMessage(clean, 'user', from);
  const looksLikeJob = /book|order|schedule|reserve|renew|buy|reorder|pickup|appointment|class|sync/i.test(clean);
  if (looksLikeJob) {
    delegateToCopilot(clean, { from });
  } else {
    postCopilotMessage(
      `Noted. I only act inside a plan you approve step by step — say “book…”, “order…” or “schedule…” and I will draft one for ${DISPATCH_CHAINS['whole-foods'] ? 'the right site' : 'you'}.`,
      'copilot',
      from,
    );
  }
};

/* ------------------------------------------------------------------ *
 * phone crew — up to four preloaded roles chosen from the master roster
 * ------------------------------------------------------------------ */

export const loadCrew = (): string[] => read<string[]>(CREW_KEY, ['fitness-club', 'errands', 'elementary', 'hair-salon']).slice(0, CREW_LIMIT);

export const saveCrew = (ids: string[]) => write(CREW_KEY, ids.slice(0, CREW_LIMIT));

export const toggleCrewMember = (id: string): string[] => {
  const crew = loadCrew();
  const next = crew.includes(id)
    ? crew.filter((c) => c !== id)
    : crew.length >= CREW_LIMIT
      ? [...crew.slice(1), id]
      : [...crew, id];
  saveCrew(next);
  return next;
};

export const loadActiveCrewMember = (): string | null => read<string | null>(ACTIVE_CREW_KEY, null);
export const saveActiveCrewMember = (id: string | null) => write(ACTIVE_CREW_KEY, id);
