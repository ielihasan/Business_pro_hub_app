import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent } from '@/components/ui';
import { Typography, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

interface ScannerOverlayProps {
  flashOn: boolean;
  onToggleFlash: () => void;
}

export function ScannerOverlay({ flashOn, onToggleFlash }: ScannerOverlayProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.overlay}>
      {/* Top Controls */}
      <SafeAreaView style={styles.topControls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={onToggleFlash}>
          <Ionicons name={flashOn ? 'flash' : 'flash-off'} size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Scan Area */}
      <View style={styles.scanAreaContainer}>
        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomContainer}>
        <Card style={styles.infoCard}>
          <CardContent style={styles.infoCardContent}>
            <Ionicons name="qr-code-outline" size={24} color={colors.foreground} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>Scan QR Code</Text>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Point your camera at a BusinessHub Pro QR code to join the queue instantly
              </Text>
            </View>
          </CardContent>
        </Card>
        <TouchableOpacity style={styles.manualEntry}>
          <Text style={[styles.manualEntryText, { color: colors.mutedForeground }]}>
            Can't scan?{' '}
            <Text style={{ color: colors.primary, fontWeight: Typography.fontWeight.semibold }}>
              Enter code manually
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'transparent' },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[2],
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanAreaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanArea: { width: SCAN_AREA_SIZE, height: SCAN_AREA_SIZE, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#FFFFFF' },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },
  bottomContainer: { paddingHorizontal: Spacing[6], paddingBottom: Spacing[8] },
  infoCard: { marginBottom: Spacing[4] },
  infoCardContent: { flexDirection: 'row', alignItems: 'center', padding: Spacing[4], gap: Spacing[4] },
  infoTextContainer: { flex: 1 },
  infoTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, marginBottom: Spacing[1] },
  infoText: { fontSize: Typography.fontSize.sm, lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed },
  manualEntry: { alignItems: 'center' },
  manualEntryText: { fontSize: Typography.fontSize.sm },
});
