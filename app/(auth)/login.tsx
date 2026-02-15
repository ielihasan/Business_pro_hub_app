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
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTheme } from '@/hooks/useTheme';
import { Button, Input } from '@/components/ui';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { signInWithGoogle, signInWithApple } from '@/lib/oauth';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  const { login, isLoading, authError, clearAuthError } = useStore();

  // Google Auth Config
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
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    const result = await login({ email, password });
    if (result.success) router.replace('/(tabs)');
    else {
      if (result.error?.includes('verify your email') || result.error?.includes('Email not confirmed')) setShowVerifyModal(true);
      else Alert.alert('Login Failed', result.error || 'Invalid email or password. Please try again.', [{ text: 'OK' }]);
    }
  };

  const handleGoogleSignIn = async (idToken: string) => {
    setSocialLoading('google');
    try {
      const result = await signInWithGoogle(idToken);
      if (result.success) router.replace('/(tabs)');
      else Alert.alert('Google Sign-In Failed', result.error || 'Please try again.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred.');
    } finally { setSocialLoading(null); }
  };

  const handleGooglePress = async () => {
    try {
      const result = await googlePromptAsync();
      if (result?.type !== 'success') console.log('Google sign-in cancelled or error');
    } catch (error) { console.error('Google sign-in error:', error); Alert.alert('Error', 'Failed to initiate Google sign-in.'); }
  };

  const handleAppleSignIn = async () => {
    setSocialLoading('apple');
    try {
      const result = await signInWithApple();
      if (result.success) router.replace('/(tabs)');
      else Alert.alert('Apple Sign-In Failed', result.error || 'Please try again.');
    } catch (error: any) { Alert.alert('Error', error.message || 'An unexpected error occurred.'); }
    finally { setSocialLoading(null); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Sign in to continue managing your queues</Text>
          </View>

          {authError && (
            <View style={[styles.errorContainer, { backgroundColor: colors.destructive + '20' }]}>
              <Ionicons name="alert-circle" size={20} color={colors.destructive} />
              <Text style={[styles.errorMessage, { color: colors.destructive }]}>{authError}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Input label="Email" placeholder="Enter your email" value={email} onChangeText={(text) => { setEmail(text); if (errors.email) setErrors((p) => ({ ...p, email: '' })); }} keyboardType="email-address" autoCapitalize="none" autoComplete="email" leftIcon="mail-outline" error={errors.email} editable={!isLoading && socialLoading === null} />
            <Input label="Password" placeholder="Enter your password" value={password} onChangeText={(text) => { setPassword(text); if (errors.password) setErrors((p) => ({ ...p, password: '' })); }} secureTextEntry autoCapitalize="none" autoComplete="password" leftIcon="lock-closed-outline" error={errors.password} editable={!isLoading && socialLoading === null} />

            <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/(auth)/forgot-password')} disabled={isLoading || socialLoading !== null}>
              <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot password?</Text>
            </TouchableOpacity>

            <Button onPress={handleLogin} loading={isLoading} style={styles.loginButton} disabled={isLoading || socialLoading !== null}>Sign In</Button>
          </View>

          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or continue with</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: (isLoading || socialLoading !== null) ? 0.5 : 1 }]} onPress={handleGooglePress} disabled={isLoading || socialLoading !== null}>
              {socialLoading === 'google' ? <ActivityIndicator color={colors.foreground} size="small" /> : <><Ionicons name="logo-google" size={20} color={colors.foreground} /><Text style={[styles.socialButtonText, { color: colors.foreground }]}>Google</Text></>}
            </TouchableOpacity>
            {Platform.OS === 'ios' && (<TouchableOpacity style={[styles.socialButton, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: (isLoading || socialLoading !== null) ? 0.5 : 1 }]} onPress={handleAppleSignIn} disabled={isLoading || socialLoading !== null}>{socialLoading === 'apple' ? <ActivityIndicator color={colors.foreground} size="small" /> : <><Ionicons name="logo-apple" size={20} color={colors.foreground} /><Text style={[styles.socialButtonText, { color: colors.foreground }]}>Apple</Text></>}</TouchableOpacity>)}
          </View>

          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: colors.mutedForeground }]}>Don't have an account?{' '}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')} disabled={isLoading}>
              <Text style={[styles.registerLink, { color: colors.primary }]}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showVerifyModal} transparent animationType="fade" onRequestClose={() => setShowVerifyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: '#FEF3C7' }]}><Ionicons name="warning-outline" size={48} color="#F59E0B" /></View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Email Not Verified</Text>
            <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>Please verify your email address before signing in. Check your inbox for the verification link.</Text>
            <Button onPress={() => setShowVerifyModal(false)} style={styles.modalButton}>OK</Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing[6], paddingBottom: Spacing[6] },
  backButton: { width: 40, height: 40, justifyContent: 'center', marginTop: Spacing[2] },
  header: { marginTop: Spacing[2], marginBottom: Spacing[6] },
  title: { fontSize: Typography.fontSize['3xl'], fontWeight: Typography.fontWeight.bold, marginBottom: Spacing[2] },
  subtitle: { fontSize: Typography.fontSize.base, lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed },
  errorContainer: { flexDirection: 'row', alignItems: 'center', padding: Spacing[3], borderRadius: BorderRadius.DEFAULT, marginBottom: Spacing[4], gap: Spacing[2] },
  errorMessage: { flex: 1, fontSize: Typography.fontSize.sm },
  form: { gap: Spacing[4] },
  forgotPassword: { alignSelf: 'flex-end' },
  forgotPasswordText: { fontSize: Typography.fontSize.sm },
  loginButton: { marginTop: Spacing[4] },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing[6] },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { paddingHorizontal: Spacing[4], fontSize: Typography.fontSize.sm },
  socialButtons: { flexDirection: 'row', gap: Spacing[3] },
  socialButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: BorderRadius.DEFAULT, borderWidth: 1, gap: Spacing[2] },
  socialButtonText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium },
  registerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing[6] },
  registerText: { fontSize: Typography.fontSize.sm },
  registerLink: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: Spacing[6] },
  modalContent: { width: '100%', maxWidth: 400, borderRadius: BorderRadius.xl, padding: Spacing[6], alignItems: 'center' },
  modalIconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing[4] },
  modalTitle: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, marginBottom: Spacing[3], textAlign: 'center' },
  modalDescription: { fontSize: Typography.fontSize.base, textAlign: 'center', marginBottom: Spacing[3] },
  modalButton: { width: '100%' },
});
