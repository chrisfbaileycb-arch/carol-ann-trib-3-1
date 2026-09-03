import React, { useState } from 'react';
import {
  Shield, Key, Search, Download, Trash2, Plus, Lock, CheckCircle2,
  AlertTriangle, RefreshCw, FileText, Tag, Database, Copy, Check
} from 'lucide-react';
import type { MemoryEntry } from '@/data/schemas';

interface MemoryLedgerTabProps {
  memories: MemoryEntry[];
  onAddMemory: (memory: Partial<MemoryEntry>) => void;
  onDeleteMemory: (id: string) => void;
  onClearAllMemories: () => void;
}

export const MemoryLedgerTab: React.FC<MemoryLedgerTabProps> = ({
  memories,
  onAddMemory,
  onDeleteMemory,
  onClearAllMemories,
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('habit');
  const [newTags, setNewTags] = useState<string>('sovereign, local');
  const [copied, setCopied] = useState(false);

  const categories = ['all', 'fitness', 'nutrition', 'family', 'habit', 'schedule', 'general'];

  const filtered = memories.filter((m) => {
    const matchCategory = filter === 'all' || m.category === filter;
    const matchSearch =
      search === '' ||
      m.content.toLowerCase().includes(search.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    onAddMemory({
      content: newContent.trim(),
      category: newCategory as MemoryEntry['category'],
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setNewContent('');
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(memories, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `magdalene-sovereign-ledger-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLedger = () => {
    navigator.clipboard.writeText(JSON.stringify(memories, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full flex-col bg-[#13141E] text-white select-none overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-6 py-4 bg-[#10111A]">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Shield className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-white">Sovereign Memory Ledger</h2>
            <p className="text-xs text-white/45">
              Client-encrypted local vector storage. Zero cloud telemetry. Complete data sovereignty.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLedger}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:text-white transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Archive</span>
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
        {/* Left Form: Add New Memory */}
        <div className="border-r border-white/8 bg-[#101118]/60 p-5 space-y-4 overflow-y-auto m-scroll">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
              <Lock className="h-3.5 w-3.5" />
              <span>Hardware-Bound Ledger</span>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Every memory entry is hashed and indexed locally. Magdalene references these during conversations to personalize without cloud storage.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Add Sovereign Memory
            </p>
            <div>
              <label className="text-[10px] text-white/40 uppercase font-mono">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-[var(--m-accent)]"
              >
                {categories.filter((c) => c !== 'all').map((c) => (
                  <option key={c} value={c} className="bg-[#181926]">
                    {c.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-white/40 uppercase font-mono">Memory Content</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="e.g. Operator prefers cold brew in morning, 15-minute buffers between strategy meetings..."
                rows={4}
                className="mt-1 w-full resize-none rounded-lg border border-white/12 bg-black/40 p-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-[var(--m-accent)] leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[10px] text-white/40 uppercase font-mono">Tags (comma separated)</label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="habits, morning, coffee"
                className="mt-1 w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-[var(--m-accent)]"
              />
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl m-gradient-bg py-2.5 text-xs font-semibold text-white shadow-md hover:brightness-110 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Record to Ledger</span>
            </button>
          </form>

          <div className="border-t border-white/8 pt-3">
            <button
              onClick={() => {
                if (window.confirm('Wipe all sovereign memory records from this local device?')) {
                  onClearAllMemories();
                }
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 py-2 text-xs text-rose-300 hover:bg-rose-500/20 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Wipe Local Memory Vault</span>
            </button>
          </div>
        </div>

        {/* Right Ledger Records Stream */}
        <div className="col-span-2 flex flex-col p-6 overflow-y-auto m-scroll space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`rounded-lg px-2.5 py-1 text-xs capitalize transition ${
                    filter === cat
                      ? 'border border-[var(--m-accent)]/60 bg-[var(--m-accent)]/20 text-white font-medium'
                      : 'border border-white/10 bg-white/[0.02] text-white/45 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ledger..."
                className="bg-transparent text-xs text-white placeholder:text-white/30 outline-none w-36"
              />
            </div>
          </div>

          {/* Records List */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-10 text-center text-xs text-white/40">
                No memories found matching your criteria. Add one using the form on the left.
              </div>
            ) : (
              filtered.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-white/8 bg-[#161724] p-4 space-y-2.5 transition hover:border-white/18"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider text-emerald-400">
                      {m.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/35 font-mono">
                        {new Date(m.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => onDeleteMemory(m.id)}
                        className="text-white/30 hover:text-rose-400 p-1 transition"
                        title="Delete memory entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-white/85 leading-relaxed">{m.content}</p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/6">
                    {m.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-white/5 px-2 py-0.5 text-[9.5px] text-white/45"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryLedgerTab;
