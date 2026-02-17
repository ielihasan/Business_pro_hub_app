import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { BusinessCard } from './BusinessCard';

interface NearbyBusinessesProps {
  businesses: any[];
}

export function NearbyBusinesses({ businesses }: NearbyBusinessesProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {t('home.nearby.title')}
        </Text>
        <TouchableOpacity onPress={() => router.push('/map')}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>
            {t('common.see_all')}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.list}>
        {businesses.map((business: any) => (
          <BusinessCard key={business.id} business={business} />
        ))}
      </View>
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
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[4],
  },
  seeAllText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium },
  list: { gap: Spacing[4] },
});
