import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';

export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const { initializeAuth } = useStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the tokens from URL params (passed by deep link)
        const accessToken = params.access_token as string;
        const refreshToken = params.refresh_token as string;

        if (accessToken && refreshToken) {
          // Set the session with the tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
            router.replace('/(auth)/login');
            return;
          }
        }

        // Re-initialize auth to get the updated session
        await initializeAuth();

        // Small delay before redirecting
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1000);
      } catch (error) {
        console.error('Callback error:', error);
        router.replace('/(auth)/login');
      }
    };

    handleCallback();
  }, [params]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.foreground }]}>
        Verifying your email...
      </Text>
      <Text style={[styles.subtext, { color: colors.mutedForeground }]}>
        Please wait while we confirm your account
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[6],
  },
  text: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginTop: Spacing[6],
    textAlign: 'center',
  },
  subtext: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing[2],
    textAlign: 'center',
  },
});
