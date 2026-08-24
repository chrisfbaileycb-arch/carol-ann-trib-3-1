import { supabase } from './supabase';
import { detectTimeZone } from './agentStore';

/**
 * Recurring command schedules (`scheduled_commands` table, owner-only RLS).
 * An hourly edge function (`run-scheduled-commands`) reads due rows and inserts
 * the matching `bus_events` row so the desktop workspace picks the command up.
 * This module is the single source of truth for cron presets + CRUD.
 * The operator's IANA time zone is auto-detected (see detectTimeZone) and stored
 * with every schedule so next-run times can be shown in their local clock.
 */

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
  /** Auto-detected IANA zone captured when the schedule was created. */
  timezone: string;
  createdAt: string;
}

export { detectTimeZone };


export interface CronPreset {
  key: string;
  label: string;
  /** Standard 5-field cron in UTC. */
  expression: string;
  hint: string;
}

/** Presets offered in the scheduling UI (all UTC). */
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
    if ([lo, hi, step].some((n) => Number.isNaN(n)) || step < 1) return;
    for (let v = lo; v <= hi; v += step) if (v >= min && v <= max) out.add(v);
  });
  return [...out].sort((a, b) => a - b);
};

/** Basic 5-field validation — mirrors what the edge function can parse. */
export const isValidCron = (expr: string): boolean => {
  const parts = (expr || '').trim().split(/\s+/);
  if (parts.length !== 5) return false;
  return parts.every((p, i) => fieldValues(p, FIELD_BOUNDS[i][0], FIELD_BOUNDS[i][1]).length > 0);
};

/** Next UTC firing time strictly after `from` (same algorithm as the edge function). */
export const nextRunFromCron = (expr: string, from: Date = new Date()): Date => {
  const fallback = new Date(from.getTime() + 60 * 60 * 1000);
  const parts = (expr || '').trim().split(/\s+/);
  if (parts.length !== 5) return fallback;
  const [minutes, hours, doms, months, dows] = parts.map((p, i) =>
    fieldValues(p, FIELD_BOUNDS[i][0], FIELD_BOUNDS[i][1]),
  );
  if ([minutes, hours, doms, months, dows].some((f) => !f.length)) return fallback;
  const domRestricted = parts[2] !== '*';
  const dowRestricted = parts[4] !== '*';

  const cursor = new Date(Date.UTC(
    from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(),
    from.getUTCHours(), from.getUTCMinutes(), 0, 0,
  ));
  cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);

  for (let i = 0; i < 366 * 24 * 60; i += 1) {
    if (!months.includes(cursor.getUTCMonth() + 1)) {
      cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1);
      cursor.setUTCHours(0, 0, 0, 0);
      continue;
    }
    const domOk = doms.includes(cursor.getUTCDate());
    const dowOk = dows.includes(cursor.getUTCDay());
    const dayOk = domRestricted && dowRestricted ? domOk || dowOk : domOk && dowOk;
    if (!dayOk) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      cursor.setUTCHours(0, 0, 0, 0);
      continue;
    }
    if (!hours.includes(cursor.getUTCHours())) {
      cursor.setUTCHours(cursor.getUTCHours() + 1, 0, 0, 0);
      continue;
    }
    if (!minutes.includes(cursor.getUTCMinutes())) {
      cursor.setUTCMinutes(cursor.getUTCMinutes() + 1, 0, 0);
      continue;
    }
    return cursor;
  }
  return fallback;
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Human-friendly description of a cron expression. */
export const describeCron = (expr: string): string => {
  const preset = CRON_PRESETS.find((p) => p.expression === expr);
  if (preset) return `${preset.label} · ${preset.hint}`;
  const parts = (expr || '').trim().split(/\s+/);
  if (parts.length !== 5) return expr || 'custom schedule';
  const [m, h, dom, mon, dow] = parts;
  const time = h === '*' ? 'every hour' : `${h.padStart(2, '0')}:${(m === '*' ? '00' : m).padStart(2, '0')} UTC`;
  if (dow !== '*') {
    const days = fieldValues(dow, 0, 6).map((d) => DAY_NAMES[d]).join(', ');
    return `${days} at ${time}`;
  }
  if (dom !== '*') return `Day ${dom}${mon !== '*' ? ` of month ${mon}` : ''} at ${time}`;
  return `Daily at ${time}`;
};

/** Compact local-time rendering for a next-run timestamp. */
export const formatNextRun = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
};

const SELECT = 'id,label,text,chain_key,cron_expression,next_run_at,last_run_at,run_count,active,created_at,timezone';

const mapRow = (r: Record<string, unknown>): ScheduledCommand => ({
  id: String(r.id),
  label: typeof r.label === 'string' && r.label.trim() ? r.label : String(r.text ?? 'Schedule'),
  text: typeof r.text === 'string' ? r.text : '',
  chainKey: typeof r.chain_key === 'string' ? r.chain_key : null,
  cronExpression: typeof r.cron_expression === 'string' ? r.cron_expression : '0 13 * * *',
  nextRunAt: typeof r.next_run_at === 'string' ? r.next_run_at : new Date().toISOString(),
  lastRunAt: typeof r.last_run_at === 'string' ? r.last_run_at : null,
  runCount: typeof r.run_count === 'number' ? r.run_count : 0,
  active: r.active !== false,
  timezone: typeof r.timezone === 'string' && r.timezone ? r.timezone : 'UTC',
  createdAt: typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
});

export const fetchSchedules = async (
  userId: string,
): Promise<{ rows: ScheduledCommand[]; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('scheduled_commands')
      .select(SELECT)
      .eq('user_id', userId)
      .order('next_run_at', { ascending: true })
      .limit(50);
    if (error) return { rows: [], error: error.message };
    return { rows: ((data ?? []) as Record<string, unknown>[]).map(mapRow), error: null };
  } catch (e) {
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
  try {
    const { data, error } = await supabase
      .from('scheduled_commands')
      .insert({
        user_id: userId,
        label: input.label.trim() || text.slice(0, 40),
        text,
        chain_key: input.chainKey,
        cron_expression: input.cronExpression.trim(),
        next_run_at: nextRunFromCron(input.cronExpression).toISOString(),
        // Auto-detected from the browser unless the operator overrode it.
        timezone: input.timezone || detectTimeZone(),
        active: true,
      })
      .select(SELECT)
      .single();
    if (error) return { row: null, error: error.message };
    return { row: mapRow((data ?? {}) as Record<string, unknown>), error: null };
  } catch (e) {
    return { row: null, error: e instanceof Error ? e.message : 'Could not create that schedule.' };
  }
};


export const setScheduleActive = async (id: string, active: boolean): Promise<string | null> => {
  try {
    const { error } = await supabase.from('scheduled_commands').update({ active }).eq('id', id);
    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Could not update that schedule.';
  }
};

export const deleteSchedule = async (id: string): Promise<string | null> => {
  try {
    const { error } = await supabase.from('scheduled_commands').delete().eq('id', id);
    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Could not remove that schedule.';
  }
};

/** Fire the cloud sweep immediately (used by the "Run sweep now" control). */
export const runScheduleSweep = async (): Promise<string | null> => {
  try {
    const { error } = await supabase.functions.invoke('run-scheduled-commands', { body: {} });
    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Sweep failed.';
  }
};
