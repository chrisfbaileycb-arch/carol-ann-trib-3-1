import { getDeviceKey, uid } from './memoryStore';

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

/**
 * Transport note:
 * The hosted Postgres endpoint used by this project does not speak the Phoenix
 * websocket protocol, so opening a `supabase.channel()` socket made the realtime
 * serializer throw ("r is not iterable") on every inbound frame. The bus now runs
 * on the browser-native BroadcastChannel with a `storage` event fallback, which
 * keeps desktop <-> remote surfaces in sync without any websocket.
 */
let bc: BroadcastChannel | null = null;
let started = false;
let connected = false;

const emit = (evt: BusEvent) => {
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

export const publishBus = (type: BusEventType, payload: Record<string, unknown>, source: 'desktop' | 'mobile') => {
  initBus();
  const evt: BusEvent = { id: uid('bus'), type, payload, source, ts: new Date().toISOString() };
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
  return evt;
};
