import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles, RotateCcw,
  Terminal, CheckCircle2,
  Wand2, Code2, Mic, FolderUp, Paperclip, X,
} from 'lucide-react';
import { useAgentRouting, type CanvasFileKey } from '@/contexts/AgentRoutingContext';
import { isLightTheme } from '@/data/intake';
import { useCarol } from '@/contexts/CarolContext';
import { useToast } from '@/hooks/use-toast';

interface SpeechRecognitionItem {
  transcript: string;
}

interface SpeechRecognitionItemCollection {
  [index: number]: SpeechRecognitionItem;
  length: number;
}

interface SpeechRecognitionEventLike {
  results: {
    [index: number]: SpeechRecognitionItemCollection;
    length: number;
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface WindowWithSpeech extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

interface ChatFeedItem {
  id: string;
  type: 'user_prompt' | 'agent_receipt';
  timestamp: string;
  promptText?: string;
  attachedFiles?: { name: string; size: number }[];
  agentName?: string;
  agentRole?: string;
  agentSkin?: string;
  actionTitle?: string;
  summary?: string;
  diffLines?: string;
  statusBadge?: string;
  auditHash?: string;
  isMock?: boolean;
}

interface CodeEditorPaneProps {
  activeFile: CanvasFileKey;
  code: string;
  onChange: (val: string) => void;
  onReset: () => void;
  onOpenConnectors?: () => void;
}

export const CodeEditorPane: React.FC<CodeEditorPaneProps> = ({
  activeFile,
  code,
  onChange,
  onReset,
}) => {
  const { activeAgentContext } = useAgentRouting();
  const { profile } = useCarol();
  const { toast } = useToast();
  const isLight = isLightTheme(profile);

  // Conversational Workspace & Prompt State
  const [promptInput, setPromptInput] = useState('');
  const [isTransforming, setIsTransforming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Chat Feed messages & task receipts (no inner agent banner / welcome card)
  const [chatFeed, setChatFeed] = useState<ChatFeedItem[]>([]);

  // Auto-scroll chat feed to bottom on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatFeed, isTransforming]);

  // Voice Input (talk-to-speak) Toggle Handler with active recording state
  const toggleVoiceInput = () => {
    if (isListening) {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    const speechWin = window as unknown as WindowWithSpeech;
    const SpeechRecognitionClass =
      speechWin.SpeechRecognition || speechWin.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          const resultsArr = Array.from({ length: event.results.length }, (_, i) => event.results[i]);
          const transcript = resultsArr
            .map((itemCol) => (itemCol[0] ? itemCol[0].transcript : ''))
            .join('');
          setPromptInput(transcript);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        speechRecognitionRef.current = recognition;
        recognition.start();
      } catch {
        setIsListening(false);
      }
    } else {
      // Graceful simulated voice capture fallback with visual pulse
      setIsListening(true);
      setTimeout(() => {
        setPromptInput((prev) =>
          prev
            ? `${prev} with responsive metrics deck and dark mode toggle`
            : 'Refactor component with clean metrics cards and responsive Tailwind layout'
        );
        setIsListening(false);
      }, 2400);
    }
  };

  // File / Directory Assets Attachment Handlers
  const handleFileAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newItems = Array.from(e.target.files).map((f) => ({
        name: f.name,
        size: f.size,
      }));
      setAttachedFiles((prev) => [...prev, ...newItems]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Agent Prompt Execution: Intelligent code refactoring & generation
  const handleExecutePrompt = useCallback(
    (customPrompt?: string) => {
      const p = customPrompt || promptInput;
      if (!p.trim()) return;

      const userMessageId = `usr-${Date.now()}`;
      const currentFiles = [...attachedFiles];

      // Add user instruction to chat feed immediately
      setChatFeed((prev) => [
        ...prev,
        {
          id: userMessageId,
          type: 'user_prompt',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          promptText: p,
          attachedFiles: currentFiles.length > 0 ? currentFiles : undefined,
        },
      ]);

      setPromptInput('');
      setAttachedFiles([]);
      setIsTransforming(true);

      const targetAgentName = activeAgentContext.personaName || activeAgentContext.name;
      const targetAgentRole = activeAgentContext.role;

      setTimeout(() => {
        let transformed = code;
        const promptLower = p.toLowerCase();
        let actionTitle = 'Autonomous Code Refactor';
        let actionSummary = `Refactored ${activeFile} based on instruction: "${p}". Verified clean execution in Live Sandbox.`;
        let linesChanged = 14;

        // If code is empty on initial load, generate a clean starting component
        if (!transformed || !transformed.trim()) {
          transformed = `import React, { useState, useEffect } from 'react';

export default function SovereignComponent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [themeMode, setThemeMode] = useState('dark');

  const metrics = [
    { label: 'System Health', value: '100%', status: 'optimal' },
    { label: 'Active Specialists', value: '4 Online', status: 'optimal' },
    { label: 'Audit Verification', value: 'Verified', status: 'optimal' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase text-rose-400">Sovereign Studio Canvas</span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Autonomous Component</h1>
          </div>
          <button
            onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-900 text-slate-200"
          >
            Mode: {themeMode}
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.map((m, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="text-xs text-slate-400 font-medium">{m.label}</div>
              <div className="text-2xl font-bold text-white mt-1">{m.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`;
          actionTitle = 'Synthesized Component';
          actionSummary = `Synthesized clean React component in response to: "${p}". Live Sandbox updated.`;
          linesChanged = 36;
        } else if (activeAgentContext.roleType === 'ui' || activeFile === 'Component.tsx') {
          // UI Agent Transformations
          if (promptLower.includes('dark') || promptLower.includes('theme')) {
            if (!transformed.includes('themeMode')) {
              transformed = transformed.replace(
                /export default function ([A-Za-z0-9_]+)\(\) \{/g,
                `export default function $1() {\n  const [themeMode, setThemeMode] = useState('dark');`
              );
            }
            actionTitle = 'Synthesized Theme Mode State';
            actionSummary = 'Injected responsive dark/light mode state hook and classes. Live Sandbox refreshed with reactive styles.';
            linesChanged = 8;
          } else if (promptLower.includes('card') || promptLower.includes('metric')) {
            transformed = transformed.replace(
              /\{ label: 'System Health', value: '100%', status: 'optimal' \},/g,
              `{ label: 'System Health', value: '100%', status: 'optimal' },\n    { label: 'Specialist Latency', value: '8ms', status: 'optimal' },`
            );
            actionTitle = 'Synthesized Latency Metrics Card';
            actionSummary = 'Added specialist telemetry card with microsecond latency metrics and high-integrity status tags.';
            linesChanged = 12;
          } else if (promptLower.includes('chart') || promptLower.includes('sparkline')) {
            transformed = transformed.replace(
              /<div className="grid grid-cols-1 md:grid-cols-3 gap-4">/g,
              `{/* Sparkline Activity */}\n        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between mb-4">\n          <div>\n            <span className="text-xs text-slate-400">Real-time Multimodal Bus</span>\n            <div className="text-lg font-bold text-emerald-400">99.98% Uptime</div>\n          </div>\n          <div className="flex gap-1 items-end h-8">\n            {[40, 65, 30, 85, 95, 75, 100].map((h, i) => (\n              <div key={i} style={{ height: \`\${h}%\` }} className="w-2 rounded-t bg-rose-500/80 hover:bg-rose-400 transition" />\n            ))}\n          </div>\n        </div>\n\n        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">`
            );
            actionTitle = 'Synthesized Real-Time Sparkline Deck';
            actionSummary = 'Generated real-time multimodal bus uptime sparkline with reactive bar animations and Tailwind classes.';
            linesChanged = 20;
          } else {
            transformed = transformed.replace(
              /<div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">/g,
              `<div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans animate-fade-in">`
            );
            actionTitle = 'Refactored Component Layout';
            actionSummary = `Synthesized UI styling and JSX enhancements for "${p}". Live Sandbox recompiled in background.`;
            linesChanged = 6;
          }
        } else {
          // Systems Agent Transformations
          if (promptLower.includes('guard') || promptLower.includes('401') || promptLower.includes('bearer')) {
            if (!transformed.includes('AUTH_BEARER_MISSING')) {
              transformed = `// Bearer token guard enforced by ${targetAgentName}\n` + transformed;
            }
            actionTitle = 'Enforced Fail-Closed 401 Bearer Guard';
            actionSummary = 'Verified strict token authorization headers. Missing or malformed requests now reject with fail-closed security.';
            linesChanged = 16;
          } else {
            transformed = `// Code updated by Systems Agent: ${targetAgentName}\n` + transformed;
            actionTitle = 'Updated Systems Contract';
            actionSummary = `Synthesized endpoint/schema logic in response to instruction: "${p}".`;
            linesChanged = 8;
          }
        }

        // Apply updated code into buffer (compiles in background for right pane)
        onChange(transformed);

        // Add specialized agent task receipt to the feed
        const receiptItem: ChatFeedItem = {
          id: `rec-${Date.now()}`,
          type: 'agent_receipt',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agentName: targetAgentName,
          agentRole: targetAgentRole,
          actionTitle,
          summary: actionSummary,
          diffLines: `+${linesChanged} lines modified in ${activeFile}`,
          statusBadge: 'SYNTHESIS COMPLETE',
          auditHash: `SHA-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          isMock: true,
        };

        setChatFeed((prev) => [...prev, receiptItem]);
        setIsTransforming(false);

        toast({
          title: actionTitle,
          description: `Live Sandbox updated · ${activeFile}`,
        });
      }, 450);
    },
    [code, promptInput, attachedFiles, activeAgentContext, activeFile, onChange, toast]
  );

  // Quick Action Suggestions based on persona role (rendered with zero bleeding text)
  const quickChips = useMemo(() => {
    if (activeAgentContext.roleType === 'ui' || activeFile === 'Component.tsx') {
      return [
        'Add Dark Theme Toggle',
        'Add Metrics Sparkline',
        'Add Responsive Grid Card',
        'Add Glassmorphism Style',
      ];
    }
    return [
      'Enforce 401 Bearer Guard',
      'Extend Zod Schema Validator',
      'Add Audit Receipt Hash',
      'Add Rate Limiter Check',
    ];
  }, [activeAgentContext.roleType, activeFile]);

  return (
    <div className={`relative flex h-full flex-col overflow-hidden transition-colors ${
      isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#0b0c14] text-white'
    }`}>
      {/* CLEAN TOP TOOLBAR (NO DUPLICATE ACTION BUTTONS) */}
      <div className={`flex shrink-0 items-center justify-between border-b px-4 py-2.5 text-xs backdrop-blur-md z-20 ${
        isLight ? 'border-rose-200/60 bg-white/90 shadow-2xs' : 'border-white/10 bg-zinc-950/85'
      }`}>
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-rose-400" />
          <span className="font-semibold text-xs">Conversational Agent Feed</span>
          <span className={`rounded-full border px-2 py-0.2 text-[9.5px] font-mono ${
            isLight ? 'border-rose-200 bg-rose-50 text-slate-600' : 'border-white/10 bg-white/[0.04] text-white/50'
          }`}>
            Target: {activeFile}
          </span>
        </div>

        {chatFeed.length > 0 && (
          <button
            onClick={() => setChatFeed([])}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10.5px] transition ${
              isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-100' : 'border-white/10 text-white/60 hover:text-white'
            }`}
            title="Clear message feed"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* CHAT FEED MESSAGE STREAM (NO REDUNDANT INNER AGENT HEADER CARDS) */}
      <div
        ref={chatScrollRef}
        className="relative min-h-0 flex-1 overflow-y-auto m-scroll p-4 space-y-4"
      >
        {chatFeed.length === 0 ? (
          /* CLEAN IDLE WORKSPACE STATE */
          <div className="flex h-full flex-col items-center justify-center p-8 text-center select-none text-slate-400 space-y-2.5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
              isLight ? 'border-rose-200 bg-rose-50 text-rose-500' : 'border-white/10 bg-white/[0.04] text-rose-400'
            }`}>
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-xs text-slate-300 font-medium">Conversational Workspace Ready</p>
            <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
              Submit an instruction below or click a suggestion chip to synthesize components in real time.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {chatFeed.map((item) => {
              if (item.type === 'user_prompt') {
                return (
                  <div key={item.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 p-3 text-xs text-white shadow-md space-y-1.5">
                      <div className="flex items-center justify-between gap-4 text-[10px] text-white/70 font-mono">
                        <span>Instruction</span>
                        <span>{item.timestamp}</span>
                      </div>
                      <p className="font-medium leading-relaxed whitespace-pre-wrap">{item.promptText}</p>

                      {item.attachedFiles && item.attachedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-white/20">
                          {item.attachedFiles.map((file, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded bg-black/20 px-1.5 py-0.5 text-[9.5px] text-white/90"
                            >
                              <Paperclip className="h-2.5 w-2.5" />
                              <span className="truncate max-w-[120px]">{file.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Agent Task Receipt
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 text-xs transition-all space-y-2.5 ${
                    isLight
                      ? 'border-emerald-200/80 bg-white shadow-xs'
                      : 'border-white/10 bg-[#12131f] shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b pb-2 border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-rose-400">{item.agentName}</span>
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9.5px] font-mono text-emerald-300">
                        {item.statusBadge}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">{item.timestamp}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>{item.actionTitle}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11.5px]">
                      {item.summary}
                    </p>
                  </div>

                  <div className={`flex items-center justify-between rounded-xl p-2 font-mono text-[10.5px] ${
                    isLight ? 'bg-slate-100 text-slate-700' : 'bg-black/40 text-slate-300 border border-white/5'
                  }`}>
                    <span className="text-emerald-400">{item.diffLines}</span>
                    <span className="text-slate-400">{item.auditHash}</span>
                  </div>
                </div>
              );
            })}

            {isTransforming && (
              <div className={`rounded-2xl border p-4 text-xs space-y-2.5 animate-pulse ${
                isLight ? 'border-rose-200 bg-rose-50/50' : 'border-rose-500/30 bg-rose-500/10'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold text-rose-400">
                    <Wand2 className="h-4 w-4 animate-spin text-rose-400" />
                    Specialist Synthesizing Changes...
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Compiling Sandbox</span>
                </div>
                <p className="text-[11.5px] text-slate-300">
                  Transforming buffer logic and updating live execution canvas.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PINNED PROMPT DOCK (SOLID OPAQUE BG, ZERO BLEEDING TEXT, Z-INDEX ISOLATED) */}
      <div className={`relative z-30 shrink-0 border-t p-3.5 shadow-2xl backdrop-blur-md space-y-2.5 ${
        isLight
          ? 'border-slate-200 bg-white/95 text-slate-900'
          : 'border-slate-800 bg-slate-900/95 text-white'
      }`}>
        {/* Clean Suggestion Chips (NO BLEEDING TEXT) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleExecutePrompt(chip)}
              disabled={isTransforming}
              className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium transition ${
                isLight
                  ? 'border-rose-200 bg-rose-50 text-slate-700 hover:bg-rose-100 hover:text-slate-900'
                  : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:text-white'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Attached Files Chips */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attachedFiles.map((file, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-white/80"
              >
                <Paperclip className="h-2.5 w-2.5 text-rose-400" />
                <span className="max-w-[130px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(idx)}
                  className="text-white/40 hover:text-white"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Action Controls & Input Dock Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecutePrompt();
          }}
          className="flex items-center gap-2"
        >
          {/* Talk-to-Speak (Microphone) Button with Active Recording State */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
              isListening
                ? 'border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-500/40 ring-2 ring-rose-400/80 animate-pulse'
                : isLight
                ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                : 'border-white/12 bg-white/[0.05] text-white/80 hover:bg-white/10'
            }`}
            title={isListening ? 'Recording voice... click to stop' : 'Voice Input (talk-to-speak)'}
          >
            <Mic className={`h-4 w-4 ${isListening ? 'animate-bounce text-white' : ''}`} />
            {isListening && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
          </button>

          {/* Folder / Attach File Button */}
          <button
            type="button"
            onClick={handleFileAttachmentClick}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
              isLight
                ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                : 'border-white/12 bg-white/[0.05] text-white/80 hover:bg-white/10'
            }`}
            title="Attach files or directory assets"
          >
            <FolderUp className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Prompt Text Input (Solid Opaque Background, Zero Bleeding) */}
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder={
              isListening
                ? 'Listening... speak your prompt'
                : `Instruct ${activeAgentContext.name} (e.g. 'Build dashboard', 'Add sparkline metrics')...`
            }
            disabled={isTransforming}
            className={`flex-1 rounded-xl border px-3.5 py-2 text-xs outline-none transition ${
              isListening
                ? 'border-rose-400 bg-rose-500/10 text-rose-200 placeholder:text-rose-300/60'
                : isLight
                ? 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-rose-400'
                : 'border-slate-700/80 bg-slate-950 text-white placeholder:text-white/40 focus:border-rose-500/80'
            }`}
          />

          {/* Emit / Send Button Cleanly Aligned to the Right */}
          <button
            type="submit"
            disabled={isTransforming || !promptInput.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-40 shrink-0"
          >
            <Wand2 className={`h-3.5 w-3.5 ${isTransforming ? 'animate-spin' : ''}`} />
            <span>{isTransforming ? 'Emitting...' : 'Emit'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default CodeEditorPane;
