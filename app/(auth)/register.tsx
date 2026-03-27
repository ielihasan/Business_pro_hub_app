import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { signInWithApple } from '@/lib/oauth';
import { supabase } from '@/lib/supabase';
import { oauthState } from '@/lib/oauthState';
import { resendVerificationEmail, sendGoogleVerificationEmail } from '@/lib/auth';

WebBrowser.maybeCompleteAuthSession();

// Trust badges shown in the visual strip
const TRUST = [
  { icon: 'shield-checkmark', color: '#10B981', label: 'Secure' },
  { icon: 'lock-closed',      color: '#6366F1', label: 'Private' },
  { icon: 'flash',            color: '#F59E0B', label: 'Instant' },
  { icon: 'ribbon',           color: '#EC4899', label: 'Rewarded' },
];

export default function RegisterScreen() {
  const { colors, isDark } = useTheme();
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors]                       = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms]         = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail]     = useState('');
  const [socialLoading, setSocialLoading]         = useState<'google' | 'apple' | null>(null);
  const [resendLoading, setResendLoading]         = useState(false);
  // Tracks whether Google has pre-filled name + email
  const [googlePrefilled, setGooglePrefilled]     = useState(false);
  // Stores the Google session tokens so we can restore them on form submit
  const [googleTokens, setGoogleTokens]           = useState<{ access_token: string; refresh_token: string } | null>(null);

  const { register, isLoading, authError, clearAuthError } = useStore();

  const updateField = (field: string, value: string) => {
    setFormData(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!formData.fullName.trim()) e.fullName = 'Full name is required';
    if (!formData.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Enter a valid email';
    if (!formData.phone) e.phone = 'Phone number is required';
    else if (!/^[0-9+\-\s()]{10,}$/.test(formData.phone)) e.phone = 'Enter a valid phone number';
    // No password required when signing up via Google
    if (!googlePrefilled) {
      if (!formData.password) e.password = 'Password is required';
      else if (formData.password.length < 8) e.password = 'Minimum 8 characters';
      if (!formData.confirmPassword) e.confirmPassword = 'Please confirm your password';
      else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    if (!agreedToTerms) e.terms = 'You must agree to continue';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // When auth/callback.tsx routes back to this screen (Android path), it stores
  // prefill data in oauthState before navigating. useFocusEffect picks them up.
  useFocusEffect(
    useCallback(() => {
      // ── 1. Already-registered error (Android path) ─────────────────────────
      const alreadyRegistered = oauthState.pendingAlreadyRegistered;
      if (alreadyRegistered) {
        oauthState.pendingAlreadyRegistered = null; // consume
        Alert.alert(
          'Already Registered',
          'This Google account is already registered. Please go to the login page and sign in with Google.',
          [
            { text: 'Go to Login', onPress: () => router.replace('/(auth)/login') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      // ── 2. Google prefill (Android path) ──────────────────────────────────
      const prefill = oauthState.pendingGooglePrefill;
      if (prefill) {
        oauthState.pendingGooglePrefill = null; // consume
        oauthState.pendingGoogleTokens  = null; // clean up (no longer used)
        setFormData(prev => ({
          ...prev,
          fullName: prefill.name  || prev.fullName,
          email:    prefill.email || prev.email,
        }));
        setGooglePrefilled(true);
        setSocialLoading(null);
        Alert.alert(
          '\u2705 Google Details Filled',
          'Name and email have been filled from your Google account.\n\nJust add your phone number to finish.',
          [{ text: 'Got it' }]
        );
      }
    }, [])
  );

  // Triggers Google OAuth via Supabase; pre-fills name + email on success
  const handleGooglePress = async () => {
    setSocialLoading('google');
    try {
      const redirectUri = makeRedirectUri({ scheme: 'businesshubpro', path: 'auth/callback' });

      // Mark source so auth/callback.tsx (Android) knows this came from register
      oauthState.oauthSource = 'register';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUri, skipBrowserRedirect: true },
      });

      if (error || !data.url) {
        setSocialLoading(null);
        Alert.alert('Error', error?.message || 'Failed to start Google sign-up.');
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (result.type === 'success') {
        // ── iOS path ─────────────────────────────────────────────────────────
        // Safari View Controller returns the URL directly; Expo Router never
        // sees it, so we handle it right here.
        const url = result.url;
        const [beforeHash, hashPart = ''] = url.split('#');
        const queryPart = beforeHash.includes('?') ? beforeHash.split('?')[1] : '';
        const hp = new URLSearchParams(hashPart);
        const qp = new URLSearchParams(queryPart);
        const at   = hp.get('access_token')  || qp.get('access_token');
        const rt   = hp.get('refresh_token') || qp.get('refresh_token') || '';
        const code = qp.get('code');

        let user = null;
        if (at) {
          const { data: sd } = await supabase.auth.setSession({ access_token: at, refresh_token: rt });
          user = sd.session?.user ?? null;
        } else if (code) {
          const { data: sd } = await supabase.auth.exchangeCodeForSession(code);
          user = sd.session?.user ?? null;
        }

        if (user) {
          // ── iOS: check if this Google account is already registered ───────
          const { data: existingProfile } = await supabase
            .from('users')
            .select('phone_number')
            .eq('id', user.id)
            .maybeSingle();

          if (existingProfile?.phone_number) {
            // Already registered — sign out and show error
            await supabase.auth.signOut();
            setSocialLoading(null);
            Alert.alert(
              'Already Registered',
              'This Google account is already registered. Please go to the login page and sign in with Google.',
              [
                { text: 'Go to Login', onPress: () => router.replace('/(auth)/login') },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
            return;
          }

          const meta       = user.user_metadata || {};
          const googleName = meta.full_name || meta.name ||
                             `${meta.given_name || ''} ${meta.family_name || ''}`.trim() || '';
          // Do NOT sign out — the session must stay alive so handleRegister
          // can call getSession() when the form is submitted.
          setFormData(prev => ({
            ...prev,
            fullName: googleName   || prev.fullName,
            email:    user!.email ?? prev.email,
          }));
          setGooglePrefilled(true);
          Alert.alert(
            '\u2705 Google Details Filled',
            'Name and email have been filled from your Google account.\n\nJust add your phone number to finish.',
            [{ text: 'Got it' }]
          );
        } else {
          Alert.alert('Error', 'Could not retrieve Google details. Please try again.');
        }
        setSocialLoading(null);
      } else {
        // ── Android path ──────────────────────────────────────────────────────
        // The OS intercepts the deep link and Expo Router routes it to
        // auth/callback.tsx. That screen stores the prefill in oauthState and
        // keeps the session alive, then calls router.replace('/(auth)/register').
        // useFocusEffect above picks up oauthState.pendingGooglePrefill.
        setSocialLoading(null);
      }
    } catch (err: any) {
      setSocialLoading(null);
      Alert.alert('Error', err.message || 'Google sign-up failed. Please try again.');
    }
  };

  const handleAppleSignUp = async () => {
    setSocialLoading('apple');
    try {
      const result = await signInWithApple();
      if (result.success) router.replace('/(tabs)');
      else Alert.alert('Apple Sign-Up Failed', result.error || 'Please try again.');
    } catch (e: any) { Alert.alert('Error', e.message || 'Unexpected error.'); }
    finally { setSocialLoading(null); }
  };

  const handleRegister = async () => {
    clearAuthError();
    if (!validateForm()) return;
    const normalizedEmail = formData.email.trim().toLowerCase();

    // ── Google signup path ───────────────────────────────────────────────────
    // Save the phone number, then sign out so the user must sign in via Google
    // on the login page (consistent flow: register → login → home).
    if (googlePrefilled) {
      setSocialLoading('google');
      try {
        const { data: { session: liveSession } } = await supabase.auth.getSession();
        if (!liveSession) throw new Error('Google session expired. Please tap \'Fill with Google\' again.');

        // Strict duplicate guard: if phone already exists, this account is already registered.
        const { data: existingProfile } = await supabase
          .from('users')
          .select('phone_number')
          .eq('id', liveSession.user.id)
          .maybeSingle();

        if (existingProfile?.phone_number) {
          await supabase.auth.signOut();
          setSocialLoading(null);
          Alert.alert(
            'Already Registered',
            'This Google account is already registered. Please sign in from the login screen.',
            [
              { text: 'Go to Login', onPress: () => router.replace({ pathname: '/(auth)/login', params: { prefillEmail: normalizedEmail } }) },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
          return;
        }

        // Save / update profile row with phone number
        await supabase.from('users').upsert({
          id:           liveSession.user.id,
          email:        liveSession.user.email,
          full_name:    formData.fullName,
          phone_number: formData.phone,
        }, { onConflict: 'id', ignoreDuplicates: false });

        // Keep auth metadata in sync for routing fallback safety.
        await supabase.auth.updateUser({
          data: {
            full_name: formData.fullName,
            phone_number: formData.phone,
          },
        });

        // Registration details are complete now; avoid stale register source
        // affecting later verification callback routing.
        oauthState.oauthSource = null;

        const verificationResult = await sendGoogleVerificationEmail(normalizedEmail);

        // Sign out so only verified users can proceed via email link callback.
        await supabase.auth.signOut();
        setSocialLoading(null);

        if (!verificationResult.success) {
          Alert.alert(
            'Verification Email Issue',
            `Profile was created, but verification email could not be sent right now.\n\nReason: ${verificationResult.error || 'Unknown error'}\n\nPlease try again from login screen.`
          );
          router.replace({ pathname: '/(auth)/login', params: { prefillEmail: normalizedEmail } });
          return;
        }

        setRegisteredEmail(normalizedEmail);
        setShowVerificationModal(true);
      } catch (err: any) {
        setSocialLoading(null);
        // Session expired — reset so user can try Google OAuth again
        setGooglePrefilled(false);
        setGoogleTokens(null);
        setFormData(prev => ({ ...prev, fullName: '', email: '' }));
        Alert.alert(
          'Session Expired',
          err.message || 'Please tap \'Fill with Google\' again to restart.',
          [{ text: 'OK' }]
        );
      }
      return;
    }

    // ── Email / password signup path ─────────────────────────────────────────
    const result = await register({
      email: normalizedEmail,
      password: formData.password,
      fullName: formData.fullName,
      phone: formData.phone,
    });
    if (result.success) {
      const targetEmail = normalizedEmail;
      const resendResult = await resendVerificationEmail(targetEmail);

      if (!resendResult.success) {
        Alert.alert(
          'Verification Email Issue',
          `Your account was created, but we could not confirm email delivery right now.\n\nReason: ${resendResult.error || 'Unknown error'}\n\nPlease use the "Resend Verification Email" button on the next screen.`
        );
      }

      setRegisteredEmail(targetEmail);
      setShowVerificationModal(true);
    } else {
      if (result.error === 'EMAIL_EXISTS_VERIFICATION_RESENT') {
        Alert.alert(
          'Account Already Exists',
          `This email is already registered, and we have sent a fresh verification email to ${normalizedEmail}. Please verify your email, then sign in.`
        );
        router.replace({ pathname: '/(auth)/login', params: { prefillEmail: normalizedEmail } });
        return;
      }

      if (result.error?.includes('already registered')) {
        Alert.alert('Email Already Registered', 'This email is already in use. If it is not verified yet, we can resend the verification email now.', [
          {
            text: 'Resend Verification',
            onPress: async () => {
              const targetEmail = formData.email.trim();
              if (!targetEmail || !/\S+@\S+\.\S+/.test(targetEmail)) {
                Alert.alert('Missing Email', 'Please enter a valid email first.');
                return;
              }
              setResendLoading(true);
              const resendResult = await resendVerificationEmail(targetEmail);
              setResendLoading(false);
              if (resendResult.success) {
                Alert.alert('Verification Sent', `A new verification email has been sent to ${targetEmail}. Check inbox and spam folder.`);
              } else {
                Alert.alert('Resend Failed', resendResult.error || 'Could not resend verification email right now.');
              }
            },
          },
          { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
          { text: 'Try Again', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Registration Failed', result.error || 'Something went wrong.', [{ text: 'OK' }]);
      }
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = registeredEmail.trim();
    if (!targetEmail || !/\S+@\S+\.\S+/.test(targetEmail)) {
      Alert.alert('Missing Email', 'No valid email found to resend verification.');
      return;
    }

    setResendLoading(true);
    const result = await resendVerificationEmail(targetEmail);
    setResendLoading(false);

    if (result.success) {
      Alert.alert(
        'Verification Sent',
        `A new verification email has been sent to ${targetEmail}. Please check inbox and spam folder.`
      );
    } else {
      Alert.alert('Resend Failed', result.error || 'Could not resend verification email right now.');
    }
  };

  const busy = isLoading || socialLoading !== null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Top brand bar ── */}
          <SafeAreaView edges={['top']}>
            <View style={styles.topBar}>
              <TouchableOpacity
                style={[styles.backBtn, { backgroundColor: colors.secondary }]}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={20} color={colors.foreground} />
              </TouchableOpacity>
              <View style={[styles.brandPill, { backgroundColor: colors.primary }]}>
                <Ionicons name="grid" size={13} color={colors.primaryForeground} />
                <Text style={[styles.brandText, { color: colors.primaryForeground }]}>BusinessHub Pro</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>

          {/* ── Hero strip ── */}
          <View style={[styles.heroStrip, { backgroundColor: isDark ? '#0D0D1A' : '#F0F1FF' }]}>
            <View style={[styles.heroBlob, { backgroundColor: isDark ? '#6366F125' : '#6366F112' }]} />
            <View style={[styles.heroBlob2, { backgroundColor: isDark ? '#10B98120' : '#10B98110' }]} />

            {/* Trust badges */}
            <View style={styles.trustRow}>
              {TRUST.map((t, i) => (
                <View key={i} style={[styles.trustBadge, { backgroundColor: isDark ? colors.secondary : '#fff', borderColor: isDark ? colors.border : t.color + '25' }]}>
                  <Ionicons name={t.icon as any} size={14} color={t.color} />
                  <Text style={[styles.trustLabel, { color: isDark ? colors.foreground : t.color }]}>{t.label}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.heroHeading, { color: isDark ? '#EDEDFF' : '#1A1A3A' }]}>Create your account</Text>
            <Text style={[styles.heroSub, { color: isDark ? '#ABABCC' : '#5C5C8A' }]}>
              Join 50,000+ customers enjoying smarter queue experiences
            </Text>
          </View>

          {/* ── Form card ── */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

            {!!authError && (
              <View style={[styles.errorBanner, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive + '40' }]}>
                <Ionicons name="alert-circle" size={16} color={colors.destructive} />
                <Text style={[styles.errorBannerText, { color: colors.destructive }]}>{authError}</Text>
              </View>
            )}

            {/* Google pre-fill banner */}
            {googlePrefilled && (
              <View style={[styles.googleBanner, { backgroundColor: '#34A85315', borderColor: '#34A85350' }]}>
                <Ionicons name="logo-google" size={15} color="#34A853" />
                <Text style={[styles.googleBannerText, { color: '#34A853' }]}>
                  Signed in with Google. Just add your phone number below.
                </Text>
              </View>
            )}

            {/* Full Name – read-only when Google-prefilled */}
            <View>
              {googlePrefilled && (
                <View style={styles.googleFieldBadge}>
                  <Ionicons name="logo-google" size={11} color="#EA4335" />
                  <Text style={styles.googleFieldBadgeText}>Verified by Google</Text>
                </View>
              )}
              <Input label="Full Name" placeholder="John Doe" value={formData.fullName}
                onChangeText={(v) => updateField('fullName', v)} autoCapitalize="words"
                autoComplete="name" leftIcon="person-outline" error={errors.fullName}
                editable={!busy && !googlePrefilled} />
            </View>

            {/* Email – read-only when Google-prefilled */}
            <View style={{ marginTop: Spacing[3] }}>
              {googlePrefilled && (
                <View style={styles.googleFieldBadge}>
                  <Ionicons name="logo-google" size={11} color="#EA4335" />
                  <Text style={styles.googleFieldBadgeText}>Verified by Google</Text>
                </View>
              )}
              <Input label="Email" placeholder="you@example.com" value={formData.email}
                onChangeText={(v) => updateField('email', v)} keyboardType="email-address"
                autoCapitalize="none" autoComplete="email" leftIcon="mail-outline" error={errors.email}
                editable={!busy && !googlePrefilled} />
            </View>

            <View style={{ marginTop: Spacing[3] }}>
              <Input label="Phone Number" placeholder="+1 234 567 8900" value={formData.phone}
                onChangeText={(v) => updateField('phone', v)} keyboardType="phone-pad"
                autoComplete="tel" leftIcon="call-outline" error={errors.phone} editable={!busy} />
            </View>

            {/* Password fields — hidden for Google sign-up (auth handled by Google) */}
            {!googlePrefilled && (
              <>
                <View style={{ marginTop: Spacing[3] }}>
                  <Input label="Password" placeholder="Min. 8 characters" value={formData.password}
                    onChangeText={(v) => updateField('password', v)} secureTextEntry autoCapitalize="none"
                    autoComplete="new-password" leftIcon="lock-closed-outline" error={errors.password}
                    hint="Must be at least 8 characters" editable={!busy} />
                </View>

                <View style={{ marginTop: Spacing[3] }}>
                  <Input label="Confirm Password" placeholder="Re-enter your password" value={formData.confirmPassword}
                    onChangeText={(v) => updateField('confirmPassword', v)} secureTextEntry autoCapitalize="none"
                    leftIcon="lock-closed-outline" error={errors.confirmPassword} editable={!busy} />
                </View>
              </>
            )}

            {/* Terms checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreedToTerms(v => !v)}
              disabled={busy}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                {
                  borderColor: errors.terms ? colors.destructive : (agreedToTerms ? colors.primary : colors.border),
                  backgroundColor: agreedToTerms ? colors.primary : 'transparent',
                },
              ]}>
                {agreedToTerms && <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />}
              </View>
              <Text style={[styles.termsText, { color: colors.mutedForeground }]}>
                I agree to the{' '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
            {!!errors.terms && (
              <View style={styles.termsErrRow}>
                <Ionicons name="alert-circle-outline" size={13} color={colors.destructive} />
                <Text style={[styles.termsErrText, { color: colors.destructive }]}>{errors.terms}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }, busy && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={busy}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color={colors.primaryForeground} />
                : <>
                    <Ionicons name="person-add-outline" size={20} color={colors.primaryForeground} />
                    <Text style={[styles.submitText, { color: colors.primaryForeground }]}>Create Account</Text>
                  </>
              }
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.divLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.divLabel, { color: colors.mutedForeground }]}>
                {googlePrefilled ? 'filled with Google' : 'or sign up with'}
              </Text>
              <View style={[styles.divLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Social buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={[
                  styles.socialBtn,
                  {
                    backgroundColor: googlePrefilled ? '#34A85310' : colors.secondary,
                    borderColor: googlePrefilled ? '#34A853' : colors.border,
                  },
                  busy && { opacity: 0.5 },
                ]}
                onPress={googlePrefilled ? undefined : handleGooglePress}
                disabled={busy || googlePrefilled}
                activeOpacity={0.75}
              >
                {socialLoading === 'google'
                  ? <ActivityIndicator color={colors.foreground} size="small" />
                  : googlePrefilled
                    ? <><Ionicons name="checkmark-circle" size={19} color="#34A853" /><Text style={[styles.socialLabel, { color: '#34A853' }]}>Filled ✓</Text></>
                    : <><Ionicons name="logo-google" size={19} color="#EA4335" /><Text style={[styles.socialLabel, { color: colors.foreground }]}>Fill with Google</Text></>
                }
              </TouchableOpacity>
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.socialBtn, { backgroundColor: colors.secondary, borderColor: colors.border }, busy && { opacity: 0.5 }]}
                  onPress={handleAppleSignUp}
                  disabled={busy}
                  activeOpacity={0.75}
                >
                  {socialLoading === 'apple'
                    ? <ActivityIndicator color={colors.foreground} size="small" />
                    : <><Ionicons name="logo-apple" size={19} color={colors.foreground} /><Text style={[styles.socialLabel, { color: colors.foreground }]}>Apple</Text></>
                  }
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Sign in link */}
          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: colors.mutedForeground }]}>Already have an account?{'  '}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} disabled={busy}>
              <Text style={[styles.switchLink, { color: colors.primary }]}>Sign in</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Email verification modal */}
      <Modal visible={showVerificationModal} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIconWrap, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="mail-unread" size={44} color={colors.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Verify Your Email</Text>
            <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
              We've sent a verification link to:
            </Text>
            <Text style={[styles.modalEmail, { color: colors.primary }]}>{registeredEmail}</Text>
            <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
              Check your inbox (and spam folder) and click the link before signing in.
            </Text>
            <View style={[styles.tipsBox, { backgroundColor: colors.secondary }]}>
              {['Check your spam / junk folder', 'Email may take a few minutes to arrive'].map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{tip}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.modalSecondaryBtn, { borderColor: colors.primary }, resendLoading && { opacity: 0.7 }]}
              onPress={handleResendVerification}
              disabled={resendLoading}
            >
              {resendLoading
                ? <ActivityIndicator color={colors.primary} />
                : <Text style={[styles.modalSecondaryBtnText, { color: colors.primary }]}>Resend Verification Email</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              onPress={() => { setShowVerificationModal(false); router.replace({ pathname: '/(auth)/login', params: { prefillEmail: registeredEmail } }); }}
            >
              <Text style={[styles.modalBtnText, { color: colors.primaryForeground }]}>Go to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: Spacing[8] },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[4], paddingTop: Spacing[3], paddingBottom: Spacing[2],
  },
  backBtn:   { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  brandPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  brandText: { fontSize: 12, fontWeight: '700' },

  heroStrip: {
    marginHorizontal: Spacing[4], borderRadius: 20,
    padding: Spacing[4], paddingBottom: Spacing[5],
    overflow: 'hidden', marginBottom: Spacing[4], position: 'relative',
  },
  heroBlob:  { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -60, right: -40 },
  heroBlob2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, bottom: -30, left: -20 },
  trustRow:   { flexDirection: 'row', gap: 7, marginBottom: Spacing[4], flexWrap: 'wrap' },
  trustBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  trustLabel: { fontSize: 11, fontWeight: '700' },
  heroHeading: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginBottom: 4 },
  heroSub:     { fontSize: 13, lineHeight: 18 },

  card: {
    marginHorizontal: Spacing[4], borderRadius: 20, borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing[5], shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, marginBottom: Spacing[4],
  },
  errorBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: Spacing[4] },
  errorBannerText: { flex: 1, fontSize: 13 },

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3], marginTop: Spacing[4] },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  termsText:    { flex: 1, fontSize: 13, lineHeight: 19 },
  termsErrRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  termsErrText: { fontSize: 12 },

  submitBtn: {
    height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginTop: Spacing[4],
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  submitText: { fontSize: 16, fontWeight: '700' },

  divider:  { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing[4], gap: Spacing[3] },
  divLine:  { flex: 1, height: 1 },
  divLabel: { fontSize: 12 },

  socialRow: { flexDirection: 'row', gap: Spacing[3] },
  socialBtn: {
    flex: 1, height: 46, borderRadius: 12, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
  },
  socialLabel: { fontSize: 14, fontWeight: '600' },

  googleBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: Spacing[4],
  },
  googleBannerText: { flex: 1, fontSize: 13, fontWeight: '500' },

  googleFieldBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginBottom: 4,
  },
  googleFieldBadgeText: { fontSize: 11, color: '#EA4335', fontWeight: '600' },

  switchRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[4] },
  switchText: { fontSize: 14 },
  switchLink: { fontSize: 14, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: Spacing[6] },
  modalCard: {
    width: '100%', maxWidth: 380, borderRadius: 24, padding: Spacing[6], alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 12,
  },
  modalIconWrap: { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing[4] },
  modalTitle:    { fontSize: 20, fontWeight: '800', marginBottom: Spacing[2], textAlign: 'center' },
  modalBody:     { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 6 },
  modalEmail:    { fontSize: 15, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  tipsBox:       { width: '100%', borderRadius: 12, padding: Spacing[4], marginVertical: Spacing[3], gap: 8 },
  tipRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipText:       { fontSize: 13, flex: 1 },
  modalSecondaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  modalSecondaryBtnText: { fontSize: 14, fontWeight: '700' },
  modalBtn:      { width: '100%', height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: Spacing[2] },
  modalBtnText:  { fontSize: 15, fontWeight: '700' },
});
