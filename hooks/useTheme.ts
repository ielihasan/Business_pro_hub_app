import { useColorScheme } from 'react-native';
import { Colors, ThemeColors, ColorScheme } from '@/constants/theme';

export function useTheme(): {
  colors: ThemeColors;
  colorScheme: ColorScheme;
  isDark: boolean;
} {
  const systemColorScheme = useColorScheme();
  const colorScheme: ColorScheme = systemColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return {
    colors,
    colorScheme,
    isDark,
  };
}

export function useThemeColor(
  lightColor: string,
  darkColor: string
): string {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkColor : lightColor;
}
