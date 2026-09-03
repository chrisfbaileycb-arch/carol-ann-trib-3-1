import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Initialize database client strictly from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// Fallback to local memory ledger mode when cloud credentials are not supplied
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('https://localhost.supabase.local', 'anon-local-key');
