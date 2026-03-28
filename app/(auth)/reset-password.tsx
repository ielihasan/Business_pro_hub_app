import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Dialog, { DialogConfig } from '@/components/ui/Dialog';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button, Input } from '@/components/ui';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogConfig | null>(null);

  const validate = () => {
    const newErrors = { password: '', confirmPassword: '' };
    let valid = true;

    if (!password) {
      newErrors.password = 'New password is required';
      valid = false;
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      valid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
      valid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleReset = async () => {
    if (!validate()) return;

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setLoading(false);
      setDialog({
        title: 'Error',
        message: error.message,
        icon: 'alert-circle-outline',
        iconVariant: 'destructive',
        actions: [{ label: 'OK', onPress: () => setDialog(null) }],
      });
      return;
    }

    // Sign out the recovery session so the user must log in with the new password.
    await supabase.auth.signOut();
    setLoading(false);

    setDialog({
      title: 'Password Updated',
      message: 'Your password has been reset successfully. Please sign in with your new password.',
      icon: 'checkmark-circle',
      iconVariant: 'success',
      actions: [{ label: 'Go to Login', onPress: () => { setDialog(null); router.replace('/(auth)/login'); } }],
    });
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
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
              <Ionicons name="lock-closed-outline" size={32} color={colors.foreground} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Set New Password
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Enter and confirm your new password below.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="New Password"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={(v) => { setPassword(v); setErrors(p => ({ ...p, password: '' })); }}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              leftIcon="lock-closed-outline"
              error={errors.password}
            />

            <Input
              label="Confirm New Password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setErrors(p => ({ ...p, confirmPassword: '' })); }}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              leftIcon="lock-closed-outline"
              error={errors.confirmPassword}
            />

            {/* Password requirements hint */}
            <View style={[styles.hint, { backgroundColor: colors.secondary, borderRadius: BorderRadius.lg }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.mutedForeground} />
              <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                Password must be at least 8 characters long.
              </Text>
            </View>

            <Button
              onPress={handleReset}
              loading={loading}
              style={styles.submitButton}
            >
              Reset Password
            </Button>
          </View>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => router.replace('/(auth)/login')}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={16} color={colors.mutedForeground} />
            <Text style={[styles.backToLoginText, { color: colors.mutedForeground }]}>
              Back to login
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      {dialog && <Dialog visible {...dialog} onDismiss={() => setDialog(null)} />}
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
  header: {
    alignItems: 'center',
    marginTop: Spacing[10],
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
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
  },
  hintText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
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
});
