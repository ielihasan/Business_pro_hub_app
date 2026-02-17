import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui';
import { Typography, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

interface QueueEmptyStateProps {
  type: 'active' | 'history';
}

export function QueueEmptyState({ type }: QueueEmptyStateProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const isActive = type === 'active';

  return (
    <View style={styles.container}>
      <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
        <Ionicons
          name={isActive ? 'list-outline' : 'time-outline'}
          size={48}
          color={colors.mutedForeground}
        />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>
        {t(isActive ? 'queue.empty.active_title' : 'queue.empty.history_title')}
      </Text>
      <Text style={[styles.text, { color: colors.mutedForeground }]}>
        {t(isActive ? 'queue.empty.active_desc' : 'queue.empty.history_desc')}
      </Text>
      {isActive && (
        <Button
          onPress={() => router.push('/(tabs)/scan')}
          style={styles.button}
          icon={<Ionicons name="qr-code-outline" size={18} color={colors.primaryForeground} />}
        >
          {t('queue.empty.scan_button')}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: Spacing[6], gap: Spacing[4] },
  icon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold },
  text: { fontSize: Typography.fontSize.base, textAlign: 'center' },
  button: { marginTop: Spacing[4] },
});
