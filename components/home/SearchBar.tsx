import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={[styles.searchBar, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={20} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder={t('common.search_placeholder')}
          placeholderTextColor={colors.mutedForeground}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
      <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.primary }]}>
        <Ionicons name="options-outline" size={20} color={colors.primaryForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    gap: Spacing[3],
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    height: 48,
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: 1,
    gap: Spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    height: '100%',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
