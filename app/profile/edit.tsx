import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/useTheme';
import { Button, Input, Card, CardContent, Separator } from '@/components/ui';
import { Typography, Spacing } from '@/constants/theme';
import { useStore } from '@/store/useStore';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { user, updateFullProfile, changePassword, isLoading } = useStore();
  const { t } = useTranslation();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [errors, setErrors] = useState({ name: '', phone: '', password: '' });

  // Password change states
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateProfile = () => {
    let isValid = true;
    const newErrors = { name: '', phone: '', password: '' };

    if (!name.trim()) {
      newErrors.name = t('profile.edit.full_name_required');
      isValid = false;
    }

    if (phone && phone.length < 10) {
      newErrors.phone = t('profile.edit.phone_invalid');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validatePassword = () => {
    let isValid = true;
    const newErrors = { name: '', phone: '', password: '' };

    if (!currentPassword.trim()) {
      newErrors.password = t('profile.password.error_current_required');
      isValid = false;
    }

    if (!newPassword.trim()) {
      newErrors.password = t('profile.password.error_new_required');
      isValid = false;
    } else if (newPassword.length < 8) {
      newErrors.password = t('profile.password.error_min_length');
      isValid = false;
    }

    if (!confirmPassword.trim()) {
      newErrors.password = t('profile.password.error_confirm_required');
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      newErrors.password = t('profile.password.error_not_match');
      isValid = false;
    }

    if (currentPassword === newPassword) {
      newErrors.password = t('profile.password.error_same');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  const handleSave = async () => {
    if (!validateProfile()) return;

    try {
      const result = await updateFullProfile({
        name: name.trim(),
        phone: phone.trim(),
      });

      if (result.success) {
        Alert.alert(t('common.success'), t('profile.edit.success'), [
          { text: 'OK', onPress: handleBack }
        ]);
      } else {
        Alert.alert(t('common.error'), result.error || t('profile.edit.error'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'An unexpected error occurred');
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    try {
      const result = await changePassword(currentPassword, newPassword);

      if (result.success) {
        Alert.alert(t('common.success'), t('profile.password.success'), [
          {
            text: 'OK',
            onPress: () => {
              setShowPasswordSection(false);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }
          }
        ]);
      } else {
        Alert.alert(t('common.error'), result.error || t('profile.password.error_failed'));
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || 'An unexpected error occurred');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={colors.foreground}
          onPress={handleBack}
          style={styles.backIcon}
        />
        <Text style={[styles.title, { color: colors.foreground }]}>{t('profile.edit.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Profile Information Section */}
          <Card>
            <CardContent>
              <Input
                label={t('profile.edit.full_name')}
                value={name}
                onChangeText={setName}
                placeholder={t('profile.edit.full_name_placeholder')}
                error={errors.name}
                leftIcon="person-outline"
              />

              <View style={{ height: Spacing[4] }} />

              <Input
                label={t('profile.edit.phone')}
                value={phone}
                onChangeText={setPhone}
                placeholder={t('profile.edit.phone_placeholder')}
                keyboardType="phone-pad"
                error={errors.phone}
                leftIcon="call-outline"
              />
            </CardContent>
          </Card>

          <View style={styles.footer}>
            <Button
              onPress={handleSave}
              loading={isLoading}
              disabled={isLoading}
              icon={<Ionicons name="save-outline" size={20} color={colors.primaryForeground} />}
            >
              {t('profile.edit.save')}
            </Button>
          </View>

          {/* Password Change Section */}
          <View style={{ marginTop: Spacing[6] }}>
            <TouchableOpacity
              onPress={() => setShowPasswordSection(!showPasswordSection)}
              style={[styles.passwordToggle, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            >
              <View style={styles.passwordToggleLeft}>
                <Ionicons
                  name={showPasswordSection ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={colors.foreground}
                />
                <Text style={[styles.passwordToggleText, { color: colors.foreground }]}>
                  {t('profile.password.title')}
                </Text>
              </View>
              <Ionicons name="lock-closed-outline" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>

            {showPasswordSection && (
              <Card style={{ marginTop: Spacing[3] }}>
                <CardContent>
                  {errors.password ? (
                    <View style={[styles.errorBox, { backgroundColor: colors.destructive + '15' }]}>
                      <Ionicons
                        name="alert-circle"
                        size={16}
                        color={colors.destructive}
                        style={{ marginRight: Spacing[2] }}
                      />
                      <Text style={[styles.errorText, { color: colors.destructive }]}>
                        {errors.password}
                      </Text>
                    </View>
                  ) : null}

                  <Input
                    label={t('profile.password.current')}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder={t('profile.password.current_placeholder')}
                    secureTextEntry={!showCurrentPassword}
                    leftIcon="lock-closed-outline"
                    rightIcon={showCurrentPassword ? 'eye-off' : 'eye'}
                    onRightIconPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  />

                  <View style={{ height: Spacing[4] }} />

                  <Input
                    label={t('profile.password.new')}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder={t('profile.password.new_placeholder')}
                    secureTextEntry={!showNewPassword}
                    leftIcon="lock-closed-outline"
                    rightIcon={showNewPassword ? 'eye-off' : 'eye'}
                    onRightIconPress={() => setShowNewPassword(!showNewPassword)}
                  />

                  <View style={{ height: Spacing[4] }} />

                  <Input
                    label={t('profile.password.confirm')}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder={t('profile.password.confirm_placeholder')}
                    secureTextEntry={!showConfirmPassword}
                    leftIcon="lock-closed-outline"
                    rightIcon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />

                  <View style={{ height: Spacing[4] }} />

                  <Button
                    onPress={handleChangePassword}
                    loading={isLoading}
                    disabled={isLoading}
                    icon={<Ionicons name="checkmark-outline" size={20} color={colors.primaryForeground} />}
                  >
                    {t('profile.password.update')}
                  </Button>

                  <Button
                    variant="outline"
                    onPress={() => {
                      setShowPasswordSection(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setErrors({ name: '', phone: '', password: '' });
                    }}
                    style={{ marginTop: Spacing[2], borderColor: colors.border }}
                  >
                    {t('profile.password.cancel')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
  },
  backIcon: { padding: Spacing[1] },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  content: {
    padding: Spacing[4],
    paddingBottom: Spacing[6],
  },
  footer: {
    marginTop: Spacing[6],
  },
  passwordToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: 10,
    borderWidth: 1,
  },
  passwordToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  passwordToggleText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: 8,
    marginBottom: Spacing[4],
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
  },
});