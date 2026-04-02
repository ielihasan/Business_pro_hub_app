import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import Dialog, { DialogConfig } from '@/components/ui/Dialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/useTheme';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { Typography, Spacing } from '@/constants/theme';
import { useStore } from '@/store/useStore';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { user, updateFullProfile, isLoading } = useStore();
  const { t } = useTranslation();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [errors, setErrors] = useState({ name: '', phone: '' });
  const [dialog, setDialog] = useState<DialogConfig | null>(null);

  const validateProfile = () => {
    let isValid = true;
    const newErrors = { name: '', phone: '' };

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
        setDialog({
          title: t('common.success'),
          message: t('profile.edit.success'),
          icon: 'checkmark-circle',
          iconVariant: 'success',
          actions: [{ label: 'OK', onPress: () => { setDialog(null); handleBack(); } }],
        });
      } else {
        setDialog({
          title: t('common.error'),
          message: result.error || t('profile.edit.error'),
          icon: 'alert-circle-outline',
          iconVariant: 'destructive',
          actions: [{ label: 'OK', onPress: () => setDialog(null) }],
        });
      }
    } catch (error) {
      setDialog({
        title: t('common.error'),
        message: 'An unexpected error occurred',
        icon: 'alert-circle-outline',
        iconVariant: 'destructive',
        actions: [{ label: 'OK', onPress: () => setDialog(null) }],
      });
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

        </ScrollView>
      </KeyboardAvoidingView>
      {dialog && <Dialog visible {...dialog} onDismiss={() => setDialog(null)} />}
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