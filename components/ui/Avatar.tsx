import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageSourcePropType } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Typography } from '@/constants/theme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: ImageSourcePropType | null;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

const sizeMap: Record<AvatarSize, { container: number; text: number }> = {
  xs: { container: 24, text: 10 },
  sm: { container: 32, text: 12 },
  md: { container: 40, text: 14 },
  lg: { container: 56, text: 18 },
  xl: { container: 80, text: 28 },
};

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getBackgroundColor(name: string): string {
  if (!name) return '#5C5C5C';
  const grays = ['#2a2a2a', '#363636', '#404040', '#4a4a4a', '#5C5C5C', '#6e6e6e', '#787878'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return grays[Math.abs(hash) % grays.length];
}

export function Avatar({ source, name = '', size = 'md', style }: AvatarProps) {
  const { colors } = useTheme();
  const dimensions = sizeMap[size];

  const containerStyle: ViewStyle = {
    width: dimensions.container,
    height: dimensions.container,
    borderRadius: dimensions.container / 2,
    backgroundColor: source ? colors.muted : getBackgroundColor(name),
  };

  if (source) {
    return (
      <View style={[styles.container, containerStyle, style]}>
        <Image
          source={source}
          style={[
            styles.image,
            {
              width: dimensions.container,
              height: dimensions.container,
              borderRadius: dimensions.container / 2,
            },
          ]}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle, style]}>
      <Text
        style={[
          styles.initials,
          {
            fontSize: dimensions.text,
            color: '#FFFFFF',
          },
        ]}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}

interface AvatarGroupProps {
  avatars: Array<{ source?: ImageSourcePropType | null; name?: string }>;
  max?: number;
  size?: AvatarSize;
  style?: ViewStyle;
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = 'md',
  style,
}: AvatarGroupProps) {
  const { colors } = useTheme();
  const dimensions = sizeMap[size];
  const displayAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <View style={[styles.group, style]}>
      {displayAvatars.map((avatar, index) => (
        <View
          key={index}
          style={[
            styles.groupItem,
            {
              marginLeft: index === 0 ? 0 : -(dimensions.container / 3),
              zIndex: displayAvatars.length - index,
            },
          ]}
        >
          <Avatar
            source={avatar.source}
            name={avatar.name}
            size={size}
            style={{
              borderWidth: 2,
              borderColor: colors.background,
            }}
          />
        </View>
      ))}
      {remainingCount > 0 && (
        <View
          style={[
            styles.groupItem,
            styles.container,
            {
              width: dimensions.container,
              height: dimensions.container,
              borderRadius: dimensions.container / 2,
              backgroundColor: colors.muted,
              marginLeft: -(dimensions.container / 3),
              borderWidth: 2,
              borderColor: colors.background,
            },
          ]}
        >
          <Text
            style={[
              styles.initials,
              {
                fontSize: dimensions.text - 2,
                color: colors.mutedForeground,
              },
            ]}
          >
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: Typography.fontWeight.medium,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupItem: {
    // Individual item in group
  },
});
