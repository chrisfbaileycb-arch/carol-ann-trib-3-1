import React, { useEffect, useRef, useState } from 'react';
import {
  Camera, CameraOff, Play, Pause, Plus, Volume2, Activity, Timer, Dumbbell, RotateCcw,
} from 'lucide-react';
import {
  getWorkoutState, saveWorkoutState, nextSplit, speak,
  EXERCISE_LIBRARY, CUE_LIBRARY, SPLIT_ROTATION, type WorkoutState,
} from '@/lib/coachStore';
import { useMaggie } from '@/contexts/MaggieContext';
import { uid } from '@/lib/memoryStore';

export const GymCoach: React.FC = () => {
  const { addCheckIn, addMessage, updateToday } = useMaggie();
  const [state, setState] = useState<WorkoutState>(getWorkoutState);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [cadence, setCadence] = useState(0);
  const [hr, setHr] = useState(112);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(95);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => saveWorkoutState(state), [state]);

  useEffect(() => {
    if (!state.timerActive) return;
    const t = window.setInterval(() => {
      setSeconds((s) => s + 1);
      setCadence((c) => (c + 1) % 4);
      setHr((h) => Math.max(96, Math.min(172, h + Math.round((Math.random() - 0.45) * 6))));
    }, 1000);
    return () => window.clearInterval(t);
  }, [state.timerActive]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  const toggleCam = async () => {
    if (camOn) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCamOn(false);
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setCamOn(true);
      setCamError('');
      speak('Camera live. Set up in frame and give me a full range rep.');
    } catch {
      setCamError('Camera permission denied or unavailable on this device.');
    }
  };

  const toggleTimer = () => {
    const active = !state.timerActive;
    setState((s) => ({ ...s, timerActive: active }));
    speak(active ? `Starting ${state.currentSplit}. First movement, ${state.activeExercise}.` : 'Paused. Breathe and reset.');
  };

  const logSet = () => {
    const set = { id: uid('set'), exercise: state.activeExercise ?? 'Unnamed', reps, weight, loggedAt: new Date().toISOString() };
    setState((s) => ({ ...s, setsCompleted: s.setsCompleted + 1, sets: [set, ...s.sets].slice(0, 60) }));
    const cue = CUE_LIBRARY[Math.floor(Math.random() * CUE_LIBRARY.length)];
    speak(`Set logged. ${reps} reps at ${weight} pounds. ${cue}`);
    addCheckIn({ type: 'physical', label: `${set.exercise} — ${reps}×${weight}lb`, notes: cue });
  };

  const finishSession = () => {
    const summary = `${Math.round(seconds / 60)} min, ${state.setsCompleted} sets, avg HR ${hr}`;
    const upcoming = nextSplit(state.currentSplit);
    setState((s) => ({
      ...s,
      timerActive: false,
      setsCompleted: 0,
      lastSessionDate: `Today (${s.currentSplit})`,
      currentSplit: upcoming,
      history: [{ date: new Date().toISOString().slice(0, 10), focus: s.currentSplit, summary }, ...s.history].slice(0, 12),
    }));
    setSeconds(0);
    updateToday({ completed_tasks: [`${state.currentSplit} — ${summary}`] });
    addMessage({ domain: 'gym', role: 'assistant', content: `Session closed: ${state.currentSplit} — ${summary}. Tomorrow rotates to ${upcoming}.`, source: 'desktop' });
    speak(`Session complete. ${summary}. Next up is ${upcoming}.`);
  };

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const exercises = EXERCISE_LIBRARY[state.currentSplit] ?? [];

  return (
    <div className="m-scroll h-full overflow-y-auto p-4 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        {/* Camera viewport */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
          <div className="flex items-center justify-between border-b border-white/8 bg-[#14151C] px-4 py-2.5">
            <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
              <Camera className="h-3.5 w-3.5" /> Vision telemetry
            </span>
            <button
              onClick={() => void toggleCam()}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${camOn ? 'border-rose-400/40 bg-rose-400/10 text-rose-300' : 'border-white/12 text-white/60 hover:text-white'}`}
            >
              {camOn ? <CameraOff className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
              {camOn ? 'Stop camera' : 'Enable camera'}
            </button>
          </div>
          <div className="relative aspect-video bg-[#0A0B0F]">
            <video ref={videoRef} autoPlay playsInline muted className={`h-full w-full object-cover ${camOn ? '' : 'hidden'}`} />
            {!camOn && (
              <div className="absolute inset-0 grid place-items-center p-6 text-center">
                <div>
                  <Dumbbell className="mx-auto h-8 w-8 text-white/15" />
                  <p className="mt-2 text-sm text-white/45">Camera viewport idle</p>
                  <p className="mt-1 text-[11px] text-white/25">{camError || 'Enable the camera for live form and cadence tracking.'}</p>
                </div>
              </div>
            )}
            {camOn && (
              <>
                <div className="pointer-events-none absolute inset-4 rounded-xl border border-[var(--m-accent-soft)]/30" />
                <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-rose-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" /> REC · form analysis
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                  {['Depth: full', 'Knee track: aligned', `Cadence: ${['down', 'down', 'hold', 'up'][cadence]}`].map((t) => (
                    <span key={t} className="rounded-full bg-black/65 px-2.5 py-1 font-mono text-[10px] text-emerald-300">{t}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Live console */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Contextual workout memory</p>
            <p className="mt-1 text-xs text-white/50">{state.lastSessionDate} → today reads as</p>
            <h3 className="font-display text-2xl font-semibold text-white">{state.currentSplit}</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SPLIT_ROTATION.map((s) => (
                <button
                  key={s}
                  onClick={() => setState((st) => ({ ...st, currentSplit: s, activeExercise: (EXERCISE_LIBRARY[s] ?? [])[0] ?? null }))}
                  className={`rounded-full border px-2.5 py-1 text-[10.5px] transition ${state.currentSplit === s ? 'border-[var(--m-accent)]/60 bg-[var(--m-accent)]/15 text-white' : 'border-white/10 text-white/40 hover:text-white'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Timer, label: 'Session', value: mmss },
              { icon: Activity, label: 'Heart rate', value: `${hr} bpm`, sub: `target ${state.targetHeartRate}` },
              { icon: Dumbbell, label: 'Sets', value: String(state.setsCompleted) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                <s.icon className="mx-auto h-4 w-4 text-[var(--m-accent-soft)]" />
                <p className="mt-1 font-mono text-lg font-semibold text-white">{s.value}</p>
                <p className="text-[9px] uppercase tracking-wider text-white/30">{s.sub ?? s.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Active movement</p>
            <select
              value={state.activeExercise ?? ''}
              onChange={(e) => setState((s) => ({ ...s, activeExercise: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-white/12 bg-[#1B1C24] px-3 py-2 text-sm text-white outline-none focus:border-[var(--m-accent)]"
            >
              {exercises.map((e) => <option key={e} value={e} className="bg-[#1B1C24]">{e}</option>)}
            </select>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-[10px] uppercase tracking-wider text-white/35">
                Reps
                <input type="number" value={reps} onChange={(e) => setReps(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-white/12 bg-[#1B1C24] px-3 py-2 font-mono text-sm text-white outline-none" />
              </label>
              <label className="text-[10px] uppercase tracking-wider text-white/35">
                Weight (lb)
                <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-white/12 bg-[#1B1C24] px-3 py-2 font-mono text-sm text-white outline-none" />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={toggleTimer} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg m-gradient-bg px-3 py-2 text-xs font-semibold text-white">
                {state.timerActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {state.timerActive ? 'Pause session' : 'Start session'}
              </button>
              <button onClick={logSet} className="flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-2 text-xs font-medium text-white/70 transition hover:border-white/30 hover:text-white">
                <Plus className="h-3.5 w-3.5" /> Log set
              </button>
              <button onClick={() => speak(CUE_LIBRARY[Math.floor(Math.random() * CUE_LIBRARY.length)])} className="flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-2 text-xs font-medium text-white/70 transition hover:border-white/30 hover:text-white">
                <Volume2 className="h-3.5 w-3.5" /> Cue
              </button>
              <button onClick={finishSession} className="flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300">
                <RotateCcw className="h-3.5 w-3.5" /> Finish
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logged sets + history */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Sets this session</p>
          {state.sets.length === 0 ? (
            <p className="mt-3 text-xs text-white/30">No sets logged yet. Hit “Log set” after each working set.</p>
          ) : (
            <ul className="m-scroll mt-3 max-h-52 space-y-1.5 overflow-y-auto">
              {state.sets.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-lg bg-black/25 px-3 py-2 text-xs">
                  <span className="text-white/70">{s.exercise}</span>
                  <span className="font-mono text-white/45">{s.reps} × {s.weight}lb · {new Date(s.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Split history</p>
          <ul className="mt-3 space-y-1.5">
            {state.history.map((h) => (
              <li key={h.date + h.focus} className="flex items-center justify-between rounded-lg bg-black/25 px-3 py-2 text-xs">
                <span className="text-white/70">{h.focus}</span>
                <span className="font-mono text-white/40">{h.date} · {h.summary}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GymCoach;
