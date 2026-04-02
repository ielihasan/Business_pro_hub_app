import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from '@/components/ui';
import { useStore } from '@/store/useStore';

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
  const key = Object.keys(CATEGORY_ICONS).find((k) => lower.includes(k));
  return key ? CATEGORY_ICONS[key] : CATEGORY_ICONS.default;
}

interface BusinessCardProps {
  business: any;
}

export function BusinessCard({ business }: BusinessCardProps) {
  const { colors }         = useTheme();
  const favoriteBusinesses = useStore((s) => s.favoriteBusinesses);
  const toggleFavorite     = useStore((s) => s.toggleFavorite);

  const FG     = colors.foreground;
  const CTA    = colors.primary;
  const CTA_FG = colors.primaryForeground;
  const MUTED  = colors.mutedForeground;
  const CARD   = colors.card;
  const BORDER = colors.border;
  const SEC    = colors.secondary;

  const isOpen   = business.is_open ?? false;
  const isFav    = favoriteBusinesses.includes(business.id);
  const accent   = isOpen ? colors.success : MUTED;

  const locationText = business.distanceKm != null
    ? `${(business.distanceKm as number).toFixed(1)} km away`
    : business.address ?? 'Location not listed';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/business/${business.id}`)}
      style={[styles.card, { backgroundColor: CARD, borderColor: BORDER }]}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accent }]} />

      <View style={styles.inner}>
        {/* ── Top row: avatar + info + heart ── */}
        <View style={styles.topRow}>
          <Avatar
            name={business.name}
            source={business.avatar_url ? { uri: business.avatar_url } : null}
            size="lg"
          />

          <View style={styles.infoBlock}>
            <Text style={[styles.name, { color: FG }]} numberOfLines={1}>
              {business.name}
            </Text>

            {/* Category pill */}
            <View style={[styles.catPill, { backgroundColor: SEC, borderColor: BORDER }]}>
              <Ionicons name={getCategoryIcon(business.category) as any} size={10} color={MUTED} />
              <Text style={[styles.catText, { color: MUTED }]} numberOfLines={1}>
                {business.category ?? 'General'}
              </Text>
            </View>

            {/* Location */}
            <View style={styles.locRow}>
              <Ionicons name="location-outline" size={11} color={MUTED} />
              <Text style={[styles.locText, { color: MUTED }]} numberOfLines={1}>
                {locationText}
              </Text>
            </View>
          </View>

          {/* Heart */}
          <TouchableOpacity
            onPress={() => toggleFavorite(business.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            style={styles.heartBtn}
          >
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={20}
              color={isFav ? colors.destructive : MUTED}
            />
          </TouchableOpacity>
        </View>

        {/* ── Divider ── */}
        <View style={[styles.divider, { backgroundColor: BORDER }]} />

        {/* ── Bottom row: status + rating + CTA ── */}
        <View style={styles.bottomRow}>
          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: accent + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: accent }]} />
            <Text style={[styles.statusText, { color: accent }]}>
              {isOpen ? 'Open Now' : 'Closed'}
            </Text>
          </View>

          <View style={styles.rightCluster}>
            {/* Rating */}
            {business.rating != null && (
              <View style={styles.ratingChip}>
                <Ionicons name="star" size={11} color={colors.warning ?? '#F59E0B'} />
                <Text style={[styles.ratingText, { color: FG }]}>
                  {typeof business.rating === 'number' ? business.rating.toFixed(1) : business.rating}
                </Text>
              </View>
            )}

            {/* CTA */}
            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: CTA }]}
              onPress={() => router.push(`/business/${business.id}`)}
              activeOpacity={0.8}
            >
              <Text style={[styles.ctaText, { color: CTA_FG }]}>View</Text>
              <Ionicons name="arrow-forward" size={13} color={CTA_FG} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },

  /* Top row */
  topRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoBlock: { flex: 1, gap: 5 },
  name:      { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },

  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1,
  },
  catText: { fontSize: 10, fontWeight: '600' },

  locRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locText: { fontSize: 11, flex: 1 },

  heartBtn: { paddingTop: 2 },

  /* Divider */
  divider: { height: StyleSheet.hairlineWidth },

  /* Bottom row */
  bottomRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot:    { width: 6, height: 6, borderRadius: 3 },
  statusText:   { fontSize: 11, fontWeight: '700' },

  rightCluster: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingChip:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText:   { fontSize: 12, fontWeight: '700' },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10,
  },
  ctaText: { fontSize: 12, fontWeight: '800' },
});
