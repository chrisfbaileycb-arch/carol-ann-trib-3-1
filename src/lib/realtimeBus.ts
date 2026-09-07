import { getDeviceKey, uid } from './memoryStore';
import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';

export type BusEventType =
  | 'command'
  | 'voice'
  | 'vision'
  | 'checkin'
  | 'coach'
  | 'copilot'
  | 'presence';

export type BusSource = 'desktop' | 'mobile' | 'cloud';

export interface BusEvent {
  id: string;
  type: BusEventType;
  payload: Record<string, unknown>;
  source: BusSource;
  ts: string;
}

type Handler = (e: BusEvent) => void;

const handlers = new Set<Handler>();
const CHANNEL = `carol-ann-remote-${getDeviceKey()}`;
const LOCAL_KEY = 'carol_ann_bus_event';
const CLIENT_ID = uid('client');

let bc: BroadcastChannel | null = null;
let started = false;
let connected = false;

let busUserId: string | null = null;
let firestoreUnsubscribe: Unsubscribe | null = null;
let cloudLive = false;
let lastCloudError: string | null = null;
const seen = new Set<string>();

const emit = (evt: BusEvent) => {
  if (seen.has(evt.id)) return;
  seen.add(evt.id);
  if (seen.size > 400) {
    const keep = Array.from(seen).slice(-200);
    seen.clear();
    keep.forEach((k) => seen.add(k));
  }
  handlers.forEach((h) => {
    try {
      h(evt);
    } catch {
      /* safe dispatch */
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
 * Live Firestore Cross-Device Relay
 * ------------------------------------------------------------------ */

const stopCloudListener = () => {
  if (firestoreUnsubscribe) {
    firestoreUnsubscribe();
    firestoreUnsubscribe = null;
  }
};

export const setBusUser = (userId: string | null) => {
  if (busUserId === userId && firestoreUnsubscribe) return;
  busUserId = userId;
  stopCloudListener();
  cloudLive = false;
  lastCloudError = null;
  if (!userId) return;

  try {
    const q = query(
      collection(db, 'bus_events'),
      where('userId', '==', userId),
    );

    firestoreUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        cloudLive = true;
        lastCloudError = null;
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const payload = (data.payload ?? {}) as Record<string, unknown>;
            if (payload.__client === CLIENT_ID) return;
            emit({
              id: change.doc.id,
              type: (data.eventType as BusEventType) || 'command',
              payload,
              source: (data.source as BusSource) || 'desktop',
              ts: data.timestamp || new Date().toISOString(),
            });
          }
        });
      },
      (error) => {
        cloudLive = false;
        lastCloudError = error.message;
      }
    );
  } catch (err: unknown) {
    cloudLive = false;
    lastCloudError = err instanceof Error ? err.message : 'Firestore listener error';
  }
};

export const pullBusNow = async () => {
  // Live onSnapshot is real-time; force heartbeat
  cloudLive = true;
};

const persistCloud = async (evt: BusEvent) => {
  if (!busUserId) return;
  try {
    const eventDoc = doc(db, 'bus_events', evt.id);
    await setDoc(eventDoc, {
      id: evt.id,
      userId: busUserId,
      eventType: evt.type,
      payload: { ...evt.payload, __client: CLIENT_ID, __localId: evt.id },
      source: evt.source,
      timestamp: evt.ts,
    });
    cloudLive = true;
    lastCloudError = null;
  } catch (e: unknown) {
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
  source: BusSource,
) => {
  initBus();
  const evt: BusEvent = { id: uid('bus'), type, payload, source, ts: new Date().toISOString() };
  seen.add(evt.id);
  try {
    bc?.postMessage(evt);
  } catch {
    /* fallback */
  }
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(evt));
  } catch {
    /* noop */
  }
  void persistCloud(evt);
  return evt;
};
