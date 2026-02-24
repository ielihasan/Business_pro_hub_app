import { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '@/hooks/useTheme';
import { Typography } from '@/constants/theme';
import { CameraPermissionView, ScannerOverlay } from '@/components/scan';
import { fetchBusinessById } from '@/lib/queue';
import { useStore } from '@/store/useStore';

export default function ScanScreen() {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [joining, setJoining] = useState(false);
  const joinQueueInSupabase = useStore((s) => s.joinQueueInSupabase);
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned || joining) return;
    setScanned(true);

    if (!data.startsWith('businesshubpro://join/')) {
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not recognized. Please scan a valid BusinessHub Pro QR code.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
      return;
    }

    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to join a queue.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
          {
            text: 'Sign In',
            onPress: () => {
              setScanned(false);
              router.push('/(auth)/login');
            },
          },
        ]
      );
      return;
    }

    const businessId = data.replace('businesshubpro://join/', '').trim();

    // Fetch business details from Supabase so we can show real info in the dialog
    const { data: business, error: fetchError } = await fetchBusinessById(businessId);

    if (fetchError || !business) {
      Alert.alert(
        'Business Not Found',
        'We could not find this business in our system. The QR code may be outdated.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
      return;
    }

    if (!business.is_open) {
      Alert.alert(
        'Business Closed',
        `${business.name} is currently closed. Please try again during business hours.`,
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
      return;
    }

    Alert.alert(
      `Join Queue — ${business.name}`,
      `Category: ${business.category}\nCurrent queue: ${business.queue_length} people\nEstimated wait: ${business.wait_time ?? 'N/A'}\n\nWould you like to join?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
        {
          text: 'Join Queue',
          onPress: async () => {
            setJoining(true);
            const result = await joinQueueInSupabase(businessId);
            setJoining(false);

            if (!result.success || !result.queueEntryId) {
              Alert.alert(
                'Could Not Join',
                result.error ?? 'An error occurred while joining the queue.',
                [{ text: 'OK', onPress: () => setScanned(false) }]
              );
              return;
            }

            // Navigate to the real queue detail screen
            setScanned(false);
            router.push(`/queue/${result.queueEntryId}`);
          },
        },
      ]
    );
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

      {/* Full-screen loading overlay while joining */}
      {joining && (
        <View style={styles.joiningOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.joiningText}>Joining queue…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: Typography.fontSize.base },
  joiningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  joiningText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
});
