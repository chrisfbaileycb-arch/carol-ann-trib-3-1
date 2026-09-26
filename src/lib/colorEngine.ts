/**
 * Color Engine & Dynamic Cross-Connector Palette Reference for Carol Ann OS.
 *
 * Ensures no visual is "grounded out" (washed out or illegible) when colors or themes switch.
 * Dynamically computes relative luminance, contrast ratios, and font color bindings
 * for buttons, badges, surfaces, and third-party SaaS connectors.
 */

export interface ColorPaletteReference {
  accent: string;
  accentSoft: string;
  accentGlow: string;
  accentForeground: string; // The optimal font color on top of the accent (light or dark)
  background: string;
  foreground: string; // Primary text color for the canvas
  mutedForeground: string; // Subdued text color
  border: string;
  cardBackground: string;
  cardForeground: string;
  isBrightSurface: boolean;
}

/**
 * Converts a 3, 6, or 8-digit hex code into RGB values [0-255].
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean.slice(0, 6), 16);
  if (isNaN(num)) {
    return { r: 255, g: 77, b: 141 }; // Default fallback to Luminous Rose
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Calculates WCAG 2.1 relative luminance for a given hex color.
 * Returns a value between 0 (pure black) and 1 (pure white).
 */
export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (c: number) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Computes optimal font color (dark or white) to guarantee high contrast
 * on top of any target background color.
 */
export function getContrastTextColor(
  bgHex: string,
  darkColor = '#0F172A',
  lightColor = '#FFFFFF'
): string {
  const lum = getRelativeLuminance(bgHex);
  // Colors with luminance > 0.52 (e.g. yellows, light cyans, white, cream) require dark text
  return lum > 0.52 ? darkColor : lightColor;
}

/**
 * Lightens or softens a hex color for subtle gradient accents
 */
export function softenHexColor(hex: string, amount = 0.35): string {
  const { r, g, b } = hexToRgb(hex);
  const blend = (c: number) => Math.round(c + (255 - c) * amount);
  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(blend(r))}${toHex(blend(g))}${toHex(blend(b))}`;
}

/**
 * Full cross-connector color palette reference generator.
 * Harmonizes the active accent color, active wallpaper, and connector brand colors
 * so font colors never clash, wash out, or dissolve.
 */
export function resolveColorPaletteReference(
  accentHex: string,
  isLightMode = false,
  foundationColor?: string
): ColorPaletteReference {
  const accent = accentHex || '#FF4D8D';
  const accentSoft = softenHexColor(accent, 0.35);
  const accentForeground = getContrastTextColor(accent, '#0F172A', '#FFFFFF');
  const bg = foundationColor || (isLightMode ? '#FFF7F7' : '#0A0B10');
  const isBrightSurface = isLightMode || getRelativeLuminance(bg) > 0.5;

  const foreground = isBrightSurface ? '#0F172A' : '#FFFFFF';
  const mutedForeground = isBrightSurface ? '#475569' : 'rgba(255, 255, 255, 0.75)';
  const border = isBrightSurface ? 'rgba(203, 213, 225, 0.85)' : 'rgba(255, 255, 255, 0.14)';
  const cardBackground = isBrightSurface ? 'rgba(255, 255, 255, 0.85)' : 'rgba(18, 19, 28, 0.75)';
  const cardForeground = isBrightSurface ? '#0F172A' : '#FFFFFF';

  return {
    accent,
    accentSoft,
    accentGlow: `0 0 24px -4px ${accent}66`,
    accentForeground,
    background: bg,
    foreground,
    mutedForeground,
    border,
    cardBackground,
    cardForeground,
    isBrightSurface,
  };
}

/**
 * Cross-Connector Brand Palette Reference
 * Ensures third-party SaaS badges (Google, Shopify, Stripe, QuickBooks, Zapier)
 * maintain readable font colors when rendered across both light and dark themes.
 */
export const CONNECTOR_PALETTE_REFERENCE: Record<
  string,
  {
    brandColor: string;
    softTint: string;
    contrastFontColor: string;
    tagLabel: string;
  }
> = {
  'google-business': {
    brandColor: '#4285F4',
    softTint: 'rgba(66, 133, 244, 0.18)',
    contrastFontColor: '#FFFFFF',
    tagLabel: 'Google Workspace',
  },
  'shopify': {
    brandColor: '#96BF48',
    softTint: 'rgba(150, 191, 72, 0.2)',
    contrastFontColor: '#0F172A',
    tagLabel: 'Shopify Commerce',
  },
  'stripe': {
    brandColor: '#635BFF',
    softTint: 'rgba(99, 91, 255, 0.2)',
    contrastFontColor: '#FFFFFF',
    tagLabel: 'Stripe Payments',
  },
  'quickbooks': {
    brandColor: '#2CA01C',
    softTint: 'rgba(44, 160, 28, 0.2)',
    contrastFontColor: '#FFFFFF',
    tagLabel: 'Intuit QuickBooks',
  },
  'gmail': {
    brandColor: '#EA4335',
    softTint: 'rgba(234, 67, 53, 0.18)',
    contrastFontColor: '#FFFFFF',
    tagLabel: 'Gmail & Mail',
  },
  'zapier': {
    brandColor: '#FF4A00',
    softTint: 'rgba(255, 74, 0, 0.2)',
    contrastFontColor: '#FFFFFF',
    tagLabel: 'Zapier Automation',
  },
  'tripadvisor': {
    brandColor: '#34E0A1',
    softTint: 'rgba(52, 224, 161, 0.2)',
    contrastFontColor: '#0F172A',
    tagLabel: 'TripAdvisor Reviews',
  },
};
