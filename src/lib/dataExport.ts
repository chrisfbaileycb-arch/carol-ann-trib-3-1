import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { LEDGER_COLLECTIONS } from '@/contexts/AuthContext';

export const EXPORT_COLLECTIONS = [...LEDGER_COLLECTIONS, 'bus_events'] as const;
export type ExportCollection = (typeof EXPORT_COLLECTIONS)[number];

export interface ExportProgress {
  table: ExportCollection | 'bundle';
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

const fetchAllRows = async (
  collectionName: string,
  userId: string,
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> => {
  try {
    let q;
    if (collectionName === 'bus_events') {
      q = query(collection(db, 'bus_events'), where('userId', '==', userId));
    } else {
      q = collection(db, 'users', userId, collectionName);
    }
    const snap = await getDocs(q);
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { rows, error: null };
  } catch (e: unknown) {
    return { rows: [], error: e instanceof Error ? e.message : 'Fetch error' };
  }
};

const csvCell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const raw = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
};

export const toCSV = (rows: Record<string, unknown>[]): string => {
  if (!rows.length) return '';
  const cols = Array.from(
    rows.reduce<Set<string>>((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
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

export const runDataExport = async (
  userId: string,
  email: string | null,
  onProgress?: (p: ExportProgress) => void,
): Promise<ExportResult> => {
  const total = EXPORT_COLLECTIONS.length;
  const counts: Record<string, number> = {};
  const errors: string[] = [];
  const files: { name: string; blob: Blob }[] = [];
  const tables: Record<string, Record<string, unknown>[]> = {};

  for (let i = 0; i < total; i += 1) {
    const col = EXPORT_COLLECTIONS[i];
    const { rows, error } = await fetchAllRows(col, userId);
    if (error) errors.push(`${col}: ${error}`);
    tables[col] = rows;
    counts[col] = rows.length;
    if (rows.length) {
      files.push({
        name: `carol-ann-${col}.csv`,
        blob: new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8' }),
      });
    }
    onProgress?.({ table: col, index: i + 1, total, rows: rows.length, done: false });
  }

  const bundle = {
    export_version: 1,
    generated_at: new Date().toISOString(),
    backend: 'firebase_firestore',
    account: { id: userId, email },
    row_counts: counts,
    collections: tables,
  };

  files.unshift({
    name: 'carol-ann-export.json',
    blob: new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }),
  });

  onProgress?.({ table: 'bundle', index: total, total, rows: 0, done: true });
  return { bundle, counts, files, errors };
};

export const downloadExportFiles = (files: { name: string; blob: Blob }[]) => {
  files.forEach((f, i) => {
    window.setTimeout(() => downloadBlob(f.blob, f.name), i * 350);
  });
};
