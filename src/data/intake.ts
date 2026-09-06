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
    id: 'luminous-rose',
    label: 'Luminous Rose',
    description: 'Pitch black foundation, glowing soft rose blush, radiant coral aura.',
    accent: '#FF4D8D',
    accentSoft: '#FF94BF',
    surface: '#000000',
    surfaceAlt: '#0A0A0F',
    ink: '#FFFFFF',
    texture: 'radial-gradient(circle at 15% 15%, rgba(255,77,141,0.22), transparent 50%), radial-gradient(circle at 85% 5%, rgba(255,148,191,0.18), transparent 45%)',
    displayFont: "'Outfit', sans-serif",
  },
  {
    id: 'electric-lavender',
    label: 'Electric Lavender',
    description: 'Pure black base, radiant electric violet, soothing luminous lilac.',
    accent: '#A855F7',
    accentSoft: '#D8B4FE',
    surface: '#000000',
    surfaceAlt: '#08080E',
    ink: '#FFFFFF',
    texture: 'radial-gradient(circle at 85% 15%, rgba(168,85,247,0.24), transparent 50%), radial-gradient(circle at 15% 85%, rgba(216,180,254,0.18), transparent 45%)',
    displayFont: "'Outfit', sans-serif",
  },
  {
    id: 'radiant-cyan',
    label: 'Aurora Cyan & Sky',
    description: 'Obsidian black, electric cyan luminescence, soft celestial seafoam.',
    accent: '#06B6D4',
    accentSoft: '#67E8F9',
    surface: '#000000',
    surfaceAlt: '#070A0F',
    ink: '#FFFFFF',
    texture: 'radial-gradient(circle at 20% 20%, rgba(6,182,212,0.22), transparent 50%), radial-gradient(circle at 80% 80%, rgba(103,232,249,0.16), transparent 45%)',
    displayFont: "'Space Grotesk', sans-serif",
  },
  {
    id: 'peach-sunrise',
    label: 'Peach & Honey Warmth',
    description: 'Deep black, comforting golden apricot glow, radiant warm amber sunrise.',
    accent: '#FB923C',
    accentSoft: '#FDE047',
    surface: '#000000',
    surfaceAlt: '#0C0806',
    ink: '#FFFFFF',
    texture: 'radial-gradient(circle at 25% 15%, rgba(251,146,60,0.24), transparent 50%), radial-gradient(circle at 85% 85%, rgba(253,224,71,0.16), transparent 45%)',
    displayFont: "'Outfit', sans-serif",
  },
  {
    id: 'emerald-oasis',
    label: 'Emerald Mint Oasis',
    description: 'Pure black, vibrant emerald radiance, soft comforting mint leaf calm.',
    accent: '#10B981',
    accentSoft: '#6EE7B7',
    surface: '#000000',
    surfaceAlt: '#060B08',
    ink: '#FFFFFF',
    texture: 'radial-gradient(circle at 80% 20%, rgba(16,185,129,0.22), transparent 50%), radial-gradient(circle at 15% 80%, rgba(110,231,183,0.18), transparent 45%)',
    displayFont: "'Outfit', sans-serif",
  },
  {
    id: 'sunbeam-gold',
    label: 'Sunbeam Honey Gold',
    description: 'Jet black, bright sunlit gold radiance, joyful warm honey glow.',
    accent: '#FBBF24',
    accentSoft: '#FEF08A',
    surface: '#000000',
    surfaceAlt: '#0C0A05',
    ink: '#FFFFFF',
    texture: 'radial-gradient(circle at 50% 10%, rgba(251,191,36,0.22), transparent 55%), radial-gradient(circle at 90% 90%, rgba(254,240,138,0.14), transparent 45%)',
    displayFont: "'Outfit', sans-serif",
  },
  {
    id: 'midnight-lux',
    label: 'Midnight Amethyst',
    description: 'Deep obsidian black, royal amethyst glow, bright soft rose edges.',
    accent: '#9333EA',
    accentSoft: '#F472B6',
    surface: '#000000',
    surfaceAlt: '#0A0812',
    ink: '#FFFFFF',
    texture: 'radial-gradient(circle at 15% 15%, rgba(147,51,234,0.22), transparent 45%), radial-gradient(circle at 85% 0%, rgba(244,114,182,0.18), transparent 40%)',
    displayFont: "'Playfair Display', serif",
  },
  {
    id: 'minimalist-obsidian',
    label: 'Obsidian Noir Titanium',
    description: 'Pure obsidian black, crisp luminous white typography, clean silver glow.',
    accent: '#E2E8F0',
    accentSoft: '#94A3B8',
    surface: '#000000',
    surfaceAlt: '#0A0A0C',
    ink: '#FFFFFF',
    texture: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 60%)',
    displayFont: "'Space Grotesk', sans-serif",
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
  { id: 'rhythm', title: 'Your daily rhythm', subtitle: 'How your hours actually move so Carol can move with them.' },
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

export interface WallpaperPreset {
  id: string;
  label: string;
  category: 'floral' | 'pastel' | 'light' | 'radiant' | 'cosmic' | 'warmth' | 'nature' | 'minimal' | 'custom';
  description: string;
  glowColor: string;
  pattern: 'none' | 'aurora' | 'starlight' | 'mesh' | 'bloom' | 'grid' | 'dots' | 'waves';
  glowIntensity: number;
  css: string;
  mood: 'light' | 'pastel' | 'warm-dark' | 'oled-black';
  foundationColor: string;
  textColorScheme: 'dark' | 'light';
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  // Curated Light & Pastel Presets
  {
    id: 'blush-peony',
    label: 'Blush Peony & Cream',
    category: 'floral',
    description: 'Soft rose blush, warm ivory linen, delicate floral gradients, and luminous feminine warmth.',
    glowColor: '#FDA4AF',
    pattern: 'bloom',
    glowIntensity: 0.45,
    mood: 'pastel',
    foundationColor: '#FFF5F5',
    textColorScheme: 'dark',
    css: 'radial-gradient(ellipse at 12% 15%, rgba(254, 205, 211, 0.78), transparent 52%), radial-gradient(ellipse at 88% 20%, rgba(253, 164, 175, 0.62), transparent 48%), radial-gradient(circle at 50% 85%, rgba(255, 228, 230, 0.85), transparent 60%), linear-gradient(135deg, #FFF1F2 0%, #FFFDFD 50%, #FFE4E6 100%)',
  },
  {
    id: 'lavender-mist',
    label: 'Lavender Mist',
    category: 'pastel',
    description: 'Calming pastel lilac, soft wisteria glow, ethereal silver accents, and serene twilight radiance.',
    glowColor: '#D8B4FE',
    pattern: 'aurora',
    glowIntensity: 0.45,
    mood: 'pastel',
    foundationColor: '#F8F5FF',
    textColorScheme: 'dark',
    css: 'radial-gradient(ellipse at 85% 15%, rgba(216, 180, 254, 0.72), transparent 52%), radial-gradient(ellipse at 15% 85%, rgba(233, 213, 255, 0.65), transparent 50%), radial-gradient(circle at 50% 45%, rgba(192, 132, 252, 0.3), transparent 60%), linear-gradient(135deg, #FAF5FF 0%, #F5F3FF 50%, #EDE9FE 100%)',
  },
  {
    id: 'sage-gardenia',
    label: 'Sage & Gardenia',
    category: 'nature',
    description: 'Fresh botanical sage green, light eucalyptus, botanical leaf motifs, and crisp morning dew.',
    glowColor: '#86EFAC',
    pattern: 'waves',
    glowIntensity: 0.45,
    mood: 'light',
    foundationColor: '#F2F8F4',
    textColorScheme: 'dark',
    css: 'radial-gradient(ellipse at 18% 18%, rgba(187, 247, 208, 0.75), transparent 50%), radial-gradient(ellipse at 82% 82%, rgba(167, 243, 208, 0.65), transparent 48%), radial-gradient(circle at 60% 28%, rgba(134, 239, 172, 0.35), transparent 55%), linear-gradient(135deg, #F0FDF4 0%, #F4F9F5 50%, #DCFCE7 100%)',
  },
  {
    id: 'sunlit-champagne',
    label: 'Sunlit Champagne',
    category: 'warmth',
    description: 'Warm buttercup cream, champagne glow, soft peach highlights, and radiant afternoon warmth.',
    glowColor: '#FDE047',
    pattern: 'bloom',
    glowIntensity: 0.45,
    mood: 'light',
    foundationColor: '#FFFDF2',
    textColorScheme: 'dark',
    css: 'radial-gradient(ellipse at 15% 25%, rgba(254, 240, 138, 0.72), transparent 52%), radial-gradient(ellipse at 85% 75%, rgba(254, 215, 170, 0.68), transparent 50%), radial-gradient(circle at 50% 20%, rgba(253, 230, 138, 0.42), transparent 55%), linear-gradient(135deg, #FEFCE8 0%, #FFFBEB 50%, #FEF3C7 100%)',
  },
  {
    id: 'classic-noir',
    label: 'Classic Noir',
    category: 'minimal',
    description: 'Pure OLED pitch-black foundation with refined hairline borders, ultra-high contrast, and obsidian elegance.',
    glowColor: '#FFFFFF',
    pattern: 'none',
    glowIntensity: 0.08,
    mood: 'oled-black',
    foundationColor: '#000000',
    textColorScheme: 'light',
    css: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 60%)',
  },

  // Atmospheric Dark & Cosmic Presets
  {
    id: 'aurora',
    label: 'Aurora Borealis',
    category: 'radiant',
    description: 'Pitch black with luminous ribbons of bright cyan, emerald, and radiant orchid aura.',
    glowColor: '#00F0FF',
    pattern: 'aurora',
    glowIntensity: 0.28,
    mood: 'warm-dark',
    foundationColor: '#0A0B10',
    textColorScheme: 'light',
    css: 'radial-gradient(ellipse at 15% 20%, rgba(0, 240, 255, 0.26), transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(217, 70, 239, 0.22), transparent 50%), radial-gradient(ellipse at 50% 85%, rgba(16, 185, 129, 0.2), transparent 55%)',
  },
  {
    id: 'starlight',
    label: 'Velvet Starlight',
    category: 'cosmic',
    description: 'Deep obsidian black with soft cosmic stardust, celestial violet dusk, and faint rose nebulae.',
    glowColor: '#A855F7',
    pattern: 'starlight',
    glowIntensity: 0.24,
    mood: 'warm-dark',
    foundationColor: '#0A0B10',
    textColorScheme: 'light',
    css: 'radial-gradient(circle at 75% 25%, rgba(168, 85, 247, 0.25), transparent 50%), radial-gradient(circle at 25% 75%, rgba(244, 114, 182, 0.2), transparent 45%), radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.14), transparent 60%)',
  },
  {
    id: 'peach-sunrise',
    label: 'Peach & Honey Sunrise',
    category: 'warmth',
    description: 'Cozy pitch black base with comforting golden apricot, bright coral, and warm honey ambient light.',
    glowColor: '#FB923C',
    pattern: 'bloom',
    glowIntensity: 0.28,
    mood: 'warm-dark',
    foundationColor: '#0A0B10',
    textColorScheme: 'light',
    css: 'radial-gradient(circle at 20% 20%, rgba(251, 146, 60, 0.28), transparent 50%), radial-gradient(circle at 80% 80%, rgba(253, 224, 71, 0.2), transparent 45%), radial-gradient(circle at 80% 20%, rgba(244, 63, 94, 0.16), transparent 40%)',
  },
  {
    id: 'electric-lilac',
    label: 'Electric Lilac Bloom',
    category: 'radiant',
    description: 'Pure black canvas with glowing soft lavender backlights and vibrant amethyst bloom.',
    glowColor: '#C084FC',
    pattern: 'bloom',
    glowIntensity: 0.3,
    mood: 'warm-dark',
    foundationColor: '#0A0B10',
    textColorScheme: 'light',
    css: 'radial-gradient(circle at 80% 20%, rgba(192, 132, 252, 0.28), transparent 50%), radial-gradient(circle at 20% 80%, rgba(244, 114, 182, 0.24), transparent 45%)',
  },
  {
    id: 'spring-blossom',
    label: 'Spring Sakura Blossom',
    category: 'warmth',
    description: 'Obsidian black with soft radiant blush petals, champagne gold shimmer, and gentle rose radiance.',
    glowColor: '#FF4D8D',
    pattern: 'waves',
    glowIntensity: 0.26,
    mood: 'warm-dark',
    foundationColor: '#0A0B10',
    textColorScheme: 'light',
    css: 'radial-gradient(circle at 30% 15%, rgba(255, 77, 141, 0.25), transparent 50%), radial-gradient(circle at 85% 75%, rgba(254, 215, 170, 0.2), transparent 45%)',
  },
  {
    id: 'cyber-glow',
    label: 'Cyber Neon Bloom',
    category: 'radiant',
    description: 'Pure black with luminous electric cyan backlight, magenta edge glow, and modern cyber vibrance.',
    glowColor: '#22D3EE',
    pattern: 'grid',
    glowIntensity: 0.25,
    mood: 'warm-dark',
    foundationColor: '#0A0B10',
    textColorScheme: 'light',
    css: 'radial-gradient(circle at 10% 20%, rgba(34, 211, 238, 0.26), transparent 50%), radial-gradient(circle at 90% 80%, rgba(244, 114, 182, 0.24), transparent 45%)',
  },
  {
    id: 'solar-flare',
    label: 'Solar Sunbeam',
    category: 'warmth',
    description: 'Pitch black with joyful radiant warm honey sunbeams, amber glow, and sunny optimism.',
    glowColor: '#FBBF24',
    pattern: 'bloom',
    glowIntensity: 0.28,
    mood: 'warm-dark',
    foundationColor: '#0A0B10',
    textColorScheme: 'light',
    css: 'radial-gradient(circle at 50% 15%, rgba(251, 191, 36, 0.28), transparent 55%), radial-gradient(circle at 80% 85%, rgba(249, 115, 22, 0.2), transparent 45%)',
  },
  {
    id: 'mint-oasis',
    label: 'Mint Eucalyptus Oasis',
    category: 'nature',
    description: 'Pure black with crisp refreshing jade luminescence, spearmint leaf glow, and botanical tranquility.',
    glowColor: '#10B981',
    pattern: 'dots',
    glowIntensity: 0.24,
    mood: 'warm-dark',
    foundationColor: '#0A0B10',
    textColorScheme: 'light',
    css: 'radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.26), transparent 50%), radial-gradient(circle at 20% 80%, rgba(110, 231, 183, 0.2), transparent 45%)',
  },
  {
    id: 'matrix-grid',
    label: 'Sovereign Luminous Grid',
    category: 'minimal',
    description: 'Pure black with delicate luminous hairline grid, soft white focal bloom, and precision craft.',
    glowColor: '#38BDF8',
    pattern: 'grid',
    glowIntensity: 0.2,
    mood: 'warm-dark',
    foundationColor: '#0A0B10',
    textColorScheme: 'light',
    css: 'radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.2), transparent 55%)',
  },
  {
    id: 'minimal-noir',
    label: 'Minimalist Obsidian',
    category: 'minimal',
    description: 'Ultra-clean pitch black with subtle luminous border highlights and maximum contrast focus.',
    glowColor: '#FFFFFF',
    pattern: 'none',
    glowIntensity: 0.12,
    mood: 'oled-black',
    foundationColor: '#000000',
    textColorScheme: 'light',
    css: 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, transparent 60%)',
  },
];

/**
 * Returns true if the active profile or wallpaper is configured for a light or pastel aesthetic.
 */
export function isLightTheme(profile?: Partial<UserProfile> | null): boolean {
  if (!profile) return false;
  if (profile.themeMode === 'light' || profile.themeMode === 'pastel') return true;
  if (profile.themeMode === 'warm-dark' || profile.themeMode === 'oled-black') return false;
  const preset = WALLPAPER_PRESETS.find((w) => w.id === profile.wallpaperPreset);
  if (preset) {
    return preset.textColorScheme === 'dark' || preset.mood === 'light' || preset.mood === 'pastel';
  }
  return false;
}

export interface FontOption {
  id: string;
  name: string;
  displayFont: string;
  bodyFont: string;
  description: string;
  sample: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'soft-rounded',
    name: 'Soft & Comfortable',
    displayFont: "'Outfit', 'Plus Jakarta Sans', sans-serif",
    bodyFont: "'Outfit', 'Plus Jakarta Sans', sans-serif",
    description: 'Modern, soft rounded curves. Friendly, cozy, inviting, and super comfortable to read.',
    sample: 'Warm, intuitive & personalized lifestyle space',
  },
  {
    id: 'editorial-chic',
    name: 'Editorial Luxury',
    displayFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'Plus Jakarta Sans', Inter, sans-serif",
    description: 'High-fashion editorial elegance with classical serif display and clean body typography.',
    sample: 'Carol Ann Sovereign Intelligence & Care',
  },
  {
    id: 'modern-sans',
    name: 'Clean Modern Tech',
    displayFont: "'Space Grotesk', sans-serif",
    bodyFont: "'Inter', sans-serif",
    description: 'Contemporary tech-forward precision with architectural neo-grotesque letterforms.',
    sample: 'Deterministic Cloud Agent Native Core',
  },
  {
    id: 'timeless-classic',
    name: 'Timeless Roman Classic',
    displayFont: "'Cinzel', Georgia, serif",
    bodyFont: "'Plus Jakarta Sans', sans-serif",
    description: 'Sophisticated Roman proportions with graceful, commanding presence.',
    sample: 'Executive Command & Sovereign Living',
  },
  {
    id: 'craft-mono',
    name: 'Studio Monospace Craft',
    displayFont: "'JetBrains Mono', monospace",
    bodyFont: "'JetBrains Mono', monospace",
    description: 'Crisp code-craft monospace for an authentic developer studio feel.',
    sample: 'carol.orchestrate(cloud_agents)',
  },
];

export const BRIGHT_ACCENTS = [
  { label: 'Luminous Rose', hex: '#FF4D8D', glow: '#FF8EB8' },
  { label: 'Electric Lavender', hex: '#A855F7', glow: '#D8B4FE' },
  { label: 'Radiant Sky', hex: '#38BDF8', glow: '#7DD3FC' },
  { label: 'Coral Peach', hex: '#FB923C', glow: '#FDE047' },
  { label: 'Bright Mint', hex: '#10B981', glow: '#6EE7B7' },
  { label: 'Honey Gold', hex: '#FBBF24', glow: '#FEF08A' },
  { label: 'Vivid Orchid', hex: '#F472B6', glow: '#F9A8D4' },
  { label: 'Electric Cyan', hex: '#06B6D4', glow: '#67E8F9' },
  { label: 'Titanium White', hex: '#F8FAFC', glow: '#E2E8F0' },
];

export const CARD_BRIGHTNESS_OPTIONS = [
  {
    id: 'soft' as const,
    label: 'Comfortable Soft',
    description: 'Subtle translucent surfaces with smooth diffused glow edges. Easy on the eyes.',
    bgClass: 'bg-white/[0.035] backdrop-blur-md border-white/8',
  },
  {
    id: 'bright' as const,
    label: 'Radiant Luminous',
    description: 'Brighter card surfaces with crisp luminous border highlights and high contrast.',
    bgClass: 'bg-white/[0.07] backdrop-blur-xl border-white/14 shadow-[0_4px_24px_rgba(0,0,0,0.45)]',
  },
  {
    id: 'luminous' as const,
    label: 'Glass Glow',
    description: 'Vibrant frosted glass with glowing accent rim illumination and luminous reflections.',
    bgClass: 'bg-white/[0.09] backdrop-blur-2xl border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)]',
  },
];

export const DEFAULT_PROFILE: UserProfile = {
  id: 'local-user',
  name: '',
  identity: '',
  theme: 'luminous-rose',
  themeMode: 'warm-dark',
  sportsTeams: ['Denver Broncos'],
  favoriteMusic: ['Fleetwood Mac'],
  faithSymbols: ['Olive Branch'],
  culinaryInterests: ['Ceremonial Matcha', 'Artisan Sourdough'],
  profileSong: 'Fleetwood Mac — Dreams',
  profileQuote: 'Sovereignty, strength, and grounded intention.',
  wallpaperPreset: 'aurora',
  wallpaperGlowColor: '#00F0FF',
  wallpaperIntensity: 0.28,
  wallpaperPattern: 'aurora',
  fontFamily: 'soft-rounded',
  fontDisplay: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  cardBrightness: 'bright',
  aesthetic: 'Luminous Rose',
  accentColor: '#FF4D8D',
  interests: ['Strength Training', 'Software Architecture'],
  routine: 'Early riser — 5am start, gym before work',
  wellnessGoal: 'Build strength & lean muscle',
  professionalFocus: 'Software engineering & architecture',
  affirmation: 'Focused, intentional, and strong every single day.',
  onboarded: false,
  created_at: new Date().toISOString(),
};
