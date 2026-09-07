import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { BusEventType, BusSource } from './realtimeBus';

/**
 * Read/maintain layer for the `bus_events` relay ledger backed by Firestore.
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

export const EVENT_TYPE_META: Record<BusEventType, { label: string; tint: string; dot: string }> = {
  command: { label: 'Command', tint: 'border-sky-400/30 bg-sky-400/10 text-sky-200', dot: 'bg-sky-400' },
  voice: { label: 'Voice', tint: 'border-violet-400/30 bg-violet-400/10 text-violet-200', dot: 'bg-violet-400' },
  vision: { label: 'Vision', tint: 'border-amber-400/30 bg-amber-400/10 text-amber-200', dot: 'bg-amber-400' },
  checkin: { label: 'Check-in', tint: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200', dot: 'bg-emerald-400' },
  coach: { label: 'Coach', tint: 'border-rose-400/30 bg-rose-400/10 text-rose-200', dot: 'bg-rose-400' },
  copilot: { label: 'Copilot', tint: 'border-indigo-400/30 bg-indigo-400/10 text-indigo-200', dot: 'bg-indigo-400' },
  presence: { label: 'Presence', tint: 'border-white/20 bg-white/8 text-white/70', dot: 'bg-white/50' },
};

export const EVENT_TYPES = Object.keys(EVENT_TYPE_META) as BusEventType[];
export const RERUNNABLE: BusEventType[] = ['command', 'voice'];

const isType = (v: unknown): v is BusEventType =>
  typeof v === 'string' && (EVENT_TYPES as string[]).includes(v);

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

export const groupByDay = (rows: BusActivityRow[]): ActivityDay[] => {
  const map = new Map<string, ActivityDay>();
  rows.forEach((r) => {
    const d = new Date(r.createdAt);
    const key = Number.isNaN(d.getTime()) ? 'unknown' : d.toISOString().slice(0, 10);
    const label = Number.isNaN(d.getTime()) ? 'Unknown date' : dayLabel(d);
    const bucket = map.get(key) ?? { key, label, events: [] };
    bucket.events.push(r);
    map.set(key, bucket);
  });
  return Array.from(map.values());
};

export interface ActivityQuery {
  types?: BusEventType[];
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  keyword?: string;
  limit?: number;
  offset?: number;
}

export const ACTIVITY_PAGE = 25;

export const fetchBusActivity = async (
  userId: string,
  queryOptions: ActivityQuery = {},
): Promise<{ rows: BusActivityRow[]; error: string | null; hasMore: boolean }> => {
  const limitCount = queryOptions.limit ?? ACTIVITY_PAGE;
  try {
    const q = query(
      collection(db, 'bus_events'),
      where('userId', '==', userId),
    );

    const snap = await getDocs(q);
    let rows: BusActivityRow[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        type: isType(data.eventType) ? (data.eventType as BusEventType) : 'command',
        payload: (data.payload as Record<string, unknown>) ?? {},
        source: data.source === 'desktop' || data.source === 'cloud' ? (data.source as BusSource) : 'mobile',
        createdAt: data.timestamp || new Date().toISOString(),
      };
    });

    // Sort newest-first
    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply in-memory client filters
    if (queryOptions.types?.length) {
      const allowed = new Set(queryOptions.types);
      rows = rows.filter((r) => allowed.has(r.type));
    }
    if (queryOptions.from) {
      const fromTs = new Date(`${queryOptions.from}T00:00:00.000Z`).getTime();
      rows = rows.filter((r) => new Date(r.createdAt).getTime() >= fromTs);
    }
    if (queryOptions.to) {
      const toTs = new Date(`${queryOptions.to}T23:59:59.999Z`).getTime();
      rows = rows.filter((r) => new Date(r.createdAt).getTime() <= toTs);
    }
    if (queryOptions.keyword?.trim()) {
      const kw = queryOptions.keyword.toLowerCase().trim();
      rows = rows.filter((r) => {
        const text = summarizePayload(r).toLowerCase();
        return text.includes(kw) || r.type.toLowerCase().includes(kw) || r.source.toLowerCase().includes(kw);
      });
    }

    const offset = queryOptions.offset ?? 0;
    const paginated = rows.slice(offset, offset + limitCount);
    const hasMore = rows.length > offset + limitCount;

    return { rows: paginated, error: null, hasMore };
  } catch (e: unknown) {
    return {
      rows: [],
      error: e instanceof Error ? e.message : 'Relay ledger unreachable.',
      hasMore: false,
    };
  }
};

export const fetchTypeCounts = async (
  userId: string,
  queryOptions: Omit<ActivityQuery, 'types' | 'offset' | 'limit'> = {},
): Promise<Record<string, number>> => {
  const { rows } = await fetchBusActivity(userId, { ...queryOptions, limit: 300, offset: 0 });
  const counts: Record<string, number> = {};
  rows.forEach((r) => {
    counts[r.type] = (counts[r.type] ?? 0) + 1;
  });
  return counts;
};

export const deleteBusEvent = async (id: string): Promise<string | null> => {
  try {
    await deleteDoc(doc(db, 'bus_events', id));
    return null;
  } catch (e: unknown) {
    return e instanceof Error ? e.message : 'Could not delete that event.';
  }
};

export const clearBusActivity = async (userId: string): Promise<string | null> => {
  try {
    const q = query(collection(db, 'bus_events'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    return null;
  } catch (e: unknown) {
    return e instanceof Error ? e.message : 'Could not clear the relay ledger.';
  }
};
