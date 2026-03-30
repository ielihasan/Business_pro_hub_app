import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

// Business types synced from dashboard (Business_pro_hub_dashboard)
const CATEGORIES = [
  { id: 'all',                  labelKey: 'home.categories.all',        icon: 'grid-outline'               as const },
  { id: 'Coffee Shop',          labelKey: 'home.categories.coffee_shop', icon: 'cafe-outline'              as const },
  { id: 'Restaurant',           labelKey: 'home.categories.restaurant', icon: 'restaurant-outline'         as const },
  { id: 'Retail Store',         labelKey: 'home.categories.retail',     icon: 'bag-handle-outline'         as const },
  { id: 'Clinic / Healthcare',  labelKey: 'home.categories.clinic',     icon: 'medical-outline'            as const },
  { id: 'Salon / Barbershop',   labelKey: 'home.categories.salon',      icon: 'cut-outline'                as const },
  { id: 'Bank / Finance',       labelKey: 'home.categories.bank',       icon: 'card-outline'               as const },
  { id: 'Government Office',    labelKey: 'home.categories.government', icon: 'business-outline'           as const },
  { id: 'Pharmacy',             labelKey: 'home.categories.pharmacy',   icon: 'medkit-outline'             as const },
  { id: 'Bakery',               labelKey: 'home.categories.bakery',     icon: 'storefront-outline'         as const },
  { id: 'Other',                labelKey: 'home.categories.other',      icon: 'ellipsis-horizontal-outline' as const },
];

interface CategoryFilterProps {
  selected: string;
  onSelect: (id: string) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const { colors } = useTheme();
  const { t }      = useTranslation();

  const FG     = colors.foreground;
  const MUTED  = colors.mutedForeground;
  const CARD   = colors.card;
  const BORDER = colors.border;

  return (
    <View style={styles.section}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {CATEGORIES.map((cat) => {
          const active = selected === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => onSelect(cat.id)}
              activeOpacity={0.75}
              style={[
                styles.chip,
                active
                  ? { backgroundColor: FG, borderColor: FG }
                  : { backgroundColor: CARD, borderColor: BORDER },
              ]}
            >
              <Ionicons
                name={cat.icon}
                size={14}
                color={active ? colors.background : MUTED}
              />
              <Text style={[styles.chipText, { color: active ? colors.background : MUTED }]}>
                {t(cat.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 16 },
  row: { paddingHorizontal: 24, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 40, borderWidth: 1,
    gap: 6,
  },
  chipText: { fontSize: 13, fontWeight: '700' },
});
