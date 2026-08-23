import { supabase } from '@/lib/supabase';
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

/* eslint-disable @typescript-eslint/no-explicit-any */
let channel: any = null;
let connected = false;

const localHandler = (e: StorageEvent) => {
  if (e.key !== LOCAL_KEY || !e.newValue) return;
  try {
    const evt = JSON.parse(e.newValue) as BusEvent;
    handlers.forEach((h) => h(evt));
  } catch {
    /* noop */
  }
};

export const isBusConnected = () => connected;

export const initBus = () => {
  if (channel) return;
  try {
    const client = supabase as any;
    channel = client.channel(CHANNEL, { config: { broadcast: { self: false } } });
    channel
      .on('broadcast', { event: 'bus' }, (msg: any) => {
        if (msg?.payload) handlers.forEach((h) => h(msg.payload as BusEvent));
      })
      .subscribe((status: string) => {
        connected = status === 'SUBSCRIBED';
      });
  } catch {
    connected = false;
    channel = null;
  }
  try {
    window.addEventListener('storage', localHandler);
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
  const evt: BusEvent = { id: uid('bus'), type, payload, source, ts: new Date().toISOString() };
  try {
    channel?.send({ type: 'broadcast', event: 'bus', payload: evt });
  } catch {
    /* offline — local fallback still fires */
  }
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(evt));
  } catch {
    /* noop */
  }
  return evt;
};
