import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { BusinessCard } from './BusinessCard';

interface NearbyBusinessesProps {
  businesses: any[];
}

export function NearbyBusinesses({ businesses }: NearbyBusinessesProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleGroup}>
          <View style={styles.iconPill}>
            <Ionicons name="storefront-outline" size={16} color="#6366F1" />
          </View>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('home.nearby.title')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {businesses.length} {businesses.length === 1 ? 'business' : 'businesses'} found
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/map')}
          style={[styles.seeAllBtn, { backgroundColor: isDark ? '#1E1E2E' : '#EEF2FF', borderColor: isDark ? '#2E2E40' : '#C7D2FE' }]}
        >
          <Text style={styles.seeAllText}>{t('common.see_all')}</Text>
          <Ionicons name="arrow-forward-outline" size={13} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {/* Empty state */}
      {businesses.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: isDark ? '#1A1A2E' : '#F9FAFB', borderColor: isDark ? '#2E2E40' : '#E5E7EB' }]}>
          <Ionicons name="search-outline" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No businesses found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Try adjusting your search radius or category filter
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
  section: { paddingHorizontal: Spacing[6], marginBottom: Spacing[6] },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold },
  subtitle: { fontSize: Typography.fontSize.xs, marginTop: 1 },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 4,
  },
  seeAllText: { fontSize: Typography.fontSize.sm, fontWeight: '600', color: '#6366F1' },
  list: { gap: Spacing[1] },
  emptyBox: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: Spacing[2],
  },
  emptyTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, marginTop: 4 },
  emptySubtitle: { fontSize: Typography.fontSize.sm, textAlign: 'center', lineHeight: 20 },
});

