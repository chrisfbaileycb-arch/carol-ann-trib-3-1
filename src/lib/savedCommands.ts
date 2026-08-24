import { supabase } from './supabase';
import { parseIntent } from './browserAgent';

/**
 * Saved command shortcuts (`saved_commands` table, owner-only RLS).
 * Single source of truth for reading/writing one-tap dispatch shortcuts that
 * appear in the phone remote and the Copilot dispatcher.
 */

export interface SavedCommand {
  id: string;
  label: string;
  text: string;
  chainKey: string | null;
  createdAt: string;
}

const mapRow = (r: Record<string, unknown>): SavedCommand => ({
  id: String(r.id),
  label: typeof r.label === 'string' && r.label.trim() ? r.label : String(r.text ?? 'Shortcut'),
  text: typeof r.text === 'string' ? r.text : '',
  chainKey: typeof r.chain_key === 'string' ? r.chain_key : null,
  createdAt: typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
});

/** Trim a command down to a short button label. */
export const shortcutLabel = (text: string, max = 28) => {
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length > max ? `${t.slice(0, max - 1)}…` : t || 'Shortcut';
};

export const fetchSavedCommands = async (
  userId: string,
): Promise<{ rows: SavedCommand[]; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('saved_commands')
      .select('id,label,text,chain_key,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(40);
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
      })
      .select('id,label,text,chain_key,created_at')
      .single();
    if (error) return { row: null, error: error.message };
    return { row: mapRow((data ?? {}) as Record<string, unknown>), error: null };
  } catch (e) {
    return { row: null, error: e instanceof Error ? e.message : 'Could not save that shortcut.' };
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
