import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, QueueStatusBadge } from '@/components/ui';
import { Typography, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

interface ActiveQueue {
  id: string;
  businessName: string;
  position: number;
  estimatedWait: string;
  status: 'waiting' | 'serving' | 'completed' | 'cancelled';
}

interface ActiveQueueCardProps {
  queue: ActiveQueue;
}

export function ActiveQueueCard({ queue }: ActiveQueueCardProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={styles.section}
      onPress={() => router.push(`/queue/${queue.id}`)}
    >
      <Card style={[styles.card, { borderColor: colors.primary, borderWidth: 2 }]}>
        <CardContent style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                {t('home.active_queue.title')}
              </Text>
              <Text style={[styles.businessName, { color: colors.foreground }]}>
                {queue.businessName}
              </Text>
            </View>
            <QueueStatusBadge status={queue.status} />
          </View>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                #{queue.position}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                {t('home.active_queue.position')}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {queue.estimatedWait}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                {t('home.active_queue.est_wait')}
              </Text>
            </View>
          </View>
          <View style={styles.viewDetailsRow}>
            <Text style={[styles.viewDetailsText, { color: colors.primary }]}>
              {t('common.view_details')}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing[6],
    marginBottom: Spacing[6],
  },
  card: { marginBottom: 0 },
  content: { padding: Spacing[4] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[4],
  },
  label: { fontSize: Typography.fontSize.xs, marginBottom: Spacing[1] },
  businessName: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold },
  stats: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[4] },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold },
  statLabel: { fontSize: Typography.fontSize.xs },
  divider: { width: 1, height: 40, marginHorizontal: Spacing[4] },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1],
  },
  viewDetailsText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium },
});
