import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

const categories = [
  { id: 'all',    name: 'home.categories.all',    icon: 'grid',           color: '#6366F1', light: '#EEF2FF' },
  { id: 'food',   name: 'home.categories.food',   icon: 'restaurant',     color: '#F97316', light: '#FFF7ED' },
  { id: 'print',  name: 'home.categories.print',  icon: 'print',          color: '#3B82F6', light: '#EFF6FF' },
  { id: 'health', name: 'home.categories.health', icon: 'medical',        color: '#EF4444', light: '#FEF2F2' },
  { id: 'repair', name: 'home.categories.repair', icon: 'construct',      color: '#F59E0B', light: '#FFFBEB' },
  { id: 'salon',  name: 'home.categories.salon',  icon: 'cut',            color: '#EC4899', light: '#FDF2F8' },
];

interface CategoryFilterProps {
  selected: string;
  onSelect: (id: string) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        {t('home.categories.title')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {categories.map((cat) => {
          const isSelected = selected === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => onSelect(cat.id)}
              activeOpacity={0.8}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? cat.color
                    : isDark ? '#1E1E2E' : cat.light,
                  borderColor: isSelected ? cat.color : isDark ? '#2E2E40' : cat.light,
                  shadowColor: isSelected ? cat.color : 'transparent',
                },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : cat.light }]}>
                <Ionicons
                  name={(cat.icon + '-outline') as any}
                  size={15}
                  color={isSelected ? '#fff' : cat.color}
                />
              </View>
              <Text style={[styles.chipText, { color: isSelected ? '#fff' : cat.color }]}>
                {t(cat.name)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingLeft: Spacing[6], marginBottom: Spacing[5] },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[3],
    paddingRight: Spacing[6],
  },
  container: { paddingRight: Spacing[6], gap: Spacing[2] },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing[4],
    paddingVertical: Spacing[2],
    paddingLeft: Spacing[2],
    borderRadius: 40,
    borderWidth: 1.5,
    gap: Spacing[1.5],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
});

