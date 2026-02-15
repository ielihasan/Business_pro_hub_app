import React from 'react';
<<<<<<< HEAD
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
=======
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography, Shadows } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
<<<<<<< HEAD
  style?: StyleProp<ViewStyle>;
=======
  style?: ViewStyle;
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
}

interface CardHeaderProps {
  children: React.ReactNode;
<<<<<<< HEAD
  style?: StyleProp<ViewStyle>;
=======
  style?: ViewStyle;
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
}

interface CardTitleProps {
  children: React.ReactNode;
<<<<<<< HEAD
  style?: StyleProp<TextStyle>;
=======
  style?: TextStyle;
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
}

interface CardDescriptionProps {
  children: React.ReactNode;
<<<<<<< HEAD
  style?: StyleProp<TextStyle>;
=======
  style?: TextStyle;
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
}

interface CardContentProps {
  children: React.ReactNode;
<<<<<<< HEAD
  style?: StyleProp<ViewStyle>;
=======
  style?: ViewStyle;
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
}

interface CardFooterProps {
  children: React.ReactNode;
<<<<<<< HEAD
  style?: StyleProp<ViewStyle>;
=======
  style?: ViewStyle;
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
}

export function Card({ children, style }: CardProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        !isDark && Shadows.sm,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, style }: CardHeaderProps) {
  return <View style={[styles.cardHeader, style]}>{children}</View>;
}

export function CardTitle({ children, style }: CardTitleProps) {
  const { colors } = useTheme();

  return (
    <Text
      style={[
        styles.cardTitle,
        { color: colors.cardForeground },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function CardDescription({ children, style }: CardDescriptionProps) {
  const { colors } = useTheme();

  return (
    <Text
      style={[
        styles.cardDescription,
        { color: colors.mutedForeground },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function CardContent({ children, style }: CardContentProps) {
  return <View style={[styles.cardContent, style]}>{children}</View>;
}

export function CardFooter({ children, style }: CardFooterProps) {
  return <View style={[styles.cardFooter, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: Spacing[6],
    paddingBottom: 0,
    gap: Spacing[1.5],
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.lg * Typography.lineHeight.tight,
  },
  cardDescription: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  cardContent: {
    padding: Spacing[6],
  },
  cardFooter: {
    padding: Spacing[6],
    paddingTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
