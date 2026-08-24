import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, Send, Sparkles, Trash2, Pin, Radio, Loader2 } from 'lucide-react';
import { COMPANION_DOMAINS, getDomain } from '@/data/domains';
import type { DomainId } from '@/data/schemas';
import { useMaggie } from '@/contexts/MaggieContext';
import { parseIntent } from '@/lib/browserAgent';
import { startRun, pushLog } from '@/lib/agentRunner';
import { publishBus, subscribeBus } from '@/lib/realtimeBus';
import { loadSaved, saveSaved, uid } from '@/lib/memoryStore';
import { supabase } from '@/lib/supabase';
import Icon from '@/components/common/Icon';

const VoiceWave: React.FC<{ active: boolean }> = ({ active }) => (
  <div className="flex h-4 items-end gap-[3px]">
    {[0, 1, 2, 3, 4].map((i) => (
      <span
        key={i}
        className={`w-[3px] rounded-full ${active ? 'm-wave-bar bg-[var(--m-accent-soft)]' : 'bg-white/20'}`}
        style={{ height: '100%', animationDelay: `${i * 0.12}s` }}
      />
    ))}
  </div>
);

export const ConversationRail: React.FC<{ onOpenAgent?: () => void }> = ({ onOpenAgent }) => {
  const { messages, addMessage, profile, memories, clearDomain } = useMaggie();
  const [domain, setDomain] = useState<DomainId>('core');
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [filter, setFilter] = useState<'all' | DomainId>('all');
  const [pinned, setPinned] = useState<string[]>(() => loadSaved().map((s) => s.messageId));
  const scrollRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<any>(null);

  const visible = useMemo(
    () => (filter === 'all' ? messages : messages.filter((m) => m.domain === filter)),
    [messages, filter],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [visible.length, thinking]);

  useEffect(() => {
    return subscribeBus((e) => {
      // Phone pushes AND cloud-scheduled dispatches both drive the desktop rail.
      if (e.source !== 'mobile' && e.source !== 'cloud') return;
      if (e.type === 'command' || e.type === 'voice') {
        const text = String(e.payload.text ?? '');
        if (!text) return;
        addMessage({ domain: (e.payload.domain as DomainId) ?? 'core', role: 'user', content: text, source: 'mobile' });
        pushLog(
          e.source === 'cloud'
            ? `Scheduled command fired: "${text}"`
            : `Remote injection received from phone: "${text}"`,
          'action',
        );
      }

      if (e.type === 'vision') {
        addMessage({
          domain: 'family',
          role: 'user',
          content: `[Vision capture] ${String(e.payload.label ?? 'Image captured on phone')}`,
          source: 'vision',
        });
      }
    });
  }, [addMessage]);

  const respond = async (text: string, dom: DomainId) => {
    setThinking(true);
    const intent = parseIntent(text);
    if (intent) {
      startRun(intent.key);
      onOpenAgent?.();
    }
    const memoryContext = memories.slice(0, 6).map((m) => `- [${m.category}] ${m.content}`).join('\n');
    const domainMeta = getDomain(dom);
    let reply = '';
    try {
      const { data, error } = await supabase.functions.invoke('maggie-chat', {
        body: {
          message: text,
          domain: dom,
          domainLabel: domainMeta.label,
          profile: {
            name: profile.name,
            identity: profile.identity,
            wellnessGoal: profile.wellnessGoal,
            professionalFocus: profile.professionalFocus,
          },
          memoryContext,
          dispatched: intent ? intent.title : null,
        },
      });
      if (error) throw error;
      reply = String(data?.reply ?? '');
    } catch {
      reply = '';
    }
    if (!reply) {
      reply = intent
        ? `Understood. I've opened a cloud browser session and started "${intent.title}". Watch the right pane — I'll stop before the final submit so you can confirm.`
        : `Logged under ${domainMeta.label}. ${domainMeta.tagline} Tell me the next move and I'll stage it.`;
    }
    addMessage({ domain: dom, role: 'assistant', content: reply, source: 'desktop' });
    setThinking(false);
  };

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text) return;
    addMessage({ domain, role: 'user', content: text, source: 'desktop' });
    publishBus('command', { text, domain }, 'desktop');
    setInput('');
    void respond(text, domain);
  };

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      addMessage({ domain, role: 'system', content: 'Voice capture is not supported in this browser. Use the phone remote for continuous voice.', source: 'desktop' });
      return;
    }
    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = 'en-US';
    r.onresult = (ev: any) => {
      const t = ev.results[0][0].transcript as string;
      setInput(t);
      send(t);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    r.start();
    setListening(true);
  };

  const togglePin = (id: string, content: string, dom: DomainId) => {
    const list = loadSaved();
    const exists = list.some((s) => s.messageId === id);
    const next = exists
      ? list.filter((s) => s.messageId !== id)
      : [...list, { id: uid('sv'), messageId: id, content, domain: dom, savedAt: new Date().toISOString() }];
    saveSaved(next);
    setPinned(next.map((s) => s.messageId));
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#15161C]">
      {/* Header */}
      <div className="shrink-0 border-b border-white/8 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg m-gradient-bg">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold text-white">Conversational Rail</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">{visible.length} threaded entries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold ${listening ? 'border-[var(--m-accent-soft)]/50 bg-[var(--m-accent-soft)]/10 text-[var(--m-accent-soft)]' : 'border-white/10 text-white/40'}`}>
              <VoiceWave active={listening} />
              {listening ? 'LIVE' : 'IDLE'}
            </div>
            <button
              onClick={() => { clearDomain(domain); }}
              title="Clear this domain thread"
              className="rounded-md border border-white/10 p-1.5 text-white/40 transition hover:border-white/25 hover:text-white"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Domain filter chips */}
        <div className="m-scroll mt-3 flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${filter === 'all' ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 text-white/45 hover:text-white/80'}`}
          >
            All threads
          </button>
          {COMPANION_DOMAINS.slice(0, 6).map((d) => (
            <button
              key={d.id}
              onClick={() => setFilter(d.id)}
              className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition"
              style={{
                borderColor: filter === d.id ? `${d.color}88` : 'rgba(255,255,255,0.1)',
                background: filter === d.id ? `${d.color}22` : 'transparent',
                color: filter === d.id ? d.color : 'rgba(255,255,255,0.45)',
              }}
            >
              {d.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Stream */}
      <div ref={scrollRef} className="m-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {visible.length === 0 && (
          <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-white/35">
            No entries in this thread yet. Speak or type below.
          </p>
        )}
        {visible.map((m) => {
          const d = getDomain(m.domain);
          const mine = m.role === 'user';
          return (
            <div key={m.id} className={`group flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <div className="mb-1 flex items-center gap-1.5">
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: `${d.color}22`, color: d.color }}
                >
                  {d.label.split(' ')[0]}
                </span>
                {m.source === 'mobile' && (
                  <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--m-accent-soft)]">
                    <Radio className="h-2.5 w-2.5" /> remote
                  </span>
                )}
                <span className="text-[9px] text-white/25">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div
                className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  mine
                    ? 'm-gradient-bg text-white'
                    : m.role === 'system'
                      ? 'border border-amber-400/25 bg-amber-400/8 text-amber-100/90'
                      : 'border border-white/10 bg-white/[0.04] text-white/85'
                }`}
              >
                {m.content}
              </div>
              {!mine && (
                <button
                  onClick={() => togglePin(m.id, m.content, m.domain)}
                  className={`mt-1 flex items-center gap-1 text-[10px] transition ${pinned.includes(m.id) ? 'text-[var(--m-accent-soft)]' : 'text-white/25 opacity-0 group-hover:opacity-100'}`}
                >
                  <Pin className="h-2.5 w-2.5" /> {pinned.includes(m.id) ? 'Pinned to insights' : 'Pin insight'}
                </button>
              )}
            </div>
          );
        })}
        {thinking && (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Maggie is composing…
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div className="m-scroll shrink-0 flex gap-1.5 overflow-x-auto border-t border-white/8 px-4 py-2">
        {getDomain(domain).quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => send(p)}
            className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/55 transition hover:border-white/25 hover:text-white"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-white/8 p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.14em] text-white/30">Tag</span>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value as DomainId)}
            className="flex-1 rounded-lg border border-white/10 bg-[#1F2029] px-2 py-1.5 text-[11px] text-white/80 outline-none focus:border-[var(--m-accent)]"
          >
            {COMPANION_DOMAINS.map((d) => (
              <option key={d.id} value={d.id} className="bg-[#1F2029]">
                {d.label}
              </option>
            ))}
          </select>
          <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `${getDomain(domain).color}22`, color: getDomain(domain).color }}>
            <Icon name={getDomain(domain).icon} className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-[#1B1C24] p-2 focus-within:border-[var(--m-accent)]/60">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder="Talk to Maggie, or say “order Whole Foods delivery”…"
            className="m-scroll max-h-28 flex-1 resize-none bg-transparent text-[13px] text-white placeholder:text-white/25 outline-none"
          />
          <button
            onClick={toggleVoice}
            className={`grid h-8 w-8 place-items-center rounded-lg border transition ${listening ? 'm-pulse-ring relative border-[var(--m-accent-soft)]/60 bg-[var(--m-accent-soft)]/15 text-[var(--m-accent-soft)]' : 'border-white/10 text-white/45 hover:text-white'}`}
            title="Voice capture"
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <button
            onClick={() => send()}
            disabled={!input.trim()}
            className="grid h-8 w-8 place-items-center rounded-lg m-gradient-bg text-white transition disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationRail;
