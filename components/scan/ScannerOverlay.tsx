import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Dimensions, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.68;
// Reserve space for the bottom action buttons (~ gallery + enter ID row)
const BOTTOM_BUTTON_CLEARANCE = 120;

interface ScannerOverlayProps {
  flashOn: boolean;
  onToggleFlash: () => void;
}

export function ScannerOverlay({ flashOn, onToggleFlash }: ScannerOverlayProps) {
  const scanLineY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(scanLineY, {
          toValue: SCAN_AREA_SIZE - 2,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineY, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]).start(animate);
    };
    animate();
    return () => scanLineY.stopAnimation();
  }, [scanLineY]);

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

      {/* Scan Area — centered in remaining space, cleared above buttons */}
      <View style={styles.scanAreaContainer}>
        <View style={styles.scanArea}>
          {/* Corner brackets */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Animated scan line */}
          <Animated.View
            style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]}
          />
        </View>
      </View>

      {/* Spacer so scan area centers above the button row */}
      <View style={{ height: BOTTOM_BUTTON_CLEARANCE }} />
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
  scanAreaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
    overflow: 'hidden',
  },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#FFFFFF' },
  topLeft:     { top: 0,    left: 0,   borderTopWidth: 4,    borderLeftWidth: 4,  borderTopLeftRadius: 8 },
  topRight:    { top: 0,    right: 0,  borderTopWidth: 4,    borderRightWidth: 4, borderTopRightRadius: 8 },
  bottomLeft:  { bottom: 0, left: 0,   borderBottomWidth: 4, borderLeftWidth: 4,  borderBottomLeftRadius: 8 },
  bottomRight: { bottom: 0, right: 0,  borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
});
