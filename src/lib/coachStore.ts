export interface WorkoutSet {
  id: string;
  exercise: string;
  reps: number;
  weight: number;
  loggedAt: string;
}

export interface WorkoutState {
  currentSplit: string;
  lastSessionDate: string;
  activeExercise: string | null;
  setsCompleted: number;
  timerActive: boolean;
  targetHeartRate: number;
  sets: WorkoutSet[];
  history: Array<{ date: string; focus: string; summary: string }>;
}

const STORAGE_KEY = 'maggie_gym_coach';

export const SPLIT_ROTATION = [
  'Upper Body Push & Shoulders',
  'Leg Day & Core',
  'Upper Body Pull & Arms',
  'Conditioning & Mobility',
  'Full Body Strength',
];

export const EXERCISE_LIBRARY: Record<string, string[]> = {
  'Leg Day & Core': ['Barbell Squats', 'Romanian Deadlift', 'Walking Lunges', 'Hanging Leg Raise'],
  'Upper Body Push & Shoulders': ['Incline Press', 'Overhead Press', 'Cable Fly', 'Lateral Raise'],
  'Upper Body Pull & Arms': ['Lat Pulldown', 'Seated Row', 'Face Pull', 'Hammer Curl'],
  'Conditioning & Mobility': ['Rower Intervals', 'Kettlebell Swings', 'Hip Openers', 'Farmer Carry'],
  'Full Body Strength': ['Trap Bar Deadlift', 'Push Press', 'Bulgarian Split Squat', 'Pull-ups'],
};

export const CUE_LIBRARY = [
  'Brace the core — ribs down, breath held at the bottom.',
  'Drive through mid-foot. Knees track over the second toe.',
  'Three seconds down, one second up. Own the eccentric.',
  'Shoulders back and down. Keep the bar path vertical.',
  'That is the strongest set of this block. Rest ninety seconds.',
];

const defaultState = (): WorkoutState => ({
  currentSplit: 'Leg Day & Core',
  lastSessionDate: 'Yesterday (Upper Body & Shoulders)',
  activeExercise: 'Barbell Squats',
  setsCompleted: 0,
  timerActive: false,
  targetHeartRate: 138,
  sets: [],
  history: [
    { date: '2026-08-22', focus: 'Upper Body Pull & Arms', summary: '45 min, 4 exercises' },
    { date: '2026-08-20', focus: 'Leg Day & Plyometrics', summary: '50 min, 5 exercises' },
    { date: '2026-08-18', focus: 'Conditioning & Mobility', summary: '32 min, intervals' },
  ],
});

export const getWorkoutState = (): WorkoutState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) } as WorkoutState;
  } catch {
    return defaultState();
  }
};

export const saveWorkoutState = (state: WorkoutState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
};

export const nextSplit = (current: string): string => {
  const i = SPLIT_ROTATION.indexOf(current);
  return SPLIT_ROTATION[(i + 1) % SPLIT_ROTATION.length];
};

export const speak = (text: string) => {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    u.pitch = 1.05;
    window.speechSynthesis.speak(u);
  } catch {
    /* speech unavailable */
  }
};
