import React, { useEffect, useRef, useState } from 'react';
import {
  Send, Sparkles, Bot, User, CheckCircle2, AlertCircle, Clock,
  ArrowRight, Play, Volume2, ShieldCheck, ChevronRight, CornerDownLeft,
  Calendar, ShoppingBag, Edit3, Check, Zap, XCircle, X, Shield, ExternalLink,
  UploadCloud, Plus
} from 'lucide-react';
import type { ConversationMessage, HydrateFormAction, UserProfile, ChatAttachment, MemoryEntry } from '@/data/schemas';
import { AGENT_PRESETS, voiceByName } from '@/data/agents';
import { isLightTheme } from '@/data/intake';
import AgentAvatar from '@/components/agents/AgentAvatar';
import VoiceOrb from '@/components/workspace/VoiceOrb';
import {
  AttachmentPlusMenu,
  StagedAttachmentsBar,
  ContextSelectorModal,
  ConnectorSelectorModal,
  MessageAttachmentGallery,
  ImageLightbox
} from '@/components/workspace/ChatAttachmentPickers';

interface DialogueCanvasProps {
  messages: ConversationMessage[];
  onSendMessage: (content: string, targetAgentId?: string, attachments?: ChatAttachment[]) => void;
  onExecuteToolAction: (action: HydrateFormAction) => void;
  onCancelToolAction?: (action: HydrateFormAction) => void;
  activeAgentId: string;
  onSelectAgent: (agentId: string) => void;
  profile: UserProfile;
  isProcessing?: boolean;
  installedPluginIds?: string[];
  scratchpad?: string;
  memories?: MemoryEntry[];
}

export const DialogueCanvas: React.FC<DialogueCanvasProps> = ({
  messages,
  onSendMessage,
  onExecuteToolAction,
  onCancelToolAction,
  activeAgentId,
  onSelectAgent,
  profile,
  isProcessing = false,
  installedPluginIds,
  scratchpad,
  memories,
}) => {
  const isLight = isLightTheme(profile);
  const [input, setInput] = useState('');
  const [stagedAttachments, setStagedAttachments] = useState<ChatAttachment[]>([]);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [isConnectorModalOpen, setIsConnectorModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const currentAgent = AGENT_PRESETS.find((a) => a.id === activeAgentId) ?? AGENT_PRESETS[0];
  const geminiVoice = voiceByName(currentAgent.geminiVoice);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing, stagedAttachments]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFilesSelected = (files: FileList | File[], forceType?: 'image' | 'video' | 'file') => {
    Array.from(files).forEach((file) => {
      const isImg = forceType === 'image' || file.type.startsWith('image/');
      const isVid = forceType === 'video' || file.type.startsWith('video/');
      const type: 'image' | 'video' | 'file' = isImg ? 'image' : isVid ? 'video' : 'file';

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        const newAttachment: ChatAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type,
          name: file.name,
          size: formatFileSize(file.size),
          mimeType: file.type,
          dataUrl,
        };
        setStagedAttachments((prev) => [...prev, newAttachment]);
      };

      reader.readAsDataURL(file);
    });
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if ((!trimmed && stagedAttachments.length === 0) || isProcessing) return;

    const outgoingContent = trimmed || (stagedAttachments.length > 0
      ? `Shared ${stagedAttachments.length} attachment${stagedAttachments.length > 1 ? 's' : ''}`
      : '');

    onSendMessage(outgoingContent, currentAgent.id, stagedAttachments.length > 0 ? stagedAttachments : undefined);
    setInput('');
    setStagedAttachments([]);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const speakMessage = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = geminiVoice.rate;
    utterance.pitch = geminiVoice.pitch;

    const voices = window.speechSynthesis.getVoices();
    const hit = voices.find((v) =>
      geminiVoice.speechSynthMatch.some((m) => v.name.toLowerCase().includes(m.toLowerCase()))
    );
    if (hit) utterance.voice = hit;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex h-full flex-col backdrop-blur-md transition-colors ${
        isLight ? 'bg-white/70 text-slate-800' : 'bg-zinc-950/60 text-white'
      }`}
    >
      {/* Drag & Drop Visual Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[var(--m-accent)]/15 backdrop-blur-md border-2 border-dashed border-[var(--m-accent)] rounded-2xl m-4 pointer-events-none animate-in fade-in duration-100">
          <div className="flex items-center gap-3 p-5 rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-black/10 dark:border-white/10">
            <div className="grid h-12 w-12 place-items-center rounded-xl m-gradient-bg text-white shadow-md">
              <UploadCloud className="h-6 w-6 animate-bounce" />
            </div>
            <div>
              <p className="font-semibold text-sm">Drop to Attach to Chat</p>
              <p className="text-xs text-slate-500 dark:text-white/60">
                Release to stage photos, videos, documents, or code into prompt
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Native File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFilesSelected(e.target.files, 'image');
          e.target.value = '';
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFilesSelected(e.target.files, 'video');
          e.target.value = '';
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFilesSelected(e.target.files, 'file');
          e.target.value = '';
        }}
      />

      {/* Dialogue Canvas Top Banner */}
      <div className={`flex shrink-0 items-center justify-between border-b px-6 py-2.5 backdrop-blur-md ${
        isLight ? 'border-rose-200/60 bg-white/75' : 'border-white/8 bg-zinc-950/60'
      }`}>
        <div className="flex items-center gap-3">
          <AgentAvatar skin={currentAgent.skin} size={30} />
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-display text-base font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {currentAgent.name}
              </span>
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-medium ${
                isLight ? 'border-rose-200 bg-rose-50/70 text-slate-700' : 'border-white/15 bg-white/[0.06] text-white/75'
              }`}>
                Voice: {currentAgent.geminiVoice}
              </span>
              {currentAgent.id === 'carol-anchor' && (
                <span className="rounded-full border border-[var(--m-accent)]/45 bg-[var(--m-accent)]/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--m-accent-soft)]">
                  Sovereign Router
                </span>
              )}
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/65'}`}>{currentAgent.role}</p>
          </div>
        </div>

        {/* Sub-Agent Quick Switcher Tabs */}
        <div className="hidden items-center gap-1.5 sm:flex">
          {AGENT_PRESETS.map((ag) => {
            const isSelected = ag.id === currentAgent.id;
            return (
              <button
                key={ag.id}
                onClick={() => onSelectAgent(ag.id)}
                title={`${ag.name}: ${ag.role}`}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                  isSelected
                    ? 'border border-[var(--m-accent)]/60 bg-[var(--m-accent)]/25 text-white font-semibold shadow-sm'
                    : isLight
                    ? 'border border-rose-200/80 bg-white/80 text-slate-700 hover:border-rose-300 hover:text-slate-900'
                    : 'border border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white'
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: isSelected ? 'var(--m-accent-soft)' : isLight ? '#f43f5e' : 'rgba(255,255,255,0.4)' }}
                />
                {ag.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="m-scroll flex-1 overflow-y-auto px-4 py-6 md:px-8 lg:px-16">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Welcome Card if first load */}
          {messages.length === 0 && (
            <div className={`rounded-2xl border p-8 text-center shadow-xl ${
              isLight ? 'border-rose-200/80 bg-white/85 text-slate-800 shadow-md' : 'border-white/12 bg-white/[0.03]'
            }`}>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl m-gradient-bg shadow-md">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h2 className={`mt-4 font-display text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Carol Ann Cloud-Agent Orchestrator
              </h2>
              <p className={`mt-1.5 text-sm max-w-md mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/75'}`}>
                Adaptive executive intelligence for {profile.name || 'Operator'}. Cloud-agent native, real-time voice orchestration, and persistent cloud memory.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {currentAgent.starters.map((starter, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(starter);
                      inputRef.current?.focus();
                    }}
                    className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                      isLight
                        ? 'border-rose-200 bg-rose-50/60 text-slate-700 hover:bg-rose-100 hover:text-slate-900 hover:border-rose-300'
                        : 'border-white/15 bg-white/[0.04] text-white/85 hover:border-[var(--m-accent)]/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    "{starter}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Render Messages */}
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const msgAgent = msg.agentId
              ? AGENT_PRESETS.find((a) => a.id === msg.agentId) ?? currentAgent
              : currentAgent;

            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="shrink-0 pt-0.5">
                    <AgentAvatar skin={msgAgent.skin} size={32} />
                  </div>
                )}

                <div
                  className={`relative max-w-[85%] rounded-2xl p-4.5 shadow-sm transition-all ${
                    isUser
                      ? isLight
                        ? 'border border-rose-300/80 bg-rose-500/15 text-slate-900 shadow-xs'
                        : 'border border-[var(--m-accent)]/50 bg-[var(--m-accent)]/20 text-white shadow-[0_0_20px_-6px_var(--m-accent)]'
                      : isLight
                      ? 'border border-rose-200/80 bg-white/90 hover:bg-white text-slate-800 backdrop-blur-md shadow-md'
                      : 'border border-white/12 bg-white/[0.05] hover:bg-white/[0.07] text-white/95 backdrop-blur-md shadow-lg'
                  }`}
                >
                  {/* Header info */}
                  <div className={`flex items-center justify-between gap-4 mb-2 pb-2 border-b text-xs ${
                    isLight ? 'border-slate-200/60 text-slate-500' : 'border-white/8 text-white/60'
                  }`}>
                    <span className={`font-semibold uppercase tracking-[0.16em] text-[11px] ${
                      isLight ? 'text-slate-800' : 'text-white/80'
                    }`}>
                      {isUser ? (profile.name || 'Operator') : msgAgent.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[11px] ${isLight ? 'text-slate-400' : 'text-white/60'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!isUser && (
                        <button
                          onClick={() => speakMessage(msg.id, msg.content)}
                          title="Read aloud with Gemini Live Voice"
                          className={`transition ${isLight ? 'text-slate-400 hover:text-slate-800' : 'text-white/60 hover:text-white'}`}
                        >
                          <Volume2
                            className={`h-3.5 w-3.5 ${speakingMsgId === msg.id ? 'text-[var(--m-accent-soft)] animate-pulse' : ''}`}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Plugin Executed Chip (ChatGPT Style) */}
                  {msg.pluginExecution && (
                    <div className="mb-2 flex items-center gap-2">
                      <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium shadow-xs ${
                        isLight ? 'border-slate-200 bg-white text-slate-800' : 'border-white/12 bg-white/[0.06] text-white/90'
                      }`}>
                        <span className="grid h-4 w-4 place-items-center rounded bg-emerald-500/20 text-emerald-500">
                          <Zap className="h-2.5 w-2.5 fill-current" />
                        </span>
                        <span className="font-semibold text-[11px]">{msg.pluginExecution.pluginName}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-[11px] text-sky-600 dark:text-sky-400">{msg.pluginExecution.toolName}()</span>
                        <span className="ml-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="h-3 w-3" />
                          {msg.pluginExecution.status === 'executed' ? 'Executed' : 'Staged'}
                        </span>
                        {msg.pluginExecution.latencyMs && (
                          <span className="font-mono text-[10px] text-slate-400 dark:text-white/40">
                            {msg.pluginExecution.latencyMs}ms
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className={`text-sm leading-relaxed whitespace-pre-wrap font-normal ${
                    isLight ? 'text-slate-800' : 'text-white/95'
                  }`}>
                    {msg.content}
                  </div>

                  {/* Rich Attachments Gallery: Photos, Videos, Files, Connectors, Context */}
                  {msg.richAttachments && msg.richAttachments.length > 0 && (
                    <MessageAttachmentGallery
                      attachments={msg.richAttachments}
                      isLight={isLight}
                      onOpenLightbox={(url, name) => setLightboxImage({ url, name })}
                    />
                  )}

                  {/* Interactive Action Confirmation Card (Safety & Action Verification Tray) */}
                  {msg.toolCall && (
                    <div className={`mt-4 rounded-xl border p-4 shadow-sm transition ${
                      msg.toolCall.status === 'executed'
                        ? isLight
                          ? 'border-emerald-300 bg-emerald-50/40'
                          : 'border-emerald-500/30 bg-emerald-950/20'
                        : msg.toolCall.status === 'cancelled'
                        ? isLight
                          ? 'border-slate-200 bg-slate-50 opacity-75'
                          : 'border-white/10 bg-white/[0.02] opacity-75'
                        : isLight
                        ? 'border-amber-300 bg-amber-50/50 ring-1 ring-amber-500/20'
                        : 'border-amber-500/40 bg-amber-950/20 ring-1 ring-amber-500/30'
                    }`}>
                      {/* Tray Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-black/5 dark:border-white/8">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md border border-[var(--m-accent)]/50 bg-[var(--m-accent)]/25 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-semibold text-[var(--m-accent-soft)]">
                            {msg.toolCall.target_app || 'MCP TOOL'}: {msg.toolCall.action_name}
                          </span>
                        </div>

                        {msg.toolCall.status === 'executed' ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-300 font-semibold">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Dispatched via MCP Bridge
                          </span>
                        ) : msg.toolCall.status === 'cancelled' ? (
                          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-white/50 font-semibold">
                            <XCircle className="h-3.5 w-3.5" /> Action Cancelled
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 font-semibold">
                            <Clock className="h-3.5 w-3.5 animate-pulse" /> Action Confirmation Required
                          </span>
                        )}
                      </div>

                      {/* Payload Details */}
                      <div className={`mt-2.5 rounded-lg p-3 text-xs space-y-2 ${
                        isLight ? 'bg-white border border-slate-200/80 text-slate-800' : 'bg-black/30 border border-white/6 text-white/90'
                      }`}>
                        <div className="flex items-center justify-between">
                          <p className={`font-semibold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {msg.toolCall.form_payload.title}
                          </p>
                          {msg.toolCall.target_app && (
                            <span className="text-[10px] font-mono text-slate-400 dark:text-white/40">
                              App: {msg.toolCall.target_app}
                            </span>
                          )}
                        </div>

                        {msg.toolCall.form_payload.items && msg.toolCall.form_payload.items.length > 0 && (
                          <ul className={`list-disc list-inside space-y-1 text-xs ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            {msg.toolCall.form_payload.items.map((item, idx) => (
                              <li key={idx} className="leading-snug">{item}</li>
                            ))}
                          </ul>
                        )}

                        {msg.toolCall.form_payload.fields && Object.keys(msg.toolCall.form_payload.fields).length > 0 && (
                          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-black/5 dark:border-white/5 font-mono text-[11px]">
                            {Object.entries(msg.toolCall.form_payload.fields).map(([k, v]) => (
                              <div key={k} className="flex items-center gap-1">
                                <span className="text-slate-400 capitalize">{k.replace('_', ' ')}:</span>
                                <span className="font-semibold">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {msg.toolCall.form_payload.target_time && (
                          <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                            Target Window: <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-white/90'}`}>{msg.toolCall.form_payload.target_time}</span>
                          </p>
                        )}

                        {msg.toolCall.form_payload.notes && (
                          <p className={`text-[11px] italic rounded p-2 bg-black/5 dark:bg-white/5 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                            Payload Note: "{msg.toolCall.form_payload.notes}"
                          </p>
                        )}
                      </div>

                      {/* Safety & Action Verification Controls */}
                      {msg.toolCall.status === 'pending_confirmation' && (
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                          <p className={`text-[11px] flex items-center gap-1 ${isLight ? 'text-amber-800' : 'text-amber-200/80'}`}>
                            <Shield className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                            <span>Safety Guard: External write action will not dispatch until approved.</span>
                          </p>
                          <div className="flex items-center justify-end gap-2 shrink-0">
                            {onCancelToolAction && (
                              <button
                                onClick={() => onCancelToolAction(msg.toolCall!)}
                                className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                  isLight
                                    ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                                    : 'border-white/12 bg-white/[0.04] text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <X className="h-3 w-3" />
                                Cancel
                              </button>
                            )}
                            <button
                              onClick={() => onExecuteToolAction(msg.toolCall!)}
                              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white shadow-md transition hover:brightness-105"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Approve & Execute
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Executed Receipt Details */}
                      {msg.toolCall.status === 'executed' && (
                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
                          <span>Receipt: Verified 200 OK · Transmitted over Sovereign MCP Bus</span>
                          <span>{msg.toolCall.executed_at ? new Date(msg.toolCall.executed_at).toLocaleTimeString() : 'Now'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="shrink-0 pt-0.5">
                    <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${
                      isLight ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-white/15 text-white'
                    }`}>
                      {profile.name ? profile.name.slice(0, 1).toUpperCase() : 'U'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center gap-3">
              <AgentAvatar skin={currentAgent.skin} size={30} />
              <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs ${
                isLight ? 'border-rose-200 bg-white/90 text-slate-700 shadow-xs' : 'border-white/12 bg-white/[0.06] text-white/80'
              }`}>
                <span className="h-2 w-2 animate-ping rounded-full bg-[var(--m-accent)]" />
                <span>{currentAgent.name} is synthesizing...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Stage Input Composer with Inline Voice Orb */}
      <div className={`shrink-0 border-t p-4 backdrop-blur-md ${
        isLight ? 'border-rose-200/60 bg-white/75' : 'border-white/10 bg-zinc-950/75'
      }`}>
        <div className="mx-auto max-w-3xl">
          {/* Starters strip if active conversation is short */}
          {messages.length > 0 && messages.length < 5 && (
            <div className={`mb-2 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs ${
              isLight ? 'text-slate-600' : 'text-white/60'
            }`}>
              <span className={`shrink-0 uppercase text-[10px] tracking-wider font-semibold ${
                isLight ? 'text-slate-400' : 'text-white/45'
              }`}>Suggestions:</span>
              {currentAgent.starters.map((st, i) => (
                <button
                  key={i}
                  onClick={() => setInput(st)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs transition ${
                    isLight
                      ? 'border-rose-200 bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900'
                      : 'border-white/12 bg-white/[0.03] text-white/80 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}

          {/* Staged Attachments Tray */}
          <StagedAttachmentsBar
            attachments={stagedAttachments}
            onRemoveAttachment={(id) => setStagedAttachments((prev) => prev.filter((a) => a.id !== id))}
            onClearAll={() => setStagedAttachments([])}
            isLight={isLight}
          />

          {/* Input Box Card */}
          <div className={`flex items-end gap-2.5 rounded-2xl border p-3 shadow-lg transition-all ${
            isLight
              ? 'border-rose-200/80 bg-white/90 shadow-md focus-within:border-rose-400 focus-within:bg-white'
              : 'border-white/15 bg-white/[0.04] focus-within:border-[var(--m-accent)]/60 focus-within:bg-white/[0.06]'
          }`}>
            {/* Plus (+) Menu to add files, photos, video, context, connector */}
            <AttachmentPlusMenu
              onSelectPhoto={() => imageInputRef.current?.click()}
              onSelectVideo={() => videoInputRef.current?.click()}
              onSelectFile={() => fileInputRef.current?.click()}
              onOpenContextModal={() => setIsContextModalOpen(true)}
              onOpenConnectorModal={() => setIsConnectorModalOpen(true)}
              isLight={isLight}
              disabled={isProcessing}
            />

            {/* Sub-Agent Pill */}
            <div className={`hidden sm:flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
              isLight ? 'border-rose-200 bg-rose-50 text-slate-800' : 'border-white/12 bg-white/[0.06] text-white'
            }`}>
              <span className="h-2 w-2 rounded-full bg-[var(--m-accent-soft)]" />
              <span>{currentAgent.name}</span>
            </div>

            {/* Input Textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${currentAgent.name}, or click + to add files, photos, video, context, or connectors...`}
              rows={1}
              className={`min-h-[38px] max-h-[140px] flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none leading-relaxed font-normal ${
                isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-white/45'
              }`}
            />

            {/* Inline Voice Orb (Breathing Pulse & Soundwave Visualizer) */}
            <div className="shrink-0 pb-0.5">
              <VoiceOrb
                onTranscript={(transcript) => {
                  setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
                }}
                voiceName={currentAgent.geminiVoice}
                disabled={isProcessing}
              />
            </div>

            {/* Send Button */}
            <button
              id="btn-chat-send-message"
              onClick={handleSend}
              disabled={(!input.trim() && stagedAttachments.length === 0) || isProcessing}
              className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full m-gradient-bg text-white shadow-md transition disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          <div className={`mt-2 flex items-center justify-between px-1 text-[11px] ${
            isLight ? 'text-slate-500' : 'text-white/50'
          }`}>
            <span>Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for newline</span>
            <span>Cloud Agent Native · Deployed Web Architecture · Gemini Live Voice</span>
          </div>
        </div>
      </div>

      {/* Workspace Context Selector Modal */}
      <ContextSelectorModal
        isOpen={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
        onSelectContext={(att) => setStagedAttachments((prev) => [...prev, att])}
        scratchpad={scratchpad}
        memories={memories}
        profile={profile}
        isLight={isLight}
      />

      {/* MCP Connector Selector Modal */}
      <ConnectorSelectorModal
        isOpen={isConnectorModalOpen}
        onClose={() => setIsConnectorModalOpen(false)}
        onSelectConnector={(att) => setStagedAttachments((prev) => [...prev, att])}
        installedPluginIds={installedPluginIds}
        isLight={isLight}
      />

      {/* Photo Lightbox Preview */}
      <ImageLightbox
        imageUrl={lightboxImage?.url || null}
        imageName={lightboxImage?.name || ''}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};

export default DialogueCanvas;
