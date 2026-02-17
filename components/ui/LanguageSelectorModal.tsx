import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

interface LanguageSelectorModalProps {
  visible: boolean;
  currentLanguage: string;
  onSelectLanguage: (langCode: string) => void;
  onClose: () => void;
}

const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

export function LanguageSelectorModal({
  visible,
  currentLanguage,
  onSelectLanguage,
  onClose,
}: LanguageSelectorModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const handleSelectLanguage = (langCode: string) => {
    onSelectLanguage(langCode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Select Language
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Language List */}
        <FlatList
          data={LANGUAGE_OPTIONS}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.languageItem,
                {
                  backgroundColor: colors.card,
                  borderColor: currentLanguage === item.code ? colors.primary : colors.border,
                  borderWidth: currentLanguage === item.code ? 2 : 1,
                },
              ]}
              onPress={() => handleSelectLanguage(item.code)}
            >
              <View style={styles.itemLeft}>
                <Text style={styles.flag}>{item.flag}</Text>
                <View>
                  <Text style={[styles.languageName, { color: colors.foreground }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.languageCode, { color: colors.mutedForeground }]}>
                    {item.code.toUpperCase()}
                  </Text>
                </View>
              </View>
              {currentLanguage === item.code && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing[2],
    marginLeft: -Spacing[2],
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    flex: 1,
    textAlign: 'center',
  },
  listContent: {
    padding: Spacing[4],
    gap: Spacing[3],
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[4],
    borderRadius: BorderRadius.DEFAULT,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing[3],
  },
  flag: {
    fontSize: 32,
  },
  languageName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[1],
  },
  languageCode: {
    fontSize: Typography.fontSize.xs,
  },
});
