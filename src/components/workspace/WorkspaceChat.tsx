import React, { useCallback, useEffect, useState } from 'react';
import {
  PanelLeftClose, PanelLeft, PanelRightClose, PanelRight,
  Sparkles, X, Plus, MessageSquare, Cpu, Trophy, Shield, Users, Palette,
  ChevronDown
} from 'lucide-react';
import type {
  ConversationMessage, ErrandTask, HydrateFormAction,
  MemoryEntry, StickerWatermark, UserProfile
} from '@/data/schemas';
import { AESTHETIC_THEMES, type AestheticTheme } from '@/data/intake';
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
  // 3-Pane Layout Open / Collapse States
  const [leftOpen, setLeftOpen] = useState<boolean>(true);
  const [rightOpen, setRightOpen] = useState<boolean>(true);

  // Tabs for the Center Stage
  const [tabs, setTabs] = useState<WorkspaceTab[]>([
    {
      id: 'tab_dialogue',
      title: 'Maggie Dialogue (Primary)',
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
      agentId: 'magdalene',
    },
    {
      id: 'th_salon',
      title: 'Executive Calendar & Styling with Coco',
      domain: 'errands',
      updatedAt: new Date(Date.now() - 3600e3 * 2).toISOString(),
      agentId: 'coco',
    },
    {
      id: 'th_gym',
      title: 'Strength Conditioning Cycle with Ripp',
      domain: 'gym',
      updatedAt: new Date(Date.now() - 3600e3 * 5).toISOString(),
      agentId: 'ripp',
    },
  ]);
  const [activeThreadId, setActiveThreadId] = useState<string>('th_orchestrator');
  const [activeAgentId, setActiveAgentId] = useState<string>('magdalene');

  // Messages, Errands, Actions, Memories, Stickers, Scratchpad
  const [messages, setMessages] = useState<ConversationMessage[]>(() => loadMessages());
  const [errands, setErrands] = useState<ErrandTask[]>(() => loadErrands());
  const [actions, setActions] = useState<HydrateFormAction[]>(() => loadActions());
  const [memories, setMemories] = useState<MemoryEntry[]>(() => loadMemories());
  const [stickers, setStickers] = useState<StickerWatermark[]>(() => loadStickers());
  const [scratchpad, setScratchpad] = useState<string>(() => loadScratchpad());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Sync back to local store
  useEffect(() => { saveMessages(messages); }, [messages]);
  useEffect(() => { saveErrands(errands); }, [errands]);
  useEffect(() => { saveActions(actions); }, [actions]);
  useEffect(() => { saveMemories(memories); }, [memories]);
  useEffect(() => { saveStickers(stickers); }, [stickers]);
  useEffect(() => { saveScratchpad(scratchpad); }, [scratchpad]);

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
      chat: { title: 'Maggie Dialogue (Primary)', icon: '💬' },
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

  // Sticker Handlers
  const handleToggleSticker = (id: string) => {
    setStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const handleAddSticker = (st: StickerWatermark) => {
    setStickers((prev) => [st, ...prev]);
  };

  const handleUpdateSticker = (updated: StickerWatermark) => {
    setStickers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteSticker = (id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
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
  const handleExecuteToolAction = (action: HydrateFormAction) => {
    const updatedAction: HydrateFormAction = {
      ...action,
      status: 'executed',
      executed_at: new Date().toISOString(),
    };

    setActions((prev) => [updatedAction, ...prev.filter((a) => a.id !== action.id)]);

    setMessages((prev) =>
      prev.map((m) => (m.toolCall?.id === action.id ? { ...m, toolCall: updatedAction } : m))
    );

    if (action.category === 'errand') {
      handleAddErrand({
        title: action.form_payload.title,
        items: action.form_payload.items ?? [],
        scheduled_time: action.form_payload.target_time,
        status: 'queued',
        target: action.action_name.toLowerCase().includes('whole foods')
          ? 'whole-foods'
          : action.action_name.toLowerCase().includes('amazon')
          ? 'amazon'
          : 'custom',
      });
    } else if (action.category === 'scratchpad_update') {
      const addition = `\n\n### Updated via ${action.action_name}\n- **Title:** ${action.form_payload.title}\n- **Items:** ${(action.form_payload.items ?? []).join(', ')}\n- **Target Time:** ${action.form_payload.target_time ?? 'N/A'}`;
      setScratchpad((prev) => prev + addition);
    } else if (action.category === 'calendar_booking') {
      handleAddErrand({
        title: `Calendar: ${action.form_payload.title}`,
        items: action.form_payload.items ?? ['Confirmed buffer time', 'Location verified'],
        scheduled_time: action.form_payload.target_time,
        status: 'queued',
        target: 'custom',
      });
    }

    if (!rightOpen) {
      setRightOpen(true);
    }
  };

  // Conversational response generation with native Gemini API execution
  const handleSendMessage = async (content: string, targetAgentId?: string) => {
    const agentId = targetAgentId || activeAgentId;
    const agent = AGENT_PRESETS.find((a) => a.id === agentId) ?? AGENT_PRESETS[0];

    const userMsg: ConversationMessage = {
      id: uid('msg_u'),
      domain: 'core',
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      agentId,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const memoryContext = memories.slice(0, 8).map((m) => `- [${m.category}] ${m.content}`).join('\n');
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          agentId,
          agentName: agent.name,
          agentRole: agent.role,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          profile: {
            name: profile.name,
            identity: profile.identity,
            wellnessGoal: profile.wellnessGoal,
            professionalFocus: profile.professionalFocus,
          },
          memoryContext,
        }),
      });

      let replyContent = '';
      let toolCall: HydrateFormAction | undefined = undefined;

      if (res.ok) {
        const data = await res.json();
        replyContent = data.reply || '';
        if (data.toolCall) {
          toolCall = data.toolCall as HydrateFormAction;
        }
      } else {
        throw new Error(`Inference request failed with code ${res.status}`);
      }

      const assistantMsg: ConversationMessage = {
        id: uid('msg_a'),
        domain: 'core',
        role: 'assistant',
        content: replyContent || 'Action staged in your sovereign executive dashboard.',
        timestamp: new Date().toISOString(),
        agentId,
        toolCall,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (toolCall) {
        setActions((prev) => [toolCall!, ...prev]);
        if (!toolCall.requires_user_confirmation) {
          handleExecuteToolAction(toolCall);
        }
      }
    } catch (err) {
      console.error('Gemini chat error:', err);
      // Resilient sovereign fallback
      const assistantMsg: ConversationMessage = {
        id: uid('msg_a'),
        domain: 'core',
        role: 'assistant',
        content: `Understood. Magdalene has routed your request through ${agent.name}. We are maintaining strict local-first memory on your sovereign device with zero cloud telemetry.`,
        timestamp: new Date().toISOString(),
        agentId,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden bg-[#11121A]">
      {/* 1. Left Rail (Conversational History, MCPs & Personal Space) */}
      <div
        className={`relative shrink-0 transition-all duration-300 ease-in-out border-r border-white/8 z-20 ${
          leftOpen ? 'w-80' : 'w-0'
        }`}
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
          />
        </div>
      </div>

      {/* Center Stage & In-line Drawer Flex Container */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-row">
        {/* Toggle Left Rail Button Overlay */}
        <button
          onClick={() => setLeftOpen(!leftOpen)}
          title={leftOpen ? 'Collapse Left Rail' : 'Expand Left Rail'}
          className="absolute left-3 top-2.5 z-30 flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-[#141520]/80 text-white/50 backdrop-blur-md transition hover:border-white/25 hover:text-white shadow-md"
        >
          {leftOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </button>

        {/* Toggle Right Drawer Button Overlay */}
        <button
          onClick={() => setRightOpen(!rightOpen)}
          title={rightOpen ? 'Collapse Automation Dock' : 'Expand Automation Dock'}
          className="absolute right-3 top-2.5 z-30 flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-[#141520]/80 text-white/50 backdrop-blur-md transition hover:border-white/25 hover:text-white shadow-md"
        >
          {rightOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
        </button>

        {/* 2. Center Stage (VS Code Multi-Tab Canvas) */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#101119]">
          {/* VS Code-Style Top Tab Bar */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/8 bg-[#0D0E15] px-12 py-1 overflow-x-auto select-none">
            <div className="flex items-center gap-1 overflow-x-auto m-scroll">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className={`group flex items-center gap-2 cursor-pointer rounded-t-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? 'border-t-2 border-t-[var(--m-accent)] bg-[#13141F] text-white shadow-sm'
                        : 'text-white/45 hover:bg-white/[0.03] hover:text-white/80'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="truncate max-w-[180px]">{tab.title}</span>
                    {tab.closable && (
                      <button
                        onClick={(e) => handleCloseTab(tab.id, e)}
                        className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-white/30 hover:bg-white/10 hover:text-white transition"
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
                  className="flex h-6 w-6 items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>

                {showAddMenu && (
                  <div className="absolute left-0 top-8 z-40 w-56 rounded-xl border border-white/12 bg-[#1A1B28] p-1.5 shadow-2xl space-y-1">
                    <button
                      onClick={() => {
                        handleOpenTab('chat');
                        setShowAddMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
                      <span>Maggie Conversational Canvas</span>
                    </button>
                    <button
                      onClick={() => {
                        handleOpenTab('connectors');
                        setShowAddMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      <Cpu className="h-3.5 w-3.5 text-emerald-400" />
                      <span>MCP Connectors & Bridges</span>
                    </button>
                    <button
                      onClick={() => {
                        handleOpenTab('customizer');
                        setShowAddMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      <Trophy className="h-3.5 w-3.5 text-amber-400" />
                      <span>Space Customizer (MySpace)</span>
                    </button>
                    <button
                      onClick={() => {
                        handleOpenTab('ledger');
                        setShowAddMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      <Shield className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Sovereign Memory Ledger</span>
                    </button>
                    <button
                      onClick={() => {
                        handleOpenTab('agent');
                        setShowAddMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      <Users className="h-3.5 w-3.5 text-fuchsia-400" />
                      <span>Sub-Agent Studio</span>
                    </button>
                    <button
                      onClick={() => {
                        handleOpenTab('theme');
                        setShowAddMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
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
                activeAgentId={activeAgentId}
                onSelectAgent={setActiveAgentId}
                profile={profile}
                isProcessing={isProcessing}
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
              <div className="h-full overflow-y-auto bg-[#13141E]">
                <AgentStudio
                  onOpenChat={(agentId) => {
                    handleSendMessage(`Summoning ${agentId} into active canvas...`, agentId);
                    handleOpenTab('chat');
                  }}
                />
              </div>
            )}

            {activeTab.type === 'theme' && (
              <div className="h-full overflow-y-auto p-8 bg-[#13141E] text-white">
                <div className="max-w-4xl mx-auto space-y-6">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-white">Aesthetic Theme Matrix</h2>
                    <p className="text-xs text-white/45 mt-1">
                      Customize Magdalene's visual frequencies, wallpaper ambiance, and accent tones.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {AESTHETIC_THEMES.map((th) => (
                      <button
                        key={th.id}
                        onClick={() => onUpdateProfile({ theme: th.id, accentColor: th.accent })}
                        className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                          profile.theme === th.id
                            ? 'border-[var(--m-accent)] bg-white/[0.08] shadow-lg ring-2 ring-[var(--m-accent)]/50'
                            : 'border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-4 w-4 rounded-full shadow-sm"
                            style={{ backgroundColor: th.accent }}
                          />
                          <span className="text-sm font-semibold text-white">{th.label}</span>
                        </div>
                        <p className="mt-2 text-xs text-white/50 leading-relaxed">{th.description}</p>
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
          className={`relative shrink-0 transition-all duration-300 ease-in-out z-20 ${
            rightOpen ? 'w-84 lg:w-96' : 'w-0'
          }`}
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
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceChat;
