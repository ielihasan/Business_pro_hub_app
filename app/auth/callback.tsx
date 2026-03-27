import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { oauthState } from '@/lib/oauthState';

export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const { initializeAuth } = useStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // ── Step 1: Establish a session ──────────────────────────────────────
        // Expo Router search params cover query-string tokens (?access_token=)
        // and sometimes hash tokens (#access_token=) depending on platform.
        // _layout.tsx Linking handler already called setSession for fragment
        // tokens on Android, so getSession() below will find the session.
        const accessToken  = params.access_token  as string | undefined;
        const refreshToken = params.refresh_token as string | undefined;
        const code         = params.code          as string | undefined;

        if (accessToken && refreshToken) {
          // Query-param tokens (email verification, or Expo Router parsed fragment)
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.error('setSession error:', error.message);
            router.replace('/(auth)/login');
            return;
          }
          // Password-reset link came as query params — route to reset screen.
          if ((params.type as string | undefined) === 'recovery') {
            router.replace('/(auth)/reset-password');
            return;
          }
        } else if (code) {
          // PKCE code exchange
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('exchangeCodeForSession error:', error.message);
            router.replace('/(auth)/login');
            return;
          }
        } else {
          // No params — Google OAuth with implicit flow (fragment tokens).
          // _layout.tsx Linking handler already called setSession for us.
          // Give it a brief moment to complete its async work.
          await new Promise(r => setTimeout(r, 400));
          // Password-reset link came via URL fragment — _layout.tsx set the flag.
          if (oauthState.isPasswordRecovery) {
            oauthState.isPasswordRecovery = false; // consume
            router.replace('/(auth)/reset-password');
            return;
          }
        }

        // ── Step 2: Read the session ────────────────────────────────────────
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // No session means the deep link was not an OAuth callback
          // (or the token was invalid). Go back to login.
          router.replace('/(auth)/login');
          return;
        }

        // Email verification links (signup or magiclink) should land user in app,
        // not back on register screen.
        const callbackType = (params.type as string | undefined) || '';
        if (callbackType === 'signup' || callbackType === 'magiclink') {
          oauthState.oauthSource = null;
          await initializeAuth();
          router.replace('/(tabs)');
          return;
        }

        // ── Step 3: Smart routing — login flow vs register flow ─────────────
        // Check the users table for an existing profile with a phone number.
        // • Has phone  → existing user who already registered → go to tabs (LOGIN)
        // • No phone   → new Google user who needs to complete registration → go to register
        let profile: { phone_number?: string | null } | null = null;

        // Prefer stable id-based lookup to avoid email case/normalization mismatches.
        const { data: profileById } = await supabase
          .from('users')
          .select('phone_number')
          .eq('id', session.user.id)
          .maybeSingle();
        profile = profileById;

        // Fallback by email for legacy rows where id mapping may be missing.
        if (!profile && session.user.email) {
          const { data: profileByEmail } = await supabase
            .from('users')
            .select('phone_number')
            .ilike('email', session.user.email)
            .maybeSingle();
          profile = profileByEmail;
        }

        oauthState.oauthSource = null; // consume

        // If profile is complete, always route to app home.
        // This avoids loops where stale source='register' sends verified users back.
        if (profile?.phone_number) {
          await initializeAuth();
          router.replace('/(tabs)');
          return;
        }

        {
          // ── REGISTER FLOW ────────────────────────────────────────────────
          // Extract name + email from Google metadata
          const meta       = session.user.user_metadata || {};
          const googleName = (
            meta.full_name ||
            meta.name ||
            `${meta.given_name || ''} ${meta.family_name || ''}`.trim() ||
            ''
          );
          const googleEmail = session.user.email || '';

          // Store prefill for register.tsx to read via useFocusEffect.
          // Do NOT sign out — the session must stay alive so handleRegister
          // can call getSession() on submit instead of restoring dead tokens.
          oauthState.pendingGooglePrefill = { name: googleName, email: googleEmail };

          router.replace('/(auth)/register');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/(auth)/login');
      }
    };

    handleCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount only

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.foreground }]}>
        Signing you in…
      </Text>
      <Text style={[styles.subtext, { color: colors.mutedForeground }]}>
        Please wait a moment
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

