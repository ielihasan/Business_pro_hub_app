import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { Typography, Spacing } from '@/constants/theme';
import { useStore } from '@/store/useStore';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { user, updateFullProfile, isLoading } = useStore();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [errors, setErrors] = useState({ name: '', phone: '' });

  const validate = () => {
    let isValid = true;
    const newErrors = { name: '', phone: '' };

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
      isValid = false;
    }

    if (phone && phone.length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
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
    if (!validate()) return;

    try {
      const result = await updateFullProfile({
        name: name.trim(),
        phone: phone.trim(),
      });

      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: handleBack }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
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
        <Text style={[styles.title, { color: colors.foreground }]}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Card>
            <CardContent>
              <Input
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                error={errors.name}
                leftIcon="person-outline"
              />

              <View style={{ height: Spacing[4] }} />

              <Input
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
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
              Save Changes
            </Button>
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
  },
  footer: {
    marginTop: Spacing[6],
  },
});