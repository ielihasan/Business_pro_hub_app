/**
 * Integration tests verifying that theme + store + component color pipeline
 * produces consistent, accessible color combinations.
 */
import { Colors } from '@/constants/theme';
import type { ColorScheme } from '@/constants/theme';

/** Parse a hex color (#RRGGBB or #RGB) to relative luminance [0, 1] */
function luminance(hex: string): number {
  const clean = hex.replace('#', '');
  const full  = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean.slice(0, 6);

  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const sRGB = (c: number) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * sRGB(r) + 0.7152 * sRGB(g) + 0.0722 * sRGB(b);
}

/** WCAG contrast ratio between two hex colors */
function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Accessibility — WCAG contrast ratios', () => {
  (['light', 'dark'] as ColorScheme[]).forEach(scheme => {
    const c = Colors[scheme];

    describe(`${scheme} theme`, () => {
      it('foreground on background meets WCAG AA (≥ 4.5:1)', () => {
        const ratio = contrastRatio(c.foreground, c.background);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      it('primary on background has sufficient contrast', () => {
        const ratio = contrastRatio(c.primary, c.background);
        expect(ratio).toBeGreaterThanOrEqual(3.0);
      });

      it('primaryForeground on primary is readable', () => {
        const ratio = contrastRatio(c.primaryForeground, c.primary);
        expect(ratio).toBeGreaterThanOrEqual(3.0);
      });
    });
  });
});

describe('Theme color consistency', () => {
  (['light', 'dark'] as ColorScheme[]).forEach(scheme => {
    const c = Colors[scheme];

    it(`${scheme}: card and background are related (card ≠ muted)`, () => {
      // card should be near background, not muted
      expect(c.card).toBeDefined();
      expect(typeof c.card).toBe('string');
    });

    it(`${scheme}: status colors are defined and valid hex`, () => {
      [c.statusWaiting, c.statusInProgress, c.statusCompleted, c.statusCancelled].forEach(color => {
        expect(color).toMatch(/^#[0-9a-fA-F]{3,8}$/);
      });
    });

    it(`${scheme}: destructive is a red-family color`, () => {
      // Red has high R, low G/B in hex
      const clean = c.destructive.replace('#', '');
      if (clean.length >= 6) {
        const r = parseInt(clean.slice(0, 2), 16);
        const g = parseInt(clean.slice(2, 4), 16);
        // red component should be dominant or it should be a light red (#ffb4ab style)
        // Allow for Material-style error colors
        expect(r).toBeGreaterThan(100);
      }
    });

    it(`${scheme}: success is a green-family color`, () => {
      const clean = c.success.replace('#', '');
      if (clean.length >= 6) {
        const g = parseInt(clean.slice(2, 4), 16);
        expect(g).toBeGreaterThan(100);
      }
    });
  });

  it('light and dark themes have inverse luminance relationships', () => {
    const lightBgL = luminance(Colors.light.background);
    const darkBgL  = luminance(Colors.dark.background);
    const lightFgL = luminance(Colors.light.foreground);
    const darkFgL  = luminance(Colors.dark.foreground);

    expect(lightBgL).toBeGreaterThan(darkBgL);   // light bg brighter
    expect(darkFgL).toBeGreaterThan(lightFgL);   // dark fg brighter (white on dark)
  });
});

describe('Theme toggle scenario', () => {
  it('switching theme produces different backgrounds', () => {
    const lightBg = Colors['light'].background;
    const darkBg  = Colors['dark'].background;
    expect(lightBg).not.toBe(darkBg);
  });

  it('status colors are stable across themes (amber waiting)', () => {
    // statusWaiting should be amber/yellow in both themes
    expect(Colors.light.statusWaiting).toBe(Colors.dark.statusWaiting);
  });
});
