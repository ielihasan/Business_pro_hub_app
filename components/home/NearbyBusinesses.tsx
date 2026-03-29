import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { BusinessCard } from './BusinessCard';

interface NearbyBusinessesProps {
  businesses: any[];
}

export function NearbyBusinesses({ businesses }: NearbyBusinessesProps) {
  const { colors } = useTheme();
  const { t }      = useTranslation();

  const FG     = colors.foreground;
  const MUTED  = colors.mutedForeground;
  const CARD   = colors.card;
  const BORDER = colors.border;

  return (
    <View style={styles.section}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: FG }]}>
            {t('home.nearby.title')}
          </Text>
          <Text style={[styles.subtitle, { color: MUTED }]}>
            {businesses.length} {businesses.length === 1 ? 'business' : 'businesses'} found
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/map')}
          style={[styles.seeAllBtn, { backgroundColor: CARD, borderColor: BORDER }]}
          activeOpacity={0.75}
        >
          <Text style={[styles.seeAllText, { color: FG }]}>{t('common.see_all')}</Text>
          <Ionicons name="arrow-forward-outline" size={12} color={FG} />
        </TouchableOpacity>
      </View>

      {/* Empty state */}
      {businesses.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: CARD, borderColor: BORDER }]}>
          <View style={[styles.emptyIconWrap, { borderColor: BORDER }]}>
            <Ionicons name="search-outline" size={28} color={FG} />
          </View>
          <Text style={[styles.emptyTitle, { color: FG }]}>No businesses found</Text>
          <Text style={[styles.emptySubtitle, { color: MUTED }]}>
            Try adjusting your search or category filter
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {businesses.map((business: any) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 24, marginBottom: 24 },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3, marginBottom: 2 },
  subtitle:     { fontSize: 11, fontWeight: '500' },

  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  seeAllText: { fontSize: 12, fontWeight: '700' },

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

  list: { gap: 1 },
});
