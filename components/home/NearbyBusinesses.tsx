import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BusinessCard } from './BusinessCard';
import { SkeletonBusinessCard } from '@/components/ui/Skeleton';

interface NearbyBusinessesProps {
  businesses: any[];
  /** Show skeleton placeholders instead of content */
  loading?: boolean;
  /** Cap the displayed list. If set, shows a "See All" button revealing the full list. */
  limit?: number;
}

export function NearbyBusinesses({ businesses, loading, limit }: NearbyBusinessesProps) {
  const { colors } = useTheme();

  const FG     = colors.foreground;
  const MUTED  = colors.mutedForeground;
  const BORDER = colors.border;

  const displayed = limit ? businesses.slice(0, limit) : businesses;
  const hasMore   = limit ? businesses.length > limit  : false;
  const skeletonCount = limit ?? 3;

  return (
    <View style={styles.section}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: FG }]}>
            AVAILABLE BUSINESSES
          </Text>
          {!loading && (
            <Text style={[styles.subtitle, { color: MUTED }]}>
              {businesses.length} {businesses.length === 1 ? 'business' : 'businesses'} found
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.seeAllBtn, { borderColor: BORDER }]}
          onPress={() => router.push('/(tabs)/map')}
          activeOpacity={0.7}
        >
          <Text style={[styles.seeAllText, { color: FG }]}>See All</Text>
          <Ionicons name="arrow-forward" size={12} color={FG} />
        </TouchableOpacity>
      </View>

      {/* Skeleton state */}
      {loading ? (
        <View style={styles.list}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <SkeletonBusinessCard key={i} />
          ))}
        </View>
      ) : businesses.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: BORDER }]}>
          <View style={[styles.emptyIconWrap, { borderColor: BORDER }]}>
            <Ionicons name="search-outline" size={28} color={FG} />
          </View>
          <Text style={[styles.emptyTitle, { color: FG }]}>No businesses found</Text>
          <Text style={[styles.emptySubtitle, { color: MUTED }]}>
            Try adjusting your search or category filter
          </Text>
          <TouchableOpacity
            style={[styles.exploreBtnRow, { borderColor: BORDER }]}
            onPress={() => router.push('/(tabs)/map')}
            activeOpacity={0.75}
          >
            <Ionicons name="map-outline" size={14} color={FG} />
            <Text style={[styles.exploreBtnText, { color: FG }]}>Explore on Map</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {displayed.map((business: any) => (
            <BusinessCard key={business.id} business={business} />
          ))}
          {hasMore && (
            <TouchableOpacity
              style={[styles.seeMoreRow, { borderColor: BORDER }]}
              onPress={() => router.push('/businesses')}
              activeOpacity={0.75}
            >
              <Text style={[styles.seeMoreText, { color: FG }]}>
                See {businesses.length - limit!} more businesses
              </Text>
              <Ionicons name="arrow-forward" size={14} color={FG} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 24, marginBottom: 24 },

  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle:  { fontSize: 16, fontWeight: '800', letterSpacing: -0.3, marginBottom: 2 },
  subtitle:      { fontSize: 11, fontWeight: '500' },
  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  seeAllText: { fontSize: 11, fontWeight: '700' },

  emptyBox: {
    borderRadius: 16, borderWidth: 1,
    paddingVertical: 36, paddingHorizontal: 24,
    alignItems: 'center', gap: 10,
  },
  emptyIconWrap: {
    width: 60, height: 60, borderRadius: 16, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  emptyTitle:    { fontSize: 15, fontWeight: '800' },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  list: { gap: 10 },
  exploreBtnRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10, marginTop: 4,
  },
  exploreBtnText: { fontSize: 13, fontWeight: '700' },

  seeMoreRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 4,
    borderWidth: 1, borderRadius: 12,
    paddingVertical: 14,
  },
  seeMoreText: { fontSize: 13, fontWeight: '700' },
});
