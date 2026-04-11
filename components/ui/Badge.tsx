import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  children,
  variant = 'default',
  style,
  textStyle,
}: BadgeProps) {
  const { colors } = useTheme();

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'default':
        return {
          container: {
            backgroundColor: colors.primary,
          },
          text: {
            color: colors.primaryForeground,
          },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: colors.secondary,
          },
          text: {
            color: colors.secondaryForeground,
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.border,
          },
          text: {
            color: colors.foreground,
          },
        };
      case 'destructive':
        return {
          container: {
            backgroundColor: colors.destructive,
          },
          text: {
            color: colors.destructiveForeground,
          },
        };
      case 'success':
        return {
          container: {
            backgroundColor: colors.success,
          },
          text: {
            color: colors.successForeground,
          },
        };
      case 'warning':
        return {
          container: {
            backgroundColor: colors.warning,
          },
          text: {
            color: colors.warningForeground,
          },
        };
      case 'info':
        return {
          container: {
            backgroundColor: colors.info,
          },
          text: {
            color: colors.infoForeground,
          },
        };
      default:
        return {
          container: {},
          text: {},
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[styles.container, variantStyles.container, style]}>
      {typeof children === 'string' ? (
        <Text style={[styles.text, variantStyles.text, textStyle]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

// Queue status specific badge
interface QueueStatusBadgeProps {
  status: 'waiting' | 'called' | 'in_progress' | 'completed' | 'cancelled';
  style?: ViewStyle;
}

export function QueueStatusBadge({ status, style }: QueueStatusBadgeProps) {
  const { colors } = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case 'waiting':
        return {
          label: 'Waiting',
          backgroundColor: colors.statusWaiting,
          textColor: '#000000',
        };
      case 'called':
        return {
          label: 'Called',
          backgroundColor: colors.brand,
          textColor: '#FFFFFF',
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          backgroundColor: colors.statusInProgress,
          textColor: '#FFFFFF',
        };
      case 'completed':
        return {
          label: 'Completed',
          backgroundColor: colors.statusCompleted,
          textColor: '#FFFFFF',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          backgroundColor: colors.statusCancelled,
          textColor: '#FFFFFF',
        };
      default:
        return {
          label: 'Unknown',
          backgroundColor: colors.muted,
          textColor: colors.mutedForeground,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.backgroundColor },
        style,
      ]}
    >
      <Text style={[styles.text, { color: config.textColor }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing[2.5],
    paddingVertical: Spacing[0.5],
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});
