import { useState, useCallback, useEffect } from 'react';
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
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import { useStore } from '@/store/useStore';
import { signInWithApple } from '@/lib/oauth';
import { supabase } from '@/lib/supabase';
import { oauthState } from '@/lib/oauthState';
import { sendVerificationOtp, verifyEmailOtp } from '@/lib/auth';
import Dialog, { DialogConfig } from '@/components/ui/Dialog';
import { GoogleLogo } from '@/components/ui/GoogleLogo';
import { OtpModal } from '@/components/ui/OtpModal';
import { useTheme } from '@/hooks/useTheme';

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const { colors, isDark } = useTheme();
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showOtpModal, setShowOtpModal]   = useState(false);
  const [otpEmail, setOtpEmail]           = useState('');
  const [otpType, setOtpType]             = useState<'signup' | 'email'>('signup');
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [googlePrefilled, setGooglePrefilled] = useState(false);
  const [showPwd, setShowPwd]           = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [dialog, setDialog]             = useState<DialogConfig | null>(null);

  const { register, initializeAuth, isLoading, authError, clearAuthError } = useStore();

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

  useFocusEffect(useCallback(() => {
    if (oauthState.pendingGooglePrefill) oauthState.pendingGooglePrefill = null;
    const alreadyRegistered = oauthState.pendingAlreadyRegistered;
    if (alreadyRegistered) {
      oauthState.pendingAlreadyRegistered = null;
      setDialog({
        title: 'Already Registered',
        message: 'This Google account is already registered. Please go to the login page and sign in with Google.',
        icon: 'person-circle-outline',
        iconVariant: 'default',
        actions: [
          { label: 'Go to Login', variant: 'primary', onPress: () => { setDialog(null); router.replace('/(auth)/login'); } },
          { label: 'Cancel', variant: 'secondary', onPress: () => setDialog(null) },
        ],
      });
    }
  }, []));

  // Auto-dismiss OTP modal if user verifies via magic link in browser
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' && showOtpModal) {
        await initializeAuth();
        setShowOtpModal(false);
        router.replace('/(tabs)');
      }
    });
    return () => subscription.unsubscribe();
  }, [showOtpModal]);

  const handleGooglePress = async () => {
    setSocialLoading('google');
    try {
      const redirectUri = makeRedirectUri({ scheme: 'businesshubpro', path: 'auth/callback' });
      oauthState.oauthSource = 'register';
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectUri, skipBrowserRedirect: true } });
      if (error || !data.url) {
        setSocialLoading(null);
        setDialog({ title: 'Error', message: error?.message || 'Failed to start Google sign-up.', icon: 'alert-circle-outline', iconVariant: 'destructive', actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }] });
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
        let user = null;
        if (at) { const { data: sd } = await supabase.auth.setSession({ access_token: at, refresh_token: rt }); user = sd.session?.user ?? null; }
        else if (code) { const { data: sd } = await supabase.auth.exchangeCodeForSession(code); user = sd.session?.user ?? null; }
        if (user) {
          const { data: existingProfile } = await supabase.from('users').select('phone_number').eq('id', user.id).maybeSingle();
          if (existingProfile?.phone_number) {
            await supabase.auth.signOut();
            setSocialLoading(null);
            setDialog({
              title: 'Already Registered',
              message: 'This Google account is already registered. Please go to the login page and sign in with Google.',
              icon: 'person-circle-outline',
              iconVariant: 'default',
              actions: [
                { label: 'Go to Login', variant: 'primary', onPress: () => { setDialog(null); router.replace('/(auth)/login'); } },
                { label: 'Cancel', variant: 'secondary', onPress: () => setDialog(null) },
              ],
            });
            return;
          }
          const meta = user.user_metadata || {};
          const googleName = meta.full_name || meta.name || `${meta.given_name || ''} ${meta.family_name || ''}`.trim() || '';
          setFormData(prev => ({ ...prev, fullName: googleName || prev.fullName, email: user!.email ?? prev.email }));
          setGooglePrefilled(true);
        } else {
          setDialog({ title: 'Error', message: 'Could not retrieve Google details. Please try again.', icon: 'alert-circle-outline', iconVariant: 'destructive', actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }] });
        }
        setSocialLoading(null);
      } else { setSocialLoading(null); }
    } catch (err: any) {
      setSocialLoading(null);
      setDialog({ title: 'Error', message: err.message || 'Google sign-up failed. Please try again.', icon: 'alert-circle-outline', iconVariant: 'destructive', actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }] });
    }
  };

  const handleAppleSignUp = async () => {
    setSocialLoading('apple');
    try {
      const result = await signInWithApple();
      if (result.success) router.replace('/(tabs)');
      else setDialog({ title: 'Apple Sign-Up Failed', message: result.error || 'Please try again.', icon: 'logo-apple', iconVariant: 'default', actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }] });
    } catch (e: any) {
      setDialog({ title: 'Error', message: e.message || 'Unexpected error.', icon: 'alert-circle-outline', iconVariant: 'destructive', actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }] });
    }
    finally { setSocialLoading(null); }
  };

  // Used only for the Google flow (existing confirmed users) — type 'email'
  const sendOtpAndShowModal = async (email: string, type: 'signup' | 'email' = 'email') => {
    const otpResult = await sendVerificationOtp(email, type);
    if (!otpResult.success) {
      setDialog({
        title: 'Could Not Send Code',
        message: otpResult.error || 'Failed to send verification code. Please try again.',
        icon: 'mail-outline',
        iconVariant: 'destructive',
        actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }],
      });
      return false;
    }
    setOtpEmail(email);
    setOtpType(type);
    setShowOtpModal(true);
    return true;
  };

  const handleRegister = async () => {
    clearAuthError();
    if (!validateForm()) return;
    const normalizedEmail = formData.email.trim().toLowerCase();

    if (googlePrefilled) {
      setSocialLoading('google');
      try {
        const { data: { session: liveSession } } = await supabase.auth.getSession();
        if (!liveSession) throw new Error("Google session expired. Please tap 'Continue with Google' again.");
        const { data: existingProfile } = await supabase.from('users').select('phone_number').eq('id', liveSession.user.id).maybeSingle();
        if (existingProfile?.phone_number) {
          await supabase.auth.signOut();
          setSocialLoading(null);
          setDialog({
            title: 'Already Registered',
            message: 'This Google account is already registered. Please sign in from the login screen.',
            icon: 'person-circle-outline',
            iconVariant: 'default',
            actions: [
              { label: 'Go to Login', variant: 'primary', onPress: () => { setDialog(null); router.replace({ pathname: '/(auth)/login', params: { prefillEmail: normalizedEmail } }); } },
              { label: 'Cancel', variant: 'secondary', onPress: () => setDialog(null) },
            ],
          });
          return;
        }
        await supabase.from('users').upsert({ id: liveSession.user.id, email: liveSession.user.email, full_name: formData.fullName, phone_number: formData.phone }, { onConflict: 'id', ignoreDuplicates: false });
        await supabase.auth.updateUser({ data: { full_name: formData.fullName, phone_number: formData.phone } });
        oauthState.oauthSource = null;
        await supabase.auth.signOut();
        setSocialLoading(null);
        await sendOtpAndShowModal(normalizedEmail);
      } catch (err: any) {
        setSocialLoading(null);
        setGooglePrefilled(false);
        setFormData(prev => ({ ...prev, fullName: '', email: '' }));
        setDialog({
          title: 'Session Expired',
          message: err.message || "Please tap 'Continue with Google' again to restart.",
          icon: 'time-outline',
          iconVariant: 'warning',
          actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }],
        });
      }
      return;
    }

    const result = await register({ email: normalizedEmail, password: formData.password, fullName: formData.fullName, phone: formData.phone });
    if (result.success) {
      // signUp already sent the OTP — just open the modal
      setOtpEmail(normalizedEmail);
      setOtpType('signup');
      setShowOtpModal(true);
    } else {
      if (result.error === 'EMAIL_EXISTS_VERIFICATION_RESENT') {
        // resendVerificationEmail() already ran inside registerUser() — show modal directly
        setOtpEmail(normalizedEmail);
        setOtpType('signup');
        setShowOtpModal(true);
        return;
      }
      if (result.error?.includes('already registered')) {
        setDialog({
          title: 'Email Already Registered',
          message: 'This email is already in use. Please sign in or use a different email.',
          icon: 'mail-outline',
          iconVariant: 'warning',
          actions: [
            { label: 'Sign In Instead', variant: 'primary', onPress: () => { setDialog(null); router.push('/(auth)/login'); } },
            { label: 'Cancel', variant: 'secondary', onPress: () => setDialog(null) },
          ],
        });
      } else {
        setDialog({ title: 'Registration Failed', message: result.error || 'Something went wrong.', icon: 'alert-circle-outline', iconVariant: 'destructive', actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }] });
      }
    }
  };

  const handleVerifyOtp = async (code: string): Promise<string | null> => {
    const result = await verifyEmailOtp(otpEmail, code, otpType);
    if (!result.success) return result.error || 'Invalid code. Please try again.';
    await initializeAuth();
    setShowOtpModal(false);
    router.replace('/(tabs)');
    return null;
  };

  const handleResendOtp = async () => {
    await sendVerificationOtp(otpEmail, otpType);
  };

  const busy = isLoading || socialLoading !== null;

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Top bar ── */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.wordmark, { color: colors.foreground }]}>BUSINESSHUB PRO</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* ── Hero headline ── */}
          <View style={styles.heroSection}>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>CREATE{'\n'}ACCOUNT.</Text>
            <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
              Join Pakistan's smartest virtual queue platform. Set up your profile in seconds.
            </Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>
            {!!authError && (
              <View style={[styles.errorBanner, { backgroundColor: '#ffb4ab18', borderColor: '#ffb4ab40' }]}>
                <Ionicons name="alert-circle" size={15} color="#ffb4ab" />
                <Text style={[styles.errorBannerText, { color: '#ffb4ab' }]}>{authError}</Text>
              </View>
            )}

            {googlePrefilled && (
              <View style={[styles.googleBanner, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <GoogleLogo size={14} />
                <Text style={[styles.googleBannerText, { color: colors.mutedForeground }]}>Google account linked. Just add your phone number.</Text>
              </View>
            )}

            {/* Full Name */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>FULL NAME <Text style={{ color: '#ff4444' }}>*</Text></Text>
              <TextInput
                style={[styles.input, { borderColor: errors.fullName ? '#ffb4ab' : colors.border, color: colors.foreground, backgroundColor: colors.input }]}
                placeholder="Your full name"
                placeholderTextColor={colors.mutedForeground}
                value={formData.fullName}
                onChangeText={(v) => updateField('fullName', v)}
                autoCapitalize="words"
                autoComplete="name"
                editable={!busy && !googlePrefilled}
                keyboardAppearance={isDark ? 'dark' : 'light'}
              />
              {googlePrefilled && <Text style={[styles.googleVerified, { color: colors.mutedForeground }]}>✓ Verified by Google</Text>}
              {!!errors.fullName && <Text style={styles.fieldError}>{errors.fullName}</Text>}
            </View>

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>EMAIL ADDRESS <Text style={{ color: '#ff4444' }}>*</Text></Text>
              <TextInput
                style={[styles.input, { borderColor: errors.email ? '#ffb4ab' : colors.border, color: colors.foreground, backgroundColor: colors.input }]}
                placeholder="name@business.pk"
                placeholderTextColor={colors.mutedForeground}
                value={formData.email}
                onChangeText={(v) => updateField('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!busy && !googlePrefilled}
                keyboardAppearance={isDark ? 'dark' : 'light'}
              />
              {googlePrefilled && <Text style={[styles.googleVerified, { color: colors.mutedForeground }]}>✓ Verified by Google</Text>}
              {!!errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
            </View>

            {/* Phone */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>PHONE NUMBER <Text style={{ color: '#ff4444' }}>*</Text></Text>
              <TextInput
                style={[styles.input, { borderColor: errors.phone ? '#ffb4ab' : colors.border, color: colors.foreground, backgroundColor: colors.input }]}
                placeholder="+92 300 1234567"
                placeholderTextColor={colors.mutedForeground}
                value={formData.phone}
                onChangeText={(v) => updateField('phone', v)}
                keyboardType="phone-pad"
                autoComplete="tel"
                editable={!busy}
                keyboardAppearance={isDark ? 'dark' : 'light'}
              />
              {!!errors.phone && <Text style={styles.fieldError}>{errors.phone}</Text>}
            </View>

            {/* Password fields (hidden for Google) */}
            {!googlePrefilled && (
              <>
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>PASSWORD <Text style={{ color: '#ff4444' }}>*</Text></Text>
                  <View style={[styles.inputWrap, { borderColor: errors.password ? '#ffb4ab' : colors.border, backgroundColor: colors.input }]}>
                    <TextInput
                      style={[styles.inputInner, { color: colors.foreground }]}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.mutedForeground}
                      value={formData.password}
                      onChangeText={(v) => updateField('password', v)}
                      secureTextEntry={!showPwd}
                      autoCapitalize="none"
                      editable={!busy}
                      keyboardAppearance={isDark ? 'dark' : 'light'}
                    />
                    <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={styles.eyeBtn}>
                      <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                  {!!errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CONFIRM PASSWORD <Text style={{ color: '#ff4444' }}>*</Text></Text>
                  <View style={[styles.inputWrap, { borderColor: errors.confirmPassword ? '#ffb4ab' : colors.border, backgroundColor: colors.input }]}>
                    <TextInput
                      style={[styles.inputInner, { color: colors.foreground }]}
                      placeholder="Re-enter your password"
                      placeholderTextColor={colors.mutedForeground}
                      value={formData.confirmPassword}
                      onChangeText={(v) => updateField('confirmPassword', v)}
                      secureTextEntry={!showConfirmPwd}
                      autoCapitalize="none"
                      editable={!busy}
                      keyboardAppearance={isDark ? 'dark' : 'light'}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPwd(v => !v)} style={styles.eyeBtn}>
                      <Ionicons name={showConfirmPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                  {!!errors.confirmPassword && <Text style={styles.fieldError}>{errors.confirmPassword}</Text>}
                </View>
              </>
            )}

            {/* Terms */}
            <TouchableOpacity style={styles.termsRow} onPress={() => setAgreedToTerms(v => !v)} disabled={busy} activeOpacity={0.7}>
              <View style={[styles.checkbox, { borderColor: errors.terms ? '#ffb4ab' : (agreedToTerms ? colors.foreground : colors.border), backgroundColor: agreedToTerms ? colors.foreground : 'transparent' }]}>
                {agreedToTerms && <Ionicons name="checkmark" size={13} color={colors.background} />}
              </View>
              <Text style={[styles.termsText, { color: colors.mutedForeground }]}>
                By selecting, you agree to BusinessHub Pro's {' '}
                <Text style={{ color: colors.foreground }}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={{ color: colors.foreground }}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
            {!!errors.terms && <Text style={[styles.fieldError, { marginTop: -8 }]}>{errors.terms}</Text>}

            {/* Register button */}
            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: colors.primary }, busy && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={busy}
              activeOpacity={0.88}
            >
              {isLoading
                ? <ActivityIndicator color={colors.primaryForeground} />
                : <>
                    <Text style={[styles.btnPrimaryText, { color: colors.primaryForeground }]}>Create Account</Text>
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

            {/* Google button */}
            <TouchableOpacity
              style={[
                styles.btnGoogle,
                googlePrefilled
                  ? { backgroundColor: colors.secondary, borderColor: colors.border }
                  : { backgroundColor: '#FFFFFF', borderColor: '#dadce0' },
                busy && { opacity: 0.5 },
              ]}
              onPress={googlePrefilled ? undefined : handleGooglePress}
              disabled={busy || googlePrefilled}
              activeOpacity={0.8}
            >
              {socialLoading === 'google'
                ? <ActivityIndicator color={googlePrefilled ? colors.foreground : '#000000'} size="small" />
                : googlePrefilled
                  ? <><Ionicons name="checkmark-circle" size={19} color={colors.foreground} /><Text style={[styles.btnGoogleText, { color: colors.foreground }]}>Google Connected</Text></>
                  : <><GoogleLogo size={20} /><Text style={[styles.btnGoogleText, { color: '#1F1F1F' }]}>Continue with Google</Text></>
              }
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.btnGoogle, { backgroundColor: colors.secondary, borderColor: colors.border, marginTop: 10 }, busy && { opacity: 0.5 }]}
                onPress={handleAppleSignUp}
                disabled={busy}
                activeOpacity={0.8}
              >
                {socialLoading === 'apple'
                  ? <ActivityIndicator color={colors.foreground} size="small" />
                  : <><Ionicons name="logo-apple" size={19} color={colors.foreground} /><Text style={[styles.btnGoogleText, { color: colors.foreground }]}>Continue with Apple</Text></>
                }
              </TouchableOpacity>
            )}
          </View>

          {/* Sign in link */}
          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: colors.mutedForeground }]}>Already have an account?{'  '}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} disabled={busy}>
              <Text style={[styles.switchLink, { color: colors.foreground }]}>Log In</Text>
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

  topBar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
  wordmark: { fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },
  backBtn:  { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },

  heroSection: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 28 },
  heroTitle:   { fontSize: 44, fontWeight: '900', letterSpacing: -1.5, lineHeight: 46, marginBottom: 12 },
  heroSub:     { fontSize: 15, lineHeight: 22 },

  form: { paddingHorizontal: 24, gap: 18, marginBottom: 24 },

  errorBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  errorBannerText: { flex: 1, fontSize: 13 },

  googleBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  googleBannerText: { flex: 1, fontSize: 13 },
  googleVerified:   { fontSize: 11, fontWeight: '600', marginTop: 4 },

  fieldWrap:  { gap: 6 },
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  fieldError: { fontSize: 11, color: '#ffb4ab', marginTop: 2 },
  input: {
    height: 54, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 20, fontSize: 15, backgroundColor: 'transparent',
  },
  inputWrap: {
    height: 54, borderWidth: 1, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', paddingHorizontal: 20,
  },
  inputInner: { flex: 1, fontSize: 15 },
  eyeBtn:     { padding: 4 },

  termsRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox:  { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  termsText: { flex: 1, fontSize: 12, lineHeight: 18 },

  btnPrimary:     { height: 56, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnPrimaryText: { fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  btnGoogle:      { height: 52, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnGoogleText:  { fontSize: 15, fontWeight: '600' },

  divider:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divLine:  { flex: 1, height: StyleSheet.hairlineWidth },
  divLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },

  switchRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  switchText: { fontSize: 14 },
  switchLink: { fontSize: 14, fontWeight: '700' },
});
