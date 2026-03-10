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
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    setError('');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'businesshubpro://auth/callback',
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'businesshubpro://auth/callback',
    });
    setLoading(false);
    if (resetError) {
      Alert.alert('Error', resetError.message);
    } else {
      Alert.alert('Sent', 'A new reset link has been sent to your email.');
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>

          <View style={styles.successContainer}>
            <View style={[styles.successIcon, { backgroundColor: colors.success }]}>
              <Ionicons name="mail" size={40} color="#FFFFFF" />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>
              Check your email
            </Text>
            <Text style={[styles.successMessage, { color: colors.mutedForeground }]}>
              We've sent a password reset link to{'\n'}
              <Text style={{ color: colors.foreground, fontWeight: Typography.fontWeight.medium }}>
                {email}
              </Text>
            </Text>

            <Card style={styles.infoCard}>
              <CardContent>
                <View style={styles.infoRow}>
                  <Ionicons name="information-circle-outline" size={20} color={colors.mutedForeground} />
                  <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                    Didn't receive the email? Check your spam folder or try resending.
                  </Text>
                </View>
              </CardContent>
            </Card>

            <Button
              onPress={handleResend}
              loading={loading}
              variant="outline"
              style={styles.resendButton}
            >
              Resend Email
            </Button>

            <Button
              onPress={() => router.push('/(auth)/login')}
              style={styles.backToLoginButton}
            >
              Back to Login
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
            <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
              <Ionicons name="key-outline" size={32} color={colors.foreground} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Forgot password?
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              No worries, we'll send you reset instructions.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (error) setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
              error={error}
            />

            <Button
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
            >
              Reset Password
            </Button>
          </View>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => router.push('/(auth)/login')}
          >
            <Ionicons name="arrow-back" size={16} color={colors.mutedForeground} />
            <Text style={[styles.backToLoginText, { color: colors.mutedForeground }]}>
              Back to login
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    marginTop: Spacing[8],
    marginBottom: Spacing[8],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },
  form: {
    gap: Spacing[4],
  },
  submitButton: {
    marginTop: Spacing[2],
  },
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    marginTop: Spacing[8],
  },
  backToLoginText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  // Success state styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing[8],
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  successTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  successMessage: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    marginBottom: Spacing[6],
  },
  infoCard: {
    width: '100%',
    marginBottom: Spacing[6],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  resendButton: {
    width: '100%',
    marginBottom: Spacing[3],
  },
  backToLoginButton: {
    width: '100%',
  },
});
