import React, { useState, useMemo } from 'react';
import {
  Plus, Image as ImageIcon, Film, FileText, Sparkles, Cpu, X,
  ExternalLink, Download, Check, Search, Maximize2, Zap,
  FileCode, Layers, Eye, ChevronDown, ChevronUp, Clock
} from 'lucide-react';
import type { ChatAttachment, MemoryEntry, UserProfile } from '@/data/schemas';
import { MCP_PLUGINS_DIRECTORY, loadInstalledPluginIds, type MCPPlugin } from '@/data/mcpPlugins';
import { SAAS_CONNECTORS_DIRECTORY, loadConnectedSaasIds, type SaaSConnector } from '@/data/saasConnectors';

interface AttachmentPlusMenuProps {
  onSelectPhoto: () => void;
  onSelectVideo: () => void;
  onSelectFile: () => void;
  onOpenContextModal: () => void;
  onOpenConnectorModal: () => void;
  isLight: boolean;
  disabled?: boolean;
}

export const AttachmentPlusMenu: React.FC<AttachmentPlusMenuProps> = ({
  onSelectPhoto,
  onSelectVideo,
  onSelectFile,
  onOpenContextModal,
  onOpenConnectorModal,
  isLight,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        id="btn-chat-plus-menu"
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        title="Add files, photos, videos, context, or connectors (Click +)"
        className={`group flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
          isOpen
            ? 'm-gradient-bg text-white shadow-md ring-2 ring-[var(--m-accent)]/40'
            : isLight
            ? 'border-rose-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50/70 hover:text-slate-900 shadow-xs'
            : 'border-white/12 bg-white/[0.05] text-white/80 hover:border-white/25 hover:bg-white/[0.09] hover:text-white'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <Plus
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? 'rotate-45' : 'group-hover:scale-110'
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <>
          {/* Backdrop Clicker */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div
            id="chat-plus-dropdown"
            className={`absolute bottom-full left-0 z-50 mb-2 w-64 rounded-2xl border p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150 ${
              isLight
                ? 'border-rose-200 bg-white/95 text-slate-800 shadow-rose-950/10'
                : 'border-white/15 bg-zinc-900/95 text-white shadow-black/60'
            }`}
          >
            <div className="px-2.5 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-white/40 border-b border-black/5 dark:border-white/8">
              Add To Prompt & Session
            </div>

            <div className="mt-1 space-y-0.5">
              {/* Option 1: Photos */}
              <button
                id="btn-attach-photo"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onSelectPhoto();
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition ${
                  isLight
                    ? 'hover:bg-rose-50 text-slate-700 hover:text-slate-900'
                    : 'hover:bg-white/[0.08] text-white/85 hover:text-white'
                }`}
              >
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-sky-500/15 text-sky-500">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs leading-none">Upload Photos</p>
                  <p className="text-[10px] text-slate-400 dark:text-white/45 truncate mt-0.5">
                    PNG, JPG, WebP, GIF, SVG
                  </p>
                </div>
              </button>

              {/* Option 2: Video */}
              <button
                id="btn-attach-video"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onSelectVideo();
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition ${
                  isLight
                    ? 'hover:bg-rose-50 text-slate-700 hover:text-slate-900'
                    : 'hover:bg-white/[0.08] text-white/85 hover:text-white'
                }`}
              >
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-purple-500/15 text-purple-400">
                  <Film className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs leading-none">Upload Video</p>
                  <p className="text-[10px] text-slate-400 dark:text-white/45 truncate mt-0.5">
                    MP4, WebM, MOV clips
                  </p>
                </div>
              </button>

              {/* Option 3: Files & Docs */}
              <button
                id="btn-attach-files"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onSelectFile();
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition ${
                  isLight
                    ? 'hover:bg-rose-50 text-slate-700 hover:text-slate-900'
                    : 'hover:bg-white/[0.08] text-white/85 hover:text-white'
                }`}
              >
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/15 text-amber-500">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs leading-none">Upload Files & Docs</p>
                  <p className="text-[10px] text-slate-400 dark:text-white/45 truncate mt-0.5">
                    PDF, DOCX, CSV, JSON, Code
                  </p>
                </div>
              </button>

              <div className="my-1 border-t border-black/5 dark:border-white/8" />

              {/* Option 4: Workspace Files Context */}
              <button
                id="btn-attach-context"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenContextModal();
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition ${
                  isLight
                    ? 'hover:bg-rose-50 text-slate-700 hover:text-slate-900'
                    : 'hover:bg-white/[0.08] text-white/85 hover:text-white'
                }`}
              >
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/15 text-emerald-500">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs leading-none">Add Files Context</p>
                  <p className="text-[10px] text-slate-400 dark:text-white/45 truncate mt-0.5">
                    Scratchpad, Memory Ledger, Profile
                  </p>
                </div>
              </button>

              {/* Option 5: Attach a Connector */}
              <button
                id="btn-attach-connector"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenConnectorModal();
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition ${
                  isLight
                    ? 'hover:bg-rose-50 text-slate-700 hover:text-slate-900'
                    : 'hover:bg-white/[0.08] text-white/85 hover:text-white'
                }`}
              >
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-pink-500/15 text-pink-500">
                  <Cpu className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs leading-none">Attach a Connector</p>
                  <p className="text-[10px] text-slate-400 dark:text-white/45 truncate mt-0.5">
                    Bind MCP Plugins (Reels, QuickBooks...)
                  </p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* --- Staged Attachments Bar --- */

interface StagedAttachmentsBarProps {
  attachments: ChatAttachment[];
  onRemoveAttachment: (id: string) => void;
  onClearAll: () => void;
  isLight: boolean;
}

export const StagedAttachmentsBar: React.FC<StagedAttachmentsBarProps> = ({
  attachments,
  onRemoveAttachment,
  onClearAll,
  isLight,
}) => {
  if (attachments.length === 0) return null;

  return (
    <div
      id="staged-attachments-tray"
      className={`mb-2.5 flex flex-wrap items-center gap-2 rounded-xl border p-2 text-xs backdrop-blur-md ${
        isLight ? 'border-rose-200 bg-rose-50/70 text-slate-800' : 'border-white/10 bg-white/[0.03] text-white'
      }`}
    >
      <div className="flex items-center gap-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-white/50 px-1">
        <span>Staged ({attachments.length}):</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
        {attachments.map((att) => (
          <div
            key={att.id}
            className={`group relative flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition shadow-xs ${
              att.type === 'image'
                ? isLight
                  ? 'border-sky-200 bg-white text-slate-800'
                  : 'border-sky-500/30 bg-sky-950/20 text-white'
                : att.type === 'video'
                ? isLight
                  ? 'border-purple-200 bg-white text-slate-800'
                  : 'border-purple-500/30 bg-purple-950/20 text-white'
                : att.type === 'connector'
                ? isLight
                  ? 'border-pink-200 bg-white text-pink-700 font-medium'
                  : 'border-pink-500/30 bg-pink-950/20 text-pink-300 font-medium'
                : att.type === 'context'
                ? isLight
                  ? 'border-emerald-200 bg-white text-emerald-800 font-medium'
                  : 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300 font-medium'
                : isLight
                ? 'border-slate-200 bg-white text-slate-800'
                : 'border-white/12 bg-white/[0.06] text-white'
            }`}
          >
            {/* Type Indicator */}
            {att.type === 'image' && (
              att.dataUrl ? (
                <img
                  src={att.dataUrl}
                  alt={att.name}
                  className="h-5 w-5 rounded object-cover border border-black/10"
                />
              ) : (
                <ImageIcon className="h-3.5 w-3.5 text-sky-500" />
              )
            )}
            {att.type === 'video' && <Film className="h-3.5 w-3.5 text-purple-400" />}
            {att.type === 'file' && <FileText className="h-3.5 w-3.5 text-amber-500" />}
            {att.type === 'connector' && <Zap className="h-3.5 w-3.5 text-pink-500" />}
            {att.type === 'context' && <Sparkles className="h-3.5 w-3.5 text-emerald-500" />}

            <span className="max-w-[130px] truncate text-[11px] font-medium" title={att.name}>
              {att.name}
            </span>

            {att.size && (
              <span className="text-[9.5px] font-mono text-slate-400 dark:text-white/40">
                {att.size}
              </span>
            )}

            <button
              type="button"
              onClick={() => onRemoveAttachment(att.id)}
              title="Remove attachment"
              className="ml-0.5 rounded p-0.5 text-slate-400 hover:bg-black/10 hover:text-slate-800 dark:hover:bg-white/15 dark:hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {attachments.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-[10px] font-semibold text-rose-500 hover:underline px-1.5"
        >
          Clear All
        </button>
      )}
    </div>
  );
};

/* --- Workspace Context Selector Modal --- */

interface ContextSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContext: (attachment: ChatAttachment) => void;
  scratchpad?: string;
  memories?: MemoryEntry[];
  profile: UserProfile;
  isLight: boolean;
}

export const ContextSelectorModal: React.FC<ContextSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectContext,
  scratchpad = '',
  memories = [],
  profile,
  isLight,
}) => {
  if (!isOpen) return null;

  const contextOptions: Array<{
    id: string;
    title: string;
    description: string;
    snippet: string;
    badge: string;
  }> = [
    {
      id: 'ctx_scratchpad',
      title: 'Active Scratchpad & Daily Routines',
      description: 'Live cloud workspace scratchpad containing active routines, notes, and staged errand updates.',
      snippet: scratchpad.slice(0, 320) || 'Active scratchpad is ready for notes.',
      badge: `${scratchpad.length} chars`,
    },
    {
      id: 'ctx_memory_ledger',
      title: 'Long-Term Memory Ledger',
      description: 'Persistent episodic memories stored across sessions, categories, and personal preferences.',
      snippet: memories.slice(0, 5).map((m) => `• [${m.category}] ${m.content}`).join('\n') || 'No memories recorded yet.',
      badge: `${memories.length} entries`,
    },
    {
      id: 'ctx_profile_dossier',
      title: 'Executive & Athletic Profile',
      description: 'Operator identity, wellness goals, and professional focus parameters calibrated with Carol Ann.',
      snippet: `Name: ${profile.name || 'User'}\nIdentity: ${profile.identity || 'Executive'}\nWellness Goal: ${profile.wellnessGoal || 'Peak performance'}\nFocus: ${profile.professionalFocus || 'Sovereign Operations'}`,
      badge: 'Calibrated Profile',
    },
    {
      id: 'ctx_sovereign_config',
      title: 'Sovereign MCP Architecture Snapshot',
      description: 'System specifications for local filesystem bridges, Zapier universal gateways, and security policies.',
      snippet: 'Sovereign Runtime v1.4\nProtocol: Model Context Protocol (MCP) JSON-RPC 2.0\nSecurity: Dual-layer affirmative user authorization required for all external state mutations.',
      badge: 'Architecture',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="modal-context-picker"
        className={`w-full max-w-lg rounded-2xl border p-5 shadow-2xl ${
          isLight ? 'border-rose-200 bg-white text-slate-800' : 'border-white/15 bg-zinc-900 text-white'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/8">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/15 text-emerald-500">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm">Add Files Context to Prompt</h3>
              <p className="text-[11px] text-slate-400 dark:text-white/50">
                Bind active workspace files or memory snapshots to your next message
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 space-y-2.5 max-h-[380px] overflow-y-auto m-scroll pr-1">
          {contextOptions.map((opt) => (
            <div
              key={opt.id}
              className={`group rounded-xl border p-3.5 transition-all ${
                isLight
                  ? 'border-slate-200 bg-slate-50/60 hover:border-rose-300 hover:bg-white shadow-xs'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs">{opt.title}</span>
                    <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 text-[9.5px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-white/60">
                    {opt.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectContext({
                      id: `att_ctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                      type: 'context',
                      name: opt.title,
                      contextSnippet: opt.snippet,
                      size: `${opt.snippet.length} chars`,
                      category: 'workspace_context',
                    });
                    onClose();
                  }}
                  className="shrink-0 flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm transition"
                >
                  <Plus className="h-3 w-3" />
                  Attach
                </button>
              </div>

              <div className="mt-2.5 rounded-lg p-2 font-mono text-[10.5px] whitespace-pre-wrap line-clamp-3 bg-black/5 dark:bg-black/30 border border-black/5 dark:border-white/5 text-slate-600 dark:text-white/70">
                {opt.snippet}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end border-t border-black/5 dark:border-white/8 pt-3">
          <button
            onClick={onClose}
            className={`rounded-lg border px-4 py-1.5 text-xs font-medium transition ${
              isLight
                ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                : 'border-white/10 bg-white/[0.05] text-white/75 hover:bg-white/10 hover:text-white'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

/* --- Connector Selector Modal --- */

interface ConnectorSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConnector: (attachment: ChatAttachment) => void;
  installedPluginIds?: string[];
  isLight: boolean;
}

export const ConnectorSelectorModal: React.FC<ConnectorSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectConnector,
  installedPluginIds,
  isLight,
}) => {
  const [search, setSearch] = useState('');
  const [pickerTab, setPickerTab] = useState<'all' | 'saas' | 'mcp'>('all');
  const activeIds = installedPluginIds ?? loadInstalledPluginIds();
  const connectedSaas = useMemo(() => loadConnectedSaasIds(), []);

  const filteredSaas = useMemo(() => {
    if (pickerTab === 'mcp') return [];
    return SAAS_CONNECTORS_DIRECTORY.filter((s) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.categoryLabel.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.vendor.toLowerCase().includes(q) ||
        s.capabilities.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [search, pickerTab]);

  const filteredPlugins = useMemo(() => {
    if (pickerTab === 'saas') return [];
    return MCP_PLUGINS_DIRECTORY.filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.vendor.toLowerCase().includes(q)
      );
    });
  }, [search, pickerTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="modal-connector-picker"
        className={`w-full max-w-2xl rounded-2xl border p-5 shadow-2xl flex flex-col max-h-[88vh] ${
          isLight ? 'border-rose-200 bg-white text-slate-800' : 'border-white/15 bg-zinc-900 text-white'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/8">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-pink-500/15 text-pink-500">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm">Attach a Connector to Chat</h3>
              <p className="text-[11px] text-slate-400 dark:text-white/50">
                Bind an MCP Tool or SaaS Integration (170+ available) directly into your conversational prompt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switcher + Search */}
        <div className="mt-3 flex items-center gap-2">
          <div className={`flex rounded-lg border p-0.5 text-[11px] shrink-0 ${
            isLight ? 'border-slate-200 bg-slate-100' : 'border-white/10 bg-black/30'
          }`}>
            <button
              onClick={() => setPickerTab('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                pickerTab === 'all'
                  ? isLight ? 'bg-white text-slate-900 shadow-xs' : 'bg-white/15 text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({SAAS_CONNECTORS_DIRECTORY.length + MCP_PLUGINS_DIRECTORY.length})
            </button>
            <button
              onClick={() => setPickerTab('saas')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                pickerTab === 'saas'
                  ? isLight ? 'bg-white text-slate-900 shadow-xs' : 'bg-white/15 text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              SaaS (170+)
            </button>
            <button
              onClick={() => setPickerTab('mcp')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                pickerTab === 'mcp'
                  ? isLight ? 'bg-white text-slate-900 shadow-xs' : 'bg-white/15 text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              MCP Native
            </button>
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Salesforce, Jira, Stripe, HubSpot, Snowflake..."
              className={`w-full rounded-xl border pl-9 pr-3 py-1.5 text-xs outline-none transition ${
                isLight
                  ? 'border-slate-200 bg-slate-50 focus:border-rose-400 focus:bg-white text-slate-800'
                  : 'border-white/10 bg-white/[0.04] focus:border-pink-500 focus:bg-black text-white'
              }`}
            />
          </div>
        </div>

        {/* List of Connectors */}
        <div className="mt-3 space-y-2 flex-1 overflow-y-auto m-scroll pr-1">
          {/* SaaS Directory results */}
          {filteredSaas.map((saas) => {
            const isLinked = connectedSaas.includes(saas.id);
            return (
              <div
                key={saas.id}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition ${
                  isLight
                    ? 'border-slate-200 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-200'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="grid h-8 w-8 place-items-center rounded-lg font-bold text-white shrink-0 text-xs shadow-xs"
                    style={{ backgroundColor: saas.accentColor }}
                  >
                    {saas.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs truncate">{saas.name}</span>
                      {isLinked && (
                        <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          Linked
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 dark:text-white/40">
                        {saas.categoryLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-white/60 truncate mt-0.5">
                      {saas.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectConnector({
                      id: `att_saas_${Date.now()}_${saas.id}`,
                      type: 'connector',
                      name: saas.name,
                      connectorId: saas.id,
                      connectorName: saas.name,
                      size: `${saas.capabilities.length} Actions`,
                      category: saas.categoryLabel,
                      contextSnippet: `Active SaaS Connector: ${saas.name} (${saas.vendor})\nCategory: ${saas.categoryLabel}\nCapabilities: ${saas.capabilities.join(', ')}\nAuth: ${saas.authType}`,
                    });
                    onClose();
                  }}
                  className="shrink-0 flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700"
                >
                  <Plus className="h-3 w-3" />
                  Bind
                </button>
              </div>
            );
          })}

          {/* MCP Plugins results */}
          {filteredPlugins.map((plugin) => {
            const isInstalled = activeIds.includes(plugin.id);
            return (
              <div
                key={plugin.id}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition ${
                  isLight
                    ? 'border-slate-200 bg-slate-50/50 hover:bg-rose-50/50 hover:border-rose-200'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-pink-500/10 text-pink-500 shrink-0 font-mono text-xs font-bold">
                    <Zap className="h-4 w-4 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs truncate">{plugin.name}</span>
                      {isInstalled && (
                        <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          Active
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 dark:text-white/40 font-mono">
                        {plugin.tools.length} tools
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-white/60 truncate mt-0.5">
                      {plugin.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectConnector({
                      id: `att_conn_${Date.now()}_${plugin.id}`,
                      type: 'connector',
                      name: plugin.name,
                      connectorId: plugin.id,
                      connectorName: plugin.name,
                      size: `${plugin.tools.length} Tools`,
                      category: plugin.category,
                      contextSnippet: `Active MCP Connector: ${plugin.name} (${plugin.vendor})\nAvailable tools: ${plugin.tools.map((t) => t.name).join(', ')}`,
                    });
                    onClose();
                  }}
                  className="shrink-0 flex items-center gap-1 rounded-lg m-gradient-bg px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:brightness-110"
                >
                  <Plus className="h-3 w-3" />
                  Bind
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex justify-between items-center border-t border-black/5 dark:border-white/8 pt-3">
          <span className="text-[11px] text-slate-400 dark:text-white/40">
            {filteredSaas.length + filteredPlugins.length} integrations available
          </span>
          <button
            onClick={onClose}
            className={`rounded-lg border px-4 py-1.5 text-xs font-medium transition ${
              isLight
                ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                : 'border-white/10 bg-white/[0.05] text-white/75 hover:bg-white/10 hover:text-white'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* --- Message Attachment Gallery Component --- */

interface MessageAttachmentGalleryProps {
  attachments: ChatAttachment[];
  isLight: boolean;
  onOpenLightbox: (imageUrl: string, imageName: string) => void;
}

export const MessageAttachmentGallery: React.FC<MessageAttachmentGalleryProps> = ({
  attachments,
  isLight,
  onOpenLightbox,
}) => {
  const [expandedContextId, setExpandedContextId] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const photos = attachments.filter((a) => a.type === 'image');
  const videos = attachments.filter((a) => a.type === 'video');
  const files = attachments.filter((a) => a.type === 'file');
  const connectors = attachments.filter((a) => a.type === 'connector');
  const contexts = attachments.filter((a) => a.type === 'context');

  return (
    <div className="mt-3 space-y-2.5">
      {/* 1. Photos Gallery */}
      {photos.length > 0 && (
        <div className={`grid gap-2 ${
          photos.length === 1
            ? 'grid-cols-1 max-w-sm'
            : photos.length === 2
            ? 'grid-cols-2 max-w-md'
            : 'grid-cols-2 sm:grid-cols-3 max-w-lg'
        }`}>
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => onOpenLightbox(photo.dataUrl || photo.url || '', photo.name)}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-black/5 aspect-4/3 transition-all hover:scale-[1.01] hover:shadow-md"
            >
              <img
                src={photo.dataUrl || photo.url}
                alt={photo.name}
                className="h-full w-full object-cover transition duration-200 group-hover:brightness-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2 text-white">
                <span className="text-[11px] font-medium truncate max-w-[120px]">{photo.name}</span>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20 backdrop-blur-md">
                  <Maximize2 className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Video Player Cards */}
      {videos.length > 0 && (
        <div className="space-y-2 max-w-md">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className={`overflow-hidden rounded-xl border ${
                isLight ? 'border-purple-200 bg-white shadow-xs' : 'border-purple-500/30 bg-purple-950/20'
              }`}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-black/5 dark:border-white/8 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <Film className="h-3.5 w-3.5 text-purple-500" />
                  <span className="truncate max-w-[200px]">{vid.name}</span>
                </div>
                {vid.size && <span className="font-mono text-[10px] text-slate-400">{vid.size}</span>}
              </div>
              {vid.dataUrl || vid.url ? (
                <video
                  src={vid.dataUrl || vid.url}
                  controls
                  playsInline
                  className="w-full max-h-56 bg-black rounded-b-xl object-contain"
                />
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">Video uploaded ({vid.name})</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 3. Document / Code Files */}
      {files.length > 0 && (
        <div className="grid gap-1.5 sm:grid-cols-2 max-w-md">
          {files.map((file) => (
            <div
              key={file.id}
              className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs transition ${
                isLight
                  ? 'border-slate-200 bg-white text-slate-800 shadow-xs'
                  : 'border-white/10 bg-white/[0.04] text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/15 text-amber-500 shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate text-[11.5px]">{file.name}</p>
                  <p className="text-[10px] font-mono text-slate-400 dark:text-white/40">
                    {file.size || 'Document File'}
                  </p>
                </div>
              </div>

              {file.dataUrl && (
                <a
                  href={file.dataUrl}
                  download={file.name}
                  title="Download File"
                  className="shrink-0 grid h-7 w-7 place-items-center rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500 dark:text-white/70" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 4. Attached Connectors */}
      {connectors.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-w-md">
          {connectors.map((conn) => (
            <div
              key={conn.id}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-xs ${
                isLight
                  ? 'border-pink-200 bg-pink-50/70 text-pink-700'
                  : 'border-pink-500/30 bg-pink-950/30 text-pink-300'
              }`}
            >
              <span className="grid h-5 w-5 place-items-center rounded bg-pink-500/20 text-pink-500">
                <Zap className="h-3 w-3 fill-current" />
              </span>
              <span>Plugged Connector: {conn.connectorName || conn.name}</span>
              {conn.size && <span className="font-mono text-[10px] opacity-75">· {conn.size}</span>}
            </div>
          ))}
        </div>
      )}

      {/* 5. Attached Context */}
      {contexts.length > 0 && (
        <div className="space-y-1.5 max-w-md">
          {contexts.map((ctx) => {
            const isExpanded = expandedContextId === ctx.id;
            return (
              <div
                key={ctx.id}
                className={`rounded-xl border p-2.5 text-xs transition ${
                  isLight
                    ? 'border-emerald-200 bg-emerald-50/50 text-slate-800'
                    : 'border-emerald-500/30 bg-emerald-950/20 text-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="font-semibold text-[11.5px]">{ctx.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedContextId(isExpanded ? null : ctx.id)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <span>{isExpanded ? 'Hide Snippet' : 'View Snippet'}</span>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                </div>

                {isExpanded && ctx.contextSnippet && (
                  <div className="mt-2 rounded-lg p-2 font-mono text-[10.5px] whitespace-pre-wrap bg-black/5 dark:bg-black/40 border border-black/5 dark:border-white/5 text-slate-700 dark:text-white/80 max-h-40 overflow-y-auto m-scroll">
                    {ctx.contextSnippet}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* --- Lightbox Modal for Photos --- */

interface ImageLightboxProps {
  imageUrl: string | null;
  imageName: string;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  imageUrl,
  imageName,
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-full items-center justify-between pb-2 text-white">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-sky-400" />
            <span className="font-medium text-xs truncate max-w-xs">{imageName}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              download={imageName}
              title="Download Photo"
              className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 hover:bg-white/20 transition text-white"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 hover:bg-white/20 transition text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <img
          src={imageUrl}
          alt={imageName}
          className="max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl border border-white/10"
        />
      </div>
    </div>
  );
};
