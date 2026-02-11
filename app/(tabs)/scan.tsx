import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button, Card, CardContent } from '@/components/ui';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

export default function ScanScreen() {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);

    // Parse QR code data - expected format: businesshubpro://join/BUSINESS_ID
    if (data.startsWith('businesshubpro://join/')) {
      const businessId = data.replace('businesshubpro://join/', '');
      Alert.alert(
        'Join Queue',
        'Would you like to join the queue at this business?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setScanned(false),
          },
          {
            text: 'Join Queue',
            onPress: () => {
              router.push(`/business/${businessId}`);
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not recognized. Please scan a valid BusinessHub Pro QR code.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.foreground }]}>
            Loading camera...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContainer}>
          <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
            <Ionicons name="camera-outline" size={48} color={colors.foreground} />
          </View>
          <Text style={[styles.permissionTitle, { color: colors.foreground }]}>
            Camera Access Required
          </Text>
          <Text style={[styles.permissionText, { color: colors.mutedForeground }]}>
            To scan QR codes and join queues quickly, we need access to your camera.
          </Text>
          <Button onPress={requestPermission} style={styles.permissionButton}>
            Grant Camera Access
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={flashOn}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top Controls */}
          <SafeAreaView style={styles.topControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setFlashOn(!flashOn)}
            >
              <Ionicons
                name={flashOn ? 'flash' : 'flash-off'}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Scan Area */}
          <View style={styles.scanAreaContainer}>
            <View style={styles.scanArea}>
              {/* Corner markers */}
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
                  <Text style={[styles.infoTitle, { color: colors.foreground }]}>
                    Scan QR Code
                  </Text>
                  <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                    Point your camera at a BusinessHub Pro QR code to join the queue instantly
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* Manual Entry Option */}
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
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[8],
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  permissionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[3],
    textAlign: 'center',
  },
  permissionText: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    marginBottom: Spacing[6],
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },
  permissionButton: {
    width: '100%',
  },
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
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  bottomContainer: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[8],
  },
  infoCard: {
    marginBottom: Spacing[4],
  },
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    gap: Spacing[4],
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[1],
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  manualEntry: {
    alignItems: 'center',
  },
  manualEntryText: {
    fontSize: Typography.fontSize.sm,
  },
});
