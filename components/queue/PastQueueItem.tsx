import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, Avatar, QueueStatusBadge } from '@/components/ui';
import { Typography, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

interface PastQueue {
  id: string;
  businessId: string;
  businessName: string;
  businessCategory: string;
  status: 'completed' | 'cancelled';
  completedAt: string;
  serviceTime?: string;
  ticketNumber: string;
}

interface PastQueueItemProps {
  queue: PastQueue;
}

export function PastQueueItem({ queue }: PastQueueItemProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity onPress={() => router.push(`/business/${queue.businessId}`)}>
      <Card>
        <CardContent>
          <View style={styles.header}>
            <Avatar name={queue.businessName} size="md" />
            <View style={styles.info}>
              <Text style={[styles.businessName, { color: colors.foreground }]}>{queue.businessName}</Text>
              <Text style={[styles.category, { color: colors.mutedForeground }]}>
                {queue.ticketNumber} • {queue.completedAt}
              </Text>
            </View>
            <QueueStatusBadge status={queue.status} />
          </View>
          {queue.status === 'completed' && queue.serviceTime && (
            <View style={styles.serviceTimeRow}>
              <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.serviceTimeText, { color: colors.mutedForeground }]}>
                {t('queue.card.service_time')}: {queue.serviceTime}
              </Text>
            </View>
          )}
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
  serviceTimeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginTop: Spacing[2] },
  serviceTimeText: { fontSize: Typography.fontSize.sm },
});
