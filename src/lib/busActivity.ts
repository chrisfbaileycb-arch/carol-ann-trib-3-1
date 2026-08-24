import { supabase } from './supabase';
import type { BusEventType, BusSource } from './realtimeBus';

/**
 * Read/maintain layer for the `bus_events` relay ledger.
 * The realtime bus WRITES rows here; this module READS them back for the
 * Remote activity panel (grouping, filtering, deleting, re-running).
 */

export interface BusActivityRow {
  id: string;
  type: BusEventType;
  payload: Record<string, unknown>;
  source: BusSource;
  createdAt: string;
}


export interface ActivityDay {
  key: string;
  label: string;
  events: BusActivityRow[];
}

/** Single source of truth for how each relay event type is presented. */
export const EVENT_TYPE_META: Record<BusEventType, { label: string; tint: string; dot: string }> = {
  command: { label: 'Command', tint: 'border-sky-400/30 bg-sky-400/10 text-sky-200', dot: 'bg-sky-400' },
  voice: { label: 'Voice', tint: 'border-violet-400/30 bg-violet-400/10 text-violet-200', dot: 'bg-violet-400' },
  vision: { label: 'Vision', tint: 'border-amber-400/30 bg-amber-400/10 text-amber-200', dot: 'bg-amber-400' },
  checkin: { label: 'Check-in', tint: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200', dot: 'bg-emerald-400' },
  coach: { label: 'Coach', tint: 'border-rose-400/30 bg-rose-400/10 text-rose-200', dot: 'bg-rose-400' },
  presence: { label: 'Presence', tint: 'border-white/20 bg-white/8 text-white/70', dot: 'bg-white/50' },
};

export const EVENT_TYPES = Object.keys(EVENT_TYPE_META) as BusEventType[];

/** Types that can be replayed straight into the cloud browser runner. */
export const RERUNNABLE: BusEventType[] = ['command', 'voice'];

const isType = (v: unknown): v is BusEventType =>
  typeof v === 'string' && (EVENT_TYPES as string[]).includes(v);

/** Human-readable one-liner for the row's payload. */
export const summarizePayload = (row: BusActivityRow): string => {
  const p = row.payload ?? {};
  const text = typeof p.text === 'string' ? p.text : '';
  if (text.trim()) return text.trim();
  const label = typeof p.label === 'string' ? p.label : '';
  if (label.trim()) return label.trim();
  if (typeof p.action === 'string') return `action: ${p.action}`;
  const keys = Object.keys(p).filter((k) => !k.startsWith('__'));
  if (!keys.length) return 'No payload attached.';
  return keys.map((k) => `${k}: ${String((p as Record<string, unknown>)[k]).slice(0, 40)}`).join(' · ');
};

/** The replayable command text for a row, if any. */
export const commandText = (row: BusActivityRow): string => {
  const t = row.payload?.text;
  return typeof t === 'string' ? t.trim() : '';
};

export const formatTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

const dayLabel = (d: Date) => {
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Today';
  if (same(d, yest)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
};

/** Group rows (already newest-first) into day buckets. */
export const groupByDay = (rows: BusActivityRow[]): ActivityDay[] => {
  const map = new Map<string, ActivityDay>();
  rows.forEach((row) => {
    const d = new Date(row.createdAt);
    const key = Number.isNaN(d.getTime()) ? 'unknown' : d.toDateString();
    let bucket = map.get(key);
    if (!bucket) {
      bucket = { key, label: Number.isNaN(d.getTime()) ? 'Unknown date' : dayLabel(d), events: [] };
      map.set(key, bucket);
    }
    bucket.events.push(row);
  });
  return Array.from(map.values());
};

/** Server-side query options for the relay ledger. */
export interface ActivityQuery {
  /** Keyword matched server-side against payload text/label and the type column. */
  keyword?: string;
  /** ISO date (yyyy-mm-dd) — inclusive lower bound on created_at. */
  from?: string;
  /** ISO date (yyyy-mm-dd) — inclusive upper bound on created_at. */
  to?: string;
  /** Restrict to these event types (server-side `in` filter). */
  types?: BusEventType[];
  /** Row offset for "Load older events" pagination. */
  offset?: number;
  limit?: number;
}

export const ACTIVITY_PAGE = 60;

const escapeKeyword = (kw: string) => kw.replace(/[,()*]/g, ' ').trim();

/**
 * Fetch a page of the signed-in user's relay ledger, newest first.
 * Keyword + date range + type filters are all applied server-side so the user
 * can dig well past the most recent window.
 */
export const fetchBusActivity = async (
  userId: string,
  query: ActivityQuery = {},
): Promise<{ rows: BusActivityRow[]; error: string | null; hasMore: boolean }> => {
  const limit = query.limit ?? ACTIVITY_PAGE;
  const offset = query.offset ?? 0;
  try {
    let q = supabase
      .from('bus_events')
      .select('id,type,payload,source,created_at')
      .eq('user_id', userId);

    if (query.types?.length) q = q.in('type', query.types);
    if (query.from) q = q.gte('created_at', `${query.from}T00:00:00.000Z`);
    if (query.to) q = q.lte('created_at', `${query.to}T23:59:59.999Z`);

    const kw = escapeKeyword(query.keyword ?? '');
    if (kw) {
      q = q.or(
        [
          `payload->>text.ilike.%${kw}%`,
          `payload->>label.ilike.%${kw}%`,
          `payload->>action.ilike.%${kw}%`,
          `type.ilike.%${kw}%`,
          `source.ilike.%${kw}%`,
        ].join(','),
      );
    }

    const { data, error } = await q
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return { rows: [], error: error.message, hasMore: false };

    const raw = (data ?? []) as Record<string, unknown>[];
    const rows: BusActivityRow[] = raw.map((r) => ({
      id: String(r.id),
      type: isType(r.type) ? r.type : 'command',
      payload: (r.payload as Record<string, unknown>) ?? {},
      source: r.source === 'desktop' || r.source === 'cloud' ? (r.source as BusSource) : 'mobile',

      createdAt: typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    }));

    return { rows, error: null, hasMore: raw.length === limit };
  } catch (e) {
    return {
      rows: [],
      error: e instanceof Error ? e.message : 'Relay ledger unreachable.',
      hasMore: false,
    };
  }
};

/** Per-type totals for the current filter window (counts only, no payloads). */
export const fetchTypeCounts = async (
  userId: string,
  query: Omit<ActivityQuery, 'types' | 'offset' | 'limit'> = {},
): Promise<Record<string, number>> => {
  const { rows } = await fetchBusActivity(userId, { ...query, limit: 300, offset: 0 });
  const counts: Record<string, number> = {};
  rows.forEach((r) => { counts[r.type] = (counts[r.type] ?? 0) + 1; });
  return counts;
};


export const deleteBusEvent = async (id: string): Promise<string | null> => {
  try {
    const { error } = await supabase.from('bus_events').delete().eq('id', id);
    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Could not delete that event.';
  }
};

export const clearBusActivity = async (userId: string): Promise<string | null> => {
  try {
    const { error } = await supabase.from('bus_events').delete().eq('user_id', userId);
    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Could not clear the relay ledger.';
  }
};
