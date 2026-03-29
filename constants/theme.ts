/**
 * BusinessHub Pro — Design System
 * Light and Dark themes.
 */

export const Colors = {
  light: {
    background: '#FFFFFF',
    foreground: '#0a0a0a',
    primary: '#000000',
    primaryForeground: '#FFFFFF',
    secondary: '#F5F5F5',
    secondaryForeground: '#0a0a0a',
    muted: '#F0F0F0',
    mutedForeground: '#737373',
    accent: '#E5E5E5',
    accentForeground: '#0a0a0a',
    destructive: '#DC2626',
    destructiveForeground: '#FFFFFF',
    success: '#16A34A',
    successForeground: '#FFFFFF',
    warning: '#F59E0B',
    warningForeground: '#000000',
    info: '#3B82F6',
    infoForeground: '#FFFFFF',
    border: '#E5E5E5',
    input: '#F5F5F5',
    ring: '#A3A3A3',
    card: '#FFFFFF',
    cardForeground: '#0a0a0a',
    popover: '#FFFFFF',
    popoverForeground: '#0a0a0a',
    chart1: '#404040',
    chart2: '#5C5C5C',
    chart3: '#787878',
    chart4: '#949494',
    chart5: '#B0B0B0',
    statusWaiting: '#F59E0B',
    statusInProgress: '#3B82F6',
    statusCompleted: '#16A34A',
    statusCancelled: '#DC2626',
  },

  dark: {
    // Surfaces — from Stitch design token spec
    background: '#131313',          // surface / surface-dim
    foreground: '#e2e2e2',          // on-surface
    primary: '#ffffff',             // primary (white)
    primaryForeground: '#1a1c1c',   // on-primary (near-black)
    secondary: '#2a2a2a',           // surface-container-high
    secondaryForeground: '#e2e2e2',
    muted: '#1b1b1b',               // surface-container-low
    mutedForeground: '#c6c6c6',     // on-surface-variant
    accent: '#353535',              // surface-container-highest
    accentForeground: '#e2e2e2',
    destructive: '#ffb4ab',         // error
    destructiveForeground: '#690005',
    success: '#22c55e',
    successForeground: '#FFFFFF',
    warning: '#F59E0B',
    warningForeground: '#000000',
    info: '#3B82F6',
    infoForeground: '#FFFFFF',
    border: '#2e2e2e',              // subtle border
    input: '#1b1b1b',
    ring: '#919191',
    card: '#1f1f1f',                // surface-container
    cardForeground: '#e2e2e2',
    popover: '#1f1f1f',
    popoverForeground: '#e2e2e2',
    chart1: '#B0B0B0',
    chart2: '#949494',
    chart3: '#787878',
    chart4: '#5C5C5C',
    chart5: '#404040',
    statusWaiting: '#F59E0B',
    statusInProgress: '#3B82F6',
    statusCompleted: '#22c55e',
    statusCancelled: '#ffb4ab',
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
