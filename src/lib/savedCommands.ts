import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { parseIntent } from './browserAgent';
import { uid } from './memoryStore';

export interface SavedCommand {
  id: string;
  label: string;
  text: string;
  chainKey: string | null;
  groupName: string;
  position: number;
  createdAt: string;
}

export const DEFAULT_GROUP = 'General';

export const GROUP_SUGGESTIONS = [
  'General',
  'Groceries',
  'Fitness',
  'Work',
  'Home',
  'Travel',
  'Errands',
] as const;

export const shortcutLabel = (text: string, max = 28) => {
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length > max ? `${t.slice(0, max - 1)}…` : t || 'Shortcut';
};

export const groupShortcuts = (rows: SavedCommand[]): { name: string; items: SavedCommand[] }[] => {
  const map = new Map<string, SavedCommand[]>();
  rows.forEach((r) => {
    const key = r.groupName || DEFAULT_GROUP;
    const bucket = map.get(key);
    if (bucket) bucket.push(r);
    else map.set(key, [r]);
  });
  return [...map.entries()].map(([name, items]) => ({ name, items }));
};

export const fetchSavedCommands = async (
  userId: string,
): Promise<{ rows: SavedCommand[]; error: string | null }> => {
  try {
    const collRef = collection(db, 'users', userId, 'scheduled_commands');
    const snap = await getDocs(collRef);
    const rows: SavedCommand[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        label: data.label || data.name || shortcutLabel(data.text || data.prompt || 'Shortcut'),
        text: data.text || data.prompt || '',
        chainKey: data.chainKey || null,
        groupName: data.groupName || DEFAULT_GROUP,
        position: typeof data.position === 'number' ? data.position : 0,
        createdAt: data.createdAt || new Date().toISOString(),
      };
    });
    rows.sort((a, b) => a.position - b.position);
    return { rows, error: null };
  } catch (e: unknown) {
    return { rows: [], error: e instanceof Error ? e.message : 'Shortcuts unavailable.' };
  }
};

export const saveCommand = async (
  userId: string,
  text: string,
  label?: string,
  groupName?: string,
): Promise<{ row: SavedCommand | null; error: string | null }> => {
  const clean = text.trim();
  if (!clean) return { row: null, error: 'Nothing to save.' };
  const id = uid('cmd');
  const intent = parseIntent(clean);
  const newRow: SavedCommand = {
    id,
    label: (label ?? shortcutLabel(clean)).trim(),
    text: clean,
    chainKey: intent?.key ?? null,
    groupName: (groupName ?? DEFAULT_GROUP).trim() || DEFAULT_GROUP,
    position: Date.now() % 100000,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, 'users', userId, 'scheduled_commands', id);
    await setDoc(docRef, {
      id,
      userId,
      name: newRow.label,
      prompt: newRow.text,
      chainKey: newRow.chainKey,
      groupName: newRow.groupName,
      position: newRow.position,
      schedule: '0 * * * *',
      active: true,
      createdAt: newRow.createdAt,
    });
    return { row: newRow, error: null };
  } catch (e: unknown) {
    return { row: null, error: e instanceof Error ? e.message : 'Could not save that shortcut.' };
  }
};

export const updateSavedCommand = async (
  userId: string,
  id: string,
  patch: { label?: string; groupName?: string },
): Promise<string | null> => {
  try {
    const docRef = doc(db, 'users', userId, 'scheduled_commands', id);
    const body: Record<string, unknown> = {};
    if (patch.label) body.name = patch.label;
    if (patch.groupName) body.groupName = patch.groupName;
    await updateDoc(docRef, body);
    return null;
  } catch (e: unknown) {
    return e instanceof Error ? e.message : 'Could not update that shortcut.';
  }
};

export const reorderSavedCommands = async (userId: string, rows: SavedCommand[]): Promise<string | null> => {
  try {
    const batch = writeBatch(db);
    rows.forEach((r, idx) => {
      const docRef = doc(db, 'users', userId, 'scheduled_commands', r.id);
      batch.update(docRef, { position: idx });
    });
    await batch.commit();
    return null;
  } catch (e: unknown) {
    return e instanceof Error ? e.message : 'Could not save the new order.';
  }
};

export const deleteSavedCommand = async (userId: string, id: string): Promise<string | null> => {
  try {
    const docRef = doc(db, 'users', userId, 'scheduled_commands', id);
    await deleteDoc(docRef);
    return null;
  } catch (e: unknown) {
    return e instanceof Error ? e.message : 'Could not remove that shortcut.';
  }
};
