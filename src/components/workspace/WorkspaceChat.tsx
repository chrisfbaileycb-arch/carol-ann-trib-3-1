import React, { useCallback, useEffect, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import {
  PanelLeftClose, PanelLeft, PanelRightClose, PanelRight,
  Sparkles, X, Plus, MessageSquare, Cpu, Trophy, Shield, Users, Palette,
  ChevronDown
} from 'lucide-react';
import type {
  ConversationMessage, ErrandTask, HydrateFormAction,
  MemoryEntry, StickerWatermark, UserProfile, ChatAttachment
} from '@/data/schemas';
import { AESTHETIC_THEMES, type AestheticTheme, isLightTheme } from '@/data/intake';
import { LeftRail, type ChatThread } from '@/components/workspace/LeftRail';
import { DialogueCanvas } from '@/components/workspace/DialogueCanvas';
import { RightDrawer } from '@/components/workspace/RightDrawer';
import { ConnectorsHub } from '@/components/workspace/ConnectorsHub';
import { SpaceCustomizer } from '@/components/workspace/SpaceCustomizer';
import { MemoryLedgerTab } from '@/components/workspace/MemoryLedgerTab';
import AgentStudio from '@/components/agents/AgentStudio';
import {
  loadMessages, saveMessages, loadErrands, saveErrands,
  loadMemories, saveMemories, loadProfile, saveProfile,
  loadStickers, saveStickers, loadScratchpad, saveScratchpad,
  loadActions, saveActions, uid
} from '@/lib/memoryStore';
import { AGENT_PRESETS } from '@/data/agents';
import { loadInstalledPluginIds } from '@/data/mcpPlugins';
import { tryExecutePluginIntent } from '@/data/pluginMockRunner';
import {
  getAgentExecutionProfile,
  partitionMemoriesForAgent,
  buildAgentSystemPersona
} from '@/lib/agentRunner';
import { useAuth } from '@/contexts/AuthContext';
import { useCarol } from '@/contexts/CarolContext';
import { executeWorkflowOnBackend } from '@/lib/workflowExecution';
import { apiFetch } from '@/lib/apiClient';

export interface WorkspaceTab {
  id: string;
  title: string;
  type: 'chat' | 'connectors' | 'customizer' | 'ledger' | 'agent' | 'theme';
  icon: string;
  closable: boolean;
  agentId?: string;
}

interface WorkspaceChatProps {
  profile: UserProfile;
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  theme: AestheticTheme;
  onOpenAgentRoster: () => void;
}

export const WorkspaceChat: React.FC<WorkspaceChatProps> = ({
  profile,
  onUpdateProfile,
  theme,
  onOpenAgentRoster,
}) => {
  const { user } = useAuth();
  const {
    stickers,
    addSticker: handleAddSticker,
    updateSticker: handleUpdateSticker,
    deleteSticker: handleDeleteSticker,
    toggleSticker: handleToggleSticker,
  } = useCarol();

  // 3-Pane Layout Open / Collapse States
  const [leftOpen, setLeftOpen] = useState<boolean>(true);
  const [rightOpen, setRightOpen] = useState<boolean>(true);

  // Tabs for the Center Stage
  const [tabs, setTabs] = useState<WorkspaceTab[]>([
    {
      id: 'tab_dialogue',
      title: 'Carol Dialogue (Primary)',
      type: 'chat',
      icon: '💬',
      closable: false,
    },
    {
      id: 'tab_connectors',
      title: 'MCP Connectors & Bridges',
      type: 'connectors',
      icon: '🔌',
      closable: true,
    },
    {
      id: 'tab_customizer',
      title: 'Space Customizer (MySpace)',
      type: 'customizer',
      icon: '🎨',
      closable: true,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab_dialogue');
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Active Thread & Agent state
  const [threads, setThreads] = useState<ChatThread[]>([
    {
      id: 'th_orchestrator',
      title: 'Daily Sovereign Orchestration',
      domain: 'core',
      updatedAt: new Date().toISOString(),
      agentId: 'carol-anchor',
    },
  ]);
  const [activeThreadId, setActiveThreadId] = useState<string>('th_orchestrator');
  const [activeAgentId, setActiveAgentId] = useState<string>('carol-anchor');

  // Messages, Errands, Actions, Memories, Scratchpad
  const [messages, setMessages] = useState<ConversationMessage[]>(() => loadMessages());
  const [errands, setErrands] = useState<ErrandTask[]>(() => loadErrands());
  const [actions, setActions] = useState<HydrateFormAction[]>(() => loadActions());
  const [memories, setMemories] = useState<MemoryEntry[]>(() => loadMemories());
  const [scratchpad, setScratchpad] = useState<string>(() => loadScratchpad());
  const [installedPluginIds, setInstalledPluginIds] = useState<string[]>(() => loadInstalledPluginIds());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Sync back to local store
  useEffect(() => { saveMessages(messages); }, [messages]);
  useEffect(() => { saveErrands(errands); }, [errands]);
  useEffect(() => { saveActions(actions); }, [actions]);
  useEffect(() => { saveMemories(memories); }, [memories]);
  useEffect(() => { saveScratchpad(scratchpad); }, [scratchpad]);

  // Sync plugin updates across tabs and views
  useEffect(() => {
    const handleStorageChange = () => {
      setInstalledPluginIds(loadInstalledPluginIds());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Tab Open helper
  const handleOpenTab = (
    tabType: 'chat' | 'agent' | 'connectors' | 'ledger' | 'customizer' | 'theme',
    meta?: { agentId?: string }
  ) => {
    const existingTab = tabs.find((t) => {
      if (tabType === 'agent') return t.type === 'agent' && t.agentId === meta?.agentId;
      return t.type === tabType;
    });

    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const tabConfig: Record<string, { title: string; icon: string }> = {
      chat: { title: 'Carol Dialogue (Primary)', icon: '💬' },
      connectors: { title: 'MCP Connectors & Bridges', icon: '🔌' },
      customizer: { title: 'Space Customizer (MySpace)', icon: '🎨' },
      ledger: { title: 'Sovereign Memory Ledger', icon: '🛡️' },
      agent: {
        title: meta?.agentId
          ? `${AGENT_PRESETS.find((a) => a.id === meta.agentId)?.name || 'Agent'} Workstation`
          : 'Agent Studio',
        icon: '👥',
      },
      theme: { title: 'Aesthetic Themes', icon: '⚙️' },
    };

    const newTab: WorkspaceTab = {
      id: `tab_${tabType}_${Date.now()}`,
      title: tabConfig[tabType]?.title || 'Workspace Tab',
      type: tabType,
      icon: tabConfig[tabType]?.icon || '📄',
      closable: tabType !== 'chat',
      agentId: meta?.agentId,
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id && remaining.length > 0) {
      setActiveTabId(remaining[remaining.length - 1].id);
    }
  };

  // Memory Handlers
  const handleAddMemory = (partial: Partial<MemoryEntry>) => {
    const newM: MemoryEntry = {
      id: uid('mem'),
      category: partial.category || 'general',
      content: partial.content || '',
      tags: partial.tags || ['sovereign'],
      created_at: new Date().toISOString(),
    };
    setMemories((prev) => [newM, ...prev]);
  };

  const handleDeleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleClearAllMemories = () => {
    setMemories([]);
  };

  // Thread Handlers
  const handleNewThread = () => {
    const newThread: ChatThread = {
      id: uid('th'),
      title: `Session ${threads.length + 1}`,
      domain: 'core',
      updatedAt: new Date().toISOString(),
      agentId: activeAgentId,
    };
    setThreads([newThread, ...threads]);
    setActiveThreadId(newThread.id);
    handleOpenTab('chat');
  };

  const handleDeleteThread = (id: string) => {
    const filtered = threads.filter((t) => t.id !== id);
    setThreads(filtered);
    if (activeThreadId === id && filtered.length > 0) {
      setActiveThreadId(filtered[0].id);
    }
  };

  // Errand Handlers
  const handleAddErrand = (partial: Partial<ErrandTask>) => {
    const newE: ErrandTask = {
      id: uid('er'),
      target: partial.target ?? 'custom',
      title: partial.title ?? 'New Errand',
      items: partial.items ?? ['Item 1'],
      status: partial.status ?? 'draft',
      scheduled_time: partial.scheduled_time,
    };
    setErrands((prev) => [newE, ...prev]);
  };

  const handleUpdateErrand = (updated: ErrandTask) => {
    setErrands((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleDeleteErrand = (id: string) => {
    setErrands((prev) => prev.filter((e) => e.id !== id));
  };

  // Execution of tool call actions
  const handleExecuteToolAction = async (action: HydrateFormAction) => {
    const updatedAction: HydrateFormAction = {
      ...action,
      status: 'executed',
      executed_at: new Date().toISOString(),
    };

    setActions((prev) => [updatedAction, ...prev.filter((a) => a.id !== action.id)]);

    setMessages((prev) =>
      prev.map((m) => (m.toolCall?.id === action.id ? { ...m, toolCall: updatedAction } : m))
    );

    // Follow through with comprehensive Firebase backend execution:
    try {
      const execResult = await executeWorkflowOnBackend(action, user?.id);
      if (execResult.errand) {
        setErrands((prev) => [execResult.errand!, ...prev.filter((e) => e.id !== execResult.errand!.id)]);
      }
    } catch (backendErr) {
      console.warn('[WorkspaceChat] Workflow backend execution fallback:', backendErr);
    }

    if (action.category === 'errand') {
      handleAddErrand({
        title: action.form_payload.title,
        items: action.form_payload.items ?? [],
        scheduled_time: action.form_payload.target_time,
        status: 'executed',
        target: action.action_name.toLowerCase().includes('whole foods')
          ? 'whole-foods'
          : action.action_name.toLowerCase().includes('amazon')
          ? 'amazon'
          : 'custom',
      });
    } else if (action.category === 'social_marketing') {
      const addition = `\n\n### Dispatched via ${action.target_app || 'Social Hub'} (Simulated)\n- **Action:** ${action.action_name}\n- **Title:** ${action.form_payload.title}\n- **Scheduled Time:** ${action.form_payload.target_time ?? 'Immediate'}\n- **Status:** Simulated — nothing was dispatched (Demo fixture only)`;
      setScratchpad((prev) => prev + addition);
    } else if (action.category === 'finance_accounting') {
      const addition = `\n\n### Dispatched via ${action.target_app || 'Accounting Hub'} (Simulated)\n- **Action:** ${action.action_name}\n- **Title:** ${action.form_payload.title}\n- **Payload:** ${JSON.stringify(action.form_payload.fields ?? {})}\n- **Receipt:** Simulated — nothing was dispatched (Demo fixture only)`;
      setScratchpad((prev) => prev + addition);
    } else if (action.category === 'hospitality_review') {
      const addition = `\n\n### Dispatched via ${action.target_app || 'Review Hub'} (Simulated)\n- **Action:** ${action.action_name}\n- **Response:** "${action.form_payload.notes ?? action.form_payload.title}"\n- **Status:** Simulated — nothing was dispatched (Demo fixture only)`;
      setScratchpad((prev) => prev + addition);
    } else if (action.category === 'scratchpad_update') {
      const addition = `\n\n### Updated via ${action.action_name}\n- **Title:** ${action.form_payload.title}\n- **Items:** ${(action.form_payload.items ?? []).join(', ')}\n- **Target Time:** ${action.form_payload.target_time ?? 'N/A'}`;
      setScratchpad((prev) => prev + addition);
    } else if (action.category === 'calendar_booking') {
      handleAddErrand({
        title: `Calendar: ${action.form_payload.title}`,
        items: action.form_payload.items ?? ['Confirmed buffer time', 'Location verified'],
        scheduled_time: action.form_payload.target_time,
        status: 'executed',
        target: 'custom',
      });
    }

    if (!rightOpen) {
      setRightOpen(true);
    }
  };

  // User cancellation of a staged action card
  const handleCancelToolAction = (action: HydrateFormAction) => {
    const updatedAction: HydrateFormAction = {
      ...action,
      status: 'cancelled',
    };
    setActions((prev) => [updatedAction, ...prev.filter((a) => a.id !== action.id)]);
    setMessages((prev) =>
      prev.map((m) => (m.toolCall?.id === action.id ? { ...m, toolCall: updatedAction } : m))
    );
  };

  // Active Gemini API execution with streaming, sub-agent persona, and workspace context injection
  const handleSendMessage = async (
    content: string,
    targetAgentId?: string,
    attachments?: ChatAttachment[]
  ) => {
    const agentId = targetAgentId || activeAgentId;
    const agent = AGENT_PRESETS.find((a) => a.id === agentId) ?? AGENT_PRESETS[0];

    const userMsg: ConversationMessage = {
      id: uid('msg_u'),
      domain: 'core',
      role: 'user',
      content,
      richAttachments: attachments,
      timestamp: new Date().toISOString(),
      agentId,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    // 1. Verify Gemini API Key configuration
    const apiKey =
      (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
      (import.meta.env ? (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) : undefined) ||
      '';

    if (!apiKey) {
      const assistantMsg: ConversationMessage = {
        id: uid('msg_a'),
        domain: 'core',
        role: 'assistant',
        content:
          'Gemini API key is missing from environment variables (process.env.GEMINI_API_KEY). Please set GEMINI_API_KEY in your environment to enable active AI chat.',
        timestamp: new Date().toISOString(),
        agentId,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsProcessing(false);
      return;
    }

    // 2. Build system instruction for selected sub-agent & inject active workspace context
    const agentExec = getAgentExecutionProfile(agentId);
    const partitionInfo = partitionMemoriesForAgent(agentId, memories);
    const basePersona = buildAgentSystemPersona(agentId, profile, memories);

    // Format current workspace context: Errands, Tools, Notes
    const errandsContext =
      errands.length > 0
        ? errands
            .map(
              (e, idx) =>
                `${idx + 1}. [${(e.status || 'draft').toUpperCase()}] ${e.title} (Target: ${e.target || 'general'}, Scheduled: ${e.scheduled_time || 'flexible'}${
                  e.items?.length ? `, Items: ${e.items.join(', ')}` : ''
                })`
            )
            .join('\n')
        : 'No active errands in workspace.';

    const toolsContext = [
      '- Grocery & Delivery Dispatch (Whole Foods, Amazon)',
      '- Executive Calendar & Appointment Booking',
      '- Accounts Receivable Invoicing (QuickBooks Online)',
      '- Social Marketing & Instagram Reel Publishing (Meta Graph API)',
      '- Guest Hospitality Review Public Responses (TripAdvisor / Google Business)',
      '- Sovereign Memory Ledger Record Management',
      '- Wellness Routine & Training Scratchpad Updates',
      installedPluginIds.length > 0
        ? `- Installed MCP Plugins: ${installedPluginIds.join(', ')}`
        : '- Core Executive MCP Connectors Hub',
    ].join('\n');

    const notesContext = scratchpad.trim() ? scratchpad.trim() : 'Workspace notes scratchpad is currently empty.';

    const systemInstruction = `${basePersona}

# Active Workspace Context (Live Environment)
## Active Errands:
${errandsContext}

## Active Tools & Connectors:
${toolsContext}

## Workspace Notes & Scratchpad:
${notesContext}

Operating Directives:
- You are strictly operating as ${agent.name} (${agent.role}).
- Embody ${agent.name}'s dedicated tone, domain expertise, and executive warmth.
- Reference and interact with the active errands, tools, and scratchpad notes above when responding.
- Provide intelligent, direct, and actionable responses without conversational filler.`;

    const assistantMsgId = uid('msg_a');
    const initialAssistantMsg: ConversationMessage = {
      id: assistantMsgId,
      domain: 'core',
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      agentId,
    };
    setMessages((prev) => [...prev, initialAssistantMsg]);

    try {
      let accumulated = '';

      // Build conversation contents for Gemini
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      for (const h of messages.slice(-10)) {
        if (h.role === 'user' || h.role === 'assistant') {
          contents.push({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }],
          });
        }
      }
      contents.push({ role: 'user', parts: [{ text: content }] });

      // Call GoogleGenAI (@google/genai) using model gemini-2.5-flash
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      try {
        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction,
          },
        });

        for await (const chunk of responseStream) {
          const chunkText = chunk.text || '';
          accumulated += chunkText;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulated } : m))
          );
        }
      } catch (streamErr) {
        console.warn('Direct stream encounter, falling back to server inference route:', streamErr);
        const currentInstalledIds = loadInstalledPluginIds();
        const res = await apiFetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            agentId,
            agentName: agentExec.name,
            agentRole: agentExec.role,
            systemPersona,
            memoryPartition: partitionInfo.partitionName,
            history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
            profile: {
              name: profile.name,
              identity: profile.identity,
              wellnessGoal: profile.wellnessGoal,
              professionalFocus: profile.professionalFocus,
            },
            memoryContext: partitionInfo.activeMemories
              .slice(0, 10)
              .map((m) => `- [${m.category}] ${m.content}`)
              .join('\n'),
            installedPlugins: currentInstalledIds,
            workspaceContext: {
              errands: errandsContext,
              tools: toolsContext,
              notes: notesContext,
            },
          }),
        });

        if (!res.ok) {
          throw new Error(`Inference request failed with code ${res.status}`);
        }

        const data = await res.json();
        accumulated = data.reply || '';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: accumulated, toolCall: data.toolCall } : m
          )
        );
        if (data.toolCall) {
          setActions((prev) => [data.toolCall!, ...prev]);
          if (!data.toolCall.requires_user_confirmation) {
            handleExecuteToolAction(data.toolCall);
          }
        }
      }

      if (!accumulated) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: 'Understood. Response processed.' } : m
          )
        );
      }
    } catch (err) {
      console.error('Gemini chat error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `Unable to complete request with Gemini: ${errMsg}. Please verify your connection and GEMINI_API_KEY configuration.`,
              }
            : m
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const isLight = isLightTheme(profile);

  return (
    <div className={`relative flex h-full min-h-0 w-full overflow-hidden bg-transparent ${isLight ? 'text-slate-800' : 'text-white'}`}>
      {/* 1. Left Rail (Conversational History, MCPs & Personal Space) */}
      <div
        className={`relative shrink-0 transition-all duration-300 ease-in-out border-r z-20 ${
          isLight ? 'border-rose-200/60' : 'border-white/8'
        } ${leftOpen ? 'w-80' : 'w-0'}`}
      >
        <div className={`h-full w-80 overflow-hidden ${leftOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <LeftRail
            threads={threads}
            activeThreadId={activeThreadId}
            onSelectThread={setActiveThreadId}
            onNewThread={handleNewThread}
            onDeleteThread={handleDeleteThread}
            memories={memories}
            profile={profile}
            onUpdateProfile={onUpdateProfile}
            theme={theme}
            stickers={stickers}
            onToggleSticker={handleToggleSticker}
            onOpenAgentRoster={onOpenAgentRoster}
            onOpenTab={handleOpenTab}
            installedPluginIds={installedPluginIds}
          />
        </div>
      </div>

      {/* Center Stage & In-line Drawer Flex Container */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-row">
        {/* Toggle Left Rail Button Overlay */}
        <button
          onClick={() => setLeftOpen(!leftOpen)}
          title={leftOpen ? 'Collapse Left Rail' : 'Expand Left Rail'}
          className={`absolute left-3 top-2.5 z-30 flex h-7 w-7 items-center justify-center rounded-lg border backdrop-blur-md transition shadow-md ${
            isLight
              ? 'border-rose-200/80 bg-white/80 text-slate-600 hover:text-slate-900 hover:border-rose-300'
              : 'border-white/10 bg-zinc-900/80 text-white/50 hover:border-white/25 hover:text-white'
          }`}
        >
          {leftOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </button>

        {/* Toggle Right Drawer Button Overlay */}
        <button
          onClick={() => setRightOpen(!rightOpen)}
          title={rightOpen ? 'Collapse Automation Dock' : 'Expand Automation Dock'}
          className={`absolute right-3 top-2.5 z-30 flex h-7 w-7 items-center justify-center rounded-lg border backdrop-blur-md transition shadow-md ${
            isLight
              ? 'border-rose-200/80 bg-white/80 text-slate-600 hover:text-slate-900 hover:border-rose-300'
              : 'border-white/10 bg-zinc-900/80 text-white/50 hover:border-white/25 hover:text-white'
          }`}
        >
          {rightOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
        </button>

        {/* 2. Center Stage (VS Code Multi-Tab Canvas) */}
        <div className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden backdrop-blur-md ${
          isLight ? 'bg-white/65 text-slate-800' : 'bg-zinc-950/70 text-white'
        }`}>
          {/* VS Code-Style Top Tab Bar */}
          <div className={`flex shrink-0 items-center justify-between border-b px-12 py-1 overflow-x-auto select-none backdrop-blur-md ${
            isLight
              ? 'border-rose-200/60 bg-white/75 text-slate-800'
              : 'border-white/8 bg-zinc-950/80 text-white'
          }`}>
            <div className="flex items-center gap-1 overflow-x-auto m-scroll">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className={`group flex items-center gap-2 cursor-pointer rounded-t-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? isLight
                          ? 'border-t-2 border-t-[var(--m-accent)] bg-white text-slate-900 shadow-xs'
                          : 'border-t-2 border-t-[var(--m-accent)] bg-white/10 text-white shadow-sm backdrop-blur-sm'
                        : isLight
                        ? 'text-slate-600 hover:bg-rose-50/50 hover:text-slate-900'
                        : 'text-white/45 hover:bg-white/[0.03] hover:text-white/80'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="truncate max-w-[180px]">{tab.title}</span>
                    {tab.closable && (
                      <button
                        onClick={(e) => handleCloseTab(tab.id, e)}
                        className={`opacity-0 group-hover:opacity-100 rounded p-0.5 transition ${
                          isLight
                            ? 'text-slate-400 hover:bg-slate-200/60 hover:text-slate-800'
                            : 'text-white/30 hover:bg-white/10 hover:text-white'
                        }`}
                        title="Close tab"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Add New Tab Button */}
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  title="Open new workspace view"
                  className={`flex h-6 w-6 items-center justify-center rounded-md transition ${
                    isLight
                      ? 'text-slate-500 hover:bg-rose-100/60 hover:text-slate-900'
                      : 'text-white/40 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>

                {showAddMenu && (
                  <div className={`absolute left-0 top-8 z-40 w-56 rounded-xl border p-1.5 shadow-2xl space-y-1 backdrop-blur-xl ${
                    isLight
                      ? 'border-rose-200/80 bg-white/95 text-slate-800'
                      : 'border-white/12 bg-[#1A1B28] text-white'
                  }`}>
                    <button
                      onClick={() => {
                        handleOpenTab('chat');
                        setShowAddMenu(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition ${
                        isLight
                          ? 'text-slate-700 hover:bg-rose-50/80 hover:text-slate-900'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
                      <span>Carol Conversational Canvas</span>
                    </button>
                    <button
                      onClick={() => {
                        handleOpenTab('connectors');
                        setShowAddMenu(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition ${
                        isLight
                          ? 'text-slate-700 hover:bg-rose-50/80 hover:text-slate-900'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Cpu className="h-3.5 w-3.5 text-emerald-400" />
                      <span>MCP Connectors & Bridges</span>
                    </button>
                    <button
                      onClick={() => {
                        handleOpenTab('customizer');
                        setShowAddMenu(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition ${
                        isLight
                          ? 'text-slate-700 hover:bg-rose-50/80 hover:text-slate-900'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Trophy className="h-3.5 w-3.5 text-amber-400" />
                      <span>Space Customizer (MySpace)</span>
                    </button>
                    <button
                      onClick={() => {
                        handleOpenTab('ledger');
                        setShowAddMenu(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition ${
                        isLight
                          ? 'text-slate-700 hover:bg-rose-50/80 hover:text-slate-900'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Shield className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Sovereign Memory Ledger</span>
                    </button>
                    <button
                      onClick={() => {
                        handleOpenTab('agent');
                        setShowAddMenu(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition ${
                        isLight
                          ? 'text-slate-700 hover:bg-rose-50/80 hover:text-slate-900'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Users className="h-3.5 w-3.5 text-fuchsia-400" />
                      <span>Sub-Agent Studio</span>
                    </button>
                    <button
                      onClick={() => {
                        handleOpenTab('theme');
                        setShowAddMenu(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition ${
                        isLight
                          ? 'text-slate-700 hover:bg-rose-50/80 hover:text-slate-900'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Palette className="h-3.5 w-3.5 text-pink-400" />
                      <span>Aesthetic Themes Matrix</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Tab Viewport */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {activeTab.type === 'chat' && (
              <DialogueCanvas
                messages={messages}
                onSendMessage={handleSendMessage}
                onExecuteToolAction={handleExecuteToolAction}
                onCancelToolAction={handleCancelToolAction}
                activeAgentId={activeAgentId}
                onSelectAgent={setActiveAgentId}
                profile={profile}
                isProcessing={isProcessing}
                installedPluginIds={installedPluginIds}
                scratchpad={scratchpad}
                memories={memories}
              />
            )}

            {activeTab.type === 'connectors' && <ConnectorsHub />}

            {activeTab.type === 'customizer' && (
              <SpaceCustomizer
                profile={profile}
                onUpdateProfile={onUpdateProfile}
                stickers={stickers}
                onToggleSticker={handleToggleSticker}
                onAddSticker={handleAddSticker}
                onUpdateSticker={handleUpdateSticker}
                onDeleteSticker={handleDeleteSticker}
              />
            )}

            {activeTab.type === 'ledger' && (
              <MemoryLedgerTab
                memories={memories}
                onAddMemory={handleAddMemory}
                onDeleteMemory={handleDeleteMemory}
                onClearAllMemories={handleClearAllMemories}
              />
            )}

            {activeTab.type === 'agent' && (
              <div className={`h-full overflow-y-auto ${isLight ? 'bg-white/40' : 'bg-[#13141E]'}`}>
                <AgentStudio
                  onOpenChat={(agentId) => {
                    handleSendMessage(`Summoning ${agentId} into active canvas...`, agentId);
                    handleOpenTab('chat');
                  }}
                />
              </div>
            )}

            {activeTab.type === 'theme' && (
              <div className={`h-full overflow-y-auto p-8 ${isLight ? 'bg-white/50 text-slate-800' : 'bg-[#13141E] text-white'}`}>
                <div className="max-w-4xl mx-auto space-y-6">
                  <div>
                    <h2 className={`font-display text-xl font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Aesthetic Theme Matrix</h2>
                    <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
                      Customize Carol Ann's visual frequencies, wallpaper ambiance, and accent tones.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {AESTHETIC_THEMES.map((th) => (
                      <button
                        key={th.id}
                        onClick={() => onUpdateProfile({ theme: th.id, accentColor: th.accent })}
                        className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                          profile.theme === th.id
                            ? isLight
                              ? 'border-[var(--m-accent)] bg-white shadow-md ring-2 ring-[var(--m-accent)]/50'
                              : 'border-[var(--m-accent)] bg-white/[0.08] shadow-lg ring-2 ring-[var(--m-accent)]/50'
                            : isLight
                            ? 'border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white'
                            : 'border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-4 w-4 rounded-full shadow-sm"
                            style={{ backgroundColor: th.accent }}
                          />
                          <span className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{th.label}</span>
                        </div>
                        <p className={`mt-2 text-xs leading-relaxed ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{th.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Right Drawer (Embedded Co-Pilot & Automation Dock - in-line push/resize) */}
        <div
          className={`relative shrink-0 transition-all duration-300 ease-in-out border-l z-20 ${
            isLight ? 'border-rose-200/60' : 'border-white/8'
          } ${rightOpen ? 'w-84 lg:w-96' : 'w-0'}`}
        >
          <div className={`h-full w-84 lg:w-96 overflow-hidden ${rightOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <RightDrawer
              errands={errands}
              onUpdateErrand={handleUpdateErrand}
              onDeleteErrand={handleDeleteErrand}
              onAddErrand={handleAddErrand}
              actions={actions}
              onConfirmAction={handleExecuteToolAction}
              scratchpad={scratchpad}
              onChangeScratchpad={setScratchpad}
              onClose={() => setRightOpen(false)}
              profile={profile}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceChat;
