import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/store/useStore';
import { oauthState } from '@/lib/oauthState';

export default function SplashIndex() {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading } = useStore();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (oauthState.oauthCallbackInProgress) return;
        router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/welcome');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading]);

  return <View style={[styles.root, { backgroundColor: colors.background }]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
