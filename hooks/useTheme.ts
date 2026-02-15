import { useColorScheme } from 'react-native';
import { Colors, ThemeColors, ColorScheme } from '@/constants/theme';
import { useStore } from '@/store/useStore';

export function useTheme(): {
  colors: ThemeColors;
  colorScheme: ColorScheme;
  isDark: boolean;
} {
  const systemColorScheme = useColorScheme();
  const { theme } = useStore();
  const resolved: ColorScheme = theme ?? (systemColorScheme === 'dark' ? 'dark' : 'light');
  const colors = Colors[resolved];
  const isDark = resolved === 'dark';

  return {
    colors,
    colorScheme: resolved,
    isDark,
  };
}

export function useThemeColor(
  lightColor: string,
  darkColor: string
): string {
  const { theme } = useStore();
  if (theme) return theme === 'dark' ? darkColor : lightColor;
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkColor : lightColor;
}
