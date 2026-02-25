import { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Modal, TextInput, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { CameraPermissionView, ScannerOverlay } from '@/components/scan';
import { resolveBusinessById, fetchServiceById } from '@/lib/queue';
import { useStore } from '@/store/useStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse both QR URL formats and return businessId + optional serviceType.
 *
 * Supported formats:
 *   1. http(s)://<host>/join-queue/<businessId>?queue_type=<serviceId>
 *   2. businesshubpro://join/<businessId>
 */
function parseQrData(raw: string): { businessId: string; serviceType?: string } | null {
  const trimmed = raw.trim();

  // Format 1 – web URL
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      // pathname: /join-queue/<businessId>
      const match = url.pathname.match(/\/join-queue\/([^/?#]+)/i);
      if (!match) return null;
      const businessId = match[1];
      const serviceType = url.searchParams.get('queue_type') ?? undefined;
      return { businessId, serviceType };
    } catch {
      return null;
    }
  }

  // Format 2 – legacy deep-link
  if (trimmed.startsWith('businesshubpro://join/')) {
    const businessId = trimmed.replace('businesshubpro://join/', '').split('?')[0];
    return businessId ? { businessId } : null;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ScanScreen() {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualBusinessId, setManualBusinessId] = useState('');
  const joinQueueInSupabase = useStore((s) => s.joinQueueInSupabase);
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  // Helper function to process business ID (used by both QR scan and manual entry)
  const processBusinessId = async (businessId: string, serviceType?: string) => {
    // 1. Validate auth
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

    // 2. Resolve business + service info
    setResolving(true);
    const [bizResult, svcResult] = await Promise.all([
      resolveBusinessById(businessId),
      serviceType ? fetchServiceById(serviceType) : Promise.resolve({ data: null, error: null }),
    ]);
    setResolving(false);

    if (bizResult.error || !bizResult.data) {
      Alert.alert(
        'Business Not Found',
        'We could not find this business. The QR code may be outdated.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
      return;
    }

    const biz = bizResult.data;
    const svc = svcResult.data;

    // 3. Build confirmation message
    const lines: string[] = [];
    if (biz.category) lines.push(`Type: ${biz.category}`);
    if (biz.address) lines.push(`Location: ${biz.address}`);
    if (svc) lines.push(`Service: ${svc.name}`);
    if (svc?.estimated_duration) lines.push(`Est. wait per person: ${svc.estimated_duration} min`);
    lines.push('\nWould you like to join the queue?');

    Alert.alert(
      `Join Queue — ${biz.name}`,
      lines.join('\n'),
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
        {
          text: 'Join Queue',
          onPress: async () => {
            setJoining(true);
            const result = await joinQueueInSupabase(businessId, serviceType);
            setJoining(false);

            if (!result.success || !result.queueEntryId) {
              Alert.alert(
                'Could Not Join',
                result.error ?? 'An error occurred while joining the queue.',
                [{ text: 'OK', onPress: () => setScanned(false) }]
              );
              return;
            }

            setScanned(false);
            router.push(`/queue/${result.queueEntryId}`);
          },
        },
      ]
    );
  };

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned || resolving || joining) return;
    setScanned(true);

    // Parse QR data
    const parsed = parseQrData(data);
    if (!parsed) {
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not a valid BusinessHub Pro queue code.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
      return;
    }

    const { businessId, serviceType } = parsed;
    await processBusinessId(businessId, serviceType);
  };

  // Manual entry function
  const handleManualEntry = () => {
    setManualBusinessId('');
    setShowManualModal(true);
  };

  const handleManualSubmit = async () => {
    if (!manualBusinessId || manualBusinessId.trim() === '') {
      Alert.alert('Invalid Input', 'Please enter a valid business ID.');
      return;
    }
    
    setShowManualModal(false);
    setScanned(true);
    await processBusinessId(manualBusinessId.trim());
    setScanned(false);
    setManualBusinessId('');
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.foreground }]}>Loading camera…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return <CameraPermissionView onRequestPermission={requestPermission} />;
  }

  const busy = resolving || joining;

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

      {busy && (
        <View style={styles.busyOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.busyText}>
            {resolving ? 'Looking up business…' : 'Joining queue…'}
          </Text>
        </View>
      )}

      {/* Manual Entry Button */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={[styles.manualButton, { backgroundColor: colors.primary }]}
          onPress={handleManualEntry}
          disabled={busy}
        >
          <Text style={styles.manualButtonText}>Enter Business ID Manually</Text>
        </TouchableOpacity>
      </View>

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowManualModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Enter Business ID
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
              Paste the business ID from Supabase
            </Text>
            <Text style={[styles.modalHint, { color: colors.mutedForeground }]}>
              💡 Run DEBUG_AND_FIX_BUSINESS.sql in Supabase to get a valid ID
            </Text>
            
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: colors.muted,
                color: colors.foreground,
                borderColor: colors.border,
              }]}
              placeholder="e.g., 3b7a50bb-b48d-4ae8..."
              placeholderTextColor={colors.mutedForeground}
              value={manualBusinessId}
              onChangeText={setManualBusinessId}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.muted }]}
                onPress={() => setShowManualModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.foreground }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleManualSubmit}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  Join Queue
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: Typography.fontSize.base },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  busyText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing[4],
    paddingBottom: Spacing[6],
  },
  manualButton: {
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.DEFAULT,
    alignItems: 'center',
  },
  manualButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.DEFAULT,
    padding: Spacing[6],
    gap: Spacing[4],
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing[2],
  },
  modalHint: {
    fontSize: Typography.fontSize.xs,
    fontStyle: 'italic',
    marginBottom: Spacing[3],
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.DEFAULT,
    padding: Spacing[3],
    fontSize: Typography.fontSize.base,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  modalButton: {
    flex: 1,
    padding: Spacing[3],
    borderRadius: BorderRadius.DEFAULT,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
});
