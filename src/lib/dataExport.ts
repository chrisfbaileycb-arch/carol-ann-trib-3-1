import { supabase } from './supabase';
import { LEDGER_TABLES } from '@/contexts/AuthContext';

/**
 * Full-account data export.
 * Pulls every row the signed-in user owns across the ledger tables plus the
 * cross-device relay ledger, then hands back a single JSON bundle and one CSV
 * per table. Progress is reported table-by-table so the UI can show a bar.
 */

/** Single source of truth for what gets exported (ledger tables + relay). */
export const EXPORT_TABLES = [...LEDGER_TABLES, 'bus_events'] as const;
export type ExportTable = (typeof EXPORT_TABLES)[number];

export interface ExportProgress {
  table: ExportTable | 'bundle';
  index: number;
  total: number;
  rows: number;
  done: boolean;
}

export interface ExportResult {
  bundle: Record<string, unknown>;
  counts: Record<string, number>;
  files: { name: string; blob: Blob }[];
  errors: string[];
}

const PAGE = 1000;

const fetchAllRows = async (
  table: string,
  userId: string,
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> => {
  const rows: Record<string, unknown>[] = [];
  let from = 0;
  for (let guard = 0; guard < 25; guard += 1) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .range(from, from + PAGE - 1);
    if (error) return { rows, error: error.message };
    const batch = (data ?? []) as Record<string, unknown>[];
    rows.push(...batch);
    if (batch.length < PAGE) break;
    from += PAGE;
  }
  return { rows, error: null };
};

const csvCell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const raw =
    typeof value === 'object' ? JSON.stringify(value) : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
};

/** Convert an array of row objects into a CSV string (union of all keys). */
export const toCSV = (rows: Record<string, unknown>[]): string => {
  if (!rows.length) return '';
  const cols = Array.from(rows.reduce<Set<string>>((set, r) => {
    Object.keys(r).forEach((k) => set.add(k));
    return set;
  }, new Set<string>()));
  const head = cols.join(',');
  const body = rows.map((r) => cols.map((c) => csvCell(r[c])).join(',')).join('\n');
  return `${head}\n${body}`;
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
};

/**
 * Run the export. Calls `onProgress` after every table so the caller can
 * render a live progress indicator, then returns the JSON bundle + CSV files.
 */
export const runDataExport = async (
  userId: string,
  email: string | null,
  onProgress?: (p: ExportProgress) => void,
): Promise<ExportResult> => {
  const total = EXPORT_TABLES.length;
  const counts: Record<string, number> = {};
  const errors: string[] = [];
  const files: { name: string; blob: Blob }[] = [];
  const tables: Record<string, Record<string, unknown>[]> = {};

  for (let i = 0; i < total; i += 1) {
    const table = EXPORT_TABLES[i];
    const { rows, error } = await fetchAllRows(table, userId);
    if (error) errors.push(`${table}: ${error}`);
    tables[table] = rows;
    counts[table] = rows.length;
    if (rows.length) {
      files.push({
        name: `maggie-${table}.csv`,
        blob: new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8' }),
      });
    }
    onProgress?.({ table, index: i + 1, total, rows: rows.length, done: false });
  }

  const bundle = {
    export_version: 1,
    generated_at: new Date().toISOString(),
    account: { id: userId, email },
    row_counts: counts,
    tables,
  };

  files.unshift({
    name: 'maggie-export.json',
    blob: new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }),
  });

  onProgress?.({ table: 'bundle', index: total, total, rows: 0, done: true });
  return { bundle, counts, files, errors };
};

/** Trigger the browser download of every produced file (staggered). */
export const downloadExportFiles = (files: { name: string; blob: Blob }[]) => {
  files.forEach((f, i) => {
    window.setTimeout(() => downloadBlob(f.blob, f.name), i * 350);
  });
};
