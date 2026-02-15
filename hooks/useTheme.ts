<<<<<<< HEAD
import { useColorScheme as _useColorScheme } from 'react-native';
import { Colors, ThemeColors, ColorScheme } from '@/constants/theme';
import { useStore } from '@/store/useStore';

export function useTheme() {
  const { theme } = useStore();
  const colors = Colors[theme];
  const isDark = theme === 'dark';

  return {
    colors,
    colorScheme: theme,
=======
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
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
    isDark,
  };
}

export function useThemeColor(
  lightColor: string,
  darkColor: string
<<<<<<< HEAD
) {
  const { theme } = useStore();
  return theme === 'dark' ? darkColor : lightColor;
=======
): string {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkColor : lightColor;
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
}
