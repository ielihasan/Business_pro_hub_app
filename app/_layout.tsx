import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { Colors } from '@/constants/theme';
import { useStore, setupAuthListener } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
<<<<<<< HEAD
import '@/lib/i18n';
=======
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
<<<<<<< HEAD
  const { theme, initializeAuth, isLoading } = useStore();
  const colors = Colors[theme];
=======
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { initializeAuth, isLoading } = useStore();
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5

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
<<<<<<< HEAD
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
=======
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
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
          name="scanner"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </View>
  );
}
