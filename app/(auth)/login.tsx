import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import { useStore } from '@/store/useStore';
import { signInWithApple } from '@/lib/oauth';
import { supabase } from '@/lib/supabase';
import Dialog, { DialogConfig } from '@/components/ui/Dialog';
import { GoogleLogo } from '@/components/ui/GoogleLogo';
import { OtpModal } from '@/components/ui/OtpModal';
import { sendVerificationOtp, verifyEmailOtp } from '@/lib/auth';
import { useTheme } from '@/hooks/useTheme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { prefillEmail } = useLocalSearchParams<{ prefillEmail?: string }>();
  const [email, setEmail]       = useState(prefillEmail ?? '');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({});
  const [showOtpModal, setShowOtpModal]       = useState(false);
  const [otpEmail, setOtpEmail]               = useState('');
  const [socialLoading, setSocialLoading]     = useState<'google' | 'apple' | null>(null);
  const [dialog, setDialog]                   = useState<DialogConfig | null>(null);

  const { login, initializeAuth, isLoading, authError, clearAuthError } = useStore();

  const handleLogin = async () => {
    clearAuthError();
    const normalizedEmail = email.trim().toLowerCase();
    const errs: { email?: string; password?: string } = {};
    if (!normalizedEmail) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(normalizedEmail)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Minimum 6 characters';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setEmail(normalizedEmail);
    const result = await login({ email: normalizedEmail, password });
    if (result.success) router.replace('/(tabs)');
    else {
      if (result.error?.includes('verify your email') || result.error?.includes('Email not confirmed')) {
        // Auto-send OTP and show code entry
        const sent = await sendVerificationOtp(normalizedEmail);
        if (sent.success) { setOtpEmail(normalizedEmail); setShowOtpModal(true); }
        else setDialog({ title: 'Email Not Verified', message: 'Please verify your email. We could not send a code right now — try again later.', icon: 'mail-outline', iconVariant: 'warning', actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }] });
      } else
        setDialog({ title: 'Login Failed', message: result.error || 'Invalid email or password.', icon: 'alert-circle-outline', iconVariant: 'destructive', actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }] });
    }
  };

  const handleGooglePress = async () => {
    setSocialLoading('google');
    try {
      const redirectUri = makeRedirectUri({ scheme: 'businesshubpro', path: 'auth/callback' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUri, skipBrowserRedirect: true },
      });
      if (error || !data.url) {
        setSocialLoading(null);
        setDialog({ title: 'Error', message: error?.message || 'Failed to start Google sign-in.', icon: 'alert-circle-outline', iconVariant: 'destructive', actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }] });
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
      if (result.type === 'success') {
        const url = result.url;
        const [beforeHash, hashPart = ''] = url.split('#');
        const queryPart = beforeHash.includes('?') ? beforeHash.split('?')[1] : '';
        const hp = new URLSearchParams(hashPart);
        const qp = new URLSearchParams(queryPart);
        const at   = hp.get('access_token')  || qp.get('access_token');
        const rt   = hp.get('refresh_token') || qp.get('refresh_token') || '';
        const code = qp.get('code');
        if (at) {
          const { error: se } = await supabase.auth.setSession({ access_token: at, refresh_token: rt });
          if (se) {
            setSocialLoading(null);
            setDialog({ title: 'Sign-In Failed', message: se.message, icon: 'alert-circle-outline', iconVariant: 'destructive', actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }] });
            return;
          }
        } else if (code) {
          const { error: ce } = await supabase.auth.exchangeCodeForSession(code);
          if (ce) {
            setSocialLoading(null);
            setDialog({ title: 'Sign-In Failed', message: ce.message, icon: 'alert-circle-outline', iconVariant: 'destructive', actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }] });
            return;
          }
        } else {
          setSocialLoading(null);
          setDialog({ title: 'Sign-In Failed', message: 'Could not retrieve session. Please try again.', icon: 'alert-circle-outline', iconVariant: 'destructive', actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }] });
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setSocialLoading(null); return; }
        let profile: { phone_number?: string | null } | null = null;
        const { data: profileById } = await supabase.from('users').select('phone_number').eq('id', session.user.id).maybeSingle();
        profile = profileById;
        if (!profile && session.user.email) {
          const { data: profileByEmail } = await supabase.from('users').select('phone_number').ilike('email', session.user.email).maybeSingle();
          profile = profileByEmail;
        }
        setSocialLoading(null);
        if (!profile?.phone_number) {
          await supabase.auth.signOut();
          setDialog({
            title: 'Account Not Found',
            message: 'No registered account found for this Google email.\n\nPlease sign up first.',
            icon: 'person-circle-outline',
            iconVariant: 'default',
            actions: [
              { label: 'Sign Up Now', variant: 'primary', onPress: () => { setDialog(null); router.push('/(auth)/register'); } },
              { label: 'Cancel', variant: 'secondary', onPress: () => setDialog(null) },
            ],
          });
        } else { await initializeAuth(); router.replace('/(tabs)'); }
      } else { setSocialLoading(null); }
    } catch (err: any) {
      setSocialLoading(null);
      setDialog({ title: 'Error', message: err.message || 'Google sign-in failed.', icon: 'alert-circle-outline', iconVariant: 'destructive', actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }] });
    }
  };

  const handleAppleSignIn = async () => {
    setSocialLoading('apple');
    try {
      const result = await signInWithApple();
      if (result.success) router.replace('/(tabs)');
      else setDialog({ title: 'Apple Sign-In Failed', message: result.error || 'Please try again.', icon: 'logo-apple', iconVariant: 'default', actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }] });
    } catch (e: any) {
      setDialog({ title: 'Error', message: e.message || 'Unexpected error.', icon: 'alert-circle-outline', iconVariant: 'destructive', actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }] });
    }
    finally { setSocialLoading(null); }
  };

  const handleVerifyOtp = async (code: string): Promise<string | null> => {
    const result = await verifyEmailOtp(otpEmail, code);
    if (!result.success) return result.error || 'Invalid code. Please try again.';
    await initializeAuth();
    setShowOtpModal(false);
    router.replace('/(tabs)');
    return null;
  };

  const handleResendOtp = async () => {
    await sendVerificationOtp(otpEmail);
  };

  const busy = isLoading || socialLoading !== null;

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Top bar */}
          <View style={styles.topBar}>
            <Text style={[styles.wordmark, { color: colors.foreground }]}>BUSINESSHUB PRO</Text>
          </View>

          {/* Hero headline */}
          <View style={styles.heroSection}>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>WELCOME{'\n'}BACK.</Text>
            <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
              Find businesses near you, scan a QR code and skip the wait from your phone.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {!!authError && (
              <View style={[styles.errorBanner, { backgroundColor: '#ffb4ab18', borderColor: '#ffb4ab40' }]}>
                <Ionicons name="alert-circle" size={15} color="#ffb4ab" />
                <Text style={[styles.errorBannerText, { color: '#ffb4ab' }]}>{authError}</Text>
              </View>
            )}

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>EMAIL <Text style={{ color: '#ff4444' }}>*</Text></Text>
              <TextInput
                style={[styles.input, { borderColor: errors.email ? '#ffb4ab' : colors.border, color: colors.foreground, backgroundColor: colors.input }]}
                placeholder="your@email.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={(v) => { setEmail(v); setErrors(p => ({ ...p, email: '' })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                keyboardAppearance={isDark ? 'dark' : 'light'}
                editable={!busy}
              />
              {!!errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <View style={styles.fieldLabelRow}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>PASSWORD <Text style={{ color: '#ff4444' }}>*</Text></Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} disabled={busy}>
                  <Text style={[styles.forgotLink, { color: colors.foreground }]}>FORGOT PASSWORD</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrap, { borderColor: errors.password ? '#ffb4ab' : colors.border, backgroundColor: colors.input }]}>
                <TextInput
                  style={[styles.inputInner, { color: colors.foreground }]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrors(p => ({ ...p, password: '' })); }}
                  secureTextEntry={!showPwd}
                  autoCapitalize="none"
                  keyboardAppearance={isDark ? 'dark' : 'light'}
                  editable={!busy}
                />
                <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              {!!errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
            </View>

            {/* Sign In button */}
            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: colors.primary }, busy && { opacity: 0.6 }]}
              onPress={handleLogin}
              disabled={busy}
              activeOpacity={0.88}
            >
              {isLoading
                ? <ActivityIndicator color={colors.primaryForeground} />
                : <>
                    <Text style={[styles.btnPrimaryText, { color: colors.primaryForeground }]}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
                  </>
              }
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.divLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.divLabel, { color: colors.mutedForeground }]}>OR CONTINUE WITH</Text>
              <View style={[styles.divLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Google */}
            <TouchableOpacity
              style={[styles.btnGoogle, { backgroundColor: '#FFFFFF', borderColor: '#dadce0' }, busy && { opacity: 0.5 }]}
              onPress={handleGooglePress}
              disabled={busy}
              activeOpacity={0.8}
            >
              {socialLoading === 'google'
                ? <ActivityIndicator color="#000000" size="small" />
                : <>
                    <GoogleLogo size={20} />
                    <Text style={[styles.btnGoogleText, { color: '#1F1F1F' }]}>Continue with Google</Text>
                  </>
              }
            </TouchableOpacity>

            {/* Apple (iOS only) */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.btnGoogle, { backgroundColor: colors.secondary, borderColor: colors.border, marginTop: 10 }, busy && { opacity: 0.5 }]}
                onPress={handleAppleSignIn}
                disabled={busy}
                activeOpacity={0.8}
              >
                {socialLoading === 'apple'
                  ? <ActivityIndicator color={colors.foreground} size="small" />
                  : <>
                      <Ionicons name="logo-apple" size={19} color={colors.foreground} />
                      <Text style={[styles.btnGoogleText, { color: colors.foreground }]}>Continue with Apple</Text>
                    </>
                }
              </TouchableOpacity>
            )}
          </View>

          {/* Sign up link */}
          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: colors.mutedForeground }]}>New to the platform?{'  '}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')} disabled={busy}>
              <Text style={[styles.switchLink, { color: colors.foreground }]}>Create an account</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <OtpModal
        visible={showOtpModal}
        email={otpEmail}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        onClose={() => setShowOtpModal(false)}
      />

      {dialog && <Dialog visible {...dialog} onDismiss={() => setDialog(null)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 48 },

  topBar:   { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
  wordmark: { fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },

  heroSection: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32 },
  heroTitle: { fontSize: 54, fontWeight: '900', letterSpacing: -2, lineHeight: 56, marginBottom: 16 },
  heroSub:   { fontSize: 15, lineHeight: 22 },

  form: { paddingHorizontal: 24, gap: 20, marginBottom: 24 },

  errorBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  errorBannerText: { flex: 1, fontSize: 13 },

  fieldWrap:     { gap: 6 },
  fieldLabel:    { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotLink:    { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  input: {
    height: 54, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 20, fontSize: 15, backgroundColor: 'transparent',
  },
  inputWrap: {
    height: 54, borderWidth: 1, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent',
    paddingHorizontal: 20,
  },
  inputInner: { flex: 1, fontSize: 15 },
  eyeBtn:     { padding: 4 },
  fieldError: { fontSize: 11, color: '#ffb4ab', marginTop: 2 },

  btnPrimary:     { height: 56, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnPrimaryText: { fontSize: 16, fontWeight: '800' },
  btnGoogle:      { height: 52, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnGoogleText:  { fontSize: 15, fontWeight: '600' },

  divider:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divLine:  { flex: 1, height: StyleSheet.hairlineWidth },
  divLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },

  switchRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  switchText: { fontSize: 14 },
  switchLink: { fontSize: 14, fontWeight: '700' },

});
