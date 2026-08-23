export type SkillCategory = 'school' | 'daycare' | 'household' | 'health' | 'finance' | 'automation';

export interface SkillField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'date' | 'number' | 'textarea';
}

export interface AgentSkill {
  id: string;
  name: string;
  category: SkillCategory;
  icon: string;
  summary: string;
  capabilities: string[];
  fields: SkillField[];
  mcpEndpoint: string;
  version: string;
  installedByDefault: boolean;
}

export const SKILL_CATEGORIES: { id: SkillCategory; label: string; color: string }[] = [
  { id: 'school', label: 'School & Students', color: '#8B5FBF' },
  { id: 'daycare', label: 'Daycare & Activities', color: '#E8A0BF' },
  { id: 'household', label: 'Household & Holidays', color: '#D9A441' },
  { id: 'health', label: 'Health & Appointments', color: '#10B981' },
  { id: 'finance', label: 'Finance & Ledgers', color: '#3B82F6' },
  { id: 'automation', label: 'Automation & MCP', color: '#22D3EE' },
];

export const AGENT_SKILLS: AgentSkill[] = [
  {
    id: 'school-scheduler',
    name: 'Student & School Scheduling',
    category: 'school',
    icon: 'GraduationCap',
    summary: 'Syncs school calendars, parent-teacher portals, and extracurricular bus runs.',
    capabilities: [
      'Import district calendar (ICS) and flag early releases',
      'Watch parent portal for grade + attendance changes',
      'Auto-plan bus and carpool runs against your work blocks',
      'Draft teacher emails from a one-line intent',
    ],
    fields: [
      { key: 'student', label: 'Student name', placeholder: 'Ava', type: 'text' },
      { key: 'school', label: 'School / district', placeholder: 'Cherry Creek Elementary', type: 'text' },
      { key: 'portal', label: 'Parent portal URL', placeholder: 'https://portal.district.org', type: 'text' },
    ],
    mcpEndpoint: 'mcp://maggie.skills/school-scheduler',
    version: '1.4.0',
    installedByDefault: true,
  },
  {
    id: 'daycare-tracker',
    name: 'Daycare & Activity Tracker',
    category: 'daycare',
    icon: 'Baby',
    summary: 'Pickup authorization logs, tuition tracking, diaper and snack inventory.',
    capabilities: [
      'Maintain authorized pickup roster with photo IDs',
      'Track weekly tuition + auto-reconcile receipts',
      'Low-supply alerts for diapers, wipes, snacks',
      'Log daily reports into the memory ledger',
    ],
    fields: [
      { key: 'center', label: 'Center name', placeholder: 'Bright Horizons', type: 'text' },
      { key: 'tuition', label: 'Weekly tuition', placeholder: '285', type: 'number' },
      { key: 'pickup', label: 'Authorized pickups', placeholder: 'Grandma Ruth, Uncle Ben', type: 'textarea' },
    ],
    mcpEndpoint: 'mcp://maggie.skills/daycare-tracker',
    version: '1.1.2',
    installedByDefault: true,
  },
  {
    id: 'holiday-planner',
    name: 'Household Logistics & Holiday Planner',
    category: 'household',
    icon: 'Gift',
    summary: 'Thanksgiving and Christmas gift budgets, guest lists, and meal plans.',
    capabilities: [
      'Per-person gift budget with running spend total',
      'Guest list with dietary restrictions',
      'Meal plan generator with oven-time sequencing',
      'Shopping list handoff to the Whole Foods runner',
    ],
    fields: [
      { key: 'holiday', label: 'Holiday', placeholder: 'Thanksgiving', type: 'text' },
      { key: 'budget', label: 'Total budget', placeholder: '1200', type: 'number' },
      { key: 'guests', label: 'Guest list', placeholder: 'Mom, Dad, Kate + 2', type: 'textarea' },
    ],
    mcpEndpoint: 'mcp://maggie.skills/holiday-planner',
    version: '2.0.1',
    installedByDefault: true,
  },
  {
    id: 'appointment-booker',
    name: 'Doctor & Appointment Booking',
    category: 'health',
    icon: 'Stethoscope',
    summary: 'Pediatrician routines, dentist recalls, and auto-form filling.',
    capabilities: [
      'Watch recall windows and open booking portals',
      'Auto-fill intake forms from stored family records',
      'Hold two candidate slots before confirming',
      'Push confirmations to the household calendar',
    ],
    fields: [
      { key: 'provider', label: 'Provider', placeholder: 'Dr. Nguyen — Pediatrics', type: 'text' },
      { key: 'patient', label: 'Patient', placeholder: 'Ava', type: 'text' },
      { key: 'window', label: 'Preferred window', placeholder: 'Weekday mornings', type: 'text' },
    ],
    mcpEndpoint: 'mcp://maggie.skills/appointment-booker',
    version: '1.7.3',
    installedByDefault: false,
  },
  {
    id: 'quickbooks-ledger',
    name: 'QuickBooks Ledger Bridge',
    category: 'finance',
    icon: 'Receipt',
    summary: 'Two-way sync of household and business expense categories.',
    capabilities: [
      'Categorize receipts captured from the phone camera',
      'Monthly household vs business split report',
      'Flag duplicate subscriptions',
    ],
    fields: [
      { key: 'realm', label: 'Company realm ID', placeholder: '4620816365...', type: 'text' },
      { key: 'categories', label: 'Watched categories', placeholder: 'Groceries, Childcare, Software', type: 'textarea' },
    ],
    mcpEndpoint: 'mcp://maggie.skills/quickbooks-ledger',
    version: '0.9.4',
    installedByDefault: false,
  },
  {
    id: 'calendar-mesh',
    name: 'Calendar & Email Mesh',
    category: 'automation',
    icon: 'CalendarRange',
    summary: 'Unifies personal, work, school, and partner calendars into one conflict map.',
    capabilities: [
      'Conflict detection across five calendar sources',
      'Auto-decline meetings that collide with pickup runs',
      'Daily 6am agenda brief read aloud on the remote',
    ],
    fields: [
      { key: 'sources', label: 'Calendar sources', placeholder: 'Google Personal, Outlook Work', type: 'textarea' },
      { key: 'brief', label: 'Brief time', placeholder: '06:00', type: 'text' },
    ],
    mcpEndpoint: 'mcp://maggie.skills/calendar-mesh',
    version: '3.2.0',
    installedByDefault: true,
  },
  {
    id: 'grocery-runner',
    name: 'Grocery & Delivery Runner',
    category: 'automation',
    icon: 'ShoppingCart',
    summary: 'Parses lists into cart population and delivery-window reservation.',
    capabilities: [
      'Parse freeform or photographed grocery lists',
      'Match pantry staples to prior purchase SKUs',
      'Reserve the earliest window that clears your calendar',
    ],
    fields: [
      { key: 'store', label: 'Preferred store', placeholder: 'Whole Foods', type: 'text' },
      { key: 'window', label: 'Preferred window', placeholder: 'Sat 8–10 AM', type: 'text' },
    ],
    mcpEndpoint: 'mcp://maggie.skills/grocery-runner',
    version: '2.5.0',
    installedByDefault: true,
  },
  {
    id: 'tutor-coordinator',
    name: 'Tutor & Extracurricular Coordinator',
    category: 'school',
    icon: 'BookMarked',
    summary: 'Books tutors, tracks practice hours, and manages season signups.',
    capabilities: [
      'Season registration deadlines with reminders',
      'Practice-hour ledger per child',
      'Coach and tutor contact directory',
    ],
    fields: [
      { key: 'activity', label: 'Activity', placeholder: 'Club volleyball', type: 'text' },
      { key: 'cadence', label: 'Weekly cadence', placeholder: 'Tue/Thu 5–7pm', type: 'text' },
    ],
    mcpEndpoint: 'mcp://maggie.skills/tutor-coordinator',
    version: '1.0.6',
    installedByDefault: false,
  },
  {
    id: 'home-ops',
    name: 'Home Ops & Maintenance',
    category: 'household',
    icon: 'Wrench',
    summary: 'Seasonal maintenance, vendor dispatch, and warranty ledger.',
    capabilities: [
      'HVAC filter and gutter cadence reminders',
      'Vendor quotes side-by-side comparison',
      'Warranty and receipt archive',
    ],
    fields: [
      { key: 'home', label: 'Property label', placeholder: 'Main house', type: 'text' },
      { key: 'vendors', label: 'Preferred vendors', placeholder: 'Summit HVAC, Rossi Plumbing', type: 'textarea' },
    ],
    mcpEndpoint: 'mcp://maggie.skills/home-ops',
    version: '1.3.1',
    installedByDefault: false,
  },
];

export interface AgentStack {
  id: string;
  name: string;
  description: string;
  skillIds: string[];
  author: string;
  downloads: string;
}

export const AGENT_STACKS: AgentStack[] = [
  {
    id: 'stack-school-year',
    name: 'School Year Command Stack',
    description: 'Everything for August through May: calendars, tutors, appointments, bus runs.',
    skillIds: ['school-scheduler', 'tutor-coordinator', 'appointment-booker', 'calendar-mesh'],
    author: 'Maggie Labs',
    downloads: '12.4k',
  },
  {
    id: 'stack-toddler-ops',
    name: 'Toddler Ops Stack',
    description: 'Daycare ledgers, supply inventory, pediatric recalls, and grocery runs.',
    skillIds: ['daycare-tracker', 'appointment-booker', 'grocery-runner'],
    author: 'Maggie Labs',
    downloads: '8.1k',
  },
  {
    id: 'stack-holiday-host',
    name: 'Holiday Host Stack',
    description: 'Guest lists, gift budgets, meal sequencing, and delivery staging.',
    skillIds: ['holiday-planner', 'grocery-runner', 'quickbooks-ledger'],
    author: 'Community',
    downloads: '5.7k',
  },
  {
    id: 'stack-founder-mode',
    name: 'Founder Mode Stack',
    description: 'Books, calendars, and household ops so the company gets your best hours.',
    skillIds: ['quickbooks-ledger', 'calendar-mesh', 'home-ops'],
    author: 'Community',
    downloads: '3.2k',
  },
];

export const getSkill = (id: string) => AGENT_SKILLS.find((s) => s.id === id);
