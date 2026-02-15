<<<<<<< HEAD
import { useState, useEffect } from 'react';
=======
import { useState } from 'react';
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
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
<<<<<<< HEAD
  ActivityIndicator,
=======
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
<<<<<<< HEAD
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
=======
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
import { useTheme } from '@/hooks/useTheme';
import { Button, Input } from '@/components/ui';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useStore } from '@/store/useStore';
<<<<<<< HEAD
import { signInWithGoogle, signInWithApple } from '@/lib/oauth';

WebBrowser.maybeCompleteAuthSession();
=======
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5

export default function RegisterScreen() {
  const { colors } = useTheme();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
<<<<<<< HEAD
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  const { register, isLoading, authError, clearAuthError } = useStore();

  // Google Auth Config
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
    redirectUrl: 'businesshubpro://oauth/google/callback',
  });

  // Handle Google OAuth response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      if (id_token) {
        handleGoogleSignUp(id_token);
      }
    }
  }, [googleResponse]);

=======

  const { register, isLoading, authError, clearAuthError } = useStore();

>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

<<<<<<< HEAD
  const handleGoogleSignUp = async (idToken: string) => {
    setSocialLoading('google');
    try {
      const result = await signInWithGoogle(idToken);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Google Sign-Up Failed', result.error || 'Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleGooglePress = async () => {
    try {
      const result = await googlePromptAsync();
      if (result?.type !== 'success') {
        console.log('Google sign-up cancelled or error');
      }
    } catch (error) {
      console.error('Google sign-up error:', error);
      Alert.alert('Error', 'Failed to initiate Google sign-up.');
    }
  };

  const handleAppleSignUp = async () => {
    setSocialLoading('apple');
    try {
      const result = await signInWithApple();
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Apple Sign-Up Failed', result.error || 'Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred.');
    } finally {
      setSocialLoading(null);
    }
  };

=======
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
  const handleRegister = async () => {
    // Clear previous errors
    clearAuthError();

    if (!validateForm()) return;

    // Call Supabase register
    const result = await register({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      phone: formData.phone,
    });

    if (result.success) {
      // Check if session exists (email confirmation disabled) or not (email confirmation enabled)
      const { session } = useStore.getState();

      if (session) {
        // Email confirmation disabled - user can proceed directly
        Alert.alert(
          'Registration Successful',
          'Your account has been created successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      } else {
        // Email confirmation enabled - show verification modal
        setRegisteredEmail(formData.email);
        setShowVerificationModal(true);
      }
    } else {
      // Check if it's a duplicate email error
      if (result.error?.includes('already registered')) {
        Alert.alert(
          'Email Already Registered',
          'This email is already registered. Please sign in or use a different email address.',
          [
            { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
            { text: 'Try Again', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert(
          'Registration Failed',
          result.error || 'Something went wrong. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleSocialSignup = (provider: string) => {
    Alert.alert(
      'Coming Soon',
      `${provider} signup will be available soon!`,
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
              Create account
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Join thousands of customers enjoying smart queue management
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
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChangeText={(value) => updateField('fullName', value)}
              autoCapitalize="words"
              autoComplete="name"
              leftIcon="person-outline"
              error={errors.fullName}
              editable={!isLoading}
            />

            <Input
              label="Email"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
              error={errors.email}
              editable={!isLoading}
            />

            <Input
              label="Phone Number"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              keyboardType="phone-pad"
              autoComplete="tel"
              leftIcon="call-outline"
              error={errors.phone}
              editable={!isLoading}
            />

            <Input
              label="Password"
              placeholder="Create a password"
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              leftIcon="lock-closed-outline"
              error={errors.password}
              hint="Must be at least 8 characters"
<<<<<<< HEAD
              editable={!isLoading && socialLoading === null}
=======
              editable={!isLoading}
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              secureTextEntry
              autoCapitalize="none"
              leftIcon="lock-closed-outline"
              error={errors.confirmPassword}
<<<<<<< HEAD
              editable={!isLoading && socialLoading === null}
=======
              editable={!isLoading}
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
            />

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
<<<<<<< HEAD
              disabled={isLoading || socialLoading !== null}
=======
              disabled={isLoading}
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: errors.terms ? colors.destructive : colors.border,
                    backgroundColor: agreedToTerms ? colors.primary : 'transparent',
                  },
                ]}
              >
                {agreedToTerms && (
                  <Ionicons name="checkmark" size={16} color={colors.primaryForeground} />
                )}
              </View>
              <Text style={[styles.termsText, { color: colors.mutedForeground }]}>
                I agree to the{' '}
                <Text style={{ color: colors.primary }}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={{ color: colors.primary }}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
            {errors.terms && (
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {errors.terms}
              </Text>
            )}

            <Button
              onPress={handleRegister}
              loading={isLoading}
              style={styles.registerButton}
<<<<<<< HEAD
              disabled={isLoading || socialLoading !== null}
=======
              disabled={isLoading}
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
            >
              Create Account
            </Button>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>
              or sign up with
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Social Signup */}
          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={[
                styles.socialButton,
<<<<<<< HEAD
                { 
                  backgroundColor: colors.secondary, 
                  borderColor: colors.border,
                  opacity: (isLoading || socialLoading !== null) ? 0.5 : 1
                },
              ]}
              onPress={handleGooglePress}
              disabled={isLoading || socialLoading !== null}
            >
              {socialLoading === 'google' ? (
                <ActivityIndicator color={colors.foreground} size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color={colors.foreground} />
                  <Text style={[styles.socialButtonText, { color: colors.foreground }]}>
                    Google
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  { 
                    backgroundColor: colors.secondary, 
                    borderColor: colors.border,
                    opacity: (isLoading || socialLoading !== null) ? 0.5 : 1
                  },
                ]}
                onPress={handleAppleSignUp}
                disabled={isLoading || socialLoading !== null}
              >
                {socialLoading === 'apple' ? (
                  <ActivityIndicator color={colors.foreground} size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={20} color={colors.foreground} />
                    <Text style={[styles.socialButtonText, { color: colors.foreground }]}>
                      Apple
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
=======
                { backgroundColor: colors.secondary, borderColor: colors.border },
              ]}
              onPress={() => handleSocialSignup('Google')}
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
              onPress={() => handleSocialSignup('Apple')}
              disabled={isLoading}
            >
              <Ionicons name="logo-apple" size={20} color={colors.foreground} />
              <Text style={[styles.socialButtonText, { color: colors.foreground }]}>
                Apple
              </Text>
            </TouchableOpacity>
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: colors.mutedForeground }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              disabled={isLoading}
            >
              <Text style={[styles.loginLink, { color: colors.primary }]}>
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Email Verification Modal */}
      <Modal
        visible={showVerificationModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* Email Icon */}
            <View style={[styles.modalIconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="mail-outline" size={48} color={colors.primary} />
            </View>

            {/* Title */}
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Verify Your Email
            </Text>

            {/* Description */}
            <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>
              We've sent a verification link to:
            </Text>
            <Text style={[styles.modalEmail, { color: colors.primary }]}>
              {registeredEmail}
            </Text>
            <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>
              Please check your inbox and click the link to verify your account before signing in.
            </Text>

            {/* Tips */}
            <View style={[styles.tipsContainer, { backgroundColor: colors.secondary }]}>
              <View style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
                  Check your spam/junk folder
                </Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
                  Email may take a few minutes to arrive
                </Text>
              </View>
            </View>

            {/* Button */}
            <Button
              onPress={() => {
                setShowVerificationModal(false);
                router.replace('/(auth)/login');
              }}
              style={styles.modalButton}
            >
              Go to Sign In
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
    marginTop: Spacing[2],
    marginBottom: Spacing[6],
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    marginTop: -Spacing[2],
  },
  registerButton: {
    marginTop: Spacing[4],
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing[6],
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[6],
  },
  loginText: {
    fontSize: Typography.fontSize.sm,
  },
  loginLink: {
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
    gap: Spacing[2],
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
