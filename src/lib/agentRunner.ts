import type { AgentRun, ActionLogEntry, RunStatus } from '@/data/schemas';
import { DISPATCH_CHAINS } from './browserAgent';
import { uid } from './memoryStore';

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
