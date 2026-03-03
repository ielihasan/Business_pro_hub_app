import { useState, useEffect } from 'react';
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
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { signInWithGoogle, signInWithApple } from '@/lib/oauth';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

// Mini feature chips shown in the visual strip
const CHIPS = [
  { icon: 'qr-code',        label: 'Scan & Join',  color: '#6366F1', bg: '#EEF2FF' },
  { icon: 'time',           label: 'Live Queue',   color: '#10B981', bg: '#F0FDF4' },
  { icon: 'notifications',  label: 'Smart Alerts', color: '#F59E0B', bg: '#FFFBEB' },
  { icon: 'star',           label: 'Rewards',      color: '#EC4899', bg: '#FDF2F8' },
];

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({});
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [socialLoading, setSocialLoading]     = useState<'google' | 'apple' | null>(null);

  const { login, isLoading, authError, clearAuthError } = useStore();

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
    redirectUri: 'businesshubpro://oauth/google/callback',
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      if (id_token) handleGoogleSignIn(id_token);
    }
  }, [googleResponse]);

  const handleLogin = async () => {
    clearAuthError();
    const errs: { email?: string; password?: string } = {};
    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Minimum 6 characters';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    const result = await login({ email, password });
    if (result.success) router.replace('/(tabs)');
    else {
      if (result.error?.includes('verify your email') || result.error?.includes('Email not confirmed'))
        setShowVerifyModal(true);
      else
        Alert.alert('Login Failed', result.error || 'Invalid email or password.', [{ text: 'OK' }]);
    }
  };

  const handleGoogleSignIn = async (idToken: string) => {
    setSocialLoading('google');
    try {
      const result = await signInWithGoogle(idToken);
      if (result.success) router.replace('/(tabs)');
      else Alert.alert('Google Sign-In Failed', result.error || 'Please try again.');
    } catch (e: any) { Alert.alert('Error', e.message || 'Unexpected error.'); }
    finally { setSocialLoading(null); }
  };

  const handleGooglePress = async () => {
    try {
      await googlePromptAsync();
    } catch { Alert.alert('Error', 'Failed to initiate Google sign-in.'); }
  };

  const handleAppleSignIn = async () => {
    setSocialLoading('apple');
    try {
      const result = await signInWithApple();
      if (result.success) router.replace('/(tabs)');
      else Alert.alert('Apple Sign-In Failed', result.error || 'Please try again.');
    } catch (e: any) { Alert.alert('Error', e.message || 'Unexpected error.'); }
    finally { setSocialLoading(null); }
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

          {/* ── Visual hero strip ── */}
          <View style={[styles.heroStrip, { backgroundColor: isDark ? '#0F0F1A' : '#F0F1FF' }]}>
            <View style={[styles.heroBlob, { backgroundColor: isDark ? '#6366F125' : '#6366F115' }]} />
            <View style={styles.chipsRow}>
              {CHIPS.map((c, i) => (
                <View
                  key={i}
                  style={[styles.chip, { backgroundColor: isDark ? colors.secondary : c.bg }]}
                >
                  <View style={[styles.chipIcon, { backgroundColor: c.color }]}>
                    <Ionicons name={c.icon as any} size={13} color="#fff" />
                  </View>
                  <Text style={[styles.chipLabel, { color: isDark ? colors.foreground : c.color }]}>{c.label}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.heroHeading, { color: isDark ? '#EDEDFF' : '#1A1A3A' }]}>Welcome back</Text>
            <Text style={[styles.heroSub, { color: isDark ? '#ABABCC' : '#5C5C8A' }]}>
              Sign in to manage your queues &amp; rewards
            </Text>
          </View>

          {/* ── Form card ── */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

            {/* Auth error */}
            {!!authError && (
              <View style={[styles.errorBanner, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive + '40' }]}>
                <Ionicons name="alert-circle" size={16} color={colors.destructive} />
                <Text style={[styles.errorBannerText, { color: colors.destructive }]}>{authError}</Text>
              </View>
            )}

            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={(v) => { setEmail(v); setErrors(p => ({ ...p, email: '' })); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
              error={errors.email}
              editable={!busy}
            />

            <View style={{ marginTop: Spacing[3] }}>
              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={(v) => { setPassword(v); setErrors(p => ({ ...p, password: '' })); }}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                leftIcon="lock-closed-outline"
                error={errors.password}
                editable={!busy}
              />
            </View>

            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => router.push('/(auth)/forgot-password')}
              disabled={busy}
            >
              <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }, busy && { opacity: 0.6 }]}
              onPress={handleLogin}
              disabled={busy}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color={colors.primaryForeground} />
                : <>
                    <Ionicons name="log-in-outline" size={20} color={colors.primaryForeground} />
                    <Text style={[styles.submitText, { color: colors.primaryForeground }]}>Sign In</Text>
                  </>
              }
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.divLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.divLabel, { color: colors.mutedForeground }]}>or continue with</Text>
              <View style={[styles.divLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Social */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: colors.secondary, borderColor: colors.border }, busy && { opacity: 0.5 }]}
                onPress={handleGooglePress}
                disabled={busy}
                activeOpacity={0.75}
              >
                {socialLoading === 'google'
                  ? <ActivityIndicator color={colors.foreground} size="small" />
                  : <><Ionicons name="logo-google" size={19} color="#EA4335" /><Text style={[styles.socialLabel, { color: colors.foreground }]}>Google</Text></>
                }
              </TouchableOpacity>
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.socialBtn, { backgroundColor: colors.secondary, borderColor: colors.border }, busy && { opacity: 0.5 }]}
                  onPress={handleAppleSignIn}
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

          {/* Sign up link */}
          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: colors.mutedForeground }]}>Don't have an account?{'  '}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')} disabled={busy}>
              <Text style={[styles.switchLink, { color: colors.primary }]}>Sign up</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Verify email modal */}
      <Modal visible={showVerifyModal} transparent animationType="fade" onRequestClose={() => setShowVerifyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="warning" size={44} color="#F59E0B" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Email Not Verified</Text>
            <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
              Please verify your email before signing in. Check your inbox for the verification link.
            </Text>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowVerifyModal(false)}
            >
              <Text style={[styles.modalBtnText, { color: colors.primaryForeground }]}>OK, Got It</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  brandPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  brandText: { fontSize: 12, fontWeight: '700' },

  heroStrip: {
    marginHorizontal: Spacing[4],
    borderRadius: 20,
    padding: Spacing[4],
    paddingBottom: Spacing[5],
    overflow: 'hidden',
    marginBottom: Spacing[4],
    position: 'relative',
  },
  heroBlob: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    top: -60, right: -40,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: Spacing[4] },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  chipIcon: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  chipLabel: { fontSize: 11, fontWeight: '600' },
  heroHeading: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4, marginBottom: 4 },
  heroSub:     { fontSize: 13, lineHeight: 18 },

  card: {
    marginHorizontal: Spacing[4],
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: Spacing[4],
  },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 10, borderWidth: 1,
    marginBottom: Spacing[4],
  },
  errorBannerText: { flex: 1, fontSize: 13 },

  forgotRow:  { alignSelf: 'flex-end', marginTop: Spacing[2] },
  forgotText: { fontSize: 13, fontWeight: '600' },

  submitBtn: {
    height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginTop: Spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
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

  switchRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[4] },
  switchText: { fontSize: 14 },
  switchLink: { fontSize: 14, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: Spacing[6] },
  modalCard: {
    width: '100%', maxWidth: 380, borderRadius: 24,
    padding: Spacing[6], alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 12,
  },
  modalIconWrap: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing[4],
  },
  modalTitle:   { fontSize: 20, fontWeight: '800', marginBottom: Spacing[2], textAlign: 'center' },
  modalBody:    { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: Spacing[5] },
  modalBtn:     { width: '100%', height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  modalBtnText: { fontSize: 15, fontWeight: '700' },
});


