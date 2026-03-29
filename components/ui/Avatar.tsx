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

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Pick a consistent index from a name string (0–4). */
export function nameIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 5;
}

export function Avatar({ source, name = '', size = 'md', style }: AvatarProps) {
  const { colors, isDark } = useTheme();
  const dimensions = sizeMap[size];

  // Theme-adaptive avatar backgrounds: dark shades for dark mode, tinted neutrals for light
  const darkBgs  = ['#2a2a2a', '#333333', '#3d3d3d', '#282828', '#303030'];
  const lightBgs = ['#e8e8e8', '#dde0e6', '#e4dff0', '#d9e8df', '#e8ddd9'];
  const bgs = isDark ? darkBgs : lightBgs;
  const avatarBg = name ? bgs[nameIndex(name)] : (isDark ? '#2a2a2a' : '#e8e8e8');

  const containerStyle: ViewStyle = {
    width: dimensions.container,
    height: dimensions.container,
    borderRadius: dimensions.container / 2,
    backgroundColor: source ? colors.muted : avatarBg,
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
            color: isDark ? '#e2e2e2' : '#1a1a1a',
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
