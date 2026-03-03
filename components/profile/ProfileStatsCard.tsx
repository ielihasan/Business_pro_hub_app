import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

interface ProfileStatsCardProps {
  loyaltyPoints: number;
  totalVisits: number;
  memberSince: string;
}

const STAT_CONFIGS = [
  { icon: 'star',        lightBg: '#FFFBEB', darkBg: '#422006', iconColor: '#D97706', key: 'points'  },
  { icon: 'storefront', lightBg: '#EFF6FF', darkBg: '#1e3a5f', iconColor: '#3B82F6', key: 'visits'  },
  { icon: 'calendar',   lightBg: '#F0FDF4', darkBg: '#052e16', iconColor: '#16A34A', key: 'since'   },
];

export function ProfileStatsCard({ loyaltyPoints, totalVisits, memberSince }: ProfileStatsCardProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const values = [
    loyaltyPoints.toLocaleString(),
    String(totalVisits),
    memberSince.split(' ')[0],
  ];

  return (
    <View style={styles.row}>
      {STAT_CONFIGS.map((cfg, i) => (
        <View
          key={cfg.key}
          style={[
            styles.tile,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: isDark ? cfg.darkBg : cfg.lightBg }]}>
            <Ionicons name={cfg.icon as any} size={18} color={cfg.iconColor} />
          </View>
          <Text style={[styles.value, { color: colors.foreground }]}>{values[i]}</Text>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>{t(`profile.stats.${cfg.key}`)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[4],
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[2],
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  value: { fontSize: Typography.fontSize.lg, fontWeight: '700', letterSpacing: -0.3 },
  label: { fontSize: Typography.fontSize.xs, marginTop: 2, textAlign: 'center' },
});
