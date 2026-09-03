import React, { useState } from 'react';
import {
  Cpu, Terminal, HardDrive, Globe, Calendar, Database,
  CheckCircle2, AlertCircle, RefreshCw, Play, ShieldCheck,
  Code2, ExternalLink, Zap, Lock, Radio
} from 'lucide-react';

interface MCPConnector {
  id: string;
  name: string;
  category: 'system' | 'browser' | 'calendar' | 'storage';
  protocol: 'MCP / stdio' | 'REST' | 'Local Bridge' | 'Sovereign Bus';
  status: 'connected' | 'idle' | 'ready';
  description: string;
  tools: string[];
  latencyMs: number;
}

export const ConnectorsHub: React.FC = () => {
  const [connectors, setConnectors] = useState<MCPConnector[]>([
    {
      id: 'mcp-local-fs',
      name: 'Local Filesystem MCP',
      category: 'system',
      protocol: 'MCP / stdio',
      status: 'connected',
      description: 'Zero-cloud local file read/write access and scratchpad synchronization.',
      tools: ['read_file', 'write_file', 'list_directory', 'sync_scratchpad'],
      latencyMs: 4,
    },
    {
      id: 'mcp-browser-bridge',
      name: 'Browser Automation MCP',
      category: 'browser',
      protocol: 'Local Bridge',
      status: 'connected',
      description: 'Executes live DOM errands across Whole Foods, Amazon, and Google Calendar via browser co-pilot.',
      tools: ['navigate_dom', 'fill_cart', 'check_delivery_slots', 'stage_checkout'],
      latencyMs: 12,
    },
    {
      id: 'mcp-calendar-engine',
      name: 'Executive Calendar MCP',
      category: 'calendar',
      protocol: 'REST',
      status: 'connected',
      description: 'Conflict resolution, scheduling buffers, and appointment drafting with Coco.',
      tools: ['inspect_conflicts', 'propose_slot', 'draft_calendar_invite'],
      latencyMs: 18,
    },
    {
      id: 'mcp-sovereign-db',
      name: 'Sovereign Local Store MCP',
      category: 'storage',
      protocol: 'Sovereign Bus',
      status: 'connected',
      description: 'Encrypted client-side memory storage and hardware-bound keys.',
      tools: ['encrypt_memory', 'query_vector_store', 'export_sovereign_archive'],
      latencyMs: 2,
    },
  ]);

  const [activeConnectorId, setActiveConnectorId] = useState<string>('mcp-browser-bridge');
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const activeConnector = connectors.find((c) => c.id === activeConnectorId) ?? connectors[0];

  const handleTestTool = (toolName: string) => {
    setIsTesting(true);
    setTestOutput(`[MCP_STDIO_CALL] Dispatching "${toolName}" on ${activeConnector.name}...`);
    setTimeout(() => {
      setTestOutput(
        `[MCP_RESPONSE_200 OK]\nTimestamp: ${new Date().toISOString()}\nTarget: ${activeConnector.name}\nTool: ${toolName}\nPayload Status: Handshake verified with Gemini Function Calling Schema.\nStatus: Ready for single-shot execution.`
      );
      setIsTesting(false);
    }, 600);
  };

  return (
    <div className="flex h-full flex-col bg-[#13141E] text-white select-none overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-6 py-4 bg-[#10111A]">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Cpu className="h-4 w-4" />
            </span>
            <h2 className="font-display text-lg font-semibold text-white">Model Context Protocol (MCP) & Connectors</h2>
          </div>
          <p className="text-xs text-white/45 mt-0.5">
            Sovereign tool definitions, local bridges, and real-time execution endpoints wired to Magdalene.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>4 Bridges Connected</span>
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
        {/* Connector List */}
        <div className="border-r border-white/8 bg-[#101118]/60 p-4 space-y-2 overflow-y-auto m-scroll">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40 px-1 mb-2">
            Configured MCP Adapters
          </p>
          {connectors.map((c) => {
            const isSelected = c.id === activeConnectorId;
            return (
              <button
                key={c.id}
                onClick={() => setActiveConnectorId(c.id)}
                className={`flex w-full flex-col rounded-xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? 'border-[var(--m-accent)] bg-white/[0.08] shadow-md ring-1 ring-[var(--m-accent)]/40'
                    : 'border-white/8 bg-white/[0.02] hover:border-white/16 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{c.name}</span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{c.latencyMs}ms</span>
                  </span>
                </div>
                <p className="text-[11px] text-white/45 mt-1 line-clamp-2">{c.description}</p>
                <div className="mt-2.5 flex items-center justify-between border-t border-white/6 pt-2 text-[10px] text-white/40">
                  <span className="font-mono">{c.protocol}</span>
                  <span>{c.tools.length} exposed tools</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Connector Details & Live Tester */}
        <div className="col-span-2 flex flex-col p-6 overflow-y-auto m-scroll space-y-6">
          <div className="rounded-2xl border border-white/8 bg-[#161724] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-white/40 font-mono">
                  {activeConnector.protocol} Adapter
                </span>
                <h3 className="text-base font-semibold text-white mt-0.5">{activeConnector.name}</h3>
              </div>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs text-emerald-300 font-medium">
                Active & Synchronized
              </span>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">{activeConnector.description}</p>

            <div className="border-t border-white/8 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-3">
                Exposed Tool Handlers
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeConnector.tools.map((t) => (
                  <div
                    key={t}
                    className="flex items-center justify-between rounded-xl border border-white/8 bg-black/30 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-sky-400" />
                      <span className="font-mono text-xs text-white/90">{t}()</span>
                    </div>
                    <button
                      onClick={() => handleTestTool(t)}
                      className="flex items-center gap-1 rounded-lg border border-white/12 bg-white/5 px-2.5 py-1 text-[11px] text-white/70 hover:border-emerald-400/40 hover:text-white transition"
                    >
                      <Play className="h-3 w-3 text-emerald-400" />
                      <span>Test</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Test Console Output */}
          <div className="rounded-2xl border border-white/8 bg-[#0D0E15] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-mono font-semibold text-white/80">
                  MCP Protocol Diagnostic Stream
                </span>
              </div>
              {isTesting && (
                <span className="flex items-center gap-1 text-[11px] text-amber-300">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Executing handshake...</span>
                </span>
              )}
            </div>

            <pre className="rounded-xl border border-white/6 bg-black/60 p-4 font-mono text-xs text-emerald-300/90 whitespace-pre-wrap leading-relaxed min-h-[140px]">
              {testOutput ||
                `// MCP Client initialized. Ready to execute tools via Magdalene Orchestration Engine.\n// Select any tool above to run an instantaneous mock handshake.`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectorsHub;
