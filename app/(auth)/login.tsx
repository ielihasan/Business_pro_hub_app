import { useState } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button, Input } from '@/components/ui';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useStore } from '@/store/useStore';

export default function LoginScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const { login, isLoading, authError, clearAuthError } = useStore();

  const handleLogin = async () => {
    // Clear previous errors
    clearAuthError();

    // Validate
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Call Supabase login
    const result = await login({ email, password });

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      // Check if email not verified
      if (result.error?.includes('verify your email') || result.error?.includes('Email not confirmed')) {
        setShowVerifyModal(true);
      } else {
        // Show error alert
        Alert.alert(
          'Login Failed',
          result.error || 'Invalid email or password. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleSocialLogin = (provider: string) => {
    // Social login will be implemented later
    Alert.alert(
      'Coming Soon',
      `${provider} login will be available soon!`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Welcome back
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Sign in to continue managing your queues
            </Text>
          </View>

          {/* Error Message */}
          {authError && (
            <View style={[styles.errorContainer, { backgroundColor: colors.destructive + '20' }]}>
              <Ionicons name="alert-circle" size={20} color={colors.destructive} />
              <Text style={[styles.errorMessage, { color: colors.destructive }]}>
                {authError}
              </Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
              error={errors.email}
              editable={!isLoading}
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
              }}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              leftIcon="lock-closed-outline"
              error={errors.password}
              editable={!isLoading}
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push('/(auth)/forgot-password')}
              disabled={isLoading}
            >
              <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            <Button
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
              disabled={isLoading}
            >
              Sign In
            </Button>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>
              or continue with
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Social Login */}
          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={[
                styles.socialButton,
                { backgroundColor: colors.secondary, borderColor: colors.border },
              ]}
              onPress={() => handleSocialLogin('Google')}
              disabled={isLoading}
            >
              <Ionicons name="logo-google" size={20} color={colors.foreground} />
              <Text style={[styles.socialButtonText, { color: colors.foreground }]}>
                Google
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.socialButton,
                { backgroundColor: colors.secondary, borderColor: colors.border },
              ]}
              onPress={() => handleSocialLogin('Apple')}
              disabled={isLoading}
            >
              <Ionicons name="logo-apple" size={20} color={colors.foreground} />
              <Text style={[styles.socialButtonText, { color: colors.foreground }]}>
                Apple
              </Text>
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: colors.mutedForeground }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              disabled={isLoading}
            >
              <Text style={[styles.registerLink, { color: colors.primary }]}>
                Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Email Verification Required Modal */}
      <Modal
        visible={showVerifyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerifyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* Warning Icon */}
            <View style={[styles.modalIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="warning-outline" size={48} color="#F59E0B" />
            </View>

            {/* Title */}
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Email Not Verified
            </Text>

            {/* Description */}
            <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>
              Please verify your email address before signing in.
            </Text>
            <Text style={[styles.modalEmail, { color: colors.primary }]}>
              {email}
            </Text>

            {/* Tips */}
            <View style={[styles.tipsContainer, { backgroundColor: colors.secondary }]}>
              <View style={styles.tipRow}>
                <Ionicons name="mail-outline" size={16} color={colors.primary} />
                <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
                  Check your inbox for the verification email
                </Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons name="folder-outline" size={16} color={colors.primary} />
                <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
                  Also check your spam/junk folder
                </Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons name="link-outline" size={16} color={colors.primary} />
                <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
                  Click the link in the email to verify
                </Text>
              </View>
            </View>

            {/* Button */}
            <Button
              onPress={() => setShowVerifyModal(false)}
              style={styles.modalButton}
            >
              Got It
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[6],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
  header: {
    marginTop: Spacing[4],
    marginBottom: Spacing[8],
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[3],
    borderRadius: BorderRadius.DEFAULT,
    marginBottom: Spacing[4],
    gap: Spacing[2],
  },
  errorMessage: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
  },
  form: {
    gap: Spacing[4],
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  loginButton: {
    marginTop: Spacing[4],
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing[8],
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: Spacing[4],
    fontSize: Typography.fontSize.sm,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: 1,
    gap: Spacing[2],
  },
  socialButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[8],
  },
  registerText: {
    fontSize: Typography.fontSize.sm,
  },
  registerLink: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[6],
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    padding: Spacing[6],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  modalTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[3],
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    marginBottom: Spacing[2],
  },
  modalEmail: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[3],
    textAlign: 'center',
  },
  tipsContainer: {
    width: '100%',
    borderRadius: BorderRadius.DEFAULT,
    padding: Spacing[4],
    marginTop: Spacing[4],
    marginBottom: Spacing[4],
    gap: Spacing[3],
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  tipText: {
    fontSize: Typography.fontSize.sm,
    flex: 1,
  },
  modalButton: {
    width: '100%',
    marginTop: Spacing[2],
  },
});
