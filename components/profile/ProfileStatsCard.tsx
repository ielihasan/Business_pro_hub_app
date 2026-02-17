import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent } from '@/components/ui';
import { Typography, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

interface ProfileStatsCardProps {
  loyaltyPoints: number;
  totalVisits: number;
  memberSince: string;
}

export function ProfileStatsCard({ loyaltyPoints, totalVisits, memberSince }: ProfileStatsCardProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <Card>
        <CardContent style={styles.statsContent}>
          <StatItem
            iconName="star"
            iconBgColor={colors.warning + '20'}
            iconColor={colors.warning}
            value={loyaltyPoints.toLocaleString()}
            label={t('profile.stats.points')}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StatItem
            iconName="location"
            iconBgColor={colors.info + '20'}
            iconColor={colors.info}
            value={String(totalVisits)}
            label={t('profile.stats.visits')}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StatItem
            iconName="calendar"
            iconBgColor={colors.success + '20'}
            iconColor={colors.success}
            value={memberSince.split(' ')[0]}
            label={t('profile.stats.since')}
          />
        </CardContent>
      </Card>
    </View>
  );
}

function StatItem({ iconName, iconBgColor, iconColor, value, label }: {
  iconName: string;
  iconBgColor: string;
  iconColor: string;
  value: string;
  label: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.statItem}>
      <View style={[styles.statIcon, { backgroundColor: iconBgColor }]}>
        <Ionicons name={iconName as any} size={20} color={iconColor} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: Spacing[6], marginBottom: Spacing[6] },
  statsContent: { flexDirection: 'row', alignItems: 'center', padding: Spacing[4] },
  statItem: { flex: 1, alignItems: 'center' },
  statIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing[2] },
  statValue: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold },
  statLabel: { fontSize: Typography.fontSize.xs, marginTop: Spacing[0.5] },
  divider: { width: 1, height: 50, marginHorizontal: Spacing[2] },
});
