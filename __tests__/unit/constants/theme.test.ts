import { Colors, Typography, Spacing, BorderRadius, Shadows, Animation } from '@/constants/theme';
import type { ColorScheme, AppTheme, ThemeColors } from '@/constants/theme';

// ── Colors ──────────────────────────────────────────────────────────────────

describe('Colors', () => {
  const REQUIRED_KEYS: (keyof ThemeColors)[] = [
    'background', 'foreground', 'primary', 'primaryForeground',
    'secondary', 'secondaryForeground', 'muted', 'mutedForeground',
    'accent', 'accentForeground', 'destructive', 'destructiveForeground',
    'success', 'border', 'card', 'cardForeground',
    'statusWaiting', 'statusInProgress', 'statusCompleted', 'statusCancelled',
  ];

  (['light', 'dark'] as ColorScheme[]).forEach((scheme) => {
    describe(`Colors.${scheme}`, () => {
      it('contains all required color tokens', () => {
        REQUIRED_KEYS.forEach(key => {
          expect(Colors[scheme]).toHaveProperty(key);
          expect(typeof (Colors[scheme] as any)[key]).toBe('string');
        });
      });

      it('every color value is a non-empty string', () => {
        Object.values(Colors[scheme]).forEach(v => {
          expect(typeof v).toBe('string');
          expect((v as string).length).toBeGreaterThan(0);
        });
      });

      it('background and foreground are different colors', () => {
        expect(Colors[scheme].background).not.toBe(Colors[scheme].foreground);
      });

      it('primary and primaryForeground are different', () => {
        expect(Colors[scheme].primary).not.toBe(Colors[scheme].primaryForeground);
      });
    });
  });

  it('light and dark themes have different backgrounds', () => {
    expect(Colors.light.background).not.toBe(Colors.dark.background);
  });

  it('light background is lighter than dark background (heuristic)', () => {
    // Light mode background should start with #F or #fff, dark with #1 or darker
    expect(Colors.light.background.toLowerCase()).toMatch(/^#[ef]/i);
    expect(Colors.dark.background.toLowerCase()).not.toMatch(/^#[ef]/i);
  });

  it('no AMOLED / black theme exists', () => {
    expect((Colors as any).black).toBeUndefined();
  });
});

// ── Typography ───────────────────────────────────────────────────────────────

describe('Typography', () => {
  it('has fontFamily with all weights', () => {
    ['regular', 'medium', 'semibold', 'bold', 'extrabold', 'black'].forEach(w => {
      expect(Typography.fontFamily).toHaveProperty(w);
    });
  });

  it('font sizes are in ascending order', () => {
    const sizes = Object.values(Typography.fontSize) as number[];
    const sorted = [...sizes].sort((a, b) => a - b);
    expect(sizes).toEqual(sorted);
  });

  it('fontWeight values are valid CSS weight strings', () => {
    const valid = ['100','200','300','400','500','600','700','800','900'];
    Object.values(Typography.fontWeight).forEach(w => {
      expect(valid).toContain(w);
    });
  });

  it('base font size is 16px', () => {
    expect(Typography.fontSize.base).toBe(16);
  });
});

// ── Spacing ───────────────────────────────────────────────────────────────────

describe('Spacing', () => {
  it('all values are non-negative numbers', () => {
    Object.values(Spacing).forEach(v => {
      expect(typeof v).toBe('number');
      expect(v).toBeGreaterThanOrEqual(0);
    });
  });

  it('Spacing[4] is 16px (standard base unit)', () => {
    expect(Spacing[4]).toBe(16);
  });

  it('values are in ascending order for integer keys', () => {
    const intKeys = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const values = intKeys.map(k => (Spacing as any)[k] as number);
    const sorted = [...values].sort((a, b) => a - b);
    expect(values).toEqual(sorted);
  });
});

// ── BorderRadius ──────────────────────────────────────────────────────────────

describe('BorderRadius', () => {
  it('none is 0', () => expect(BorderRadius.none).toBe(0));
  it('full is a very large value', () => expect(BorderRadius.full).toBeGreaterThan(100));
  it('DEFAULT is 16 (1rem base)', () => expect(BorderRadius.DEFAULT).toBe(16));

  it('values increase from none → sm → md → DEFAULT → lg → xl', () => {
    expect(BorderRadius.none).toBeLessThan(BorderRadius.sm);
    expect(BorderRadius.sm).toBeLessThan(BorderRadius.md);
    expect(BorderRadius.md).toBeLessThan(BorderRadius.DEFAULT);
    expect(BorderRadius.DEFAULT).toBeLessThan(BorderRadius.lg);
    expect(BorderRadius.lg).toBeLessThan(BorderRadius.xl);
  });
});

// ── Shadows ───────────────────────────────────────────────────────────────────

describe('Shadows', () => {
  const SHADOW_KEYS = ['none', 'sm', 'DEFAULT', 'md', 'lg', 'xl'];

  SHADOW_KEYS.forEach(key => {
    it(`Shadows.${key} has required properties`, () => {
      const s = (Shadows as any)[key];
      expect(s).toHaveProperty('shadowColor');
      expect(s).toHaveProperty('shadowOffset');
      expect(s).toHaveProperty('shadowOpacity');
      expect(s).toHaveProperty('shadowRadius');
      expect(s).toHaveProperty('elevation');
    });
  });

  it('none shadow has 0 elevation and 0 opacity', () => {
    expect(Shadows.none.elevation).toBe(0);
    expect(Shadows.none.shadowOpacity).toBe(0);
  });

  it('shadow elevations increase with severity', () => {
    expect(Shadows.sm.elevation).toBeLessThan(Shadows.DEFAULT.elevation);
    expect(Shadows.DEFAULT.elevation).toBeLessThan(Shadows.md.elevation);
    expect(Shadows.md.elevation).toBeLessThan(Shadows.lg.elevation);
  });
});

// ── Animation ─────────────────────────────────────────────────────────────────

describe('Animation', () => {
  it('fast < normal < slow', () => {
    expect(Animation.fast).toBeLessThan(Animation.normal);
    expect(Animation.normal).toBeLessThan(Animation.slow);
  });

  it('all values are positive ms', () => {
    Object.values(Animation).forEach(v => {
      expect(v).toBeGreaterThan(0);
    });
  });
});

// ── Type checks ───────────────────────────────────────────────────────────────

describe('Types', () => {
  it('ColorScheme includes light and dark', () => {
    const schemes: ColorScheme[] = ['light', 'dark'];
    expect(schemes).toContain('light');
    expect(schemes).toContain('dark');
  });

  it('AppTheme includes null (system default)', () => {
    const theme: AppTheme = null;
    expect(theme).toBeNull();
  });

  it('Colors.light satisfies ThemeColors shape', () => {
    const t: ThemeColors = Colors.light;
    expect(t).toBeDefined();
  });
});
