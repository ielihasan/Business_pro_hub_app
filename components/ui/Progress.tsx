import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius } from '@/constants/theme';

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
    <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.secondary}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children}
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
});
