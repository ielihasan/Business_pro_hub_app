import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, Button, Avatar, QueueStatusBadge, Progress, Separator } from '@/components/ui';
import { Typography, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

interface ActiveQueue {
  id: string;
  businessId: string;
  businessName: string;
  businessCategory: string;
  position: number;
  totalInQueue: number;
  estimatedWait: string;
  status: 'waiting' | 'in_progress' | 'serving' | 'completed' | 'cancelled';
  joinedAt: string;
  ticketNumber: string;
}

interface ActiveQueueItemProps {
  queue: ActiveQueue;
  onLeave: (id: string) => void;
}

export function ActiveQueueItem({ queue, onLeave }: ActiveQueueItemProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const total = queue.totalInQueue > 0 ? queue.totalInQueue : queue.position;
  const progressPercent = total > 0 ? ((total - queue.position + 1) / total) * 100 : 100;

  return (
    <TouchableOpacity onPress={() => router.push(`/queue/${queue.id}`)}>
      <Card>
        <CardContent>
          {/* Header */}
          <View style={styles.header}>
            <Avatar name={queue.businessName} size="lg" />
            <View style={styles.info}>
              <Text style={[styles.businessName, { color: colors.foreground }]}>{queue.businessName}</Text>
              <Text style={[styles.category, { color: colors.mutedForeground }]}>{queue.businessCategory}</Text>
              <View style={styles.ticketRow}>
                <Ionicons name="ticket-outline" size={14} color={colors.mutedForeground} />
                <Text style={[styles.ticketNumber, { color: colors.mutedForeground }]}>{queue.ticketNumber}</Text>
              </View>
            </View>
            <QueueStatusBadge status={queue.status} />
          </View>

          <Separator style={{ marginVertical: Spacing[4] }} />

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t('queue.card.your_position')}</Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>#{queue.position}</Text>
              <Text style={[styles.statSubtext, { color: colors.mutedForeground }]}>{t('queue.card.in_queue', { count: queue.totalInQueue })}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t('queue.card.est_wait')}</Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{queue.estimatedWait}</Text>
              <Text style={[styles.statSubtext, { color: colors.mutedForeground }]}>{t('queue.card.joined_at')} {queue.joinedAt}</Text>
            </View>
          </View>

          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>{t('queue.card.progress')}</Text>
              <Text style={[styles.progressPercent, { color: colors.foreground }]}>{Math.round(progressPercent)}%</Text>
            </View>
            <Progress value={progressPercent} />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              variant="outline"
              size="sm"
              onPress={() => onLeave(queue.id)}
              style={styles.actionButton}
              icon={<Ionicons name="exit-outline" size={16} color={colors.foreground} />}
            >
              {t('queue.card.leave')}
            </Button>
            <Button
              size="sm"
              onPress={() => router.push(`/queue/${queue.id}`)}
              style={styles.actionButton}
              icon={<Ionicons name="eye-outline" size={16} color={colors.primaryForeground} />}
            >
              {t('common.view_details')}
            </Button>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  info: { flex: 1 },
  businessName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold },
  category: { fontSize: Typography.fontSize.sm },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginTop: Spacing[1] },
  ticketNumber: { fontSize: Typography.fontSize.sm },
  statsContainer: { flexDirection: 'row', marginTop: Spacing[4] },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: Typography.fontSize.xs },
  statValue: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold },
  statSubtext: { fontSize: Typography.fontSize.xs },
  statDivider: { width: 1, marginHorizontal: Spacing[3] },
  progressContainer: { marginTop: Spacing[4] },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: Typography.fontSize.sm },
  progressPercent: { fontSize: Typography.fontSize.sm },
  actions: { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[4] },
  actionButton: { flex: 1 },
});
