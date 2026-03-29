import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  const { colors } = useTheme();
  const { t }      = useTranslation();

  const FG     = colors.foreground;
  const MUTED  = colors.mutedForeground;
  const CARD   = colors.card;
  const BORDER = colors.border;

  return (
    <View style={[styles.bar, { backgroundColor: CARD, borderColor: BORDER }]}>
      <Ionicons name="search-outline" size={16} color={MUTED} />
      <TextInput
        style={[styles.input, { color: FG }]}
        placeholder={t('common.search_placeholder')}
        placeholderTextColor={MUTED}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={8}>
          <Ionicons name="close-circle" size={16} color={MUTED} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 24, marginBottom: 16,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 13, gap: 10,
  },
  input: { flex: 1, fontSize: 14, padding: 0 },
});
