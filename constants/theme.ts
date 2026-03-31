/**
 * BusinessHub Pro — Design System
 * Light and Dark themes.
 */

/**
 * 60 – 30 – 10 colour rule
 * ─────────────────────────
 * 60 %  Neutral base  →  background, card, secondary, muted
 * 30 %  Brand         →  brand / brandForeground / brandMuted  (deep forest green)
 * 10 %  CTA / accent  →  primary / primaryForeground           (rich amber)
 */
export const Colors = {
  light: {
    // ── 60 % Neutral base ──────────────────────────────────────────────────
    background: '#F7F9F7',          // off-white with slight green warmth
    foreground: '#0E1510',          // near-black with green undertone
    card: '#FFFFFF',
    cardForeground: '#0E1510',
    secondary: '#EEF2EE',           // very light surface
    secondaryForeground: '#1A2B1A',
    muted: '#E4EAE5',
    mutedForeground: '#6A7A6B',     // accessible grey-green
    accent: '#DDE8DE',
    accentForeground: '#1A2B1A',
    input: '#EEF2EE',
    border: '#D9E3DA',
    ring: '#A3BFA5',
    popover: '#FFFFFF',
    popoverForeground: '#0E1510',

    // ── 10 % CTA / action buttons ──────────────────────────────────────────
    primary: '#D97706',             // rich amber — every primary button/CTA
    primaryForeground: '#FFFFFF',

    // ── 30 % Brand (deep forest green) ────────────────────────────────────
    brand: '#2D6A4F',               // deep forest green
    brandForeground: '#FFFFFF',
    brandMuted: '#E0F0E8',          // very light green tint

    // ── Semantic ───────────────────────────────────────────────────────────
    destructive: '#DC2626',
    destructiveForeground: '#FFFFFF',
    success: '#16A34A',
    successForeground: '#FFFFFF',
    warning: '#F59E0B',
    warningForeground: '#000000',
    info: '#2563EB',
    infoForeground: '#FFFFFF',

    // ── Charts ─────────────────────────────────────────────────────────────
    chart1: '#2D6A4F',
    chart2: '#40916C',
    chart3: '#52B788',
    chart4: '#74C69D',
    chart5: '#B7E4C7',

    // ── Status ─────────────────────────────────────────────────────────────
    statusWaiting: '#D97706',
    statusInProgress: '#2563EB',
    statusCompleted: '#16A34A',
    statusCancelled: '#DC2626',
  },

  dark: {
    // ── 60 % Neutral base ──────────────────────────────────────────────────
    background: '#111614',          // deep dark with faint green undertone
    foreground: '#E8F0EA',          // near-white with green warmth
    card: '#1A211C',                // slightly lighter surface
    cardForeground: '#E8F0EA',
    secondary: '#232C25',           // surface-container-high
    secondaryForeground: '#C8D8CA',
    muted: '#1C2420',               // surface-container-low
    mutedForeground: '#8FA890',     // muted accessible text
    accent: '#2C3B2E',              // surface-container-highest
    accentForeground: '#C8D8CA',
    input: '#1C2420',
    border: '#2A3A2C',
    ring: '#52B788',
    popover: '#1A211C',
    popoverForeground: '#E8F0EA',

    // ── 10 % CTA / action buttons ──────────────────────────────────────────
    primary: '#F59E0B',             // amber (lighter for dark bg contrast)
    primaryForeground: '#1C1100',

    // ── 30 % Brand (sage green — readable on dark) ────────────────────────
    brand: '#52B788',               // sage/mint green
    brandForeground: '#071A11',
    brandMuted: '#112B1C',          // dark green tinted surface

    // ── Semantic ───────────────────────────────────────────────────────────
    destructive: '#FF8A80',
    destructiveForeground: '#690005',
    success: '#22C55E',
    successForeground: '#FFFFFF',
    warning: '#F59E0B',
    warningForeground: '#000000',
    info: '#60A5FA',
    infoForeground: '#FFFFFF',

    // ── Charts ─────────────────────────────────────────────────────────────
    chart1: '#B7E4C7',
    chart2: '#74C69D',
    chart3: '#52B788',
    chart4: '#40916C',
    chart5: '#2D6A4F',

    // ── Status ─────────────────────────────────────────────────────────────
    statusWaiting: '#F59E0B',
    statusInProgress: '#60A5FA',
    statusCompleted: '#22C55E',
    statusCancelled: '#FF8A80',
  },
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    extrabold: 'System',
    black: 'System',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  lineHeight: {
    none: 1,
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },
  letterSpacing: {
    tighter: -1,
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
};

// Spacing — Tailwind-compatible scale
export const Spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
};

// Border Radius — matching Stitch design spec (1rem = 16px base)
export const BorderRadius = {
  none: 0,
  sm: 6,
  md: 10,
  DEFAULT: 16,   // 1rem
  lg: 24,        // 1.5rem
  xl: 32,        // 2rem
  '2xl': 40,
  '3xl': 48,
  full: 9999,
};

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  DEFAULT: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  white: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const Animation = {
  fast: 150,
  normal: 300,
  slow: 500,
};

export type ColorScheme = 'light' | 'dark';
export type AppTheme = ColorScheme | null;   // null = follow system
export type ThemeColors = typeof Colors.light;
