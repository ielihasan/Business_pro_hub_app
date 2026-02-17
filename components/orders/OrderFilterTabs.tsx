import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

type FilterType = 'all' | 'active' | 'completed';

const TABS: Array<{ key: FilterType; label: string }> = [
  { key: 'all', label: 'orders.tabs.all' },
  { key: 'active', label: 'orders.tabs.active' },
  { key: 'completed', label: 'orders.tabs.completed' },
];

interface OrderFilterTabsProps {
  selected: FilterType;
  onSelect: (filter: FilterType) => void;
}

export function OrderFilterTabs({ selected, onSelect }: OrderFilterTabsProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.chip,
              {
                backgroundColor: selected === tab.key ? colors.primary : colors.secondary,
                borderColor: colors.border,
              },
            ]}
            onPress={() => onSelect(tab.key)}
          >
            <Text
              style={[
                styles.chipText,
                { color: selected === tab.key ? colors.primaryForeground : colors.foreground },
              ]}
            >
              {t(tab.label)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing[6], paddingVertical: Spacing[4] },
  chip: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing[2],
  },
  chipText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium },
});
