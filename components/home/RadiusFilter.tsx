import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

const RADIUS_OPTIONS = [1, 3, 5, 10];

interface RadiusFilterProps {
  selected: number;
  onSelect: (radius: number) => void;
}

export function RadiusFilter({ selected, onSelect }: RadiusFilterProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Radius</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
        {RADIUS_OPTIONS.map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => onSelect(r)}
            style={[
              styles.chip,
              {
                backgroundColor: selected === r ? colors.primary : colors.secondary,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: selected === r ? colors.primaryForeground : colors.foreground }}>
              {r} km
            </Text>
          </TouchableOpacity>
        ))}
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
  container: { paddingHorizontal: Spacing[2], flexDirection: 'row', gap: Spacing[3] },
  chip: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
});
