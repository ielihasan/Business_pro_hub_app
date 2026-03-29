/**
 * Unit tests for useTheme resolution logic.
 * We test the pure resolution logic directly without React hooks.
 */
import { Colors } from '@/constants/theme';
import type { ColorScheme } from '@/constants/theme';

/**
 * Mirror of the resolution logic inside useTheme — extracted for pure testing.
 */
function resolveTheme(
  storetheme: 'light' | 'dark' | null,
  systemScheme: 'light' | 'dark' | null
): ColorScheme {
  if (storetheme === 'dark')  return 'dark';
  if (storetheme === 'light') return 'light';
  return systemScheme === 'dark' ? 'dark' : 'light';
}

function isDarkResolved(resolved: ColorScheme): boolean {
  return resolved === 'dark';
}

describe('useTheme resolution logic', () => {
  describe('resolveTheme', () => {
    it('returns dark when store theme is dark (ignores system)', () => {
      expect(resolveTheme('dark', 'light')).toBe('dark');
      expect(resolveTheme('dark', null)).toBe('dark');
    });

    it('returns light when store theme is light (ignores system)', () => {
      expect(resolveTheme('light', 'dark')).toBe('light');
      expect(resolveTheme('light', null)).toBe('light');
    });

    it('follows system when store theme is null', () => {
      expect(resolveTheme(null, 'dark')).toBe('dark');
      expect(resolveTheme(null, 'light')).toBe('light');
    });

    it('defaults to light when both are null/undefined', () => {
      expect(resolveTheme(null, null)).toBe('light');
    });

    it('never returns "black" (AMOLED removed)', () => {
      const result = resolveTheme('dark', 'dark');
      expect(result).not.toBe('black');
    });
  });

  describe('isDarkResolved', () => {
    it('is true only for dark', () => {
      expect(isDarkResolved('dark')).toBe(true);
    });

    it('is false for light', () => {
      expect(isDarkResolved('light')).toBe(false);
    });
  });

  describe('Colors lookup by resolved scheme', () => {
    it('always resolves to a valid Colors entry', () => {
      (['light', 'dark'] as ColorScheme[]).forEach(scheme => {
        expect(Colors[scheme]).toBeDefined();
        expect(Colors[scheme].background).toBeTruthy();
      });
    });

    it('dark mode uses a darker background color', () => {
      const lightBg = parseInt(Colors.light.background.replace('#', ''), 16);
      const darkBg  = parseInt(Colors.dark.background.replace('#', ''), 16);
      expect(darkBg).toBeLessThan(lightBg);
    });

    it('dark mode foreground is brighter than light foreground', () => {
      const lightFg = parseInt(Colors.light.foreground.replace('#', ''), 16);
      const darkFg  = parseInt(Colors.dark.foreground.replace('#', ''), 16);
      expect(darkFg).toBeGreaterThan(lightFg);
    });
  });
});
