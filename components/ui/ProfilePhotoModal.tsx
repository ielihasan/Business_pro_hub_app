import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

interface ProfilePhotoModalProps {
  visible: boolean;
  hasPhoto: boolean;
  onViewPhoto: () => void;
  onEditPhoto: () => void;
  onCancel: () => void;
}

export function ProfilePhotoModal({
  visible,
  hasPhoto,
  onViewPhoto,
  onEditPhoto,
  onCancel,
}: ProfilePhotoModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onCancel}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={styles.backdropTouchable} onTouchEnd={onCancel} />
        
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t('profile.photo.title')}
            </Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {/* View Photo Option */}
            {hasPhoto && (
              <>
                <TouchableOpacity
                  style={[styles.option, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    onViewPhoto();
                    onCancel();
                  }}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      { backgroundColor: colors.primary + '15' },
                    ]}
                  >
                    <Ionicons
                      name="eye-outline"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.optionContent}>
                    <Text
                      style={[styles.optionTitle, { color: colors.foreground }]}
                    >
                      {t('profile.photo.view')}
                    </Text>
                    <Text
                      style={[
                        styles.optionDescription,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {t('profile.photo.view_desc')}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </>
            )}

            {/* Edit Photo Option */}
            <TouchableOpacity
              style={[
                styles.option,
                hasPhoto && { borderTopColor: colors.border, borderTopWidth: 1 },
              ]}
              onPress={() => {
                onEditPhoto();
                onCancel();
              }}
            >
              <View
                style={[
                  styles.optionIcon,
                  { backgroundColor: colors.warning + '15' },
                ]}
              >
                <Ionicons
                  name="pencil-outline"
                  size={24}
                  color={colors.warning}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: colors.foreground }]}>
                  {t('profile.photo.edit')}
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {t('profile.photo.edit_desc')}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[
              styles.cancelButton,
              { backgroundColor: colors.secondary, marginTop: Spacing[3] },
            ]}
            onPress={onCancel}
          >
            <Text style={[styles.cancelText, { color: colors.foreground }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[4],
  },
  header: {
    marginBottom: Spacing[4],
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  optionsContainer: {
    marginBottom: Spacing[4],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.DEFAULT,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[1],
  },
  optionDescription: {
    fontSize: Typography.fontSize.sm,
  },
  cancelButton: {
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
});
