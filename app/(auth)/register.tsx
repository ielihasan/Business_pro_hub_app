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

  const { register, isLoading, authError, clearAuthError } = useStore();

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
    redirectUri: 'businesshubpro://oauth/google/callback',
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      if (id_token) handleGoogleSignUp(id_token);
    }
  }, [googleResponse]);

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
    if (!formData.password) e.password = 'Password is required';
    else if (formData.password.length < 8) e.password = 'Minimum 8 characters';
    if (!formData.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!agreedToTerms) e.terms = 'You must agree to continue';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGoogleSignUp = async (idToken: string) => {
    setSocialLoading('google');
    try {
      const result = await signInWithGoogle(idToken);
      if (result.success) router.replace('/(tabs)');
      else Alert.alert('Google Sign-Up Failed', result.error || 'Please try again.');
    } catch (e: any) { Alert.alert('Error', e.message || 'Unexpected error.'); }
    finally { setSocialLoading(null); }
  };

  const handleGooglePress = async () => {
    try { await googlePromptAsync(); }
    catch { Alert.alert('Error', 'Failed to initiate Google sign-up.'); }
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
    const result = await register({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      phone: formData.phone,
    });
    if (result.success) {
      const { session } = useStore.getState();
      if (session) router.replace('/(tabs)');
      else { setRegisteredEmail(formData.email); setShowVerificationModal(true); }
    } else {
      if (result.error?.includes('already registered')) {
        Alert.alert('Email Already Registered', 'This email is already in use. Please sign in or use another email.', [
          { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
          { text: 'Try Again', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Registration Failed', result.error || 'Something went wrong.', [{ text: 'OK' }]);
      }
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

            <Input label="Full Name" placeholder="John Doe" value={formData.fullName}
              onChangeText={(v) => updateField('fullName', v)} autoCapitalize="words"
              autoComplete="name" leftIcon="person-outline" error={errors.fullName} editable={!busy} />

            <View style={{ marginTop: Spacing[3] }}>
              <Input label="Email" placeholder="you@example.com" value={formData.email}
                onChangeText={(v) => updateField('email', v)} keyboardType="email-address"
                autoCapitalize="none" autoComplete="email" leftIcon="mail-outline" error={errors.email} editable={!busy} />
            </View>

            <View style={{ marginTop: Spacing[3] }}>
              <Input label="Phone Number" placeholder="+1 234 567 8900" value={formData.phone}
                onChangeText={(v) => updateField('phone', v)} keyboardType="phone-pad"
                autoComplete="tel" leftIcon="call-outline" error={errors.phone} editable={!busy} />
            </View>

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
              <Text style={[styles.divLabel, { color: colors.mutedForeground }]}>or sign up with</Text>
              <View style={[styles.divLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Social buttons */}
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
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              onPress={() => { setShowVerificationModal(false); router.replace('/(auth)/login'); }}
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
  modalBtn:      { width: '100%', height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: Spacing[2] },
  modalBtnText:  { fontSize: 15, fontWeight: '700' },
});

WebBrowser.maybeCompleteAuthSession();

