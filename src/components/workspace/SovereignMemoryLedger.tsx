import React, { useState } from 'react';
import {
  Shield, Download, Trash2, Plus, Search, Filter,
  FileJson, FileText, Lock, Key, Check, Sparkles, Heart,
  Dumbbell, Utensils, Users, Briefcase, Calendar, CheckCircle2
} from 'lucide-react';
import type { CheckInRecord, MemoryEntry, MyDaySession, UserProfile } from '@/data/schemas';
import {
  loadMemories, saveMemories, loadCheckIns, saveCheckIns,
  loadSessions, saveSessions, exportJSON, exportMarkdown,
  clearLocalLedger, getDeviceKey, uid
} from '@/lib/memoryStore';

interface SovereignMemoryLedgerProps {
  profile: UserProfile;
}

export const SovereignMemoryLedger: React.FC<SovereignMemoryLedgerProps> = ({ profile }) => {
  const [memories, setMemories] = useState<MemoryEntry[]>(() => loadMemories());
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>(() => loadCheckIns());
  const [sessions, setSessions] = useState<MyDaySession[]>(() => loadSessions());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryEntry['category']>('habit');
  const [newTags, setNewTags] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [wipeConfirm, setWipeConfirm] = useState(false);

  const deviceKey = getDeviceKey();

  const handleAddMemory = () => {
    if (!newContent.trim()) return;
    const entry: MemoryEntry = {
      id: uid('mem'),
      category: newCategory,
      content: newContent.trim(),
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
      last_recalled: new Date().toISOString().slice(0, 10),
    };
    const updated = [entry, ...memories];
    setMemories(updated);
    saveMemories(updated);
    setNewContent('');
    setNewTags('');
    setIsAdding(false);
  };

  const handleDeleteMemory = (id: string) => {
    const updated = memories.filter((m) => m.id !== id);
    setMemories(updated);
    saveMemories(updated);
  };

  const handleWipe = () => {
    clearLocalLedger();
    setMemories([]);
    setCheckIns([]);
    setSessions([]);
    setWipeConfirm(false);
  };

  const filteredMemories = memories.filter((m) => {
    const matchesCat = activeCategory === 'all' || m.category === activeCategory;
    const matchesSearch =
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex h-full flex-col bg-[#11121A] text-white select-none overflow-hidden">
      {/* Top Banner */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 bg-[#151622] px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/20 text-emerald-300">
            <Shield className="h-4 w-4" />
          </span>
          <div>
            <h1 className="font-display text-sm font-semibold">Sovereign Memory Ledger</h1>
            <p className="text-[10px] text-white/45">Local-First Storage · Zero External Data Leaks · Full Operator Ownership</p>
          </div>
        </div>

        {/* Export & Security Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/80 hover:bg-white/10 transition"
          >
            <FileJson className="h-3.5 w-3.5 text-sky-400" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={exportMarkdown}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/80 hover:bg-white/10 transition"
          >
            <FileText className="h-3.5 w-3.5 text-amber-300" />
            <span>Export Markdown</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="m-scroll flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Device & Encryption Status Bar */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Device Cryptographic Ledger</p>
              <p className="text-[10.5px] text-white/45 font-mono truncate max-w-sm">
                Key: {deviceKey}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> 100% Local Device Isolation
            </span>
            <span className="text-white/40">|</span>
            <span className="text-white/60">
              {memories.length} Memories · {checkIns.length} Check-ins
            </span>
          </div>
        </div>

        {/* Memories Explorer Section */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-sm font-bold text-white">Memories & Personal Index</h2>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1 rounded-lg m-gradient-bg px-3 py-1.5 text-[11px] font-semibold text-white shadow"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Memory</span>
            </button>
          </div>

          {/* New Memory Form Drawer */}
          {isAdding && (
            <div className="rounded-xl border border-[var(--m-accent)]/40 bg-[var(--m-accent)]/10 p-4 space-y-3">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Enter personal memory, dietary rule, schedule habit, or training nuance..."
                rows={2}
                className="w-full resize-none rounded-lg border border-white/10 bg-black/40 p-2.5 text-xs text-white placeholder:text-white/30 outline-none"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as MemoryEntry['category'])}
                    className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] text-white outline-none"
                  >
                    <option value="habit">Habit</option>
                    <option value="fitness">Fitness</option>
                    <option value="nutrition">Nutrition</option>
                    <option value="preference">Preference</option>
                    <option value="family">Family</option>
                    <option value="people">People</option>
                  </select>
                  <input
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="Tags (comma separated)"
                    className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] text-white placeholder:text-white/30 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="px-2.5 py-1 text-[11px] text-white/50 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMemory}
                    className="rounded-lg bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-black"
                  >
                    Save Memory
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search & Category Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {['all', 'fitness', 'nutrition', 'habit', 'preference', 'family'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium capitalize transition ${
                    activeCategory === cat
                      ? 'border border-[var(--m-accent)] bg-[var(--m-accent)]/20 text-white'
                      : 'border border-white/8 bg-white/[0.02] text-white/50 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/30" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ledger..."
                className="w-full rounded-lg border border-white/10 bg-white/[0.02] pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/25"
              />
            </div>
          </div>

          {/* Memories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {filteredMemories.map((m) => (
              <div
                key={m.id}
                className="group relative rounded-xl border border-white/8 bg-white/[0.02] p-3.5 text-xs text-white/80 space-y-2 hover:border-white/20 transition"
              >
                <div className="flex items-center justify-between text-[10px] text-white/40">
                  <span className="uppercase font-mono tracking-wider font-semibold text-[var(--m-accent-soft)]">
                    {m.category}
                  </span>
                  <span>Recalled: {m.last_recalled}</span>
                </div>
                <p className="leading-relaxed">{m.content}</p>
                <div className="flex items-center justify-between pt-1 border-t border-white/6 text-[10px]">
                  <div className="flex flex-wrap gap-1">
                    {m.tags.map((t, idx) => (
                      <span key={idx} className="rounded bg-white/5 px-1.5 py-0.5 text-white/50">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleDeleteMemory(m.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-rose-400 transition"
                    title="Delete Memory"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Check-In History */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          <h2 className="font-display text-sm font-bold text-white">Daily Wellness & Readiness Check-Ins</h2>
          <div className="space-y-2">
            {checkIns.map((ci) => (
              <div
                key={ci.id}
                className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-white/70">
                    <Heart className="h-3.5 w-3.5 text-rose-400" />
                  </span>
                  <div>
                    <p className="font-semibold text-white">{ci.label}</p>
                    <p className="text-[11px] text-white/55">{ci.notes}</p>
                  </div>
                </div>
                <span className="text-[10px] text-white/35 font-mono">
                  {new Date(ci.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Ledger Wipe Zone */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 flex items-center justify-between">
          <div>
            <h3 className="font-display text-xs font-bold text-rose-300">Wipe Local Device Ledger</h3>
            <p className="text-[11px] text-rose-200/60 mt-0.5">
              Permanently destroys all memories, threads, and check-in history stored on this machine.
            </p>
          </div>
          {wipeConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWipeConfirm(false)}
                className="px-3 py-1.5 text-xs text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleWipe}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
              >
                Confirm Wipe
              </button>
            </div>
          ) : (
            <button
              onClick={() => setWipeConfirm(true)}
              className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20"
            >
              Wipe Ledger
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SovereignMemoryLedger;
