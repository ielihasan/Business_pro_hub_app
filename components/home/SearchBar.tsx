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
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: isDark ? '#1E1E2E' : '#F4F6FB',
            borderColor: isDark ? '#2E2E40' : '#E2E8F0',
            shadowColor: '#000',
          },
        ]}
      >
        <View style={[styles.searchIconWrap, { backgroundColor: isDark ? '#2E2E40' : '#EEF2FF' }]}>
          <Ionicons name="search-outline" size={17} color="#6366F1" />
        </View>
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder={t('common.search_placeholder')}
          placeholderTextColor={colors.mutedForeground}
          value={value}
          onChangeText={onChangeText}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[4],
    gap: Spacing[3],
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    borderRadius: 16,
    borderWidth: 1.5,
    gap: Spacing[2],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 2,
  },
});
