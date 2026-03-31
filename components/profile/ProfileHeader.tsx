import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Avatar, Progress } from '@/components/ui';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

interface ProfileHeaderProps {
  name: string;
  email: string;
  phone?: string;
  avatarUri?: string | null;
  isUploading: boolean;
  uploadProgress?: number;
  loyaltyPoints?: number;
  onAvatarPress: () => void;
}

function getMemberTier(pts: number): { label: string; icon: string } {
  if (pts >= 1000) return { label: 'Gold Member',   icon: 'trophy'               };
  if (pts >= 500)  return { label: 'Silver Member', icon: 'ribbon-outline'        };
  if (pts >= 100)  return { label: 'Bronze Member', icon: 'medal-outline'         };
  return                   { label: 'Member',        icon: 'person-circle-outline' };
}

export function ProfileHeader({ name, email, phone, avatarUri, isUploading, uploadProgress = 0, loyaltyPoints = 0, onAvatarPress }: ProfileHeaderProps) {
  const { colors } = useTheme();
  const tier = getMemberTier(loyaltyPoints);

  return (
    <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Decorative top strip */}
      <View style={[styles.heroStrip, { backgroundColor: colors.secondary }]} />

      {/* Avatar row */}
      <View style={styles.avatarRow}>
        <TouchableOpacity
          style={[styles.avatarRing, { borderColor: colors.border, backgroundColor: colors.background }]}
          onPress={onAvatarPress}
          disabled={isUploading}
          activeOpacity={0.85}
        >
          <Avatar
            source={avatarUri ? { uri: avatarUri } : undefined}
            name={name}
            size="xl"
          />
          <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
            {isUploading
              ? <ActivityIndicator size="small" color={colors.primaryForeground} />
              : <Ionicons name="camera" size={13} color={colors.primaryForeground} />}
          </View>
        </TouchableOpacity>

        {/* Edit profile pill — top-right */}
        <TouchableOpacity
          style={[styles.editPill, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          onPress={() => router.push('/profile/edit')}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={13} color={colors.mutedForeground} />
          <Text style={[styles.editPillText, { color: colors.mutedForeground }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Upload progress bar */}
      {isUploading && uploadProgress > 0 && (
        <View style={styles.progressWrap}>
          <Progress value={uploadProgress} height={3} style={{ borderRadius: 2 }} />
        </View>
      )}

      {/* Name & email */}
      <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>{name}</Text>
      <Text style={[styles.userEmail, { color: colors.mutedForeground }]} numberOfLines={1}>{email}</Text>
      {!!phone && (
        <Text style={[styles.userPhone, { color: colors.mutedForeground }]} numberOfLines={1}>{phone}</Text>
      )}

      {/* Membership tier badge */}
      <View style={[styles.tierBadge, { backgroundColor: colors.secondary, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>
        <Ionicons name={tier.icon as any} size={13} color={colors.foreground} />
        <Text style={[styles.tierText, { color: colors.foreground }]}>{tier.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[4],
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: Spacing[5],
  },
  heroStrip: { width: '100%', height: 52 },

  avatarRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: -36,
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[3],
  },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPill: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  editPillText: { fontSize: 12, fontWeight: '600' },

  userName:  { fontSize: Typography.fontSize.xl, fontWeight: '700', letterSpacing: -0.3, marginBottom: 2 },
  userEmail: { fontSize: Typography.fontSize.sm, marginBottom: 2 },
  userPhone: { fontSize: 12, marginBottom: 4 },

  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: Spacing[3],
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tierText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },

  progressWrap: { width: '80%', marginBottom: 8 },
});
