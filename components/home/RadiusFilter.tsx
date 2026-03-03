import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing } from '@/constants/theme';

const RADIUS_OPTIONS = [1, 3, 5, 10];

interface RadiusFilterProps {
  selected: number;
  onSelect: (radius: number) => void;
}

export function RadiusFilter({ selected, onSelect }: RadiusFilterProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Ionicons name="radio-outline" size={16} color="#6366F1" />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Search Radius</Text>
      </View>
      <View style={styles.row}>
        {RADIUS_OPTIONS.map((r) => {
          const isSelected = selected === r;
          return (
            <TouchableOpacity
              key={r}
              onPress={() => onSelect(r)}
              activeOpacity={0.8}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? '#6366F1' : isDark ? '#1E1E2E' : '#F4F6FB',
                  borderColor: isSelected ? '#6366F1' : isDark ? '#2E2E40' : '#E2E8F0',
                  shadowColor: isSelected ? '#6366F1' : 'transparent',
                },
              ]}
            >
              <Ionicons
                name="location"
                size={12}
                color={isSelected ? '#fff' : '#6366F1'}
              />
              <Text style={[styles.chipText, { color: isSelected ? '#fff' : colors.foreground }]}>
                {r} km
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: Spacing[6], marginBottom: Spacing[5] },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing[3] },
  sectionTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold },
  row: { flexDirection: 'row', gap: Spacing[2] },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: 40,
    borderWidth: 1.5,
    gap: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  chipText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
});

