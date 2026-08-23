import type { DomainId } from './schemas';

export interface DomainMeta {
  id: DomainId;
  label: string;
  tagline: string;
  icon: string;
  color: string;
  quickPrompts: string[];
}

export const COMPANION_DOMAINS: DomainMeta[] = [
  {
    id: 'core',
    label: 'Maggie Core',
    tagline: 'Life, thoughts, reflections, and daily grounding.',
    icon: 'Sparkles',
    color: '#8B5FBF',
    quickPrompts: ['Daily focus check-in', 'Evening reflection', 'Mindset reset'],
  },
  {
    id: 'gym',
    label: 'Gym & Physical Coach',
    tagline: 'Split tracking, rep cadence, and live camera form coaching.',
    icon: 'Activity',
    color: '#EF4444',
    quickPrompts: ["What's my split today?", 'Start workout timer', 'Log upper body set'],
  },
  {
    id: 'errands',
    label: 'Autonomous Dispatcher',
    tagline: 'Cloud browser automation for delivery, reorders, and pickups.',
    icon: 'ShoppingBag',
    color: '#F59E0B',
    quickPrompts: ['Order Whole Foods essentials', 'Schedule dry cleaning pickup', 'Reorder protein'],
  },
  {
    id: 'family',
    label: 'Family & Life Skills',
    tagline: 'School runs, daycare ledgers, holidays, and appointments.',
    icon: 'Users',
    color: '#E8A0BF',
    quickPrompts: ['Sync school calendar', 'Log daycare pickup', 'Plan holiday budget'],
  },
  {
    id: 'kitchen',
    label: 'Kitchen & Nutrition',
    tagline: 'Healthy recipes, ingredient scaling, and prep timing.',
    icon: 'Utensils',
    color: '#10B981',
    quickPrompts: ['Quick high-protein dinner', 'Pantry substitutions', 'Meal prep plan'],
  },
  {
    id: 'faith',
    label: 'Faith & Contemplation',
    tagline: 'Scriptural studies, prayer journal, and quiet meditation.',
    icon: 'BookOpen',
    color: '#D97706',
    quickPrompts: ['Scripture reading', 'Add to prayer list', 'Evening gratitude'],
  },
  {
    id: 'code',
    label: 'Code & Architecture',
    tagline: 'Technical scratchpad, MCP agent pipelines, and debugging.',
    icon: 'Code2',
    color: '#3B82F6',
    quickPrompts: ['Architecture review', 'Debug snippet', 'MCP skill builder'],
  },
  {
    id: 'garden',
    label: 'Garden & Home',
    tagline: 'Seasonal planting, watering cadence, and home upkeep.',
    icon: 'Leaf',
    color: '#65A30D',
    quickPrompts: ['This week in the garden', 'Watering schedule', 'Home maintenance list'],
  },
];

export const DOMAIN_MAP: Record<string, DomainMeta> = COMPANION_DOMAINS.reduce(
  (acc, d) => ({ ...acc, [d.id]: d }),
  {} as Record<string, DomainMeta>,
);

export const getDomain = (id: string): DomainMeta => DOMAIN_MAP[id] ?? COMPANION_DOMAINS[0];
