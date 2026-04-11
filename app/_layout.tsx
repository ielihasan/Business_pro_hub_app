import '@/lib/suppressWarnings'; // MUST be first — patches console before native modules fire
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { Colors } from '@/constants/theme';
import { useStore, setupAuthListener } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { oauthState } from '@/lib/oauthState';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import '@/lib/i18n';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { theme, initializeAuth } = useStore();
  const resolvedTheme =
    theme === 'dark'  ? 'dark'
    : theme === 'light' ? 'light'
    : colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[resolvedTheme];
  // appReady gates the spinner only for the one-time startup auth check.
  // Using isLoading from the store would unmount the nav stack whenever
  // any store action (profile save, password change, etc.) sets isLoading:true.
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Initialize authentication on app start
    const initAuth = async () => {
      await initializeAuth();
      setAppReady(true);
      // Hide splash screen after auth is initialized
      SplashScreen.hideAsync();
    };

    initAuth();

    // Setup auth state listener for real-time auth changes
    const { data: { subscription } } = setupAuthListener();

    // Handle deep links for email verification / OAuth callbacks.
    // IMPORTANT: do NOT call initializeAuth() here — it sets isLoading:true which
    // unmounts the entire navigation Stack and causes index.tsx to re-run its
    // routing effect (sending the user to /(tabs) even during registration).
    // setupAuthListener already reacts to SIGNED_IN without touching isLoading.
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;

      // Check if this is an auth callback URL
      if (url.includes('access_token') || url.includes('refresh_token') || url.includes('code=')) {
        oauthState.oauthCallbackInProgress = true;
      }
      if (url.includes('access_token') || url.includes('refresh_token')) {
        // Extract tokens from URL fragment
        const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const linkType = params.get('type');

        // Mark password-recovery links BEFORE the async setSession so
        // auth/callback.tsx can read the flag after its 400 ms wait.
        if (linkType === 'recovery') {
          oauthState.isPasswordRecovery = true;
        }

        if (accessToken && refreshToken) {
          try {
            // Establish the Supabase session; setupAuthListener handles store update.
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
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

  // Show loading indicator while initializing auth for the first time
  if (!appReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.foreground} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
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
        <Stack.Screen name="business/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="queue/[id]"   options={{ headerShown: false }} />
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
    </ErrorBoundary>
  );
}
