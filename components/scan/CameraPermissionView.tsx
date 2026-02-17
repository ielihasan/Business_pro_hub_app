import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui';
import { Typography, Spacing } from '@/constants/theme';

interface CameraPermissionViewProps {
  onRequestPermission: () => void;
}

export function CameraPermissionView({ onRequestPermission }: CameraPermissionViewProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
          <Ionicons name="camera-outline" size={48} color={colors.foreground} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Camera Access Required
        </Text>
        <Text style={[styles.text, { color: colors.mutedForeground }]}>
          To scan QR codes and join queues quickly, we need access to your camera.
        </Text>
        <Button onPress={onRequestPermission} style={styles.button}>
          Grant Camera Access
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[8] },
  iconContainer: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing[6] },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, marginBottom: Spacing[3], textAlign: 'center' },
  text: { fontSize: Typography.fontSize.base, textAlign: 'center', marginBottom: Spacing[6], lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed },
  button: { width: '100%' },
});
