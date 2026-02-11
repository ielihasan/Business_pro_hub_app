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
    isDark,
  };
}

export function useThemeColor(
  lightColor: string,
  darkColor: string
) {
  const { theme } = useStore();
  return theme === 'dark' ? darkColor : lightColor;
}
