import React, { useState, useMemo } from 'react';
import {
  Cpu, Terminal, HardDrive, Globe, Calendar, Database,
  CheckCircle2, AlertCircle, RefreshCw, Play, ShieldCheck,
  Code2, ExternalLink, Zap, Lock, Radio, Search, Plus, Check,
  Settings, Key, Sliders, Layers, ArrowUpRight, Filter, ChevronRight,
  Eye, EyeOff, Sparkles, CheckSquare, MessageSquare, Trash2
} from 'lucide-react';
import {
  MCP_PLUGINS_DIRECTORY,
  loadInstalledPluginIds,
  saveInstalledPluginIds,
  loadZapierConfig,
  saveZapierConfig,
  type MCPPlugin,
  type PluginCategory,
  type ZapierConfig,
  type ZapierActionMeta
} from '@/data/mcpPlugins';
import { PluginAppIcon } from '@/components/workspace/PluginAppIcon';
import { SaaSConnectorsDirectory } from '@/components/connectors/SaaSConnectorsDirectory';
import { isLightTheme } from '@/data/intake';
import type { UserProfile } from '@/data/schemas';

interface ConnectorsHubProps {
  profile?: UserProfile;
  onPluginsUpdated?: (installedIds: string[]) => void;
}

export const ConnectorsHub: React.FC<ConnectorsHubProps> = ({ profile, onPluginsUpdated }) => {
  const isLight = isLightTheme(profile);

  // Active view: 'saas_directory' | 'marketplace' | 'ecosystems' | 'zapier' | 'diagnostics'
  const [activeView, setActiveView] = useState<'saas_directory' | 'marketplace' | 'ecosystems' | 'zapier' | 'diagnostics'>('saas_directory');

  // Plugin Marketplace State
  const [installedPluginIds, setInstalledPluginIds] = useState<string[]>(() => loadInstalledPluginIds());
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | 'all' | 'installed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingPlugin, setInspectingPlugin] = useState<MCPPlugin | null>(null);

  // Zapier Remote MCP Configuration State
  const [zapierConfig, setZapierConfig] = useState<ZapierConfig>(() => loadZapierConfig());
  const [zapierUrlInput, setZapierUrlInput] = useState(zapierConfig.endpointUrl);
  const [zapierKeyInput, setZapierKeyInput] = useState(zapierConfig.apiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingZapier, setIsTestingZapier] = useState(false);
  const [zapierStatusMsg, setZapierStatusMsg] = useState<string | null>(null);

  // Protocol Diagnostics State
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isExecutingTest, setIsExecutingTest] = useState(false);
  const [activeDiagnosticConnector, setActiveDiagnosticConnector] = useState<string>('mcp-zapier-gateway');

  // Toggle Install / Uninstall
  const handleToggleInstall = (pluginId: string) => {
    let updated: string[];
    if (installedPluginIds.includes(pluginId)) {
      updated = installedPluginIds.filter((id) => id !== pluginId);
    } else {
      updated = [...installedPluginIds, pluginId];
    }
    setInstalledPluginIds(updated);
    saveInstalledPluginIds(updated);
    if (onPluginsUpdated) {
      onPluginsUpdated(updated);
    }
  };

  // Filtered plugins in Marketplace
  const filteredPlugins = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return MCP_PLUGINS_DIRECTORY.filter((plugin) => {
      // Category filter
      if (selectedCategory === 'installed') {
        if (!installedPluginIds.includes(plugin.id)) return false;
      } else if (selectedCategory !== 'all') {
        if (plugin.category !== selectedCategory) return false;
      }

      // Search query
      if (!q) return true;
      return (
        plugin.name.toLowerCase().includes(q) ||
        plugin.description.toLowerCase().includes(q) ||
        plugin.vendor.toLowerCase().includes(q) ||
        plugin.tools.some((t) => t.name.toLowerCase().includes(q) || t.displayName.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery, installedPluginIds]);

  // Handle saving the Zapier demo configuration.
  // NOTE: this is a demo sandbox — no live Zapier connection is established.
  // The "test" simulates a handshake locally so action payload shapes can be
  // previewed; it never contacts Zapier or any live service.
  const handleTestAndFetchZapier = () => {
    setIsTestingZapier(true);
    setZapierStatusMsg(null);

    setTimeout(() => {
      const updatedConfig: ZapierConfig = {
        endpointUrl: zapierUrlInput.trim() || 'https://actions.zapier.com/settings/mcp/',
        apiKey: zapierKeyInput.trim(),
        isConnected: false,
        lastSyncedAt: null,
        actions: zapierConfig.actions,
      };

      setZapierConfig(updatedConfig);
      saveZapierConfig(updatedConfig);
      setIsTestingZapier(false);
      setZapierStatusMsg(
        `Demo configuration saved — simulated sandbox. No live Zapier connection was established; actions below are previews only.`
      );

      // Ensure Zapier Gateway is marked installed
      if (!installedPluginIds.includes('zapier-gateway')) {
        const withZapier = [...installedPluginIds, 'zapier-gateway'];
        setInstalledPluginIds(withZapier);
        saveInstalledPluginIds(withZapier);
        onPluginsUpdated?.(withZapier);
      }
    }, 850);
  };

  // Run a SIMULATED diagnostic preview. The output below is a locally
  // generated payload preview — no live service is contacted.
  const handleRunDiagnosticTest = (toolLabel: string, appName: string) => {
    setIsExecutingTest(true);
    setTestOutput(`[SIMULATED] Preparing preview of "${toolLabel}" on ${appName}...`);
    setTimeout(() => {
      setTestOutput(
        `[SIMULATED PAYLOAD PREVIEW — no live service contacted]\n` +
        `Timestamp: ${new Date().toISOString()}\n` +
        `Target: ${appName}\n` +
        `Tool: ${toolLabel}\n` +
        `Status: simulated locally. Nothing was transmitted or executed.\n` +
        `Safety Envelope: Action requires confirmation? ${toolLabel.includes('create') || toolLabel.includes('post') || toolLabel.includes('schedule') ? 'YES (Confirmation Card Enforced)' : 'NO (Read-Only Direct Return)'}\n`
      );
      setIsExecutingTest(false);
    }, 600);
  };

  return (
    <div className={`flex h-full flex-col select-none overflow-hidden transition-colors ${
      isLight ? 'bg-transparent text-slate-800' : 'bg-transparent text-white'
    }`}>
      {/* Top Header & View Navigator */}
      <div className={`flex shrink-0 items-center justify-between border-b px-6 py-3.5 backdrop-blur-md ${
        isLight ? 'border-rose-200/60 bg-white/80' : 'border-white/8 bg-zinc-950/80'
      }`}>
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl m-gradient-bg shadow-sm">
            <Cpu className="h-5 w-5 text-white" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`font-display text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                MCP Connectors & Bridges
              </h2>
              <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{installedPluginIds.length} Plugins Active</span>
              </span>
            </div>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
              Universal connector directory & demo sandbox — integrations shown here are simulated previews until you connect a real service
            </p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className={`flex items-center gap-1 rounded-xl border p-1 ${
          isLight ? 'border-rose-200/80 bg-white/90 shadow-xs' : 'border-white/10 bg-black/40'
        }`}>
          <button
            onClick={() => setActiveView('saas_directory')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeView === 'saas_directory'
                ? isLight ? 'bg-indigo-600 text-white shadow-xs' : 'bg-indigo-500 text-white shadow'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/50 hover:text-white'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-300" />
            <span>SaaS Directory (170+)</span>
          </button>
          <button
            onClick={() => setActiveView('marketplace')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeView === 'marketplace'
                ? isLight ? 'bg-rose-500/15 text-slate-900 shadow-xs' : 'bg-white/15 text-white shadow'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/50 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-sky-500" />
            <span>Plugin Marketplace</span>
          </button>
          <button
            onClick={() => setActiveView('ecosystems')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeView === 'ecosystems'
                ? isLight ? 'bg-rose-500/15 text-slate-900 shadow-xs' : 'bg-white/15 text-white shadow'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/50 hover:text-white'
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-emerald-500" />
            <span>Connected Ecosystems</span>
          </button>
          <button
            onClick={() => setActiveView('zapier')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeView === 'zapier'
                ? isLight ? 'bg-rose-500/15 text-slate-900 shadow-xs' : 'bg-white/15 text-white shadow'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/50 hover:text-white'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span>Zapier Remote MCP</span>
          </button>
          <button
            onClick={() => setActiveView('diagnostics')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeView === 'diagnostics'
                ? isLight ? 'bg-rose-500/15 text-slate-900 shadow-xs' : 'bg-white/15 text-white shadow'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/50 hover:text-white'
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-purple-400" />
            <span>Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 overflow-y-auto m-scroll p-6">
        {/* VIEW 0: SaaS & Enterprise Directory (170+ integrations across 25 categories) */}
        {activeView === 'saas_directory' && (
          <div className="mx-auto max-w-7xl">
            <SaaSConnectorsDirectory isLight={isLight} />
          </div>
        )}

        {/* VIEW 1: ChatGPT-Style Plugin & MCP Marketplace */}
        {activeView === 'marketplace' && (
          <div className="mx-auto max-w-6xl space-y-6">
            {/* Search & Filter Header */}
            <div className={`rounded-2xl border p-5 space-y-4 ${
              isLight ? 'border-rose-200/80 bg-white/90 shadow-sm' : 'border-white/10 bg-white/[0.03]'
            }`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Search Bar */}
                <div className={`relative flex-1 w-full rounded-xl border flex items-center px-3.5 py-2.5 transition ${
                  isLight
                    ? 'border-rose-200 bg-rose-50/40 focus-within:bg-white focus-within:border-rose-400'
                    : 'border-white/12 bg-black/40 focus-within:border-[var(--m-accent)]'
                }`}>
                  <Search className={`h-4 w-4 shrink-0 mr-2.5 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search plugins and active tool schemas (e.g., QuickBooks, TripAdvisor, Instagram, Shopify)..."
                    className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400 dark:placeholder:text-white/35"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Active Install Counter */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                    Active Tool Definitions:
                  </span>
                  <span className={`font-mono text-xs font-bold rounded-lg border px-2.5 py-1 ${
                    isLight ? 'border-rose-200 bg-rose-50 text-slate-800' : 'border-white/12 bg-white/[0.06] text-white'
                  }`}>
                    {MCP_PLUGINS_DIRECTORY.filter(p => installedPluginIds.includes(p.id)).reduce((acc, p) => acc + p.tools.length, 0)} Tools Loaded
                  </span>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 m-scroll text-xs">
                {(
                  [
                    { id: 'all', label: `All Plugins (${MCP_PLUGINS_DIRECTORY.length})` },
                    { id: 'installed', label: `Installed (${installedPluginIds.length})` },
                    { id: 'popular', label: 'Popular / Essentials' },
                    { id: 'commerce', label: 'Business & Commerce' },
                    { id: 'social', label: 'Social & Marketing' },
                    { id: 'hospitality', label: 'Hospitality & Reviews' },
                    { id: 'productivity', label: 'Productivity' },
                    { id: 'finance', label: 'Finance' },
                  ] as const
                ).map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`shrink-0 rounded-full px-3.5 py-1 text-[11.5px] font-medium transition ${
                        isSelected
                          ? 'm-gradient-bg text-white font-semibold shadow-sm'
                          : isLight
                          ? 'border border-rose-200/70 bg-white text-slate-700 hover:bg-rose-50 hover:text-slate-900'
                          : 'border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plugin Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlugins.map((plugin) => {
                const isInstalled = installedPluginIds.includes(plugin.id);

                return (
                  <div
                    key={plugin.id}
                    className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
                      isInstalled
                        ? isLight
                          ? 'border-emerald-300 bg-white shadow-md ring-1 ring-emerald-500/20'
                          : 'border-emerald-500/30 bg-emerald-950/10 shadow-lg ring-1 ring-emerald-500/25'
                        : isLight
                        ? 'border-rose-200/70 bg-white/90 hover:border-rose-300 hover:shadow-md'
                        : 'border-white/10 bg-[#161724]/80 hover:border-white/20 hover:bg-[#161724]'
                    }`}
                  >
                    <div>
                      {/* Top Header: Icon, Name, Badge & Install Button */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <PluginAppIcon iconType={plugin.iconType} size={42} />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className={`font-display text-sm font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {plugin.name}
                              </h3>
                              {plugin.badge && (
                                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                                  {plugin.badge}
                                </span>
                              )}
                            </div>
                            <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                              {plugin.vendor}
                            </p>
                          </div>
                        </div>

                        {/* Install / Installed Button (ChatGPT Plugin Store Pattern) */}
                        <button
                          onClick={() => handleToggleInstall(plugin.id)}
                          title={isInstalled ? 'Click to uninstall' : 'Install plugin and activate tool schemas'}
                          className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition shadow-xs ${
                            isInstalled
                              ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-600 dark:hover:text-rose-300 group/btn'
                              : isLight
                              ? 'border border-slate-300 bg-slate-900 text-white hover:bg-slate-800'
                              : 'border border-white/20 bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {isInstalled ? (
                            <>
                              <Check className="h-3.5 w-3.5 group-hover/btn:hidden text-emerald-500" />
                              <Trash2 className="h-3.5 w-3.5 hidden group-hover/btn:inline text-rose-500" />
                              <span className="group-hover/btn:hidden">Installed</span>
                              <span className="hidden group-hover/btn:inline">Uninstall</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5" />
                              <span>Install</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Description */}
                      <p className={`mt-3 text-xs leading-relaxed line-clamp-2 ${
                        isLight ? 'text-slate-600' : 'text-white/60'
                      }`}>
                        {plugin.description}
                      </p>
                    </div>

                    {/* Bottom Metadata & Tools Inspection */}
                    <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
                      isLight ? 'border-slate-100 text-slate-500' : 'border-white/6 text-white/40'
                    }`}>
                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        <span className="rounded px-1.5 py-0.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                          {plugin.authType}
                        </span>
                        <span>{plugin.latencyMs}ms</span>
                      </div>

                      <button
                        onClick={() => setInspectingPlugin(plugin)}
                        className={`flex items-center gap-1 font-medium transition hover:underline ${
                          isLight ? 'text-sky-600' : 'text-sky-400'
                        }`}
                      >
                        <Code2 className="h-3 w-3" />
                        <span>{plugin.tools.length} Tools</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredPlugins.length === 0 && (
              <div className={`rounded-2xl border p-12 text-center ${
                isLight ? 'border-rose-200 bg-white/70' : 'border-white/8 bg-white/[0.02]'
              }`}>
                <Search className="h-8 w-8 mx-auto text-slate-400 dark:text-white/30 mb-2" />
                <h4 className="text-sm font-semibold">No plugins found matching "{searchQuery}"</h4>
                <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
                  Try adjusting your search query or select another category filter.
                </p>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: Ecosystems & Channels Directory (demo sandbox) */}
        {activeView === 'ecosystems' && (
          <div className="mx-auto max-w-6xl space-y-8">
            <div className={`rounded-2xl border px-5 py-3 text-xs ${
              isLight ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
            }`}>
              <strong>Demo sandbox:</strong> the integrations below are directory listings, not live connections.
              Nothing here is connected to Instagram, Facebook, TikTok, YouTube, or any other service.
            </div>
            {/* Banner */}
            <div className={`rounded-2xl border p-6 ${
              isLight ? 'border-rose-200/80 bg-white/90 shadow-sm' : 'border-white/10 bg-white/[0.03]'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={`font-display text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Ecosystems & Channels (Demo)
                  </h3>
                  <p className={`text-xs mt-1 leading-relaxed max-w-2xl ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                    A directory of popular business, social, hospitality, and commerce integrations. Listings are informational only — no live connections exist yet. Connect a service to enable it.
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('zapier')}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl m-gradient-bg px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:brightness-110 transition"
                >
                  <Zap className="h-3.5 w-3.5 fill-white" />
                  <span>Configure Zapier Universal Gateway</span>
                </button>
              </div>
            </div>

            {/* 1. Social & Content Directory */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <h4 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    1. Social & Content Distribution
                  </h4>
                </div>
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                  Reels, Shorts, Video Hooks & Auto-Captions
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    id: 'instagram-reels',
                    name: 'Instagram Reels',
                    category: 'Meta Platforms',
                    icon: 'instagram' as const,
                    status: 'Demo — not connected',
                    actions: 'Post Reels, Audio Sync, Analytics',
                    latency: '—'
                  },
                  {
                    id: 'facebook-pages',
                    name: 'Facebook Pages & Groups',
                    category: 'Meta Platforms',
                    icon: 'facebook' as const,
                    status: 'Demo — not connected',
                    actions: 'Community Posts, Group Feeds',
                    latency: '—'
                  },
                  {
                    id: 'tiktok-creator',
                    name: 'TikTok Creator Studio',
                    category: 'ByteDance Ltd.',
                    icon: 'tiktok' as const,
                    status: 'Demo — not connected',
                    actions: 'Trending Sounds, Video Drafts',
                    latency: '—'
                  },
                  {
                    id: 'youtube-studio',
                    name: 'YouTube Studio & Shorts',
                    category: 'Google LLC',
                    icon: 'youtube' as const,
                    status: 'Demo — not connected',
                    actions: 'Shorts Staging, SEO Tags',
                    latency: '—'
                  },
                ].map((eco) => {
                  const isInstalled = installedPluginIds.includes(eco.id);
                  return (
                    <div
                      key={eco.id}
                      className={`rounded-2xl border p-4.5 flex flex-col justify-between transition ${
                        isLight ? 'border-rose-200/70 bg-white/90 shadow-sm' : 'border-white/10 bg-[#161724]'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <PluginAppIcon iconType={eco.icon} size={36} />
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                            <CheckCircle2 className="h-3 w-3" /> {eco.latency}
                          </span>
                        </div>
                        <h5 className={`mt-3 font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {eco.name}
                        </h5>
                        <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                          {eco.actions}
                        </p>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                        <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                          {isInstalled ? 'Active in Chat' : 'Standby'}
                        </span>
                        <button
                          onClick={() => handleRunDiagnosticTest('test_post_handshake', eco.name)}
                          className={`text-[11px] font-semibold transition hover:underline ${
                            isLight ? 'text-rose-600' : 'text-rose-400'
                          }`}
                        >
                          Test Ping
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Hospitality & Reviews */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <h4 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    2. Hospitality & Reputation Engine
                  </h4>
                </div>
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                  Guest Reviews, Star Ratings & Polite Replies
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    id: 'tripadvisor',
                    name: 'TripAdvisor Reviews & Listings',
                    icon: 'tripadvisor' as const,
                    desc: 'Live guest review monitoring, ranking tracker, and automated empathetic host response drafting.',
                    tools: ['tripadvisor_fetch_reviews', 'tripadvisor_post_reply'],
                    status: 'Demo — not connected'
                  },
                  {
                    id: 'yelp-business',
                    name: 'Yelp for Business',
                    icon: 'yelp' as const,
                    desc: 'Local customer ratings, review notifications, and operating hours synchronization.',
                    tools: ['yelp_get_reviews', 'yelp_update_hours'],
                    status: 'Demo — not connected'
                  },
                  {
                    id: 'google-business',
                    name: 'Google Business Profile',
                    icon: 'google' as const,
                    desc: 'Google Maps verified customer reviews, local ranking tracking, and public announcements.',
                    tools: ['gbp_fetch_reviews', 'gbp_post_update'],
                    status: 'Demo — not connected'
                  },
                ].map((hosp) => (
                  <div
                    key={hosp.id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between ${
                      isLight ? 'border-rose-200/70 bg-white/90 shadow-sm' : 'border-white/10 bg-[#161724]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <PluginAppIcon iconType={hosp.icon} size={38} />
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {hosp.status}
                        </span>
                      </div>
                      <h5 className={`mt-3 font-semibold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {hosp.name}
                      </h5>
                      <p className={`mt-1.5 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                        {hosp.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400 dark:text-white/40">
                        {hosp.tools.length} Handlers Wired
                      </span>
                      <button
                        onClick={() => handleRunDiagnosticTest(hosp.tools[0], hosp.name)}
                        className={`text-xs font-semibold hover:underline ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}
                      >
                        Run Live Ping
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Commerce & Finance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  <h4 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    3. Commerce & Financial Architecture
                  </h4>
                </div>
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                  Live GMV, Overdue Ledgers, Invoices & Stripe Payouts
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    id: 'shopify',
                    name: 'Shopify Storefront & Orders',
                    icon: 'shopify' as const,
                    highlight: 'Today GMV: $18,420 (42 Orders)',
                    desc: 'Real-time order fulfillment, live inventory quantities, and B2B wholesale transaction streams.',
                    tools: ['shopify_get_orders', 'shopify_get_inventory', 'shopify_update_product']
                  },
                  {
                    id: 'quickbooks',
                    name: 'QuickBooks Online',
                    icon: 'quickbooks' as const,
                    highlight: 'Unpaid Invoices: $6,970 (3 Clients)',
                    desc: 'Accounts receivable tracking, overdue aging, general ledger reconciliation, and invoice generation.',
                    tools: ['quickbooks_get_invoices', 'quickbooks_create_invoice', 'quickbooks_get_balances']
                  },
                  {
                    id: 'stripe',
                    name: 'Stripe Payments & Billing',
                    icon: 'stripe' as const,
                    highlight: 'Rolling 30d Volume: $148,290',
                    desc: 'Credit card payment intents, customer billing portal, instant checkout links, and dispute shields.',
                    tools: ['stripe_get_charges', 'stripe_create_payment_link']
                  },
                ].map((comm) => (
                  <div
                    key={comm.id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between ${
                      isLight ? 'border-rose-200/70 bg-white/90 shadow-sm' : 'border-white/10 bg-[#161724]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <PluginAppIcon iconType={comm.icon} size={38} />
                        <span className="rounded-full bg-sky-500/10 border border-sky-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                          Live Bridge Active
                        </span>
                      </div>
                      <h5 className={`mt-3 font-semibold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {comm.name}
                      </h5>
                      <div className={`mt-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium font-mono ${
                        isLight ? 'bg-sky-50 text-sky-900 border border-sky-100' : 'bg-sky-950/30 text-sky-300 border border-sky-800/40'
                      }`}>
                        {comm.highlight}
                      </div>
                      <p className={`mt-2 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                        {comm.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400 dark:text-white/40">
                        {comm.tools.length} Exposed Tools
                      </span>
                      <button
                        onClick={() => handleRunDiagnosticTest(comm.tools[0], comm.name)}
                        className={`text-xs font-semibold hover:underline ${isLight ? 'text-sky-600' : 'text-sky-400'}`}
                      >
                        Query Live Data
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Universal Automation Bridge */}
            <div className={`rounded-2xl border p-6 ${
              isLight ? 'border-amber-300/80 bg-gradient-to-r from-amber-50/70 to-orange-50/70' : 'border-amber-500/30 bg-[#1A1820]'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <PluginAppIcon iconType="zapier" size={44} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`font-display text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Zapier Universal MCP Gateway
                      </h4>
                      <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                        7,000+ Apps via Single Endpoint
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                      Pre-authenticated AI Actions across Slack, Gmail, Notion, Salesforce, HubSpot, and QuickBooks.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveView('zapier')}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl bg-[#FF4F00] text-white px-4 py-2 text-xs font-bold shadow-md hover:brightness-110 transition"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Manage Remote Endpoint</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: Zapier Remote MCP Configuration */}
        {activeView === 'zapier' && (
          <div className="mx-auto max-w-4xl space-y-6">
            <div className={`rounded-2xl border p-6 space-y-5 ${
              isLight ? 'border-rose-200/80 bg-white/90 shadow-md text-slate-800' : 'border-white/12 bg-white/[0.03]'
            }`}>
              <div className={`flex items-center justify-between pb-4 border-b ${isLight ? 'border-rose-100' : 'border-white/8'}`}>
                <div className="flex items-center gap-3">
                  <PluginAppIcon iconType="zapier" size={40} />
                  <div>
                    <h3 className={`font-display text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Zapier Remote MCP Server Configuration
                    </h3>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                      Connect your pre-authenticated Zapier AI Actions to Carol Ann over Model Context Protocol
                    </p>
                  </div>
                </div>

                <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>MCP SSE Live</span>
                </span>
              </div>

              {/* Endpoint Input Fields */}
              <div className="space-y-4">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                    isLight ? 'text-slate-700' : 'text-white/70'
                  }`}>
                    Zapier MCP Endpoint URL
                  </label>
                  <div className={`flex items-center rounded-xl border px-3 py-2 ${
                    isLight ? 'border-rose-200 bg-white' : 'border-white/10 bg-black/40'
                  }`}>
                    <Globe className="h-4 w-4 text-amber-500 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={zapierUrlInput}
                      onChange={(e) => setZapierUrlInput(e.target.value)}
                      placeholder="https://actions.zapier.com/settings/mcp/"
                      className="w-full bg-transparent text-xs font-mono outline-none"
                    />
                  </div>
                  <p className={`mt-1 text-[11px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                    Obtain your dedicated MCP Server Endpoint from your Zapier AI Actions settings.
                  </p>
                </div>

                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                    isLight ? 'text-slate-700' : 'text-white/70'
                  }`}>
                    Zapier API / Bearer Token
                  </label>
                  <div className={`flex items-center rounded-xl border px-3 py-2 ${
                    isLight ? 'border-rose-200 bg-white' : 'border-white/10 bg-black/40'
                  }`}>
                    <Key className="h-4 w-4 text-amber-500 mr-2 shrink-0" />
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={zapierKeyInput}
                      onChange={(e) => setZapierKeyInput(e.target.value)}
                      placeholder="zp_sec_live_..."
                      className="w-full bg-transparent text-xs font-mono outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className={`mt-1 text-[11px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                    Stored in this browser's local storage only. Demo sandbox — nothing is transmitted to Zapier.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleTestAndFetchZapier}
                  disabled={isTestingZapier}
                  className="flex items-center gap-2 rounded-xl bg-[#FF4F00] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition disabled:opacity-50"
                >
                  {isTestingZapier ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving demo configuration...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5 fill-white" />
                      <span>Save Demo Configuration</span>
                    </>
                  )}
                </button>

                {zapierConfig.lastSyncedAt && (
                  <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                    Last Synced: {new Date(zapierConfig.lastSyncedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>

              {/* Status Message */}
              {zapierStatusMsg && (
                <div className={`rounded-xl border p-3.5 text-xs flex items-center gap-2.5 ${
                  isLight ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                }`}>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{zapierStatusMsg}</span>
                </div>
              )}
            </div>

            {/* Discovered Enabled Zapier Actions */}
            <div className={`rounded-2xl border p-6 space-y-4 ${
              isLight ? 'border-rose-200/80 bg-white/90 shadow-md text-slate-800' : 'border-white/12 bg-white/[0.03]'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-display text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Discovered Zapier AI Actions ({zapierConfig.actions.length})
                  </h4>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    Demo action previews — simulated locally, nothing is transmitted
                  </p>
                </div>
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                  Demo Sandbox
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {zapierConfig.actions.map((act) => (
                  <div
                    key={act.id}
                    className={`rounded-xl border p-3.5 flex flex-col justify-between ${
                      isLight ? 'border-rose-100 bg-rose-50/30' : 'border-white/8 bg-black/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-mono">
                          {act.app}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                          act.actionType === 'write'
                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-500'
                            : 'border-sky-500/30 bg-sky-500/10 text-sky-500'
                        }`}>
                          {act.actionType}
                        </span>
                      </div>
                      <h5 className={`mt-1 font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {act.name}
                      </h5>
                      <p className={`mt-1 text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/55'}`}>
                        {act.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px]">
                      <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                        Requires Confirmation: <strong>{act.requiresConfirmation ? 'Yes' : 'No'}</strong>
                      </span>
                      <button
                        onClick={() => handleRunDiagnosticTest(act.name, act.app)}
                        className={`text-xs font-semibold hover:underline ${isLight ? 'text-amber-600' : 'text-amber-400'}`}
                      >
                        Simulate Action
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: Diagnostics Stream */}
        {activeView === 'diagnostics' && (
          <div className="mx-auto max-w-4xl space-y-5">
            <div className={`rounded-2xl border p-5 ${
              isLight ? 'border-rose-200/80 bg-white/90 text-slate-800' : 'border-white/10 bg-[#0D0E15]'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-emerald-500" />
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider">
                    Model Context Protocol (MCP) Diagnostic Stream
                  </h4>
                </div>
                {isExecutingTest && (
                  <span className="flex items-center gap-1 text-xs text-amber-500 font-mono">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Generating simulated preview...</span>
                  </span>
                )}
              </div>

              <pre className={`rounded-xl border p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap min-h-[220px] ${
                isLight ? 'border-slate-200 bg-slate-900 text-emerald-400' : 'border-white/8 bg-black text-emerald-300'
              }`}>
                {testOutput ||
                  `// Demo sandbox — simulated connector. No live service is connected.\n// Actions below are payload previews only; nothing is transmitted.\n// Configure a real endpoint above to move beyond the sandbox.`}
              </pre>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setTestOutput(null)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    isLight ? 'border-slate-200 hover:bg-slate-100 text-slate-700' : 'border-white/10 hover:bg-white/5 text-white/70'
                  }`}
                >
                  Clear Console
                </button>
                <button
                  onClick={() => handleRunDiagnosticTest('system_ping', 'Carol Ann Central Engine')}
                  className="rounded-lg m-gradient-bg px-4 py-1.5 text-xs font-semibold text-white shadow hover:brightness-110 transition"
                >
                  Run Simulated Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal / Drawer for Tool Schema Details */}
      {inspectingPlugin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`relative w-full max-w-2xl rounded-2xl border p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto m-scroll ${
            isLight ? 'border-rose-200 bg-white text-slate-800' : 'border-white/12 bg-[#161724] text-white'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/8">
              <div className="flex items-center gap-3">
                <PluginAppIcon iconType={inspectingPlugin.iconType} size={38} />
                <div>
                  <h3 className={`font-display text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {inspectingPlugin.name}
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
                    {inspectingPlugin.tools.length} Runtime Tool Function Schemas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingPlugin(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-white/70">
              {inspectingPlugin.description}
            </p>

            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">
                Tool Declarations for Gemini Function Calling:
              </h4>
              {inspectingPlugin.tools.map((t) => (
                <div
                  key={t.name}
                  className={`rounded-xl border p-3.5 space-y-2 ${
                    isLight ? 'border-rose-100 bg-rose-50/40' : 'border-white/8 bg-black/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-sky-500" />
                      <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-300">{t.name}()</span>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                      t.actionType === 'write'
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-500'
                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {t.actionType} {t.requiresConfirmation ? '· Confirmation Enforced' : ''}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-white/70">
                    {t.description}
                  </p>

                  <div className="rounded-lg p-2 font-mono text-[11px] bg-black/5 dark:bg-black/40 text-slate-700 dark:text-white/80 overflow-x-auto">
                    <pre>{JSON.stringify(t.parameters, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/8">
              <button
                onClick={() => {
                  handleToggleInstall(inspectingPlugin.id);
                  setInspectingPlugin(null);
                }}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow ${
                  installedPluginIds.includes(inspectingPlugin.id)
                    ? 'border border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
                    : 'm-gradient-bg text-white hover:brightness-110'
                }`}
              >
                {installedPluginIds.includes(inspectingPlugin.id) ? 'Uninstall Plugin' : '+ Install Plugin'}
              </button>

              <button
                onClick={() => setInspectingPlugin(null)}
                className={`rounded-xl border px-4 py-2 text-xs font-medium ${
                  isLight ? 'border-slate-200 text-slate-700 hover:bg-slate-100' : 'border-white/10 text-white/70 hover:bg-white/5'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectorsHub;
