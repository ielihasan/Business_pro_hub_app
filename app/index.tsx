import { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { oauthState } from '@/lib/oauthState';

export default function SplashIndex() {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading } = useStore();

  useEffect(() => {
    // Wait for auth to be initialized, then redirect
    if (!isLoading) {
      const timer = setTimeout(() => {
        // Don't redirect while an OAuth callback is being processed —
        // auth/callback.tsx will handle navigation once it resolves.
        if (oauthState.oauthCallbackInProgress) return;

        if (isAuthenticated) {
          // User is logged in, go to main tabs
          router.replace('/(tabs)');
        } else {
          // User is not logged in, go to welcome screen
          router.replace('/(auth)/welcome');
        }
      }, 300); // Brief delay for splash screen effect

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading]);

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
