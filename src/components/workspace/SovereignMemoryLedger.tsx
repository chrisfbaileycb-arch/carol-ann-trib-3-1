import React, { useState } from 'react';
import {
  Shield, Download, Trash2, Plus, Search, Filter,
  FileJson, FileText, Lock, Key, Check, Sparkles, Heart,
  Dumbbell, Utensils, Users, Briefcase, Calendar, CheckCircle2, Cloud
} from 'lucide-react';
import type { CheckInRecord, MemoryEntry, MyDaySession, UserProfile } from '@/data/schemas';
import { isLightTheme } from '@/data/intake';
import {
  loadMemories, saveMemories, loadCheckIns, saveCheckIns,
  loadSessions, saveSessions, exportJSON, exportMarkdown,
  clearLocalLedger, getDeviceKey, uid
} from '@/lib/memoryStore';

interface SovereignMemoryLedgerProps {
  profile: UserProfile;
}

export const SovereignMemoryLedger: React.FC<SovereignMemoryLedgerProps> = ({ profile }) => {
  const isLight = isLightTheme(profile);
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
    <div className={`flex h-full flex-col bg-transparent select-none overflow-hidden transition-colors ${
      isLight ? 'text-slate-800' : 'text-white'
    }`}>
      {/* Top Banner */}
      <div className={`flex shrink-0 items-center justify-between border-b px-6 py-3 backdrop-blur-md ${
        isLight ? 'border-rose-200/60 bg-white/75' : 'border-white/8 bg-zinc-950/75'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`grid h-8 w-8 place-items-center rounded-xl ${
            isLight ? 'bg-emerald-500/15 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            <Shield className="h-4 w-4" />
          </span>
          <div>
            <h1 className={`font-display text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Sovereign Memory Ledger
            </h1>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
              Local-First On-Device Vault · Hardware-Bound Storage · Sovereign Operator Control
            </p>
          </div>
        </div>

        {/* Export & Security Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportJSON}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition ${
              isLight
                ? 'border-rose-200 bg-white text-slate-700 hover:bg-rose-50'
                : 'border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/10'
            }`}
          >
            <FileJson className="h-3.5 w-3.5 text-sky-500" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={exportMarkdown}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition ${
              isLight
                ? 'border-rose-200 bg-white text-slate-700 hover:bg-rose-50'
                : 'border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/10'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-amber-500" />
            <span>Export Markdown</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="m-scroll flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Device & Encryption Status Bar */}
        <div className={`rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md ${
          isLight ? 'border-rose-200/80 bg-white/85 text-slate-800 shadow-sm' : 'border-white/10 bg-white/[0.02]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`grid h-9 w-9 place-items-center rounded-xl ${
              isLight ? 'bg-emerald-500/15 text-emerald-600' : 'bg-emerald-500/15 text-emerald-400'
            }`}>
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Local Device Memory Vault</p>
              <p className={`text-[10.5px] font-mono truncate max-w-sm ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
                Device Key: {deviceKey}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Local-First Storage · Zero External Cloud Transmission
            </span>
            <span className={isLight ? 'text-slate-300' : 'text-white/40'}>|</span>
            <span className={isLight ? 'text-slate-600 font-medium' : 'text-white/60'}>
              {memories.length} Memories · {checkIns.length} Check-ins
            </span>
          </div>
        </div>

        {/* Memories Explorer Section */}
        <div className={`rounded-2xl border p-5 space-y-4 backdrop-blur-md ${
          isLight ? 'border-rose-200/80 bg-white/90 text-slate-800 shadow-md' : 'border-white/10 bg-white/[0.02]'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className={`font-display text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Memories & Personal Index
            </h2>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1 rounded-lg m-gradient-bg px-3 py-1.5 text-[11px] font-semibold text-white shadow hover:brightness-110 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Memory</span>
            </button>
          </div>

          {/* New Memory Form Drawer */}
          {isAdding && (
            <div className={`rounded-xl border p-4 space-y-3 ${
              isLight ? 'border-rose-200 bg-rose-50/50' : 'border-[var(--m-accent)]/40 bg-[var(--m-accent)]/10'
            }`}>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Enter personal memory, dietary rule, schedule habit, or training nuance..."
                rows={2}
                className={`w-full resize-none rounded-lg border p-2.5 text-xs outline-none ${
                  isLight
                    ? 'border-rose-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-rose-400'
                    : 'border-white/10 bg-black/40 text-white placeholder:text-white/30 focus:border-white/30'
                }`}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as MemoryEntry['category'])}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] outline-none ${
                      isLight
                        ? 'border-rose-200 bg-white text-slate-900'
                        : 'border-white/10 bg-black/40 text-white'
                    }`}
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
                    className={`rounded-lg border px-2.5 py-1 text-[11px] outline-none ${
                      isLight
                        ? 'border-rose-200 bg-white text-slate-900 placeholder:text-slate-400'
                        : 'border-white/10 bg-black/40 text-white placeholder:text-white/30'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAdding(false)}
                    className={`px-2.5 py-1 text-[11px] ${
                      isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/50 hover:text-white'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMemory}
                    className="rounded-lg bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-white shadow hover:bg-emerald-600 transition"
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
                      ? isLight
                        ? 'border border-rose-400 bg-rose-100 text-slate-900 font-semibold'
                        : 'border border-[var(--m-accent)] bg-[var(--m-accent)]/20 text-white'
                      : isLight
                      ? 'border border-rose-200 bg-white/70 text-slate-600 hover:text-slate-900 hover:border-rose-300'
                      : 'border border-white/8 bg-white/[0.02] text-white/50 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative min-w-[200px]">
              <Search className={`absolute left-2.5 top-2.5 h-3.5 w-3.5 ${
                isLight ? 'text-slate-400' : 'text-white/30'
              }`} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ledger..."
                className={`w-full rounded-lg border pl-8 pr-3 py-1.5 text-xs outline-none transition ${
                  isLight
                    ? 'border-rose-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-rose-400'
                    : 'border-white/10 bg-white/[0.02] text-white placeholder:text-white/30 focus:border-white/25'
                }`}
              />
            </div>
          </div>

          {/* Memories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {filteredMemories.length === 0 ? (
              <div className={`col-span-full rounded-2xl border border-dashed p-10 text-center ${
                isLight ? 'border-rose-200 bg-white/50' : 'border-white/10 bg-white/[0.01]'
              }`}>
                <Shield className={`h-8 w-8 mx-auto mb-2 ${isLight ? 'text-rose-400' : 'text-emerald-400/60'}`} />
                <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  Your memory ledger is empty. What I know about you starts right here.
                </h3>
                <p className={`text-xs mt-1.5 max-w-md mx-auto ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                  As you interact with Carol Ann or add entries above, your personal preferences, schedule habits, and routines will be stored strictly on this device.
                </p>
              </div>
            ) : (
              filteredMemories.map((m) => (
                <article
                  key={m.id}
                  aria-label={`Memory entry: ${m.category} - ${m.content.slice(0, 40)}`}
                  className={`group relative rounded-xl border p-3.5 text-xs space-y-2 transition ${
                    isLight
                      ? 'border-rose-200/80 bg-white/90 hover:border-rose-300 text-slate-800 shadow-xs'
                      : 'border-white/8 bg-white/[0.02] text-white/80 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`uppercase font-mono tracking-wider font-semibold ${
                      isLight ? 'text-rose-600' : 'text-[var(--m-accent-soft)]'
                    }`}>
                      {m.category}
                    </span>
                    <span className={isLight ? 'text-slate-400' : 'text-white/40'}>
                      Recalled: {m.last_recalled}
                    </span>
                  </div>
                  <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/85'}`}>{m.content}</p>
                  <div className={`flex items-center justify-between pt-1 border-t text-[10px] ${
                    isLight ? 'border-rose-100' : 'border-white/6'
                  }`}>
                    <div className="flex flex-wrap gap-1">
                      {m.tags.map((t, idx) => (
                        <span key={idx} className={`rounded px-1.5 py-0.5 ${
                          isLight ? 'bg-rose-50 text-slate-600 border border-rose-100' : 'bg-white/5 text-white/50'
                        }`}>
                          #{t}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleDeleteMemory(m.id)}
                      className={`opacity-0 group-hover:opacity-100 p-1 transition ${
                        isLight ? 'text-slate-400 hover:text-rose-600' : 'text-white/30 hover:text-rose-400'
                      }`}
                      title="Delete Memory"
                      aria-label="Delete Memory"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        {/* Daily Check-In History */}
        <div className={`rounded-2xl border p-5 space-y-4 backdrop-blur-md ${
          isLight ? 'border-rose-200/80 bg-white/90 text-slate-800 shadow-md' : 'border-white/10 bg-white/[0.02]'
        }`}>
          <h2 className={`font-display text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Daily Wellness & Readiness Check-Ins
          </h2>
          <div className="space-y-2">
            {checkIns.map((ci) => (
              <div
                key={ci.id}
                className={`flex items-center justify-between rounded-xl border p-3 text-xs ${
                  isLight ? 'border-rose-100 bg-rose-50/30' : 'border-white/8 bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`grid h-7 w-7 place-items-center rounded-lg ${
                    isLight ? 'bg-rose-100 text-rose-600' : 'bg-white/5 text-white/70'
                  }`}>
                    <Heart className="h-3.5 w-3.5 text-rose-500" />
                  </span>
                  <div>
                    <p className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{ci.label}</p>
                    <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-white/55'}`}>{ci.notes}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-white/35'}`}>
                  {new Date(ci.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Ledger Wipe Zone */}
        <div className={`rounded-2xl border p-5 flex items-center justify-between backdrop-blur-md ${
          isLight ? 'border-rose-300 bg-rose-50/70' : 'border-rose-500/20 bg-rose-500/5'
        }`}>
          <div>
            <h3 className={`font-display text-xs font-bold ${isLight ? 'text-rose-900' : 'text-rose-300'}`}>
              Wipe Local Device Ledger
            </h3>
            <p className={`text-[11px] mt-0.5 ${isLight ? 'text-rose-700/80' : 'text-rose-200/60'}`}>
              Permanently destroys all memories, threads, and check-in history stored on this machine.
            </p>
          </div>
          {wipeConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWipeConfirm(false)}
                className={`px-3 py-1.5 text-xs ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'}`}
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
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                isLight
                  ? 'border-rose-300 bg-white text-rose-700 hover:bg-rose-100'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
              }`}
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
