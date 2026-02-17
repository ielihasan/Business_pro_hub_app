import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from '@/components/ui';
import { Typography, Spacing } from '@/constants/theme';

interface ProfileHeaderProps {
  name: string;
  email: string;
  avatarUri?: string | null;
  isUploading: boolean;
  onAvatarPress: () => void;
}

export function ProfileHeader({ name, email, avatarUri, isUploading, onAvatarPress }: ProfileHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.avatarContainer} onPress={onAvatarPress} disabled={isUploading}>
        <Avatar
          source={avatarUri ? { uri: avatarUri } : undefined}
          name={name}
          size="xl"
        />
        <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Ionicons name="image" size={14} color={colors.primaryForeground} />
          )}
        </View>
      </TouchableOpacity>
      <Text style={[styles.userName, { color: colors.foreground }]}>{name}</Text>
      <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: Spacing[6], paddingHorizontal: Spacing[6] },
  avatarContainer: { position: 'relative', marginBottom: Spacing[4] },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, marginBottom: Spacing[1] },
  userEmail: { fontSize: Typography.fontSize.sm },
});
