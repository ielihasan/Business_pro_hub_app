import { useColorScheme } from 'react-native';
import { Colors, ThemeColors, ColorScheme } from '@/constants/theme';
import { useStore } from '@/store/useStore';

export function useTheme(): {
  colors: ThemeColors;
  colorScheme: ColorScheme;
  isDark: boolean;
  theme: 'light' | 'dark' | 'black' | null;
} {
  const systemColorScheme = useColorScheme();
  const { theme }         = useStore();

  // null  → follow system (dark or light)
  // 'dark'  → force dark (#131313 surfaces)
  // 'black' → force AMOLED black (#000000 surfaces)
  // 'light' → force light
  const resolved: ColorScheme =
    theme === 'black' ? 'black'
    : theme === 'dark'  ? 'dark'
    : theme === 'light' ? 'light'
    : systemColorScheme === 'dark' ? 'dark' : 'light';  // null = system

  const colors = Colors[resolved];
  const isDark  = resolved === 'dark' || resolved === 'black';

  return { colors, colorScheme: resolved, isDark, theme };
}

export function useThemeColor(lightColor: string, darkColor: string): string {
  const { theme }         = useStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'dark' || theme === 'black' ||
    (theme === null && systemColorScheme === 'dark');
  return isDark ? darkColor : lightColor;
}
