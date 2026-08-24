import React from 'react';
import { Cpu, Clock, Brain, Volume2, ShieldCheck, Gauge, PanelRight } from 'lucide-react';
import { MODEL_OPTIONS, type AISettings, detectTimeZone, timeZoneLabel } from '@/lib/agentStore';

/** Left rail of the chat hub: the ordinary AI settings, kept out of the work area. */
const AISettingsPanel: React.FC<{
  settings: AISettings;
  onChange: (patch: Partial<AISettings>) => void;
}> = ({ settings, onChange }) => {
  const Toggle: React.FC<{ label: string; hint: string; icon: React.ElementType; value: boolean; onToggle: () => void }> =
    ({ label, hint, icon: Icon, value, onToggle }) => (
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-white/25"
      >
        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/45" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11.5px] font-semibold text-white/80">{label}</span>
          <span className="block text-[10px] leading-relaxed text-white/35">{hint}</span>
        </span>
        <span className={`mt-0.5 h-4 w-7 shrink-0 rounded-full p-0.5 transition ${value ? 'bg-[var(--m-accent)]' : 'bg-white/15'}`}>
          <span className={`block h-3 w-3 rounded-full bg-white transition ${value ? 'translate-x-3' : ''}`} />
        </span>
      </button>
    );

  return (
    <div className="m-scroll h-full space-y-3 overflow-y-auto p-3.5">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">AI settings</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-white/40">
          Model, memory and voice for every agent in this workspace.
        </p>
      </div>

      <div>
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-white/30">
          <Cpu className="h-3 w-3" /> Model
        </p>
        <div className="mt-1.5 space-y-1.5">
          {MODEL_OPTIONS.map((m) => (
            <button
              key={m.key}
              onClick={() => onChange({ model: m.key })}
              className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left transition ${
                settings.model === m.key ? 'border-[var(--m-accent)]/60 bg-[var(--m-accent)]/12' : 'border-white/10 hover:border-white/25'
              }`}
            >
              <span className="text-[11.5px] font-medium text-white/80">{m.label}</span>
              <span className="text-[9.5px] text-white/35">{m.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-white/30">
          <Gauge className="h-3 w-3" /> Creativity · {settings.creativity.toFixed(1)}
        </p>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={settings.creativity}
          onChange={(e) => onChange({ creativity: Number(e.target.value) })}
          className="mt-2 w-full accent-[var(--m-accent)]"
        />
        <div className="mt-1.5 flex gap-1.5">
          {(['short', 'balanced', 'deep'] as const).map((r) => (
            <button
              key={r}
              onClick={() => onChange({ replyLength: r })}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-[10.5px] capitalize transition ${
                settings.replyLength === r ? 'border-[var(--m-accent)]/60 bg-[var(--m-accent)]/12 text-white' : 'border-white/10 text-white/45 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <Toggle
        label="Use agent memory"
        hint="Feed each agent its own subject memory."
        icon={Brain}
        value={settings.useMemory}
        onToggle={() => onChange({ useMemory: !settings.useMemory })}
      />
      <Toggle
        label="Speak replies"
        hint="Read answers aloud with the agent's voice."
        icon={Volume2}
        value={settings.speakReplies}
        onToggle={() => onChange({ speakReplies: !settings.speakReplies })}
      />
      <Toggle
        label="Confirm before submit"
        hint="Agents always pause before a real booking or purchase."
        icon={ShieldCheck}
        value={settings.confirmBeforeSubmit}
        onToggle={() => onChange({ confirmBeforeSubmit: !settings.confirmBeforeSubmit })}
      />
      <Toggle
        label="Browser sandbox pane"
        hint="Show the agent sandbox on the right."
        icon={PanelRight}
        value={settings.sandboxOpen}
        onToggle={() => onChange({ sandboxOpen: !settings.sandboxOpen })}
      />

      {/* Time zone */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
        <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-white/80">
          <Clock className="h-3.5 w-3.5 text-white/45" /> Time zone
        </p>
        <p className="mt-1 text-[10.5px] text-white/45">
          {settings.timeZone} · {timeZoneLabel()}
        </p>
        <div className="mt-2 flex gap-1.5">
          <button
            onClick={() => onChange({ autoTimeZone: true, timeZone: detectTimeZone() })}
            className={`flex-1 rounded-lg border px-2 py-1.5 text-[10.5px] transition ${
              settings.autoTimeZone ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' : 'border-white/10 text-white/45 hover:text-white'
            }`}
          >
            Auto-detect
          </button>
          <button
            onClick={() => onChange({ autoTimeZone: false })}
            className={`flex-1 rounded-lg border px-2 py-1.5 text-[10.5px] transition ${
              !settings.autoTimeZone ? 'border-[var(--m-accent)]/60 bg-[var(--m-accent)]/12 text-white' : 'border-white/10 text-white/45 hover:text-white'
            }`}
          >
            Manual
          </button>
        </div>
        {!settings.autoTimeZone && (
          <input
            value={settings.timeZone}
            onChange={(e) => onChange({ timeZone: e.target.value })}
            placeholder="America/New_York"
            className="mt-2 w-full rounded-lg border border-white/12 bg-black/30 px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[var(--m-accent)]/50"
          />
        )}
      </div>

      <p className="text-[10px] leading-relaxed text-white/25">
        Settings and agent memory live on this device. Clear or delete them any time from the Agent Studio.
      </p>
    </div>
  );
};

export default AISettingsPanel;
