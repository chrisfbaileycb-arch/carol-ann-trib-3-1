import React, { useEffect, useState } from 'react';
import {
  X, Bot, Play, ShoppingBag, Plus, Trash2, Code2, TerminalSquare, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { CHAIN_LIST, chainForTarget, parseIntent } from '@/lib/browserAgent';
import { startRun, subscribeRunner, getRunnerState, pushLog } from '@/lib/agentRunner';
import { useMaggie } from '@/contexts/MaggieContext';
import { uid } from '@/lib/memoryStore';
import { publishBus } from '@/lib/realtimeBus';
import SavedShortcuts from '@/components/shortcuts/SavedShortcuts';
import type { ErrandTask } from '@/data/schemas';

type Tab = 'errands' | 'code' | 'terminal';


export const TaskDispatcher: React.FC<{ open: boolean; onClose: () => void; onRunStarted?: () => void }> = ({
  open, onClose, onRunStarted,
}) => {
  const { errands, upsertErrand } = useMaggie();
  const [tab, setTab] = useState<Tab>('errands');
  const [, force] = useState(0);
  const [newItem, setNewItem] = useState('');
  const [scratch, setScratch] = useState(
    '// Architecture scratchpad\nconst pipeline = {\n  ingest: "phone.vision",\n  route: "cloud.runner",\n  persist: "local -> supabase"\n};\n',
  );
  const [validation, setValidation] = useState<{ ok: boolean; msg: string } | null>(null);
  const [cmd, setCmd] = useState('');
  const [termLines, setTermLines] = useState<string[]>([
    'maggie@sovereign:~$ runner status',
    'cloud runner: READY · chromium 128 · region us-west-2',
  ]);

  useEffect(() => subscribeRunner(() => force((n) => n + 1)), []);
  const { runs } = getRunnerState();

  if (!open) return null;

  const addErrandItem = (task: ErrandTask) => {
    if (!newItem.trim()) return;
    upsertErrand({ ...task, items: [...task.items, newItem.trim()] });
    setNewItem('');
  };

  const validate = () => {
    try {
      // eslint-disable-next-line no-new-func
      new Function(scratch);
      setValidation({ ok: true, msg: 'Syntax valid — no parse errors detected.' });
    } catch (e) {
      setValidation({ ok: false, msg: String(e) });
    }
  };

  const runCmd = () => {
    const c = cmd.trim();
    if (!c) return;
    const out: string[] = [`maggie@sovereign:~$ ${c}`];
    if (c.startsWith('run ')) {
      const key = c.slice(4).trim();
      const chain = CHAIN_LIST.find((x) => x.key === key);
      if (chain) {
        startRun(chain.key);
        onRunStarted?.();
        out.push(`dispatching chain "${chain.title}" → ${chain.url}`);
      } else {
        out.push(`unknown chain: ${key}. available: ${CHAIN_LIST.map((x) => x.key).join(', ')}`);
      }
    } else if (c === 'chains') {
      out.push(CHAIN_LIST.map((x) => `  ${x.key.padEnd(20)} ${x.title}`).join('\n'));
    } else if (c === 'status') {
      out.push(`active runs: ${runs.length} · ${runs.filter((r) => r.status === 'running').length} executing`);
    } else if (c === 'clear') {
      setTermLines([]);
      setCmd('');
      return;
    } else {
      out.push(`command not found: ${c}. try: chains | run <key> | status | clear`);
    }
    setTermLines((prev) => [...prev, ...out].slice(-60));
    setCmd('');
  };

  // One-tap saved shortcut: resolve its chain (or parse the text) and dispatch.
  const runShortcut = (text: string, chainKey: string | null) => {
    const chain = chainKey ? CHAIN_LIST.find((x) => x.key === chainKey) : parseIntent(text);
    if (!chain) {
      pushLog(`No dispatch chain matched shortcut “${text.slice(0, 60)}”.`, 'warn');
      setTermLines((prev) => [...prev, `maggie@sovereign:~$ shortcut "${text}"`, 'no matching chain'].slice(-60));
      return;
    }
    startRun(chain.key);
    publishBus('command', { text, origin: 'saved-shortcut' }, 'desktop');
    pushLog(`Saved shortcut dispatched → ${chain.title}`, 'action');
    onRunStarted?.();
  };

  return (

    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#15161C] shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg m-gradient-bg">
              <Bot className="h-4 w-4 text-white" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold text-white">Automation Copilot</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">{runs.length} runs this session</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-white/40 transition hover:bg-white/8 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex shrink-0 gap-1 border-b border-white/8 px-3 py-2">
          {([
            { id: 'errands', label: 'Errands', icon: ShoppingBag },
            { id: 'code', label: 'Scratchpad', icon: Code2 },
            { id: 'terminal', label: 'Terminal', icon: TerminalSquare },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${tab === t.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/75'}`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <div className="m-scroll min-h-0 flex-1 overflow-y-auto p-4">
          {tab === 'errands' && (
            <div className="space-y-3">
              {/* One-tap saved shortcuts (shared with the phone remote) */}
              <SavedShortcuts
                className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                variant="list"
                title="Saved shortcuts"
                onDispatch={(c) => runShortcut(c.text, c.chainKey)}
              />

              {errands.map((e) => {
                const chain = chainForTarget(e.target);
                return (
                  <div key={e.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{e.title}</p>
                        <p className="text-[10px] uppercase tracking-wider text-white/30">{chain.provider} · {e.status}</p>
                      </div>
                      <button
                        onClick={() => {
                          startRun(chain.key);
                          upsertErrand({ ...e, status: 'dispatched' });
                          onRunStarted?.();
                        }}
                        className="flex shrink-0 items-center gap-1 rounded-lg m-gradient-bg px-2.5 py-1.5 text-[11px] font-semibold text-white"
                      >
                        <Play className="h-3 w-3" /> Dispatch
                      </button>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {e.items.map((it, i) => (
                        <li key={`${e.id}-${i}`} className="flex items-center gap-2 rounded-md bg-black/25 px-2.5 py-1.5 text-[11px] text-white/60">
                          <span className="flex-1">{it}</span>
                          <button
                            onClick={() => upsertErrand({ ...e, items: e.items.filter((_, j) => j !== i) })}
                            className="text-white/25 transition hover:text-rose-300"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={newItem}
                        onChange={(ev) => setNewItem(ev.target.value)}
                        onKeyDown={(ev) => ev.key === 'Enter' && addErrandItem(e)}
                        placeholder="Add item…"
                        className="flex-1 rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5 text-[11px] text-white placeholder:text-white/20 outline-none focus:border-[var(--m-accent)]"
                      />
                      <button onClick={() => addErrandItem(e)} className="rounded-lg border border-white/12 px-2 text-white/50 transition hover:text-white">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {e.scheduled_time && <p className="mt-2 text-[10px] text-emerald-300/70">Window: {e.scheduled_time}</p>}
                  </div>
                );
              })}
              <button
                onClick={() =>
                  upsertErrand({ id: uid('er'), target: 'custom', title: 'New errand chain', items: [], status: 'draft' })
                }
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 py-3 text-xs text-white/45 transition hover:border-white/35 hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" /> New errand
              </button>
            </div>
          )}

          {tab === 'code' && (
            <div className="space-y-3">
              <textarea
                value={scratch}
                onChange={(e) => setScratch(e.target.value)}
                rows={16}
                spellCheck={false}
                className="m-scroll w-full resize-none rounded-xl border border-white/12 bg-black/35 p-3 font-mono text-[11.5px] leading-relaxed text-emerald-200/90 outline-none focus:border-[var(--m-accent)]"
              />
              <button onClick={validate} className="w-full rounded-lg m-gradient-bg py-2 text-xs font-semibold text-white">
                Validate syntax
              </button>
              {validation && (
                <div className={`flex items-start gap-2 rounded-lg border p-3 text-[11px] ${validation.ok ? 'border-emerald-400/30 bg-emerald-400/8 text-emerald-300' : 'border-rose-400/30 bg-rose-400/8 text-rose-300'}`}>
                  {validation.ok ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                  <span className="break-words">{validation.msg}</span>
                </div>
              )}
            </div>
          )}

          {tab === 'terminal' && (
            <div className="flex h-full flex-col">
              <div className="m-scroll min-h-[220px] flex-1 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/12 bg-black/45 p-3 font-mono text-[11px] text-emerald-300/85">
                {termLines.join('\n')}
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/12 bg-black/35 px-3 py-2">
                <span className="font-mono text-[11px] text-[var(--m-accent-soft)]">$</span>
                <input
                  value={cmd}
                  onChange={(e) => setCmd(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runCmd()}
                  placeholder="chains | run whole-foods | status"
                  className="flex-1 bg-transparent font-mono text-[11px] text-white placeholder:text-white/20 outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default TaskDispatcher;
