/**
 * Single source of truth for the Agent Studio: preset agents, personality tones,
 * voice options and the sovereignty disclaimer copy.
 *
 * Every agent keeps its OWN workflow memory, scoped by `subject` — memory written
 * while talking to the Hair Salon agent is never visible to the Coding agent.
 */

export type AgentCategory = 'appointments' | 'family' | 'wellness' | 'work' | 'money' | 'faith' | 'custom';

export interface AgentSkin {
  /** Body / hat gradient stops for the little animated character. */
  body: [string, string];
  hat: string;
  /** Accessory rendered on the character: hat, halo, headset, cap, bow, glasses. */
  prop: 'hat' | 'halo' | 'headset' | 'cap' | 'bow' | 'glasses' | 'visor';
}

export interface AgentPreset {
  id: string;
  name: string;
  role: string;
  /** The one subject this agent's memory is scoped to. */
  subject: string;
  category: AgentCategory;
  /** Description rendered behind / under the animated character. */
  blurb: string;
  starters: string[];
  skin: AgentSkin;
  /** Sensitive-domain notice appended to the standard disclaimer. */
  caution?: string;
}

export interface TonePreset {
  key: string;
  label: string;
  hint: string;
  prompt: string;
}

export interface VoiceOption {
  key: string;
  label: string;
  /** Hints used to pick a matching SpeechSynthesis voice. */
  match: string[];
  pitch: number;
  rate: number;
}

export const AGENT_CATEGORIES: { key: AgentCategory; label: string }[] = [
  { key: 'appointments', label: 'Appointments' },
  { key: 'family', label: 'Family & school' },
  { key: 'wellness', label: 'Wellness' },
  { key: 'work', label: 'Work & build' },
  { key: 'money', label: 'Money' },
  { key: 'faith', label: 'Faith' },
  { key: 'custom', label: 'Custom' },
];

export const AGENT_PRESETS: AgentPreset[] = [
  {
    id: 'hair-salon',
    name: 'Coco',
    role: 'Hair salon booking agent',
    subject: 'Hair salon appointments, stylist preferences and colour history',
    category: 'appointments',
    blurb: 'Books the chair, remembers your stylist, your formula and how long you like between touch-ups.',
    starters: ['Book my usual cut for Saturday', 'When is my colour due again?', 'Find a salon open late Thursday'],
    skin: { body: ['#F472B6', '#A855F7'], hat: '#FDE68A', prop: 'bow' },
  },
  {
    id: 'nail-salon',
    name: 'Lacque',
    role: 'Nail salon agent',
    subject: 'Nail appointments, shapes, shades and fill schedule',
    category: 'appointments',
    blurb: 'Tracks fills, shades and shapes so a two-tap message holds your slot before the weekend goes.',
    starters: ['Rebook my fill in two weeks', 'What shade did I get last time?', 'Any walk-in slots tonight?'],
    skin: { body: ['#FB7185', '#F59E0B'], hat: '#FFE4E6', prop: 'bow' },
  },
  {
    id: 'daycare',
    name: 'Pip',
    role: 'Daycare schedule agent',
    subject: 'Daycare hours, pickups, closures and supply lists',
    category: 'family',
    blurb: 'Watches drop-off windows, closure days and who is on the pickup list this week.',
    starters: ['Is daycare closed Monday?', 'Who is on pickup Thursday?', 'What supplies are due this month?'],
    skin: { body: ['#38BDF8', '#818CF8'], hat: '#FDE68A', prop: 'cap' },
    caution: 'This agent handles information about a child. Nothing is shared with anyone; the record lives on this device only.',
  },
  {
    id: 'elementary',
    name: 'Chalk',
    role: 'Elementary school agent',
    subject: 'Elementary school calendar, homework, permission slips and teacher notes',
    category: 'family',
    blurb: 'Holds the school calendar, spirit days, early releases and the permission slips that hide in backpacks.',
    starters: ['What is due this week?', 'When is the next early release?', 'Draft a note to the teacher'],
    skin: { body: ['#34D399', '#22D3EE'], hat: '#FCD34D', prop: 'cap' },
  },
  {
    id: 'fitness-club',
    name: 'Ripp',
    role: 'Fitness club agent',
    subject: 'Gym classes, trainer sessions and club membership',
    category: 'wellness',
    blurb: 'Grabs class spots the moment booking opens and keeps your trainer cadence honest.',
    starters: ['Book Saturday spin', 'Reschedule my trainer', 'How many sessions are left?'],
    skin: { body: ['#F97316', '#EF4444'], hat: '#111827', prop: 'visor' },
  },
  {
    id: 'coding',
    name: 'Byte',
    role: 'Coding agent',
    subject: 'Code, repositories, stack decisions and build errors',
    category: 'work',
    blurb: 'Reads the error, writes the patch, explains the why. Ships small, reversible changes.',
    starters: ['Explain this stack trace', 'Write a migration for a users table', 'Review my component for leaks'],
    skin: { body: ['#22D3EE', '#3B82F6'], hat: '#0F172A', prop: 'headset' },
  },
  {
    id: 'technology',
    name: 'Volt',
    role: 'Technology instructor agent',
    subject: 'Devices, apps, accounts and how-to instruction',
    category: 'work',
    blurb: 'Instructs you step by step through any device, app or account — never jargon, always the next tap.',
    starters: ['Walk me through two-factor auth', 'My laptop is slow — triage it', 'Set up a shared calendar'],
    skin: { body: ['#A78BFA', '#6366F1'], hat: '#E0E7FF', prop: 'glasses' },
  },
  {
    id: 'financial',
    name: 'Ledger',
    role: 'Financial planner agent',
    subject: 'Budget, savings goals, bills and long-range money plans',
    category: 'money',
    blurb: 'Plans the month, names the leaks, and tells you the honest number before you spend it.',
    starters: ['Build a 60/20/20 month', 'What can I safely put away?', 'Plan a debt payoff order'],
    skin: { body: ['#4ADE80', '#059669'], hat: '#065F46', prop: 'hat' },
    caution: 'Educational planning only — not licensed financial, tax or legal advice.',
  },
  {
    id: 'faith',
    name: 'Selah',
    role: 'Person of faith agent',
    subject: 'Faith practice, scripture, prayer list and reflection',
    category: 'faith',
    blurb: 'Keeps your prayer list, reflection rhythm and the verses you keep coming back to.',
    starters: ['A verse for a hard morning', 'Add my sister to the prayer list', 'Plan a quiet 10 minutes'],
    skin: { body: ['#FBBF24', '#F472B6'], hat: '#FFFBEB', prop: 'halo' },
    caution: 'Reflection and companionship only — never a substitute for your clergy, community or a crisis line.',
  },
  {
    id: 'health-appts',
    name: 'Pulse',
    role: 'Medical appointment agent',
    subject: 'Doctor, dentist and specialist appointments',
    category: 'wellness',
    blurb: 'Holds the referral, the copay and the next available slot for every provider you use.',
    starters: ['Book my six-month cleaning', 'What did the referral say?', 'Find an earlier opening'],
    skin: { body: ['#F87171', '#FB7185'], hat: '#FEE2E2', prop: 'hat' },
    caution: 'Scheduling support only — never medical advice or diagnosis.',
  },
  {
    id: 'errands',
    name: 'Dash',
    role: 'Errands & delivery agent',
    subject: 'Groceries, deliveries, returns and pickups',
    category: 'appointments',
    blurb: 'Runs the cart, the return label and the pickup window while you stay in your day.',
    starters: ['Rebuild my weekly cart', 'Schedule a return pickup', 'Order dinner for four'],
    skin: { body: ['#FCD34D', '#F97316'], hat: '#78350F', prop: 'cap' },
  },
  {
    id: 'home',
    name: 'Nest',
    role: 'Home & maintenance agent',
    subject: 'Home maintenance, contractors and household schedule',
    category: 'family',
    blurb: 'Remembers filter sizes, warranty dates and which contractor actually shows up.',
    starters: ['When was the HVAC serviced?', 'Book a plumber for Friday', 'Build a spring checklist'],
    skin: { body: ['#60A5FA', '#34D399'], hat: '#1E3A8A', prop: 'hat' },
  },
];

export const TONE_PRESETS: TonePreset[] = [
  {
    key: 'friendly',
    label: 'Friendly & light',
    hint: 'warm, easy, a little playful',
    prompt: 'Be warm, light and encouraging. Short sentences, plain language, a little playful. Never lecture.',
  },
  {
    key: 'calm',
    label: 'Calm & steady',
    hint: 'unhurried, grounding',
    prompt: 'Be calm, unhurried and grounding. Lower the temperature of the moment and give one clear next step.',
  },
  {
    key: 'strict',
    label: 'Strict accountability',
    hint: 'holds you to it',
    prompt: 'Hold the operator accountable. Name the commitment, name the slip, ask for a date and time. Kind but immovable.',
  },
  {
    key: 'executive',
    label: 'Executive brief',
    hint: 'terse, decision-first',
    prompt: 'Answer decision-first in three lines or fewer: the call, the reason, the next action. No filler.',
  },
  {
    key: 'teacher',
    label: 'Patient teacher',
    hint: 'step by step',
    prompt: 'Teach step by step. Number every step, assume no prior knowledge, confirm understanding before moving on.',
  },
  {
    key: 'hype',
    label: 'Hype coach',
    hint: 'high energy',
    prompt: 'Be high energy and motivating. Celebrate momentum, make the next rep feel doable, keep it under 60 words.',
  },
];

export const VOICE_OPTIONS: VoiceOption[] = [
  { key: 'female-warm', label: 'Female · warm', match: ['female', 'samantha', 'karen', 'victoria', 'zira', 'google us english'], pitch: 1.05, rate: 0.98 },
  { key: 'female-bright', label: 'Female · bright', match: ['female', 'tessa', 'moira', 'fiona'], pitch: 1.25, rate: 1.06 },
  { key: 'male-calm', label: 'Male · calm', match: ['male', 'daniel', 'alex', 'david', 'fred'], pitch: 0.92, rate: 0.95 },
  { key: 'male-deep', label: 'Male · deep', match: ['male', 'google uk english male', 'rishi'], pitch: 0.75, rate: 0.92 },
  { key: 'neutral', label: 'Neutral', match: [], pitch: 1, rate: 1 },
  { key: 'silent', label: 'No voice', match: [], pitch: 1, rate: 1 },
];

/** Standard sovereignty disclaimer — shown for every agent, always dismissible. */
export const AGENT_DISCLAIMER = [
  'This agent is yours. Its memory lives on this device under your control — you can clear one entry, wipe the whole agent, or delete the agent entirely at any time.',
  'Agents never submit a booking, purchase or message without pausing for your confirmation first.',
  'Nothing an agent says is professional advice. You accept, edit or delete anything it produces.',
];

export const toneByKey = (key: string): TonePreset =>
  TONE_PRESETS.find((t) => t.key === key) ?? TONE_PRESETS[0];

export const voiceByKey = (key: string): VoiceOption =>
  VOICE_OPTIONS.find((v) => v.key === key) ?? VOICE_OPTIONS[0];
