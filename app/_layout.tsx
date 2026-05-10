import '@/lib/suppressWarnings'; // MUST be first — patches console before native modules fire
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, Image, Text, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { Colors } from '@/constants/theme';
import { useStore, setupAuthListener } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { oauthState } from '@/lib/oauthState';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import '@/lib/i18n';

// Minimum time (ms) the splash screen stays visible — even if auth finishes faster
const SPLASH_DURATION_MS = 3000;

// Keep the native splash screen visible while JS loads
SplashScreen.preventAutoHideAsync();

function AppLoadingScreen() {
  return (
    <View style={ls.root}>
      {/* adaptive-icon has transparent background — looks clean on black */}
      <Image
        source={require('../assets/adaptive-icon.png')}
        style={ls.icon}
        resizeMode="contain"
      />
      <Text style={ls.appName}>BusinessHub Pro</Text>
      <Text style={ls.tagline}>Smart Queue Management</Text>
    </View>
  );
}

const ls = StyleSheet.create({
  root:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' },
  icon:    { width: 240, height: 280, marginBottom: 16 },
  appName: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  tagline: { fontSize: 14, fontWeight: '400', color: '#1E8F4E', marginTop: 6 },
});

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
    // Wait for BOTH auth to finish AND the minimum splash duration.
    // This ensures the icon screen is always visible for at least SPLASH_DURATION_MS,
    // even on fast devices where auth completes in under a second.
    const initAuth = async () => {
      await Promise.all([
        initializeAuth(),
        new Promise<void>((resolve) => setTimeout(resolve, SPLASH_DURATION_MS)),
      ]);
      setAppReady(true);
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

        // Mark link type BEFORE the async setSession so setupAuthListener
        // can read the flags synchronously when SIGNED_IN fires.
        if (linkType === 'recovery') {
          oauthState.isPasswordRecovery = true;
        }
        if (linkType === 'signup') {
          // Email verification — block auto-login in setupAuthListener.
          oauthState.isSignupVerification = true;
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
    return <AppLoadingScreen />;
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
