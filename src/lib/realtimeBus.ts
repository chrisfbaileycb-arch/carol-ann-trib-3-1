import { getDeviceKey, uid } from './memoryStore';
import { supabase } from './supabase';

export type BusEventType =
  | 'command'
  | 'voice'
  | 'vision'
  | 'checkin'
  | 'coach'
  | 'presence';

export interface BusEvent {
  id: string;
  type: BusEventType;
  payload: Record<string, unknown>;
  source: 'desktop' | 'mobile';
  ts: string;
}

type Handler = (e: BusEvent) => void;

const handlers = new Set<Handler>();
const CHANNEL = `maggie-remote-${getDeviceKey()}`;
const LOCAL_KEY = 'maggie_bus_event';
const CLIENT_ID = uid('client');
const POLL_MS = 3500;

/**
 * Transport notes
 * ---------------
 * 1. Same-device / same-network surfaces sync instantly through BroadcastChannel
 *    (plus a `storage` event fallback). No websocket is opened — the hosted
 *    Postgres endpoint does not speak the Phoenix protocol.
 * 2. TRUE cross-device sync (phone on cellular driving the desktop workspace)
 *    is achieved by persisting every event to the `bus_events` table and
 *    polling with a since-timestamp cursor. Rows are RLS-scoped to the owner.
 */
let bc: BroadcastChannel | null = null;
let started = false;
let connected = false;

let busUserId: string | null = null;
let pollTimer: number | null = null;
let cursor = new Date(Date.now() - 60_000).toISOString();
let cloudLive = false;
let lastCloudError: string | null = null;
const seen = new Set<string>();

interface CloudRow {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  source: string | null;
  created_at: string;
}

const emit = (evt: BusEvent) => {
  if (seen.has(evt.id)) return;
  seen.add(evt.id);
  if (seen.size > 400) {
    // keep the dedupe set bounded
    const keep = Array.from(seen).slice(-200);
    seen.clear();
    keep.forEach((k) => seen.add(k));
  }
  handlers.forEach((h) => {
    try {
      h(evt);
    } catch {
      /* a bad subscriber must not break the bus */
    }
  });
};

const isBusEvent = (value: unknown): value is BusEvent => {
  if (!value || typeof value !== 'object') return false;
  const e = value as Partial<BusEvent>;
  return typeof e.type === 'string' && typeof e.source === 'string' && !!e.payload;
};

const localHandler = (e: StorageEvent) => {
  if (e.key !== LOCAL_KEY || !e.newValue) return;
  try {
    const evt = JSON.parse(e.newValue) as unknown;
    if (isBusEvent(evt)) emit(evt);
  } catch {
    /* noop */
  }
};

export const isBusConnected = () => connected;
export const isCloudBusLive = () => cloudLive;
export const cloudBusError = () => lastCloudError;

/* ------------------------------------------------------------------ *
 * Cloud relay (cross-device)
 * ------------------------------------------------------------------ */

const pollCloud = async () => {
  if (!busUserId) return;
  try {
    const { data, error } = await supabase
      .from('bus_events')
      .select('id,type,payload,source,created_at')
      .eq('user_id', busUserId)
      .gt('created_at', cursor)
      .order('created_at', { ascending: true })
      .limit(40);

    if (error) {
      cloudLive = false;
      lastCloudError = error.message;
      return;
    }

    cloudLive = true;
    lastCloudError = null;
    const rows = (data ?? []) as CloudRow[];
    rows.forEach((row) => {
      if (row.created_at > cursor) cursor = row.created_at;
      const payload = (row.payload ?? {}) as Record<string, unknown>;
      // ignore the echo of events this very client published
      if (payload.__client === CLIENT_ID) return;
      emit({
        id: row.id,
        type: (row.type as BusEventType) ?? 'command',
        payload,
        source: (row.source as 'desktop' | 'mobile') ?? 'mobile',
        ts: row.created_at,
      });
    });
  } catch (e) {
    cloudLive = false;
    lastCloudError = e instanceof Error ? e.message : 'Cloud relay unreachable';
  }
};

const stopPolling = () => {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
};

/** Attach (or detach) the signed-in account so events relay through the cloud. */
export const setBusUser = (userId: string | null) => {
  if (busUserId === userId) return;
  busUserId = userId;
  stopPolling();
  cloudLive = false;
  lastCloudError = null;
  if (!userId) return;
  cursor = new Date(Date.now() - 60_000).toISOString();
  void pollCloud();
  pollTimer = window.setInterval(() => void pollCloud(), POLL_MS);
};

/** Force an immediate cursor read (used by manual "pull" buttons). */
export const pullBusNow = async () => {
  await pollCloud();
};

const persistCloud = async (evt: BusEvent) => {
  if (!busUserId) return;
  try {
    const { error } = await supabase.from('bus_events').insert({
      user_id: busUserId,
      type: evt.type,
      payload: { ...evt.payload, __client: CLIENT_ID, __localId: evt.id },
      source: evt.source,
    });
    if (error) {
      cloudLive = false;
      lastCloudError = error.message;
    } else {
      cloudLive = true;
      lastCloudError = null;
    }
  } catch (e) {
    cloudLive = false;
    lastCloudError = e instanceof Error ? e.message : 'Cloud relay write failed';
  }
};

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

export const initBus = () => {
  if (started) return;
  started = true;

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(CHANNEL);
      bc.onmessage = (msg: MessageEvent) => {
        if (isBusEvent(msg?.data)) emit(msg.data);
      };
      connected = true;
    }
  } catch {
    bc = null;
    connected = false;
  }

  try {
    window.addEventListener('storage', localHandler);
    connected = true;
  } catch {
    /* noop */
  }
};

export const subscribeBus = (fn: Handler) => {
  initBus();
  handlers.add(fn);
  return () => {
    handlers.delete(fn);
  };
};

export const publishBus = (
  type: BusEventType,
  payload: Record<string, unknown>,
  source: 'desktop' | 'mobile',
) => {
  initBus();
  const evt: BusEvent = { id: uid('bus'), type, payload, source, ts: new Date().toISOString() };
  seen.add(evt.id);
  try {
    bc?.postMessage(evt);
  } catch {
    /* channel closed — local fallback still fires */
  }
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(evt));
  } catch {
    /* noop */
  }
  void persistCloud(evt);
  return evt;
};
