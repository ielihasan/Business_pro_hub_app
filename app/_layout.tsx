import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, ActivityIndicator, LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { Colors } from '@/constants/theme';
import { useStore, setupAuthListener } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import '@/lib/i18n';

// ─── Silence expo-notifications Expo Go SDK 53 warning ──────────────────────
// expo-notifications logs this at native-module init time inside Expo Go.
// It is purely informational – remote push is intentionally unsupported there.
// We suppress it via both LogBox (UI overlay) and console overrides (Metro CLI).
const IGNORED_NOTIFICATION_PATTERNS = [
  'expo-notifications: Android Push notifications',
  'expo-notifications: Push notifications',
  'removed from Expo Go',
];

// Suppress the red/yellow LogBox overlay
LogBox.ignoreLogs(IGNORED_NOTIFICATION_PATTERNS);

// Suppress the Metro terminal output
(function suppressExpoNotificationsExpoGoWarning() {
  const originalError = console.error.bind(console);
  console.error = (...args: any[]) => {
    const msg = args[0];
    if (
      typeof msg === 'string' &&
      IGNORED_NOTIFICATION_PATTERNS.some((p) => msg.includes(p))
    ) {
      return; // swallow silently
    }
    originalError(...args);
  };
  const originalWarn = console.warn.bind(console);
  console.warn = (...args: any[]) => {
    const msg = args[0];
    if (
      typeof msg === 'string' &&
      IGNORED_NOTIFICATION_PATTERNS.some((p) => msg.includes(p))
    ) {
      return;
    }
    originalWarn(...args);
  };
})();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { theme, initializeAuth, isLoading } = useStore();
  const resolvedTheme = theme ?? (colorScheme === 'dark' ? 'dark' : 'light');
  const colors = Colors[resolvedTheme];

  useEffect(() => {
    // Initialize authentication on app start
    const initAuth = async () => {
      await initializeAuth();
      // Hide splash screen after auth is initialized
      SplashScreen.hideAsync();
    };

    initAuth();

    // Setup auth state listener for real-time auth changes
    const { data: { subscription } } = setupAuthListener();

    // Handle deep links for email verification
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;

      // Check if this is an auth callback URL
      if (url.includes('access_token') || url.includes('refresh_token')) {
        // Extract tokens from URL fragment
        const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          try {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            // Re-initialize auth to update state
            await initializeAuth();
          } catch (error) {
            console.error('Error handling deep link auth:', error);
          }
        }
      }
    };

    // Listen for deep links
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Cleanup subscriptions on unmount
    return () => {
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, []);

  // Show loading indicator while initializing auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="auth/callback" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="business/[id]"
          options={{
            headerShown: true,
            headerTitle: 'Business Details',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.foreground,
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="queue/[id]"
          options={{
            headerShown: true,
            headerTitle: 'Queue Status',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.foreground,
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="profile/terms"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="profile/feedback"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="profile/about"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="profile/help"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </View>
  );
}
