/**
 * BusinessHub Pro Theme Configuration
 * Matching the dashboard's black/white theme using similar color values
 * Converted from OKLCH to HEX for React Native compatibility
 */

export const Colors = {
  light: {
    // Core colors - matching dashboard's neutral black/white theme
    background: '#FFFFFF',        // oklch(1 0 0) - Pure White
    foreground: '#242424',        // oklch(0.145 0 0) - Near Black

    // Primary - Dark gray/black for main actions
    primary: '#1A1A1A',           // oklch(0.205 0 0) - Dark Gray/Black
    primaryForeground: '#FCFCFC', // oklch(0.985 0 0) - Off-White

    // Secondary - Light gray for secondary elements
    secondary: '#F7F7F7',         // oklch(0.97 0 0) - Very Light Gray
    secondaryForeground: '#1A1A1A', // oklch(0.205 0 0)

    // Muted - For less prominent elements
    muted: '#F7F7F7',             // oklch(0.97 0 0)
    mutedForeground: '#737373',   // oklch(0.556 0 0) - Medium Gray

    // Accent - Same as secondary in default theme
    accent: '#F7F7F7',
    accentForeground: '#1A1A1A',

    // Destructive - Red for errors/warnings
    destructive: '#DC2626',       // oklch(0.577 0.245 27.325) - Red
    destructiveForeground: '#FFFFFF',

    // Success - Green for success states
    success: '#16A34A',           // Green
    successForeground: '#FFFFFF',

    // Warning - Yellow/Amber for warnings
    warning: '#F59E0B',           // Amber
    warningForeground: '#000000',

    // Info - Blue for information
    info: '#3B82F6',              // Blue
    infoForeground: '#FFFFFF',

    // Border & Input
    border: '#E5E5E5',            // oklch(0.922 0 0) - Very Light Gray
    input: '#E5E5E5',
    ring: '#A3A3A3',              // oklch(0.708 0 0) - Medium-Dark Gray

    // Card
    card: '#FFFFFF',
    cardForeground: '#242424',

    // Popover/Modal
    popover: '#FFFFFF',
    popoverForeground: '#242424',

    // Chart colors (grayscale)
    chart1: '#404040',            // oklch(0.3211 0 0)
    chart2: '#5C5C5C',            // oklch(0.4495 0 0)
    chart3: '#787878',            // oklch(0.5693 0 0)
    chart4: '#949494',            // oklch(0.6830 0 0)
    chart5: '#B0B0B0',            // oklch(0.7921 0 0)

    // Status colors for queue
    statusWaiting: '#F59E0B',     // Yellow/Amber
    statusInProgress: '#3B82F6',  // Blue
    statusCompleted: '#16A34A',   // Green
    statusCancelled: '#DC2626',   // Red
  },

  dark: {
    // Core colors - Dark mode
    background: '#0A0A0A',        // oklch(0.145 0 0) - Near Black
    foreground: '#FAFAFA',        // oklch(0.985 0 0) - Off-White

    // Primary - Light gray for main actions in dark mode
    primary: '#E5E5E5',           // oklch(0.922 0 0) - Light Gray
    primaryForeground: '#1A1A1A', // oklch(0.205 0 0) - Dark

    // Secondary
    secondary: '#262626',         // Dark gray
    secondaryForeground: '#FAFAFA',

    // Muted
    muted: '#262626',
    mutedForeground: '#A3A3A3',

    // Accent
    accent: '#262626',
    accentForeground: '#FAFAFA',

    // Destructive
    destructive: '#DC2626',
    destructiveForeground: '#FFFFFF',

    // Success
    success: '#16A34A',
    successForeground: '#FFFFFF',

    // Warning
    warning: '#F59E0B',
    warningForeground: '#000000',

    // Info
    info: '#3B82F6',
    infoForeground: '#FFFFFF',

    // Border & Input
    border: '#262626',
    input: '#262626',
    ring: '#D4D4D4',

    // Card
    card: '#171717',
    cardForeground: '#FAFAFA',

    // Popover/Modal
    popover: '#171717',
    popoverForeground: '#FAFAFA',

    // Chart colors (grayscale - inverted for dark)
    chart1: '#B0B0B0',
    chart2: '#949494',
    chart3: '#787878',
    chart4: '#5C5C5C',
    chart5: '#404040',

    // Status colors
    statusWaiting: '#F59E0B',
    statusInProgress: '#3B82F6',
    statusCompleted: '#16A34A',
    statusCancelled: '#DC2626',
  },
};

// Typography - matching Inter font styling
export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

// Spacing - consistent with Tailwind defaults
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

// Border Radius - matching dashboard's default theme
export const BorderRadius = {
  none: 0,
  sm: 4,       // ~0.225rem
  md: 7,       // ~0.425rem
  DEFAULT: 10, // ~0.625rem
  lg: 10,      // ~0.625rem
  xl: 16,      // ~1.025rem
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// Shadows - subtle shadows matching dashboard
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
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  DEFAULT: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
};

// Animation durations
export const Animation = {
  fast: 150,
  normal: 300,
  slow: 500,
};

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof Colors.light;
