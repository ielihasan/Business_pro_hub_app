import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

interface EmptyOrdersStateProps {
  filter: 'all' | 'active' | 'completed';
}

export function EmptyOrdersState({ filter }: EmptyOrdersStateProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const descKey = filter === 'active'
    ? 'orders.empty.active_desc'
    : filter === 'completed'
      ? 'orders.empty.completed_desc'
      : 'orders.empty.all_desc';

  return (
    <View style={styles.container}>
      <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
        <Ionicons name="receipt-outline" size={48} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>
        {t('orders.empty.title')}
      </Text>
      <Text style={[styles.text, { color: colors.mutedForeground }]}>
        {t(descKey)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing[16] },
  icon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing[6] },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.semibold, marginBottom: Spacing[2] },
  text: { fontSize: Typography.fontSize.base, textAlign: 'center', maxWidth: 280 },
});
