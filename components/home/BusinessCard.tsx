import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, Badge, Avatar } from '@/components/ui';
import { Typography, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

interface BusinessCardProps {
  business: any;
}

export function BusinessCard({ business }: BusinessCardProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity onPress={() => router.push(`/business/${business.id}`)}>
      <Card style={styles.card}>
        <CardContent style={styles.content}>
          <View style={styles.header}>
            <Avatar name={business.name} size="lg" />
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                {business.name}
              </Text>
              <Text style={[styles.category, { color: colors.mutedForeground }]}>
                {business.category}
              </Text>
              <View style={styles.meta}>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                    {business.distanceKm ? `${business.distanceKm.toFixed(2)} km` : '-'}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                    {business.rating}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View style={[styles.stats, { borderTopColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {business.queue_length ?? '-'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                {t('home.nearby.in_queue')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {business.wait_time ?? '-'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                {t('home.nearby.wait_time')}
              </Text>
            </View>
            <Badge variant={business.isOpen ? 'success' : 'secondary'}>
              {business.is_open ? t('common.open') : t('common.closed')}
            </Badge>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 0 },
  content: { padding: Spacing[4] },
  header: { flexDirection: 'row', marginBottom: Spacing[4] },
  info: { flex: 1, marginLeft: Spacing[4] },
  name: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, marginBottom: Spacing[0.5] },
  category: { fontSize: Typography.fontSize.sm, marginBottom: Spacing[2] },
  meta: { flexDirection: 'row', gap: Spacing[4] },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1] },
  metaText: { fontSize: Typography.fontSize.xs },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing[4],
    borderTopWidth: 1,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold },
  statLabel: { fontSize: Typography.fontSize.xs },
});
