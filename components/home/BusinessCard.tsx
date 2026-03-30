import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

// Maps business_type values (synced from dashboard) to Ionicons names
const CATEGORY_ICONS: Record<string, string> = {
  'coffee shop':       'cafe-outline',
  'restaurant':        'restaurant-outline',
  'retail store':      'bag-handle-outline',
  'clinic':            'medical-outline',
  'healthcare':        'medical-outline',
  'salon':             'cut-outline',
  'barbershop':        'cut-outline',
  'bank':              'card-outline',
  'finance':           'card-outline',
  'government office': 'business-outline',
  'government':        'business-outline',
  'pharmacy':          'medkit-outline',
  'bakery':            'storefront-outline',
  'other':             'ellipsis-horizontal-outline',
  // legacy short-form ids
  'food':              'restaurant-outline',
  'health':            'medical-outline',
  'repair':            'construct-outline',
  'print':             'print-outline',
  'default':           'storefront-outline',
};

function getCategoryIcon(cat?: string): string {
  if (!cat) return CATEGORY_ICONS.default;
  const lower = cat.toLowerCase();
  if (CATEGORY_ICONS[lower]) return CATEGORY_ICONS[lower];
  // partial match for compound types like "Clinic / Healthcare"
  const key = Object.keys(CATEGORY_ICONS).find((k) => lower.includes(k));
  return key ? CATEGORY_ICONS[key] : CATEGORY_ICONS.default;
}

interface BusinessCardProps {
  business: any;
}

export function BusinessCard({ business }: BusinessCardProps) {
  const { colors } = useTheme();
  const { t }      = useTranslation();

  const FG     = colors.foreground;
  const MUTED  = colors.mutedForeground;
  const CARD   = colors.card;
  const BORDER = colors.border;
  const SEC    = colors.secondary;

  const initials = (business.name ?? '??')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  const isOpen = business.is_open ?? false;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => router.push(`/business/${business.id}`)}
      style={[styles.card, { backgroundColor: CARD, borderColor: BORDER }]}
    >
      <View style={styles.body}>
        {/* Avatar column */}
        <View style={styles.avatarCol}>
          <View style={[styles.avatar, { backgroundColor: SEC, borderColor: BORDER }]}>
            <Text style={[styles.initials, { color: FG }]}>{initials}</Text>
          </View>
          {/* Open/Closed dot */}
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: isOpen ? colors.success : MUTED }]} />
            <Text style={[styles.statusText, { color: isOpen ? colors.success : MUTED }]}>
              {isOpen ? t('common.open') : t('common.closed')}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.info}>
          {/* Name + category */}
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: FG }]} numberOfLines={1}>
              {business.name}
            </Text>
            <View style={[styles.catPill, { backgroundColor: SEC, borderColor: BORDER }]}>
              <Ionicons name={getCategoryIcon(business.category) as any} size={10} color={MUTED} />
              <Text style={[styles.catText, { color: MUTED }]}>
                {business.category ?? 'General'}
              </Text>
            </View>
          </View>

          {/* Distance / address + rating */}
          <View style={styles.metaRow}>
            <View style={[styles.metaChip, { flex: 1, flexShrink: 1 }]}>
              <Ionicons name="location-outline" size={11} color={MUTED} />
              <Text style={[styles.metaText, { color: MUTED }]} numberOfLines={1}>
                {business.distanceKm != null
                  ? `${(business.distanceKm as number).toFixed(1)} km away`
                  : business.address ?? 'Address not listed'}
              </Text>
            </View>
            {business.rating != null && (
              <View style={styles.metaChip}>
                <Ionicons name="star-outline" size={11} color={MUTED} />
                <Text style={[styles.metaText, { color: MUTED }]}>{business.rating}</Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: BORDER }]} />

          {/* Stats + join */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: FG }]}>
                {business.queue_length ?? 0}
              </Text>
              <Text style={[styles.statLbl, { color: MUTED }]}>
                {t('home.nearby.in_queue')}
              </Text>
            </View>
            <View style={[styles.statSep, { backgroundColor: BORDER }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: FG }]}>
                {business.wait_time ?? '–'}
              </Text>
              <Text style={[styles.statLbl, { color: MUTED }]}>
                {t('home.nearby.wait_time')}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: FG }]}
              onPress={() => router.push(`/business/${business.id}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-forward" size={14} color={CARD} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16, borderWidth: 1,
    marginBottom: 10, overflow: 'hidden',
  },
  body:      { flexDirection: 'row', padding: 16, gap: 14 },
  avatarCol: { alignItems: 'center', gap: 8 },
  avatar: {
    width: 56, height: 56, borderRadius: 14, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  initials:   { fontSize: 18, fontWeight: '800' },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot:        { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '700' },

  info:    { flex: 1, gap: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name:    { fontSize: 15, fontWeight: '800', flex: 1 },
  catPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1, gap: 4,
  },
  catText: { fontSize: 10, fontWeight: '600' },

  metaRow:  { flexDirection: 'row', gap: 14 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11 },

  divider: { height: 1 },

  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statItem: { alignItems: 'center' },
  statVal:  { fontSize: 15, fontWeight: '800' },
  statLbl:  { fontSize: 10, fontWeight: '500' },
  statSep:  { width: 1, height: 24, marginHorizontal: 2 },
  joinBtn: {
    marginLeft: 'auto',
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
});
