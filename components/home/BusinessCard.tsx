import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

const CATEGORY_COLORS: Record<string, { color: string; light: string; icon: string }> = {
  food:    { color: '#F97316', light: '#FFF7ED', icon: 'restaurant' },
  health:  { color: '#EF4444', light: '#FEF2F2', icon: 'medical' },
  salon:   { color: '#EC4899', light: '#FDF2F8', icon: 'cut' },
  repair:  { color: '#F59E0B', light: '#FFFBEB', icon: 'construct' },
  print:   { color: '#3B82F6', light: '#EFF6FF', icon: 'print' },
  default: { color: '#6366F1', light: '#EEF2FF', icon: 'storefront' },
};

function getCategoryStyle(cat?: string) {
  if (!cat) return CATEGORY_COLORS.default;
  const lc = cat.toLowerCase();
  return CATEGORY_COLORS[lc] ?? CATEGORY_COLORS.default;
}

interface BusinessCardProps {
  business: any;
}

export function BusinessCard({ business }: BusinessCardProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const catStyle = getCategoryStyle(business.category);

  const initials = (business.name ?? '??')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  const isOpen = business.is_open ?? false;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => router.push(`/business/${business.id}`)}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF',
            borderColor: isDark ? '#2E2E40' : '#F1F3FA',
            shadowColor: catStyle.color,
          },
        ]}
      >
        {/* Category accent top bar */}
        <View style={[styles.topBar, { backgroundColor: catStyle.color }]} />

        <View style={styles.body}>
          {/* Avatar + open badge */}
          <View style={styles.avatarCol}>
            <View style={[styles.avatar, { backgroundColor: catStyle.light }]}>
              <Text style={[styles.initials, { color: catStyle.color }]}>{initials}</Text>
            </View>
            <View style={[styles.openBadge, { backgroundColor: isOpen ? '#D1FAE5' : '#F3F4F6' }]}>
              <View style={[styles.openDot, { backgroundColor: isOpen ? '#10B981' : '#9CA3AF' }]} />
              <Text style={[styles.openText, { color: isOpen ? '#059669' : '#6B7280' }]}>
                {isOpen ? t('common.open') : t('common.closed')}
              </Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                {business.name}
              </Text>
              <View style={[styles.catPill, { backgroundColor: catStyle.light }]}>
                <Ionicons name={(catStyle.icon + '-outline') as any} size={11} color={catStyle.color} />
                <Text style={[styles.catText, { color: catStyle.color }]}>{business.category ?? 'General'}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Ionicons name="location-outline" size={12} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  {business.distanceKm ? `${business.distanceKm.toFixed(1)} km` : '–'}
                </Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  {business.rating ?? '–'}
                </Text>
              </View>
            </View>

            {/* Stats divider */}
            <View style={[styles.divider, { backgroundColor: isDark ? '#2E2E40' : '#F1F3FA' }]} />

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: catStyle.color }]}>
                  {business.queue_length ?? 0}
                </Text>
                <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>
                  {t('home.nearby.in_queue')}
                </Text>
              </View>
              <View style={[styles.statSep, { backgroundColor: isDark ? '#2E2E40' : '#F1F3FA' }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: catStyle.color }]}>
                  {business.wait_time ?? '–'}
                </Text>
                <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>
                  {t('home.nearby.wait_time')}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.joinBtn, { backgroundColor: catStyle.color }]}
                onPress={() => router.push(`/business/${business.id}`)}
              >
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: Spacing[3],
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  topBar: { height: 4 },
  body: { flexDirection: 'row', padding: Spacing[4], gap: Spacing[3] },
  avatarCol: { alignItems: 'center', gap: Spacing[2] },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: { fontSize: 18, fontWeight: Typography.fontWeight.bold },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 3,
  },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openText: { fontSize: 10, fontWeight: '600' },
  info: { flex: 1, gap: Spacing[2] },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], flexWrap: 'wrap' },
  name: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, flex: 1 },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 3,
  },
  catText: { fontSize: 10, fontWeight: '600' },
  metaRow: { flexDirection: 'row', gap: Spacing[3] },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: Typography.fontSize.xs },
  divider: { height: 1, borderRadius: 1 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold },
  statLbl: { fontSize: Typography.fontSize.xs },
  statSep: { width: 1, height: 28, marginHorizontal: 2 },
  joinBtn: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

