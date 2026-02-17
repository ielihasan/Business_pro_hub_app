import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '@/hooks/useTheme';
import { Typography } from '@/constants/theme';
import { CameraPermissionView, ScannerOverlay } from '@/components/scan';

export default function ScanScreen() {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);

    if (data.startsWith('businesshubpro://join/')) {
      const businessId = data.replace('businesshubpro://join/', '');
      Alert.alert(
        'Join Queue',
        'Would you like to join the queue at this business?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
          { text: 'Join Queue', onPress: () => router.push(`/business/${businessId}`) },
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
          <Text style={[styles.loadingText, { color: colors.foreground }]}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return <CameraPermissionView onRequestPermission={requestPermission} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={flashOn}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <ScannerOverlay flashOn={flashOn} onToggleFlash={() => setFlashOn(!flashOn)} />
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: Typography.fontSize.base },
});
