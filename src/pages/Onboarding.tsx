import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Sparkles, Loader2 } from 'lucide-react';
import {
  INTAKE_STEPS, AESTHETIC_THEMES, SPORTS_TEAMS, INTEREST_OPTIONS,
  ROUTINE_OPTIONS, WELLNESS_GOALS, PROFESSIONAL_FOCUS, ACCENT_PALETTES,
} from '@/data/intake';
import { useMaggie } from '@/contexts/MaggieContext';

const Chip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; color?: string }> = ({
  active, onClick, children, color = '#8B5FBF',
}) => (
  <button
    onClick={onClick}
    className="rounded-full border px-3.5 py-2 text-xs font-medium transition"
    style={{
      borderColor: active ? `${color}99` : 'rgba(255,255,255,0.12)',
      background: active ? `${color}22` : 'rgba(255,255,255,0.02)',
      color: active ? '#fff' : 'rgba(255,255,255,0.55)',
    }}
  >
    {children}
  </button>
);

export const Onboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { profile, updateProfile, theme } = useMaggie();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const meta = INTAKE_STEPS[step];
  const last = step === INTAKE_STEPS.length - 1;

  const toggleArr = (key: 'sportsTeams' | 'interests', v: string) => {
    const cur = profile[key];
    updateProfile({ [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] } as never);
  };

  const finish = async () => {
    setError('');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email or leave it blank.');
      return;
    }
    setSubmitting(true);
    updateProfile({ onboarded: true, email: email || undefined });
    setSubmitting(false);
    onComplete();
  };

  return (
    <div className="maggie-root min-h-screen text-white" style={{ backgroundColor: theme.surface, backgroundImage: theme.texture }}>
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-10">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl m-gradient-bg">
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <div>
            <p className="font-display text-lg font-semibold">Maggie</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Sovereign intake</p>
          </div>
          <button onClick={onComplete} className="ml-auto text-[11px] text-white/35 underline-offset-2 transition hover:text-white/70 hover:underline">
            Skip for now
          </button>
        </div>

        {/* Progress */}
        <div className="mt-6 flex gap-1.5">
          {INTAKE_STEPS.map((s, i) => (
            <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full transition-all duration-500 ${i <= step ? 'm-gradient-bg' : ''}`} style={{ width: i <= step ? '100%' : '0%' }} />
            </div>
          ))}
        </div>

        <div className="mt-8 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: theme.accentSoft }}>
            Step {step + 1} of {INTAKE_STEPS.length}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{meta.title}</h1>
          <p className="mt-2 text-sm text-white/45">{meta.subtitle}</p>

          <div className="mt-7 space-y-5">
            {step === 0 && (
              <>
                <label className="block text-[11px] uppercase tracking-wider text-white/40">
                  Your name
                  <input
                    value={profile.name}
                    onChange={(e) => updateProfile({ name: e.target.value })}
                    placeholder="Sarah"
                    className="mt-1.5 w-full rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-base normal-case text-white placeholder:text-white/20 outline-none focus:border-[var(--m-accent)]"
                  />
                </label>
                <label className="block text-[11px] uppercase tracking-wider text-white/40">
                  How you'd describe yourself right now
                  <textarea
                    value={profile.identity}
                    onChange={(e) => updateProfile({ identity: e.target.value })}
                    rows={3}
                    placeholder="Engineer, mother of two, training for a first powerlifting meet."
                    className="mt-1.5 w-full resize-none rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-sm normal-case text-white placeholder:text-white/20 outline-none focus:border-[var(--m-accent)]"
                  />
                </label>
                <label className="block text-[11px] uppercase tracking-wider text-white/40">
                  A line you want on your canvas
                  <input
                    value={profile.affirmation}
                    onChange={(e) => updateProfile({ affirmation: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-sm normal-case italic text-white outline-none focus:border-[var(--m-accent)]"
                  />
                </label>
              </>
            )}

            {step === 1 && (
              <div className="space-y-2">
                {ROUTINE_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => updateProfile({ routine: r })}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${profile.routine === r ? 'border-[var(--m-accent)]/70 bg-[var(--m-accent)]/12 text-white' : 'border-white/10 bg-white/[0.02] text-white/55 hover:text-white'}`}
                  >
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${profile.routine === r ? 'border-transparent m-gradient-bg' : 'border-white/20'}`}>
                      {profile.routine === r && <Check className="h-3 w-3 text-white" />}
                    </span>
                    {r}
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  {WELLNESS_GOALS.map((g) => (
                    <button
                      key={g}
                      onClick={() => updateProfile({ wellnessGoal: g })}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${profile.wellnessGoal === g ? 'border-[var(--m-accent)]/70 bg-[var(--m-accent)]/12 text-white' : 'border-white/10 bg-white/[0.02] text-white/55 hover:text-white'}`}
                    >
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${profile.wellnessGoal === g ? 'border-transparent m-gradient-bg' : 'border-white/20'}`}>
                        {profile.wellnessGoal === g && <Check className="h-3 w-3 text-white" />}
                      </span>
                      {g}
                    </button>
                  ))}
                </div>
                <div>
                  <p className="mb-2 text-[11px] uppercase tracking-wider text-white/40">Primary interests</p>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((i) => (
                      <Chip key={i} active={profile.interests.includes(i)} onClick={() => toggleArr('interests', i)}>{i}</Chip>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <div className="space-y-2">
                {PROFESSIONAL_FOCUS.map((p) => (
                  <button
                    key={p}
                    onClick={() => updateProfile({ professionalFocus: p })}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${profile.professionalFocus === p ? 'border-[var(--m-accent)]/70 bg-[var(--m-accent)]/12 text-white' : 'border-white/10 bg-white/[0.02] text-white/55 hover:text-white'}`}
                  >
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${profile.professionalFocus === p ? 'border-transparent m-gradient-bg' : 'border-white/20'}`}>
                      {profile.professionalFocus === p && <Check className="h-3 w-3 text-white" />}
                    </span>
                    {p}
                  </button>
                ))}
              </div>
            )}

            {step === 4 && (
              <>
                <div>
                  <p className="mb-2 text-[11px] uppercase tracking-wider text-white/40">Design subculture</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {AESTHETIC_THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => updateProfile({ theme: t.id, aesthetic: t.label, accentColor: t.accent })}
                        className="rounded-xl border p-3.5 text-left transition"
                        style={{
                          borderColor: profile.theme === t.id ? `${t.accent}99` : 'rgba(255,255,255,0.1)',
                          background: profile.theme === t.id ? `${t.accent}18` : 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-white">
                          <span className="h-3 w-3 rounded-full" style={{ background: t.accent }} /> {t.label}
                        </span>
                        <span className="mt-1 block text-[11px] text-white/40">{t.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[11px] uppercase tracking-wider text-white/40">Favorite teams</p>
                  <div className="flex flex-wrap gap-2">
                    {SPORTS_TEAMS.map((t) => (
                      <Chip key={t} active={profile.sportsTeams.includes(t)} onClick={() => toggleArr('sportsTeams', t)} color="#F97316">{t}</Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[11px] uppercase tracking-wider text-white/40">Accent palette</p>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_PALETTES.map((a) => (
                      <Chip key={a.id} active={profile.accentColor === a.value} onClick={() => updateProfile({ accentColor: a.value })} color={a.value}>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.value }} /> {a.label}
                        </span>
                      </Chip>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/45">
                  Maggie is local-first — everything above already lives on this device. Adding a contact channel only enables
                  cross-device continuity and optional briefings. It is entirely optional.
                </p>
                <label className="block text-[11px] uppercase tracking-wider text-white/40">
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="mt-1.5 w-full rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-sm normal-case text-white placeholder:text-white/20 outline-none focus:border-[var(--m-accent)]"
                  />
                </label>
                <label className="block text-[11px] uppercase tracking-wider text-white/40">
                  Phone number (optional)
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 010 4477"
                    className="mt-1.5 w-full rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-sm normal-case text-white placeholder:text-white/20 outline-none focus:border-[var(--m-accent)]"
                  />
                </label>
                <label className="flex cursor-pointer items-start gap-2.5 text-[11px] leading-relaxed text-white/45">
                  <input
                    type="checkbox"
                    checked={smsOptIn}
                    onChange={(e) => setSmsOptIn(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-white/25 bg-black/30 accent-[var(--m-accent)]"
                  />
                  <span>Text me updates. Msg &amp; data rates may apply. Reply STOP to unsubscribe.</span>
                </label>
                {error && <p className="text-xs text-rose-300">{error}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1.5 rounded-xl border border-white/12 px-4 py-2.5 text-xs font-medium text-white/55 transition hover:text-white disabled:opacity-25"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <button
            onClick={() => (last ? void finish() : setStep((s) => s + 1))}
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-xl m-gradient-bg px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {last ? 'Enter the command center' : 'Continue'}
            {!last && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
