import { useEffect } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing } from '@/constants/theme';

export default function SplashIndex() {
  const { colors } = useTheme();

  useEffect(() => {
    // Simulate checking auth state and redirect
    const timer = setTimeout(() => {
      // For now, always redirect to auth
      // In production, check if user is authenticated
      router.replace('/(auth)/welcome');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.logoContainer}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Text style={[styles.logoText, { color: colors.primaryForeground }]}>
            BH
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>
          BusinessHub Pro
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Smart Queue Management
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  logoText: {
    fontSize: 40,
    fontWeight: Typography.fontWeight.bold,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
  },
});
