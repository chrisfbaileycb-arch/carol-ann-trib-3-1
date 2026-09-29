import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AGENT_PRESETS, CORE_AGENT_PRESETS, type AgentPreset, type AgentSkin } from '@/data/agents';
import { loadAgents, type AgentConfig } from '@/lib/agentStore';
import { applyPlatformSafetyBaseline } from '@/data/safetyBaseline';

export type CanvasViewMode = 'split' | 'preview' | 'editor';
export type CanvasFileKey = 'Component.tsx' | 'endpoint.ts' | 'schema.sql';
export type AgentRoleType = 'ui' | 'systems';

export interface ActiveAgentContext {
  id: string;
  name: string;
  personaName: string;
  role: string;
  systemPrompt: string;
  avatar: {
    skin: AgentSkin;
    size?: number;
  };
  category: string;
  roleType: AgentRoleType;
  geminiVoice?: string;
  vendor?: string;
  blurb?: string;
  starters?: string[];
}

export interface AgentRoutingContextType {
  activeAgentContext: ActiveAgentContext;
  setActiveAgent: (agent: Partial<ActiveAgentContext> & { id: string }) => void;
  transitionToCanvasWithAgent: (agentIdOrData: string | AgentPreset | AgentConfig, preferredFile?: CanvasFileKey) => void;
  activeTab: 'chat' | 'canvas' | 'roster' | 'ledger' | 'theme';
  setActiveTab: (tab: 'chat' | 'canvas' | 'roster' | 'ledger' | 'theme') => void;
  viewMode: CanvasViewMode;
  setViewMode: (mode: CanvasViewMode) => void;
  activeFile: CanvasFileKey;
  setActiveFile: (file: CanvasFileKey) => void;
  codeBuffers: Record<CanvasFileKey, string>;
  setCodeBuffer: (file: CanvasFileKey, code: string) => void;
  resetCodeBuffer: (file: CanvasFileKey) => void;
}

export function detectRoleType(agent: {
  category?: string;
  role?: string;
  name?: string;
}): AgentRoleType {
  const cat = (agent.category || '').toLowerCase();
  const role = (agent.role || '').toLowerCase();
  const name = (agent.name || '').toLowerCase();

  // Systems / Backend / Cloud agents
  if (
    cat === 'cloud-infra' ||
    role.includes('backend') ||
    role.includes('endpoint') ||
    role.includes('system') ||
    role.includes('api') ||
    role.includes('schema') ||
    role.includes('database') ||
    role.includes('sql') ||
    role.includes('infra') ||
    name.includes('system') ||
    name.includes('prisma') ||
    name.includes('supabase') ||
    name.includes('cloudflare') ||
    name.includes('database')
  ) {
    return 'systems';
  }

  // Default to UI / Frontend Agent
  return 'ui';
}

export const DEFAULT_UI_COMPONENT = `import React, { useState, useEffect } from 'react';

interface SovereignExecutiveDeckProps {
  title?: string;
  accent?: string;
}

/**
 * SovereignExecutiveDeck — default UI agent component template.
 * Dev-side starter: duplicate it in the Workspace Canvas and make it yours.
 * State, effects, and Tailwind are wired and ready.
 */
export const SovereignExecutiveDeck: React.FC<SovereignExecutiveDeckProps> = ({
  title = 'Executive Deck',
  accent = '#8B5FBF',
}) => {
  const [pulseEnabled, setPulseEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return (
    <section
      className="rounded-2xl border border-white/10 bg-zinc-950 p-6 text-white transition-opacity duration-500"
      style={{ opacity: mounted ? 1 : 0, borderTopColor: accent }}
    >
      <header className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <button
          type="button"
          onClick={() => setPulseEnabled((v) => !v)}
          className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/70 hover:text-white"
        >
          {pulseEnabled ? 'Pulse on' : 'Pulse off'}
        </button>
      </header>
      <p className="mt-2 text-xs text-white/50">
        Replace this body with your agent's live view. This is a local dev
        template — nothing here is connected until you wire it.
      </p>
      <div className={pulseEnabled ? 'mt-4 animate-pulse rounded-xl bg-white/5 p-4' : 'mt-4 rounded-xl bg-white/5 p-4'}>
        <p className="text-[11px] text-white/40">Canvas preview region</p>
      </div>
    </section>
  );
};

export default SovereignExecutiveDeck;
`;

export const DEFAULT_SYSTEMS_ENDPOINT = `/**
 * Sovereign Systems Agent: API Endpoint & Schema Router
 * Enforces: Bearer token auth, fail-closed 401 guards, Zod schema validation,
 * and Non-Negotiable Honesty & Receipt Rules.
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

// Zod Schema Definition
export const WorkflowTaskSchema = z.object({
  taskId: z.string().min(3),
  targetService: z.enum(['firestore', 'memory_ledger', 'cloud_run', 'gemini_multimodal']),
  action: z.enum(['sync', 'verify_hash', 'audit_dump', 'dispatch']),
  parameters: z.record(z.unknown()).default({}),
  isLiveExecution: z.boolean().default(false),
});

export type WorkflowTaskPayload = z.infer<typeof WorkflowTaskSchema>;

// Secure Endpoint Route with Fail-Closed Bearer Guard
router.post('/api/systems/task/dispatch', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  // Fail-closed 401 guard: No bearer token, immediate rejection
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Fail-closed guard: missing or malformed Authorization Bearer session token.',
      code: 'AUTH_BEARER_MISSING',
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Fail-closed guard: invalid session token signature.',
      code: 'AUTH_TOKEN_INVALID',
    });
  }

  // Validate request payload with Zod
  const parseResult = WorkflowTaskSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Bad Request',
      details: parseResult.error.flatten(),
    });
  }

  const data = parseResult.data;
  const isMock = !data.isLiveExecution;

  // Strict Receipt Integrity: Zero fake 'Verified 200' claims on mock data
  const receipt = {
    receiptId: isMock ? \`SIM-\${Date.now()}\` : \`LIVE-TX-\${Date.now()}\`,
    status: isMock ? 'simulated' : 'executed',
    isMock,
    badge: isMock ? 'DEMO' : 'LIVE',
    dispatchNote: isMock
      ? 'Simulated — nothing was dispatched to production.'
      : 'Network call executed on sovereign backend.',
    timestamp: new Date().toISOString(),
    task: data,
  };

  return res.status(200).json({
    success: true,
    receipt,
  });
});

export default router;
`;

export const DEFAULT_SCHEMA_SQL = `-- Sovereign PostgreSQL Data Ledger & Access Policies
CREATE TABLE IF NOT EXISTS sovereign_audit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id VARCHAR(64) NOT NULL,
  persona_name VARCHAR(128) NOT NULL,
  operation_type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_mock BOOLEAN NOT NULL DEFAULT true,
  receipt_hash VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_agent ON sovereign_audit_ledger(agent_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON sovereign_audit_ledger(created_at DESC);

-- Row-level security policy
ALTER TABLE sovereign_audit_ledger ENABLE ROW LEVEL SECURITY;
`;

const INITIAL_AGENT_CONTEXT: ActiveAgentContext = {
  id: 'carol-anchor',
  name: 'Carol Ann',
  personaName: 'Carol Ann (Warm Anchor)',
  role: 'Frontend Architect & Sovereign Executive',
  systemPrompt: applyPlatformSafetyBaseline('You are the Frontend Architect & Agent Orchestrator. Direct clean Tailwind/React JSX and systems logic.'),
  avatar: {
    skin: { body: ['#8B5FBF', '#E8A0BF'], hat: '#FAF8F5', prop: 'halo' },
    size: 36,
  },
  category: 'orchestrator',
  roleType: 'ui',
  geminiVoice: 'Aoede',
  vendor: 'sovereign-core',
  blurb: 'Frontend Architect & UI Specialist emitting clean Tailwind and React components.',
  starters: [
    'Refactor to responsive split-pane layout',
    'Add animated status indicators and metrics',
    'Build an interactive dashboard component',
  ],
};

const AgentRoutingContext = createContext<AgentRoutingContextType | undefined>(undefined);

export const AgentRoutingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<'chat' | 'canvas' | 'roster' | 'ledger' | 'theme'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam === 'canvas' || tabParam === 'chat' || tabParam === 'roster' || tabParam === 'ledger' || tabParam === 'theme') {
        return tabParam;
      }
    }
    return 'chat';
  });

  const [viewMode, setViewModeState] = useState<CanvasViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('carol_canvas_view_mode') as CanvasViewMode;
      if (saved === 'split' || saved === 'preview' || saved === 'editor') return saved;
    }
    return 'split';
  });

  const [activeFile, setActiveFileState] = useState<CanvasFileKey>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('carol_canvas_active_file') as CanvasFileKey;
      if (saved === 'Component.tsx' || saved === 'endpoint.ts' || saved === 'schema.sql') return saved;
    }
    return 'Component.tsx';
  });

  const [codeBuffers, setCodeBuffers] = useState<Record<CanvasFileKey, string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        let savedUi = localStorage.getItem('carol_canvas_buffer_Component.tsx');
        if (savedUi && (savedUi.includes('Mission Control & Autonomous Orchestrator') || savedUi.includes('SovereignExecutiveDeck'))) {
          savedUi = '';
          localStorage.setItem('carol_canvas_buffer_Component.tsx', '');
        }
        const savedEndpoint = localStorage.getItem('carol_canvas_buffer_endpoint.ts');
        const savedSchema = localStorage.getItem('carol_canvas_buffer_schema.sql');
        return {
          'Component.tsx': savedUi ?? '',
          'endpoint.ts': savedEndpoint || DEFAULT_SYSTEMS_ENDPOINT,
          'schema.sql': savedSchema || DEFAULT_SCHEMA_SQL,
        };
      } catch {
        // Fallback to default
      }
    }
    return {
      'Component.tsx': DEFAULT_UI_COMPONENT,
      'endpoint.ts': DEFAULT_SYSTEMS_ENDPOINT,
      'schema.sql': DEFAULT_SCHEMA_SQL,
    };
  });

  const [activeAgentContext, setActiveAgentContextState] = useState<ActiveAgentContext>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('carol_active_agent_context');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id && parsed.name) return parsed;
        }
      } catch {
        // Fallback
      }
    }
    return INITIAL_AGENT_CONTEXT;
  });

  // Save changes to localStorage
  const setViewMode = useCallback((mode: CanvasViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem('carol_canvas_view_mode', mode);
    } catch {
      // storage unavailable
    }
  }, []);

  const setActiveFile = useCallback((file: CanvasFileKey) => {
    setActiveFileState(file);
    try {
      localStorage.setItem('carol_canvas_active_file', file);
    } catch {
      // storage unavailable
    }
  }, []);

  const setCodeBuffer = useCallback((file: CanvasFileKey, code: string) => {
    setCodeBuffers((prev) => {
      const next = { ...prev, [file]: code };
      try {
        localStorage.setItem(`carol_canvas_buffer_${file}`, code);
      } catch {
        // storage unavailable
      }
      return next;
    });
  }, []);

  const resetCodeBuffer = useCallback((file: CanvasFileKey) => {
    const defaultVal =
      file === 'Component.tsx'
        ? DEFAULT_UI_COMPONENT
        : file === 'endpoint.ts'
        ? DEFAULT_SYSTEMS_ENDPOINT
        : DEFAULT_SCHEMA_SQL;
    setCodeBuffer(file, defaultVal);
  }, [setCodeBuffer]);

  const setActiveAgent = useCallback((agent: Partial<ActiveAgentContext> & { id: string }) => {
    const roleType = agent.roleType || detectRoleType(agent);
    const updated: ActiveAgentContext = {
      id: agent.id,
      name: agent.name || 'Specialist Agent',
      personaName: agent.personaName || agent.name || 'Specialist',
      role: agent.role || (roleType === 'ui' ? 'UI/Frontend Architect' : 'Systems & Infrastructure Guardian'),
      systemPrompt: agent.systemPrompt || 'Execute commands and emit production code.',
      avatar: agent.avatar || {
        skin: (agent as AgentPreset).skin || { body: ['#38BDF8', '#818CF8'], hat: '#F8FAFC', prop: 'visor' },
        size: 36,
      },
      category: agent.category || (roleType === 'ui' ? 'design' : 'cloud-infra'),
      roleType,
      geminiVoice: agent.geminiVoice || 'Aoede',
      vendor: agent.vendor,
      blurb: agent.blurb,
      starters: agent.starters,
    };

    setActiveAgentContextState(updated);
    try {
      localStorage.setItem('carol_active_agent_context', JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, []);

  const setActiveTab = useCallback((tab: 'chat' | 'canvas' | 'roster' | 'ledger' | 'theme') => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Transition to Canvas when an agent card/tile is clicked
  const transitionToCanvasWithAgent = useCallback(
    (agentIdOrData: string | AgentPreset | AgentConfig, preferredFile?: CanvasFileKey) => {
      let targetAgent: Partial<ActiveAgentContext> & { id: string };

      if (typeof agentIdOrData === 'string') {
        const found = AGENT_PRESETS.find((a) => a.id === agentIdOrData);
        if (found) {
          const roleType = detectRoleType(found);
          targetAgent = {
            id: found.id,
            name: found.name,
            personaName: found.name,
            role: found.role,
            systemPrompt: applyPlatformSafetyBaseline(found.systemPrompt),
            avatar: { skin: found.skin, size: 36 },
            category: found.category,
            roleType,
            geminiVoice: found.geminiVoice,
            vendor: found.vendor,
            blurb: found.blurb,
            starters: found.starters,
          };
        } else {
          // Check local custom agents
          const customAgents = loadAgents();
          const foundCustom = customAgents.find((a) => a.id === agentIdOrData);
          if (foundCustom) {
            const roleType = detectRoleType(foundCustom);
            targetAgent = {
              id: foundCustom.id,
              name: foundCustom.name,
              personaName: foundCustom.name,
              role: foundCustom.role,
              systemPrompt: applyPlatformSafetyBaseline(foundCustom.prompt),
              avatar: { skin: foundCustom.skin, size: 36 },
              category: foundCustom.category,
              roleType,
              blurb: foundCustom.blurb,
            };
          } else {
            targetAgent = {
              id: agentIdOrData,
              name: 'Specialist Agent',
              personaName: 'Specialist Agent',
              role: 'Agent Specialist',
              systemPrompt: applyPlatformSafetyBaseline('Assist operator in active canvas workspace.'),
              avatar: {
                skin: { body: ['#38BDF8', '#818CF8'], hat: '#F8FAFC', prop: 'visor' },
                size: 36,
              },
              category: 'work',
              roleType: 'ui',
            };
          }
        }
      } else {
        const roleType = detectRoleType(agentIdOrData);
        targetAgent = {
          id: agentIdOrData.id,
          name: agentIdOrData.name,
          personaName: agentIdOrData.name,
          role: agentIdOrData.role,
          systemPrompt: applyPlatformSafetyBaseline('systemPrompt' in agentIdOrData ? agentIdOrData.systemPrompt : (agentIdOrData as AgentConfig).prompt),
          avatar: { skin: agentIdOrData.skin, size: 36 },
          category: agentIdOrData.category,
          roleType,
          vendor: (agentIdOrData as AgentPreset).vendor,
          blurb: agentIdOrData.blurb,
          starters: (agentIdOrData as AgentPreset).starters,
        };
      }

      // Update active agent
      setActiveAgent(targetAgent);

      // Determine appropriate file if not explicitly given
      const roleType = targetAgent.roleType || 'ui';
      const fileToOpen: CanvasFileKey = preferredFile || (roleType === 'systems' ? 'endpoint.ts' : 'Component.tsx');
      setActiveFile(fileToOpen);

      // Immediately switch view to Workspace Canvas tab!
      setActiveTab('canvas');
    },
    [setActiveAgent, setActiveFile, setActiveTab]
  );

  // Check URL parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      const agentParam = urlParams.get('agent');

      if (agentParam && tabParam === 'canvas') {
        transitionToCanvasWithAgent(agentParam);
      } else if (tabParam === 'canvas') {
        setActiveTab('canvas');
      }
    }
  }, [transitionToCanvasWithAgent, setActiveTab]);

  return (
    <AgentRoutingContext.Provider
      value={{
        activeAgentContext,
        setActiveAgent,
        transitionToCanvasWithAgent,
        activeTab,
        setActiveTab,
        viewMode,
        setViewMode,
        activeFile,
        setActiveFile,
        codeBuffers,
        setCodeBuffer,
        resetCodeBuffer,
      }}
    >
      {children}
    </AgentRoutingContext.Provider>
  );
};

export const useAgentRouting = () => {
  const ctx = useContext(AgentRoutingContext);
  if (!ctx) {
    throw new Error('useAgentRouting must be used within an AgentRoutingProvider');
  }
  return ctx;
};
