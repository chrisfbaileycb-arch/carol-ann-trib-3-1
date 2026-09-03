import type { UserProfile } from './schemas';

export interface AestheticTheme {
  id: string;
  label: string;
  description: string;
  accent: string;
  accentSoft: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  texture: string;
  displayFont: string;
}

export const AESTHETIC_THEMES: AestheticTheme[] = [
  {
    id: 'midnight-lux',
    label: 'Midnight Lux',
    description: 'Deep charcoal, amethyst glow, gold-leaf edges.',
    accent: '#8B5FBF',
    accentSoft: '#E8A0BF',
    surface: '#1A1B23',
    surfaceAlt: '#22232D',
    ink: '#FAF8F5',
    texture: 'radial-gradient(circle at 15% 15%, rgba(139,95,191,0.22), transparent 45%), radial-gradient(circle at 85% 0%, rgba(232,160,191,0.16), transparent 40%)',
    displayFont: "'Playfair Display', serif",
  },
  {
    id: 'botanical',
    label: 'Botanical Atrium',
    description: 'Moss greens, warm ivory, pressed-leaf calm.',
    accent: '#4F8A5B',
    accentSoft: '#A7C4A0',
    surface: '#17201A',
    surfaceAlt: '#1F2A22',
    ink: '#F4F7F1',
    texture: 'radial-gradient(circle at 80% 20%, rgba(79,138,91,0.28), transparent 45%), radial-gradient(circle at 10% 80%, rgba(167,196,160,0.18), transparent 40%)',
    displayFont: "'Playfair Display', serif",
  },
  {
    id: 'anime-neon',
    label: 'Anime Neon',
    description: 'Cel-shaded cyan, hot magenta, night-city energy.',
    accent: '#22D3EE',
    accentSoft: '#F472B6',
    surface: '#0F1020',
    surfaceAlt: '#171A33',
    ink: '#F5F7FF',
    texture: 'linear-gradient(120deg, rgba(34,211,238,0.18) 0%, transparent 45%), radial-gradient(circle at 90% 90%, rgba(244,114,182,0.22), transparent 40%)',
    displayFont: "'Playfair Display', serif",
  },
  {
    id: 'y2k-retro',
    label: 'Y2K Retro',
    description: 'Chrome lilac, bubble gloss, early-web sparkle.',
    accent: '#A78BFA',
    accentSoft: '#7DD3FC',
    surface: '#14121F',
    surfaceAlt: '#1D1A2C',
    ink: '#FDF7FF',
    texture: 'linear-gradient(135deg, rgba(167,139,250,0.25), transparent 50%), radial-gradient(circle at 20% 90%, rgba(125,211,252,0.2), transparent 45%)',
    displayFont: "'Playfair Display', serif",
  },
  {
    id: 'minimalist-studio',
    label: 'Minimalist Studio',
    description: 'Warm ivory, graphite hairlines, gallery quiet.',
    accent: '#6B7280',
    accentSoft: '#B8AFA4',
    surface: '#1C1C1B',
    surfaceAlt: '#26262A',
    ink: '#FAF8F5',
    texture: 'linear-gradient(180deg, rgba(255,255,255,0.05), transparent 55%)',
    displayFont: "'Playfair Display', serif",
  },
  {
    id: 'sunset-terracotta',
    label: 'Sunset Terracotta',
    description: 'Clay, saffron, and desert-dusk warmth.',
    accent: '#E07A5F',
    accentSoft: '#F2CC8F',
    surface: '#201715',
    surfaceAlt: '#2B1F1C',
    ink: '#FDF6EF',
    texture: 'radial-gradient(circle at 20% 10%, rgba(224,122,95,0.28), transparent 45%), radial-gradient(circle at 90% 80%, rgba(242,204,143,0.18), transparent 40%)',
    displayFont: "'Playfair Display', serif",
  },
];

export const getTheme = (id: string): AestheticTheme =>
  AESTHETIC_THEMES.find((t) => t.id === id) ?? AESTHETIC_THEMES[0];

export const SPORTS_TEAMS = [
  'Denver Broncos',
  'Pittsburgh Steelers',
  'Kansas City Chiefs',
  'Dallas Cowboys',
  'Colorado Avalanche',
  'Denver Nuggets',
  'Philadelphia Eagles',
  'Green Bay Packers',
  'LA Lakers',
  'Boston Celtics',
];

export const INTEREST_OPTIONS = [
  'Strength Training',
  'Running',
  'Yoga & Mobility',
  'Nutrition & Meal Prep',
  'Faith & Scripture',
  'Gardening',
  'Software Architecture',
  'Interior Design',
  'Reading',
  'Travel Planning',
  'Family Logistics',
  'Finance & Budgeting',
];

export const ROUTINE_OPTIONS = [
  'Early riser — 5am start, gym before work',
  'Mid-morning momentum — deep work 9am–1pm',
  'Split day — school runs, then focus blocks',
  'Night owl — creative work after 8pm',
];

export const WELLNESS_GOALS = [
  'Build strength & lean muscle',
  'Improve sleep and recovery',
  'Lower stress, more stillness',
  'Consistent nutrition & hydration',
  'Return to movement after a break',
];

export const PROFESSIONAL_FOCUS = [
  'Software engineering & architecture',
  'Founder / operator',
  'Creative direction & design',
  'Healthcare & caregiving',
  'Household executive & family ops',
];

export const ACCENT_PALETTES = [
  { id: 'amethyst', label: 'Amethyst Rose', value: '#8B5FBF' },
  { id: 'rose', label: 'Rose Quartz', value: '#E8A0BF' },
  { id: 'gold', label: 'Gold Leaf', value: '#D9A441' },
  { id: 'jade', label: 'Jade', value: '#4F8A5B' },
  { id: 'cyan', label: 'Electric Cyan', value: '#22D3EE' },
  { id: 'clay', label: 'Terracotta', value: '#E07A5F' },
];

export interface IntakeStepMeta {
  id: string;
  title: string;
  subtitle: string;
}

export const INTAKE_STEPS: IntakeStepMeta[] = [
  { id: 'identity', title: 'Who is at the helm', subtitle: 'Your name and how you describe yourself right now.' },
  { id: 'rhythm', title: 'Your daily rhythm', subtitle: 'How your hours actually move so Maggie can move with them.' },
  { id: 'wellness', title: 'Body & wellness focus', subtitle: 'What your physical coach should optimize for.' },
  { id: 'work', title: 'Professional focus', subtitle: 'Where your technical and executive energy goes.' },
  { id: 'aesthetic', title: 'Aesthetic & culture', subtitle: 'The canvas re-skins itself from these choices.' },
  { id: 'sync', title: 'Sovereign sync', subtitle: 'Optional contact channel for cross-device continuity.' },
];

export const MUSIC_BAND_PRESETS = [
  { name: 'Fleetwood Mac', emoji: '✨', quote: 'Dreams / Rumours' },
  { name: 'Daft Punk', emoji: '🤖', quote: 'Discovery / Random Access' },
  { name: 'Tame Impala', emoji: '🌀', quote: 'Currents / Slow Rush' },
  { name: 'Deftones', emoji: '🌸', quote: 'White Pony / Koi No Yokan' },
  { name: 'Taylor Swift', emoji: '🪩', quote: 'Folklore / Midnights' },
  { name: 'Erykah Badu', emoji: '🕯️', quote: 'Baduizm / Mama\'s Gun' },
  { name: 'Sade', emoji: '🌹', quote: 'Love Deluxe / Diamond Life' },
  { name: 'Pink Floyd', emoji: '🌈', quote: 'Dark Side of the Moon' },
  { name: 'Radiohead', emoji: '📻', quote: 'In Rainbows / Kid A' },
  { name: 'Stevie Nicks', emoji: '🌙', quote: 'Bella Donna / Edge of Seventeen' },
  { name: 'The Cure', emoji: '🕷️', quote: 'Disintegration' },
  { name: 'Billie Eilish', emoji: '🕸️', quote: 'Hit Me Hard and Soft' },
];

export const FAITH_SYMBOLS = [
  { name: 'Celtic Cross', emoji: '✝️', label: 'Cross of Faith' },
  { name: 'Lotus Blossom', emoji: '🪷', label: 'Spiritual Purity' },
  { name: 'Star of David', emoji: '✡️', label: 'Magen David' },
  { name: 'Olive Branch', emoji: '🕊️', label: 'Peace & Solace' },
  { name: 'Sacred Heart', emoji: '❤️‍🔥', label: 'Devotion' },
  { name: 'Tree of Life', emoji: '🌳', label: 'Roots & Wisdom' },
  { name: 'Zen Stones', emoji: '🪨', label: 'Stillness & Focus' },
  { name: 'Serenity Flame', emoji: '🕯️', label: 'Inner Clarity' },
];

export const CULINARY_LIFESTYLE = [
  { name: 'Artisan Sourdough', emoji: '🍞', label: 'Fermentation & Hearth' },
  { name: 'Ceremonial Matcha', emoji: '🍵', label: 'Daily Mindful Ritual' },
  { name: 'Grass-Fed Ribeye', emoji: '🥩', label: 'High Protein / Iron' },
  { name: 'Cold Brew Nitro', emoji: '☕', label: 'Morning Clean Fuel' },
  { name: 'Herb Garden', emoji: '🌿', label: 'Rosemary & Basil' },
  { name: 'French Press', emoji: '🫖', label: 'Slow Roast Blend' },
  { name: 'Cast Iron Cooking', emoji: '🍳', label: 'Hearth & Iron' },
  { name: 'Hydration Electrolytes', emoji: '💧', label: 'Optimal Fluid Balance' },
];

export const RETRO_WATERMARKS = [
  { id: 'stk_broncos', label: 'Denver Broncos', emoji: '🐴', category: 'sports' as const, position: 'top-right' as const, opacity: 0.18, scale: 1.0, active: true },
  { id: 'stk_sparkle', label: 'Y2K Holographic Star', emoji: '✨', category: 'aesthetic' as const, position: 'header-accent' as const, opacity: 0.22, scale: 1.1, active: true },
  { id: 'stk_fleetwood', label: 'Fleetwood Mac', emoji: '🪩', category: 'music' as const, position: 'bottom-right' as const, opacity: 0.15, scale: 0.95, active: false },
  { id: 'stk_sourdough', label: 'Artisan Sourdough', emoji: '🍞', category: 'culinary' as const, position: 'top-left' as const, opacity: 0.14, scale: 0.9, active: false },
  { id: 'stk_olive', label: 'Olive Peace Branch', emoji: '🕊️', category: 'faith' as const, position: 'bottom-left' as const, opacity: 0.16, scale: 1.0, active: false },
];

export const WALLPAPER_PRESETS = [
  { id: 'nebula', label: 'Midnight Nebula', css: 'radial-gradient(ellipse at top left, rgba(139,95,191,0.25), transparent 60%), radial-gradient(ellipse at bottom right, rgba(232,160,191,0.18), transparent 50%)' },
  { id: 'matrix-grid', label: 'Sovereign Grid', css: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)' },
  { id: 'botanical-mist', label: 'Moss Atrium', css: 'radial-gradient(circle at 80% 20%, rgba(79,138,91,0.25), transparent 50%), radial-gradient(circle at 20% 80%, rgba(167,196,160,0.15), transparent 45%)' },
  { id: 'cyber-glow', label: 'Cyber Sunset', css: 'radial-gradient(circle at 10% 20%, rgba(34,211,238,0.2), transparent 50%), radial-gradient(circle at 90% 80%, rgba(244,114,182,0.22), transparent 45%)' },
  { id: 'minimal-noir', label: 'Minimal Studio Dark', css: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 60%)' },
];

export const DEFAULT_PROFILE: UserProfile = {
  id: 'local-user',
  name: '',
  identity: '',
  theme: 'midnight-lux',
  sportsTeams: ['Denver Broncos'],
  favoriteMusic: ['Fleetwood Mac'],
  faithSymbols: ['Olive Branch'],
  culinaryInterests: ['Ceremonial Matcha', 'Artisan Sourdough'],
  profileSong: 'Fleetwood Mac — Dreams',
  profileQuote: 'Sovereignty, strength, and grounded intention.',
  wallpaperPreset: 'nebula',
  aesthetic: 'Midnight Lux',
  accentColor: '#8B5FBF',
  interests: ['Strength Training', 'Software Architecture'],
  routine: 'Early riser — 5am start, gym before work',
  wellnessGoal: 'Build strength & lean muscle',
  professionalFocus: 'Software engineering & architecture',
  affirmation: 'Focused, intentional, and strong every single day.',
  onboarded: false,
  created_at: new Date().toISOString(),
};
