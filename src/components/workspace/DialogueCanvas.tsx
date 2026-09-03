import React, { useEffect, useRef, useState } from 'react';
import {
  Send, Sparkles, Bot, User, CheckCircle2, AlertCircle, Clock,
  ArrowRight, Play, Volume2, ShieldCheck, ChevronRight, CornerDownLeft,
  Calendar, ShoppingBag, Edit3, Check
} from 'lucide-react';
import type { ConversationMessage, HydrateFormAction, UserProfile } from '@/data/schemas';
import { AGENT_PRESETS, voiceByName } from '@/data/agents';
import AgentAvatar from '@/components/agents/AgentAvatar';
import VoiceOrb from '@/components/workspace/VoiceOrb';

interface DialogueCanvasProps {
  messages: ConversationMessage[];
  onSendMessage: (content: string, targetAgentId?: string) => void;
  onExecuteToolAction: (action: HydrateFormAction) => void;
  activeAgentId: string;
  onSelectAgent: (agentId: string) => void;
  profile: UserProfile;
  isProcessing?: boolean;
}

export const DialogueCanvas: React.FC<DialogueCanvasProps> = ({
  messages,
  onSendMessage,
  onExecuteToolAction,
  activeAgentId,
  onSelectAgent,
  profile,
  isProcessing = false,
}) => {
  const [input, setInput] = useState('');
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const currentAgent = AGENT_PRESETS.find((a) => a.id === activeAgentId) ?? AGENT_PRESETS[0];
  const geminiVoice = voiceByName(currentAgent.geminiVoice);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;
    onSendMessage(trimmed, currentAgent.id);
    setInput('');
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
    <div className="relative flex h-full flex-col bg-[#161722]/95 text-white">
      {/* Dialogue Canvas Top Banner */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 bg-[#13141E]/80 px-6 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <AgentAvatar skin={currentAgent.skin} size={28} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-semibold text-white">
                {currentAgent.name}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9.5px] font-mono text-white/55">
                Voice: {currentAgent.geminiVoice}
              </span>
              {currentAgent.id === 'magdalene' && (
                <span className="rounded-full border border-[var(--m-accent)]/40 bg-[var(--m-accent)]/15 px-2 py-0.5 text-[9.5px] font-medium text-[var(--m-accent-soft)]">
                  Sovereign Router
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/50">{currentAgent.role}</p>
          </div>
        </div>

        {/* Sub-Agent Quick Switcher Tabs */}
        <div className="hidden items-center gap-1 sm:flex">
          {AGENT_PRESETS.map((ag) => {
            const isSelected = ag.id === currentAgent.id;
            return (
              <button
                key={ag.id}
                onClick={() => onSelectAgent(ag.id)}
                title={`${ag.name}: ${ag.role}`}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                  isSelected
                    ? 'border border-[var(--m-accent)]/60 bg-[var(--m-accent)]/20 text-white shadow-sm'
                    : 'border border-white/8 bg-white/[0.02] text-white/45 hover:border-white/20 hover:text-white'
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: isSelected ? 'var(--m-accent-soft)' : 'rgba(255,255,255,0.3)' }}
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
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center shadow-xl">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl m-gradient-bg shadow-md">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h2 className="mt-4 font-display text-lg font-bold text-white">
                Magdalene Sovereign Orchestrator
              </h2>
              <p className="mt-1 text-[13px] text-white/60 max-w-md mx-auto leading-relaxed">
                Adaptive executive intelligence for {profile.name || 'Sovereign Operator'}. Zero cloud data leaks, real-time voice orchestration, and local-first memory.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {currentAgent.starters.map((starter, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(starter);
                      inputRef.current?.focus();
                    }}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[11.5px] text-white/70 hover:border-[var(--m-accent)]/50 hover:bg-white/10 hover:text-white transition"
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
                    <AgentAvatar skin={msgAgent.skin} size={30} />
                  </div>
                )}

                <div
                  className={`relative max-w-[85%] rounded-2xl p-4 shadow-sm transition-all ${
                    isUser
                      ? 'border border-white/12 bg-[var(--m-accent)]/20 text-white'
                      : 'border border-white/10 bg-white/[0.04] text-white/90 backdrop-blur-sm'
                  }`}
                >
                  {/* Header info */}
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/6 text-[10px] text-white/40">
                    <span className="font-medium uppercase tracking-wider text-white/60">
                      {isUser ? (profile.name || 'Operator') : msgAgent.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!isUser && (
                        <button
                          onClick={() => speakMessage(msg.id, msg.content)}
                          title="Read aloud with Gemini Live Voice"
                          className="text-white/40 hover:text-white transition"
                        >
                          <Volume2
                            className={`h-3 w-3 ${speakingMsgId === msg.id ? 'text-[var(--m-accent-soft)] animate-pulse' : ''}`}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="prose prose-invert prose-sm max-w-none text-[13px] leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>

                  {/* Structured Tool Call Action (System Prompt 2 Hydration) */}
                  {msg.toolCall && (
                    <div className="mt-4 rounded-xl border border-white/12 bg-black/30 p-3.5 shadow-inner">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md border border-[var(--m-accent)]/40 bg-[var(--m-accent)]/20 px-2 py-0.5 text-[9.5px] font-mono uppercase tracking-wider text-[var(--m-accent-soft)]">
                            TOOL: {msg.toolCall.action_name}
                          </span>
                          <span className="text-[10px] text-white/40 capitalize">
                            Domain: {msg.toolCall.category.replace('_', ' ')}
                          </span>
                        </div>
                        {msg.toolCall.status === 'executed' ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Staged & Confirmed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-amber-300 font-medium">
                            <Clock className="h-3 w-3" /> Awaiting Confirmation
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 rounded-lg bg-white/[0.03] p-2.5 text-[11.5px] text-white/80 space-y-1.5">
                        <p className="font-semibold text-white">{msg.toolCall.form_payload.title}</p>
                        {msg.toolCall.form_payload.items && msg.toolCall.form_payload.items.length > 0 && (
                          <ul className="list-disc list-inside space-y-0.5 text-white/70 text-[11px]">
                            {msg.toolCall.form_payload.items.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        )}
                        {msg.toolCall.form_payload.target_time && (
                          <p className="text-[10.5px] text-white/50">
                            Target Window: <span className="text-white/80">{msg.toolCall.form_payload.target_time}</span>
                          </p>
                        )}
                        {msg.toolCall.form_payload.notes && (
                          <p className="text-[10.5px] text-white/50 italic">
                            Note: {msg.toolCall.form_payload.notes}
                          </p>
                        )}
                      </div>

                      {/* Affirmative Confirmation Button */}
                      {msg.toolCall.status === 'pending_confirmation' && (
                        <div className="mt-3 flex items-center justify-end gap-2">
                          <button
                            onClick={() => onExecuteToolAction(msg.toolCall!)}
                            className="flex items-center gap-1.5 rounded-lg m-gradient-bg px-3 py-1.5 text-[11px] font-semibold text-white shadow-md hover:brightness-110 transition"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Authorize & Execute
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="shrink-0 pt-0.5">
                    <div className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white text-xs font-semibold">
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
              <AgentAvatar skin={currentAgent.skin} size={28} />
              <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[12px] text-white/60">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[var(--m-accent)]" />
                <span>{currentAgent.name} is synthesizing...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Stage Input Composer with Inline Voice Orb */}
      <div className="shrink-0 border-t border-white/8 bg-[#13141E]/95 p-4 backdrop-blur-lg">
        <div className="mx-auto max-w-3xl">
          {/* Starters strip if active conversation is short */}
          {messages.length > 0 && messages.length < 5 && (
            <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-white/45">
              <span className="shrink-0 uppercase text-[9px] tracking-wider text-white/30">Suggestions:</span>
              {currentAgent.starters.map((st, i) => (
                <button
                  key={i}
                  onClick={() => setInput(st)}
                  className="shrink-0 rounded-full border border-white/8 bg-white/[0.02] px-2.5 py-0.5 text-white/65 hover:border-white/20 hover:text-white transition"
                >
                  {st}
                </button>
              ))}
            </div>
          )}

          {/* Input Box Card */}
          <div className="flex items-end gap-2 rounded-2xl border border-white/12 bg-white/[0.03] p-2.5 shadow-lg focus-within:border-[var(--m-accent)]/60 focus-within:bg-white/[0.05] transition-all">
            {/* Sub-Agent Pill */}
            <div className="hidden sm:flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-white/80">
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
              placeholder={`Message ${currentAgent.name} or speak with Gemini Live Voice...`}
              rows={1}
              className="min-h-[38px] max-h-[140px] flex-1 resize-none bg-transparent px-2 py-1 text-[13px] text-white placeholder:text-white/30 outline-none leading-relaxed"
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
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full m-gradient-bg text-white shadow-md transition disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-white/35">
            <span>Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for newline</span>
            <span>Local-First Sovereign AI · Zero External Telemetry</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DialogueCanvas;
