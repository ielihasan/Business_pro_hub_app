import React from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing } from '@/constants/theme';

interface ProgressProps {
  value: number; // 0 to 100
  style?: ViewStyle;
  height?: number;
  showAnimation?: boolean;
}

export function Progress({
  value,
  style,
  height = 8,
  showAnimation = false,
}: ProgressProps) {
  const { colors } = useTheme();
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.secondary,
          height,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.indicator,
          {
            backgroundColor: colors.primary,
            width: `${clampedValue}%`,
            height,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

// Circular progress for queue position
interface CircularProgressProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function CircularProgress({
  value,
  size = 80,
  strokeWidth = 8,
  style,
  children,
}: CircularProgressProps) {
  const { colors } = useTheme();
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <View style={[styles.circularContainer, { width: size, height: size }, style]}>
      {/* Background circle */}
      <View
        style={[
          styles.circularBackground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: colors.secondary,
          },
        ]}
      />
      {/* Progress indicator - simplified without SVG */}
      <View
        style={[
          styles.circularProgress,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: colors.primary,
            borderTopColor: 'transparent',
            borderRightColor: clampedValue > 25 ? colors.primary : 'transparent',
            borderBottomColor: clampedValue > 50 ? colors.primary : 'transparent',
            borderLeftColor: clampedValue > 75 ? colors.primary : 'transparent',
            transform: [{ rotate: '-90deg' }],
          },
        ]}
      />
      {children && <View style={styles.circularContent}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  circularContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularBackground: {
    position: 'absolute',
  },
  circularProgress: {
    position: 'absolute',
  },
  circularContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
