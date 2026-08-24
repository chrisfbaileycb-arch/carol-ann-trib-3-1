import { supabase } from './supabase';
import { parseIntent } from './browserAgent';

/**
 * Saved command shortcuts (`saved_commands` table, owner-only RLS).
 * Single source of truth for reading/writing one-tap dispatch shortcuts that
 * appear in the phone remote and the Copilot dispatcher, including their
 * group name and manual ordering.
 */

export interface SavedCommand {
  id: string;
  label: string;
  text: string;
  chainKey: string | null;
  groupName: string;
  position: number;
  createdAt: string;
}

/** Default group bucket used when a shortcut has no explicit group. */
export const DEFAULT_GROUP = 'General';

/** Suggested group headings offered in the rename/group editor. */
export const GROUP_SUGGESTIONS = [
  'General',
  'Groceries',
  'Fitness',
  'Work',
  'Home',
  'Travel',
  'Errands',
] as const;

const mapRow = (r: Record<string, unknown>): SavedCommand => ({
  id: String(r.id),
  label: typeof r.label === 'string' && r.label.trim() ? r.label : String(r.text ?? 'Shortcut'),
  text: typeof r.text === 'string' ? r.text : '',
  chainKey: typeof r.chain_key === 'string' ? r.chain_key : null,
  groupName:
    typeof r.group_name === 'string' && r.group_name.trim() ? r.group_name.trim() : DEFAULT_GROUP,
  position: typeof r.position === 'number' ? r.position : 0,
  createdAt: typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
});

const SELECT = 'id,label,text,chain_key,group_name,position,created_at';

/** Trim a command down to a short button label. */
export const shortcutLabel = (text: string, max = 28) => {
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length > max ? `${t.slice(0, max - 1)}…` : t || 'Shortcut';
};

/** Bucket shortcuts under their group heading, preserving list order. */
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
    const { data, error } = await supabase
      .from('saved_commands')
      .select(SELECT)
      .eq('user_id', userId)
      .order('group_name', { ascending: true })
      .order('position', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(80);
    if (error) return { rows: [], error: error.message };
    return { rows: ((data ?? []) as Record<string, unknown>[]).map(mapRow), error: null };
  } catch (e) {
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
  try {
    const intent = parseIntent(clean);
    const { data, error } = await supabase
      .from('saved_commands')
      .insert({
        user_id: userId,
        label: (label ?? shortcutLabel(clean)).trim(),
        text: clean,
        chain_key: intent?.key ?? null,
        group_name: (groupName ?? DEFAULT_GROUP).trim() || DEFAULT_GROUP,
        position: Date.now() % 100000,
      })
      .select(SELECT)
      .single();
    if (error) return { row: null, error: error.message };
    return { row: mapRow((data ?? {}) as Record<string, unknown>), error: null };
  } catch (e) {
    return { row: null, error: e instanceof Error ? e.message : 'Could not save that shortcut.' };
  }
};

/** Rename a shortcut and/or move it into a different group heading. */
export const updateSavedCommand = async (
  id: string,
  patch: { label?: string; groupName?: string },
): Promise<string | null> => {
  const body: Record<string, unknown> = {};
  if (typeof patch.label === 'string') body.label = patch.label.trim() || 'Shortcut';
  if (typeof patch.groupName === 'string') body.group_name = patch.groupName.trim() || DEFAULT_GROUP;
  if (!Object.keys(body).length) return null;
  try {
    const { error } = await supabase.from('saved_commands').update(body).eq('id', id);
    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Could not update that shortcut.';
  }
};

/** Persist a new manual ordering — index in the array becomes `position`. */
export const reorderSavedCommands = async (rows: SavedCommand[]): Promise<string | null> => {
  try {
    const results = await Promise.all(
      rows.map((r, i) =>
        supabase.from('saved_commands').update({ position: i }).eq('id', r.id),
      ),
    );
    const failed = results.find((r) => r.error);
    return failed?.error ? failed.error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Could not save the new order.';
  }
};

export const deleteSavedCommand = async (id: string): Promise<string | null> => {
  try {
    const { error } = await supabase.from('saved_commands').delete().eq('id', id);
    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Could not remove that shortcut.';
  }
};
