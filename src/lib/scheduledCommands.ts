import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { detectTimeZone } from './agentStore';
import { uid } from './memoryStore';
import { publishBus } from './realtimeBus';

export interface ScheduledCommand {
  id: string;
  label: string;
  text: string;
  chainKey: string | null;
  cronExpression: string;
  nextRunAt: string;
  lastRunAt: string | null;
  runCount: number;
  active: boolean;
  timezone: string;
  createdAt: string;
}

export { detectTimeZone };

export interface CronPreset {
  key: string;
  label: string;
  expression: string;
  hint: string;
}

export const CRON_PRESETS: CronPreset[] = [
  { key: 'hourly', label: 'Every hour', expression: '0 * * * *', hint: 'top of every hour' },
  { key: 'daily-morning', label: 'Every morning', expression: '0 13 * * *', hint: '13:00 UTC daily' },
  { key: 'daily-evening', label: 'Every evening', expression: '0 1 * * *', hint: '01:00 UTC daily' },
  { key: 'weekdays', label: 'Weekday mornings', expression: '0 13 * * 1-5', hint: 'Mon–Fri 13:00 UTC' },
  { key: 'weekly', label: 'Weekly (Sunday)', expression: '0 15 * * 0', hint: 'Sundays 15:00 UTC' },
  { key: 'monthly', label: 'Monthly (1st)', expression: '0 14 1 * *', hint: '1st of month 14:00 UTC' },
];

const FIELD_BOUNDS: [number, number][] = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 6],
];

const fieldValues = (field: string, min: number, max: number): number[] => {
  const out = new Set<number>();
  field.split(',').forEach((part) => {
    const [rangePart, stepPart] = part.split('/');
    const step = stepPart ? parseInt(stepPart, 10) : 1;
    let lo = min;
    let hi = max;
    if (rangePart && rangePart !== '*') {
      if (rangePart.includes('-')) {
        const [a, b] = rangePart.split('-');
        lo = parseInt(a, 10);
        hi = parseInt(b, 10);
      } else {
        lo = parseInt(rangePart, 10);
        hi = lo;
      }
    }
    if (Number.isNaN(lo) || Number.isNaN(hi) || Number.isNaN(step) || step <= 0) return;
    for (let v = lo; v <= hi; v += step) {
      if (v >= min && v <= max) out.add(v);
    }
  });
  return Array.from(out).sort((a, b) => a - b);
};

export const isValidCron = (expr: string): boolean => {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  return parts.every((p, i) => {
    const [min, max] = FIELD_BOUNDS[i];
    const vals = fieldValues(p, min, max);
    return vals.length > 0;
  });
};

export const nextRunFromCron = (expr: string, fromDate = new Date()): Date => {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5 || !isValidCron(expr)) {
    return new Date(fromDate.getTime() + 3600_000);
  }
  const minutes = fieldValues(parts[0], 0, 59);
  const hours = fieldValues(parts[1], 0, 23);
  const days = fieldValues(parts[2], 1, 31);
  const months = fieldValues(parts[3], 1, 12).map((m) => m - 1);
  const dows = fieldValues(parts[4], 0, 6);

  const t = new Date(fromDate.getTime() + 60_000);
  t.setUTCSeconds(0, 0);

  for (let i = 0; i < 60 * 24 * 366; i += 1) {
    if (
      months.includes(t.getUTCMonth()) &&
      days.includes(t.getUTCDate()) &&
      dows.includes(t.getUTCDay()) &&
      hours.includes(t.getUTCHours()) &&
      minutes.includes(t.getUTCMinutes())
    ) {
      return t;
    }
    t.setUTCMinutes(t.getUTCMinutes() + 1);
  }
  return new Date(fromDate.getTime() + 3600_000);
};

export const formatCronLabel = (expr: string): string => {
  const match = CRON_PRESETS.find((p) => p.expression === expr.trim());
  return match ? match.label : expr;
};

export const fetchSchedules = async (
  userId: string,
): Promise<{ rows: ScheduledCommand[]; error: string | null }> => {
  try {
    const collRef = collection(db, 'users', userId, 'scheduled_commands');
    const snap = await getDocs(collRef);
    const rows: ScheduledCommand[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        label: data.name || data.label || 'Scheduled command',
        text: data.prompt || data.text || '',
        chainKey: data.chainKey || null,
        cronExpression: data.schedule || data.cronExpression || '0 * * * *',
        nextRunAt: data.nextRunAt || new Date().toISOString(),
        lastRunAt: data.lastRunAt || null,
        runCount: typeof data.runCount === 'number' ? data.runCount : 0,
        active: data.active !== false,
        timezone: data.timezone || 'UTC',
        createdAt: data.createdAt || new Date().toISOString(),
      };
    });
    rows.sort((a, b) => new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime());
    return { rows, error: null };
  } catch (e: unknown) {
    return { rows: [], error: e instanceof Error ? e.message : 'Schedules unavailable.' };
  }
};

export const createSchedule = async (
  userId: string,
  input: { label: string; text: string; chainKey: string | null; cronExpression: string; timezone?: string },
): Promise<{ row: ScheduledCommand | null; error: string | null }> => {
  const text = input.text.trim();
  if (!text) return { row: null, error: 'Nothing to schedule.' };
  if (!isValidCron(input.cronExpression)) return { row: null, error: 'That cron expression is not valid.' };

  const id = uid('sc');
  const nextRun = nextRunFromCron(input.cronExpression).toISOString();
  const timezone = input.timezone || detectTimeZone();
  const label = input.label.trim() || text.slice(0, 40);

  const payload: ScheduledCommand = {
    id,
    label,
    text,
    chainKey: input.chainKey,
    cronExpression: input.cronExpression.trim(),
    nextRunAt: nextRun,
    lastRunAt: null,
    runCount: 0,
    active: true,
    timezone,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, 'users', userId, 'scheduled_commands', id);
    await setDoc(docRef, {
      id,
      userId,
      name: label,
      prompt: text,
      schedule: payload.cronExpression,
      chainKey: payload.chainKey,
      nextRunAt: payload.nextRunAt,
      lastRunAt: payload.lastRunAt,
      runCount: payload.runCount,
      active: true,
      timezone: payload.timezone,
      createdAt: payload.createdAt,
    });
    return { row: payload, error: null };
  } catch (e: unknown) {
    return { row: null, error: e instanceof Error ? e.message : 'Could not create that schedule.' };
  }
};

export const setScheduleActive = async (
  userId: string,
  id: string,
  active: boolean,
): Promise<string | null> => {
  try {
    const docRef = doc(db, 'users', userId, 'scheduled_commands', id);
    await updateDoc(docRef, { active });
    return null;
  } catch (e: unknown) {
    return e instanceof Error ? e.message : 'Could not update that schedule.';
  }
};

export const deleteSchedule = async (userId: string, id: string): Promise<string | null> => {
  try {
    const docRef = doc(db, 'users', userId, 'scheduled_commands', id);
    await deleteDoc(docRef);
    return null;
  } catch (e: unknown) {
    return e instanceof Error ? e.message : 'Could not remove that schedule.';
  }
};

export const runScheduleSweep = async (userId: string): Promise<string | null> => {
  try {
    // 1. Trigger backend sweep against Firestore scheduled commands
    try {
      const res = await fetch('/api/workflow/sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        return null;
      }
    } catch {
      // Continue to direct client-side sweep fallback
    }

    const { rows } = await fetchSchedules(userId);
    const now = new Date();
    for (const item of rows) {
      if (!item.active) continue;
      publishBus('command', { text: item.text, sourceScheduleId: item.id }, 'cloud');
      const docRef = doc(db, 'users', userId, 'scheduled_commands', item.id);
      await updateDoc(docRef, {
        lastRunAt: now.toISOString(),
        runCount: (item.runCount || 0) + 1,
        nextRunAt: nextRunFromCron(item.cronExpression, now).toISOString(),
      });
    }
    return null;
  } catch (e: unknown) {
    return e instanceof Error ? e.message : 'Sweep failed.';
  }
};
