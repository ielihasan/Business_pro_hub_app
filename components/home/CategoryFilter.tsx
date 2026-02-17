import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

const categories = [
  { id: 'all', name: 'home.categories.all', icon: 'grid-outline' },
  { id: 'food', name: 'home.categories.food', icon: 'restaurant-outline' },
  { id: 'print', name: 'home.categories.print', icon: 'print-outline' },
  { id: 'health', name: 'home.categories.health', icon: 'medical-outline' },
  { id: 'repair', name: 'home.categories.repair', icon: 'construct-outline' },
  { id: 'salon', name: 'home.categories.salon', icon: 'cut-outline' },
];

interface CategoryFilterProps {
  selected: string;
  onSelect: (id: string) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        {t('home.categories.title')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
        {categories.map((category) => {
          const isSelected = selected === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.secondary,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => onSelect(category.id)}
            >
              <Ionicons
                name={category.icon as any}
                size={18}
                color={isSelected ? colors.primaryForeground : colors.foreground}
              />
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {t(category.name)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: Spacing[6], marginBottom: Spacing[6] },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[4],
  },
  container: { paddingRight: Spacing[6], gap: Spacing[2] },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2.5],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing[2],
  },
  chipText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium },
});
