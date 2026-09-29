import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  RotateCcw, Smartphone, Tablet, Monitor, Sparkles, Terminal,
  ExternalLink, Copy, Check, ShieldAlert, CheckCircle2,
  Send, Lock, Server, Layers, AlertCircle, Eye, Code2, ZoomIn, ZoomOut,
  Download, ChevronDown, FileCode2, FileArchive, Columns, Maximize2, Minimize2,
  X, Code
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import JSZip from 'jszip';
import { useAgentRouting, type CanvasFileKey } from '@/contexts/AgentRoutingContext';
import { isLightTheme } from '@/data/intake';
import { useCarol } from '@/contexts/CarolContext';
import { useToast } from '@/hooks/use-toast';
import GitHubSyncModal, { GithubIcon } from './GitHubSyncModal';

interface LiveSandboxPaneProps {
  activeFile: CanvasFileKey;
  code: string;
  onChangeCode?: (val: string) => void;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

export const LiveSandboxPane: React.FC<LiveSandboxPaneProps> = ({
  activeFile,
  code,
  onChangeCode,
}) => {
  const { activeAgentContext, codeBuffers, viewMode, setViewMode } = useAgentRouting();
  const { profile } = useCarol();
  const { toast } = useToast();
  const isLight = isLightTheme(profile);

  // Viewport, Zoom & Theme state
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [zoom, setZoom] = useState<number>(100);
  const [iframeTheme, setIframeTheme] = useState<'dark' | 'light'>('dark');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSubMode, setActiveSubMode] = useState<'preview' | 'api-runner'>('preview');

  // Top Canvas Action Bar Modals & Dropdowns
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'monaco' | 'native'>('native');
  const [copied, setCopied] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // GitHub connection check
  const [isGithubConnected, setIsGithubConnected] = useState(() => {
    if (typeof window !== 'undefined') {
      const pat = localStorage.getItem('carol_github_pat');
      const repo = localStorage.getItem('carol_github_repo');
      return Boolean(pat && repo);
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pat = localStorage.getItem('carol_github_pat');
      const repo = localStorage.getItem('carol_github_repo');
      setIsGithubConnected(Boolean(pat && repo));
    }
  }, [githubModalOpen]);

  // Close download dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(e.target as Node)) {
        setDownloadDropdownOpen(false);
      }
    };
    if (downloadDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [downloadDropdownOpen]);

  // Auto-switch mode based on file
  useEffect(() => {
    if (activeFile === 'endpoint.ts') {
      setActiveSubMode('api-runner');
    } else {
      setActiveSubMode('preview');
    }
  }, [activeFile]);

  // Is canvas currently idle?
  const isIdle = useMemo(() => {
    if (!code || !code.trim()) return true;
    if (code.includes('Mission Control & Autonomous Orchestrator') || code.includes('SovereignExecutiveDeck')) return true;
    return false;
  }, [code]);

  // Copy code handler
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Code Copied',
      description: `Copied ${activeFile} buffer to clipboard.`,
    });
  };

  // Download active file
  const handleDownloadFile = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile;
    link.click();
    URL.revokeObjectURL(url);
    setDownloadDropdownOpen(false);
    toast({
      title: `Downloaded ${activeFile}`,
      description: 'Single buffer exported to your device.',
    });
  };

  // Download workspace bundle as .zip
  const handleDownloadZip = async () => {
    try {
      const zip = new JSZip();
      zip.file(`src/components/Component.tsx`, codeBuffers['Component.tsx'] || code);
      zip.file(`src/server/endpoint.ts`, codeBuffers['endpoint.ts'] || '// Endpoint dispatch');
      zip.file(`src/db/schema.sql`, codeBuffers['schema.sql'] || '-- Database schema');
      zip.file(
        'README.md',
        `# Sovereign Executive Workspace\n\nExported from Carol-Ann Autonomous Studio.\nActive Agent: ${activeAgentContext.name}\nExported: ${new Date().toISOString()}\n\n## Project Architecture\n- Component.tsx: React Frontend Component\n- endpoint.ts: Express API Dispatch & Security Guards\n- schema.sql: PostgreSQL Database Schema\n`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sovereign-workspace-bundle.zip';
      link.click();
      URL.revokeObjectURL(url);
      setDownloadDropdownOpen(false);
      toast({
        title: 'Project Bundle Exported',
        description: 'Downloaded sovereign-workspace-bundle.zip with all workspace files.',
      });
    } catch (err) {
      console.error('Failed to create zip', err);
      toast({
        title: 'Export Failed',
        description: 'Unable to bundle workspace .zip archive.',
      });
    }
  };

  // Toggle split view vs full preview
  const handleToggleSplit = () => {
    setViewMode(viewMode === 'split' ? 'preview' : 'split');
  };

  // Construct iframe srcDoc with safety sandbox and hardened React scope
  const srcDoc = useMemo(() => {
    if (isIdle) return '';

    if (activeFile === 'Component.tsx') {
      // Clean and normalize React code:
      // Strip all forms of React and external module imports cleanly so they don't collision-declare or error
      const cleanCode = code
        .replace(/import\s+React\s*,\s*\{[^}]*\}\s*from\s*['"]react['"];?/g, '')
        .replace(/import\s*\{[^}]*\}\s*from\s*['"]react['"];?/g, '')
        .replace(/import\s+React\s+from\s*['"]react['"];?/g, '')
        .replace(/import\s+\*\s+as\s+React\s+from\s*['"]react['"];?/g, '')
        .replace(/import\s+.*?from\s+['"].*?['"];?/g, '')
        .replace(/import\s+['"].*?['"];?/g, '')
        .replace(/export\s+default\s+function\s+([A-Za-z0-9_$]+)/g, 'function $1')
        .replace(/export\s+default\s+/g, 'const DefaultExport = ')
        .replace(/export\s+\{[^}]*\};?/g, '')
        .replace(/export\s+(const|let|var|function|class)\s+/g, '$1 ');

      return `<!DOCTYPE html>
<html lang="en" class="${iframeTheme === 'dark' ? 'dark' : ''}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sandbox Preview</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            rose: {
              400: '#fb7185',
              500: '#f43f5e',
              600: '#e11d48'
            }
          }
        }
      }
    }
  </script>
  <!-- React & ReactDOM -->
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <!-- Babel for JSX Compilation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: ${iframeTheme === 'dark' ? '#090a0f' : '#f8fafc'};
      color: ${iframeTheme === 'dark' ? '#f1f5f9' : '#0f172a'};
      min-height: 100vh;
      overflow-x: hidden;
    }
    #error-container {
      display: none;
      padding: 16px;
      margin: 16px;
      border-radius: 8px;
      background-color: #450a0a;
      border: 1px solid #dc2626;
      color: #fecaca;
      font-family: monospace;
      font-size: 12px;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div id="error-container"></div>
  <div id="root"></div>

  <script type="text/babel">
    window.onerror = function(message, source, lineno, colno, error) {
      const errBox = document.getElementById('error-container');
      if (errBox) {
        errBox.style.display = 'block';
        errBox.textContent = 'Sandbox Runtime Error: ' + message + (lineno ? ' (Line ' + lineno + ')' : '');
      }
      return false;
    };

    // 1. Explicitly import and destructure React & core hooks at head of sandboxed bundle
    var React = window.React || (typeof React !== 'undefined' ? React : undefined);
    var {
      useState,
      useEffect,
      useMemo,
      useCallback,
      useRef,
      useContext,
      useReducer,
      useLayoutEffect,
      createContext,
      Fragment
    } = React;

    // 2. Guarantee availability on window global scope
    window.React = React;
    window.useState = React.useState;
    window.useEffect = React.useEffect;
    window.useMemo = React.useMemo;
    window.useCallback = React.useCallback;
    window.useRef = React.useRef;
    window.useContext = React.useContext;
    window.useReducer = React.useReducer;
    window.createContext = React.createContext;
    window.Fragment = React.Fragment;

    // 3. Fallback components for Lucide icons commonly used in synthesized dashboards
    const LucideIconFallback = (props) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={props.size || 16}
        height={props.size || 16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={props.className || "inline-block"}
        style={props.style}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );

    const [
      Activity, Sparkles, Check, ChevronDown, ChevronRight, ChevronUp,
      Shield, Zap, Terminal, Code2, Database, Play, Plus, Search,
      ExternalLink, CheckCircle2, RotateCcw, AlertCircle, RefreshCw,
      Layers, Copy, Download, Github, Heart, Star, Settings, User,
      Clock, ArrowRight, ArrowLeft, Sun, Moon, Eye, FileText, CheckCircle
    ] = Array(35).fill(LucideIconFallback);

    try {
      const {
        useState,
        useEffect,
        useMemo,
        useCallback,
        useRef,
        useContext,
        useReducer,
        createContext
      } = React;

      ${cleanCode}

      // Determine component to mount
      const ComponentToMount = typeof SovereignExecutiveDeck !== 'undefined'
        ? SovereignExecutiveDeck
        : typeof SovereignComponent !== 'undefined'
        ? SovereignComponent
        : typeof DefaultExport !== 'undefined'
        ? DefaultExport
        : typeof App !== 'undefined'
        ? App
        : null;

      if (ComponentToMount) {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<ComponentToMount />);
      } else {
        document.getElementById('root').innerHTML = '<div style="padding: 24px; color: #94a3b8; font-family: sans-serif;">Component ready. Define a default export function to view custom UI.</div>';
      }
    } catch (err) {
      const errBox = document.getElementById('error-container');
      if (errBox) {
        errBox.style.display = 'block';
        errBox.textContent = 'Sandbox Compilation Error:\\n' + (err.stack || err.message);
      }
    }
  </script>
</body>
</html>`;
    }

    // Fallback preview for schemas / endpoints
    return `<!DOCTYPE html>
<html lang="en" class="${iframeTheme === 'dark' ? 'dark' : ''}">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background-color: ${iframeTheme === 'dark' ? '#0b0c14' : '#f8fafc'};
      color: ${iframeTheme === 'dark' ? '#e2e8f0' : '#1e293b'};
      font-family: monospace;
      padding: 24px;
    }
  </style>
</head>
<body>
  <div class="max-w-2xl mx-auto space-y-4">
    <div class="p-4 rounded-xl border ${iframeTheme === 'dark' ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'}">
      <h3 class="text-sm font-semibold mb-2">Systems Agent File Loaded</h3>
      <p class="text-xs text-slate-400">File: ${activeFile}</p>
      <div class="mt-3 text-xs bg-black/40 p-3 rounded border border-white/10 text-emerald-400">
        Contract validation active. Switch to "API Contract Runner" tab above to trigger verification requests.
      </div>
    </div>
  </div>
</body>
</html>`;
  }, [code, activeFile, iframeTheme, isIdle]);

  // Handle Tab key indentation in raw modal textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = target.value;
      const next = val.substring(0, start) + '  ' + val.substring(end);
      if (onChangeCode) onChangeCode(next);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const lineCount = useMemo(() => (code ? code.split('\n').length : 1), [code]);

  return (
    <div className={`relative flex h-full flex-col overflow-hidden transition-colors ${
      isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#090a10] text-white'
    }`}>
      {/* FILE ACTION BAR CLEANLY MOUNTED AT THE TOP OF THE CANVAS */}
      <div className={`flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-2 text-xs backdrop-blur-md z-20 ${
        isLight ? 'border-rose-200/60 bg-white/90 shadow-2xs' : 'border-white/10 bg-zinc-950/85'
      }`}>
        {/* Left: Active File & Sandbox Status */}
        <div className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-rose-400" />
          <span className="font-mono text-xs font-semibold">{activeFile}</span>

          {isIdle ? (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9.5px] font-mono ${
              isLight ? 'border-slate-300 bg-slate-100 text-slate-600' : 'border-white/10 bg-white/[0.04] text-white/50'
            }`}>
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Canvas Idle
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9.5px] font-mono ${
              isLight ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
            }`}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Sandbox Active
            </span>
          )}
        </div>

        {/* Right: File Action Controls & Viewports */}
        <div className="flex items-center gap-1.5">
          {/* [View / Edit Code] Modal Toggle */}
          <button
            onClick={() => setCodeModalOpen(true)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
              isLight
                ? 'border-rose-200 bg-rose-50/60 text-slate-800 hover:bg-rose-100 shadow-2xs'
                : 'border-white/12 bg-white/[0.05] text-white/90 hover:bg-white/10'
            }`}
            title="Open raw code editor and inspect source lines"
          >
            <Code2 className="h-3.5 w-3.5 text-rose-400" />
            <span className="hidden sm:inline">View / Edit Code</span>
            <span className="sm:hidden">Code</span>
            <span className={`ml-0.5 rounded px-1 text-[9px] font-mono ${
              isLight ? 'bg-rose-200/50 text-rose-900' : 'bg-white/10 text-white/60'
            }`}>
              {lineCount}L
            </span>
          </button>

          {/* [Export ZIP / Download] Dropdown */}
          <div className="relative" ref={downloadRef}>
            <button
              onClick={() => setDownloadDropdownOpen(!downloadDropdownOpen)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                isLight
                  ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  : 'border-white/10 hover:bg-white/[0.08] text-white/80'
              }`}
              title="Download code or export workspace zip"
            >
              <Download className="h-3.5 w-3.5 text-sky-400" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {downloadDropdownOpen && (
              <div className={`absolute right-0 top-full mt-1.5 w-52 rounded-xl border p-1.5 shadow-2xl z-50 backdrop-blur-xl ${
                isLight ? 'border-slate-200 bg-white text-slate-900' : 'border-white/15 bg-[#141522] text-white'
              }`}>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Export Options
                </div>
                <button
                  onClick={handleDownloadFile}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition ${
                    isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-white/10 text-white/90'
                  }`}
                >
                  <FileCode2 className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">Download {activeFile}</div>
                    <div className="text-[10px] text-slate-400">Single buffer file</div>
                  </div>
                </button>

                <button
                  onClick={handleDownloadZip}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition ${
                    isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-white/10 text-white/90'
                  }`}
                >
                  <FileArchive className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">Export ZIP (.zip)</div>
                    <div className="text-[10px] text-slate-400">All workspace files</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* [GitHub: Sync] Push/Pull Trigger Button */}
          <button
            onClick={() => setGithubModalOpen(true)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
              isGithubConnected
                ? isLight
                  ? 'border-violet-300 bg-violet-50 text-violet-900 hover:bg-violet-100 shadow-2xs'
                  : 'border-violet-500/40 bg-violet-500/15 text-violet-200 hover:bg-violet-500/25 shadow-2xs'
                : isLight
                ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                : 'border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]'
            }`}
            title="GitHub Repository Sync: Push and Pull repository code directly"
          >
            <GithubIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline font-mono">
              {isGithubConnected ? 'GitHub: Connected' : 'GitHub: Sync'}
            </span>
            <span className="sm:hidden font-mono">GitHub</span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isGithubConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>

          {/* Active Device Viewports & Layout Toggles */}
          <div className={`flex items-center rounded-lg p-0.5 border ${
            isLight ? 'border-slate-200 bg-slate-100' : 'border-white/10 bg-white/[0.04]'
          }`}>
            <button
              onClick={() => setViewport('desktop')}
              className={`rounded-md p-1 transition ${
                viewport === 'desktop'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-white/20 text-white'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Desktop Viewport (100%)"
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`rounded-md p-1 transition ${
                viewport === 'mobile'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-white/20 text-white'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Mobile Viewport (375px)"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleToggleSplit}
              className={`rounded-md p-1 transition ${
                viewMode === 'split'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-white/20 text-white'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title={viewMode === 'split' ? 'Switch to Full Preview' : 'Switch to Split View'}
            >
              <Columns className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`rounded-md p-1 transition ${
                isFullscreen
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-white/20 text-white'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Canvas'}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className={`rounded-lg border p-1 text-[11px] transition ${
              isLight
                ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                : 'border-white/10 hover:bg-white/[0.06] text-white/70'
            }`}
            title="Reload sandbox preview"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* MAIN SANDBOX STAGE */}
      <div className={`relative min-h-0 flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center ${
        isFullscreen ? 'fixed inset-0 z-50 bg-[#090a10] p-4' : 'bg-black/20'
      }`}>
        {isIdle ? (
          /* CLEAN MINIMAL IDLE CANVAS STATE */
          <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center select-none">
            <div className="flex flex-col items-center justify-center max-w-sm space-y-3.5">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                isLight ? 'border-rose-200 bg-rose-50 text-rose-500 shadow-xs' : 'border-white/10 bg-white/[0.04] text-rose-400'
              }`}>
                <Eye className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h4 className={`text-sm font-semibold tracking-tight ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                  Canvas Idle · Ready to preview
                </h4>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                  Prompt the agent on the left or load a file to see live rendering.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ACTIVE LIVE SANDBOX CONTAINER */
          <div
            className={`h-full transition-all duration-300 flex flex-col items-center justify-center overflow-hidden rounded-xl border shadow-xl ${
              viewport === 'desktop'
                ? 'w-full'
                : viewport === 'tablet'
                ? 'w-[768px] max-w-full'
                : 'w-[375px] max-w-full'
            } ${
              isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#090a0f]'
            }`}
            style={{
              maxHeight: '100%',
              transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
              transformOrigin: 'top center',
            }}
          >
            <iframe
              key={refreshKey}
              srcDoc={srcDoc}
              title="Live Component Sandbox"
              sandbox="allow-scripts allow-modals allow-same-origin"
              className="h-full w-full border-0 bg-transparent"
            />
          </div>
        )}
      </div>

      {/* [VIEW / EDIT CODE] MODAL OVERLAY */}
      {codeModalOpen && (
        <div className="absolute inset-0 z-40 flex flex-col bg-zinc-950 text-white animate-fade-in">
          {/* Modal Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-2.5 bg-zinc-900/90 text-xs">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-rose-400" />
              <span className="font-mono font-semibold">{activeFile}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9.5px] font-mono text-slate-300">
                {lineCount} lines
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono ml-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Compiling
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditorMode(editorMode === 'monaco' ? 'native' : 'monaco')}
                className="rounded-lg border border-white/15 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10 transition"
              >
                <Code className="h-3 w-3 inline mr-1" />
                <span>{editorMode === 'monaco' ? 'Switch to Native' : 'Switch to Monaco'}</span>
              </button>

              <button
                onClick={handleCopyCode}
                className="rounded-lg border border-white/15 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10 transition"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>

              <button
                onClick={handleDownloadFile}
                className="rounded-lg border border-white/15 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10 transition"
              >
                Download
              </button>

              <button
                onClick={() => setCodeModalOpen(false)}
                className="flex items-center gap-1 rounded-lg bg-rose-500 hover:bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-xs transition"
              >
                <X className="h-3.5 w-3.5" />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Modal Editor Body */}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            {editorMode === 'monaco' ? (
              <Editor
                height="100%"
                language={activeFile.endsWith('.tsx') || activeFile.endsWith('.ts') ? 'typescript' : 'sql'}
                value={code}
                theme="vs-dark"
                onChange={(val) => {
                  if (onChangeCode) onChangeCode(val || '');
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12.5,
                  lineNumbers: 'on',
                  lineDecorationsWidth: 6,
                  tabSize: 2,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, monospace",
                  padding: { top: 10, bottom: 10 },
                }}
                loading={
                  <div className="flex h-full w-full items-center justify-center font-mono text-xs text-white/40">
                    Loading Monaco editor...
                  </div>
                }
              />
            ) : (
              <div className="flex h-full w-full overflow-hidden bg-black/40">
                <div className="w-12 shrink-0 select-none overflow-hidden py-3 pr-3 text-right font-mono text-xs leading-[21px] bg-black/60 text-white/30 border-r border-white/10">
                  {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                <div className="relative flex-1 overflow-hidden">
                  <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => {
                      if (onChangeCode) onChangeCode(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                    className="h-full w-full resize-none p-3 font-mono text-xs leading-[21px] outline-none bg-transparent text-slate-100 selection:bg-rose-500/30"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-[11px] font-mono text-slate-400 bg-zinc-950">
            <span>Edits compile in the background and update the Live Sandbox instantly.</span>
            <button
              onClick={() => setCodeModalOpen(false)}
              className="text-rose-400 hover:underline"
            >
              Done & Return to Canvas →
            </button>
          </div>
        </div>
      )}

      {/* GITHUB SYNC MODAL */}
      <GitHubSyncModal
        open={githubModalOpen}
        onClose={() => setGithubModalOpen(false)}
        activeFile={activeFile}
        currentCode={code}
        onApplyCode={(newCode) => {
          if (onChangeCode) onChangeCode(newCode);
        }}
      />
    </div>
  );
};

export default LiveSandboxPane;
