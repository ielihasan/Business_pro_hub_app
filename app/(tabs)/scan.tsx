import { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, TextInput, Platform } from 'react-native';
import { router } from 'expo-router';
import Dialog, { DialogConfig } from '@/components/ui/Dialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { CameraPermissionView, ScannerOverlay } from '@/components/scan';
import { resolveBusinessById, fetchServiceById } from '@/lib/queue';
import { useStore } from '@/store/useStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ParsedQrData = {
  businessId: string;
  serviceType?: string;
  unitPrice?: number;
  raw: string;
  payload: Record<string, string>;
};

const BUSINESS_ID_KEYS = ['business_id', 'businessid', 'business', 'id'];
const SERVICE_TYPE_KEYS = ['queue_type', 'service_type', 'service_id', 'serviceid', 'service'];
const UNIT_PRICE_KEYS = ['unit_price', 'unitprice', 'price', 'amount'];

function firstMatching(payload: Record<string, string>, keys: string[]): string | undefined {
  const lowered = Object.fromEntries(
    Object.entries(payload).map(([k, v]) => [k.toLowerCase(), v])
  ) as Record<string, string>;
  for (const key of keys) {
    const value = lowered[key];
    if (value) return value;
  }
  return undefined;
}

function parsePriceValue(value?: string): number | undefined {
  if (!value) return undefined;
  const numeric = Number(value.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(numeric)) return undefined;
  if (numeric < 0) return undefined;
  return numeric;
}

function parseQrData(raw: string): ParsedQrData | null {
  const trimmed = raw.trim();
  const payload: Record<string, string> = {};
  let businessId = '';
  let serviceType: string | undefined;
  let unitPrice: number | undefined;

  // JSON payload support: {"business_id":"...","queue_type":"...",...}
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        for (const [k, v] of Object.entries(parsed)) {
          if (v == null) continue;
          payload[k] = String(v);
        }
      }
      businessId = firstMatching(payload, BUSINESS_ID_KEYS) || '';
      serviceType = firstMatching(payload, SERVICE_TYPE_KEYS);
      unitPrice = parsePriceValue(firstMatching(payload, UNIT_PRICE_KEYS));
      if (businessId) {
        return { businessId, serviceType, unitPrice, raw: trimmed, payload };
      }
    } catch {
      // Continue to other parsers
    }
  }

  // URL/deeplink support
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);

      url.searchParams.forEach((value, key) => {
        payload[key] = value;
      });

      const joinQueueMatch = url.pathname.match(/\/join-queue\/([^/?#]+)/i);
      const joinMatch = url.pathname.match(/\/join\/([^/?#]+)/i);
      const pathBusinessId = joinQueueMatch?.[1] || joinMatch?.[1];

      businessId =
        pathBusinessId ||
        firstMatching(payload, BUSINESS_ID_KEYS) ||
        '';

      serviceType = firstMatching(payload, SERVICE_TYPE_KEYS);
      unitPrice = parsePriceValue(firstMatching(payload, UNIT_PRICE_KEYS));

      if (pathBusinessId) {
        payload.business_id = payload.business_id || pathBusinessId;
      }

      if (businessId) {
        return { businessId, serviceType, unitPrice, raw: trimmed, payload };
      }
    } catch {
      // Continue to other parsers
    }
  }

  // Plain query string payload support: business_id=...&queue_type=...
  if (trimmed.includes('=')) {
    const params = new URLSearchParams(trimmed);
    params.forEach((value, key) => {
      payload[key] = value;
    });

    businessId = firstMatching(payload, BUSINESS_ID_KEYS) || '';
    serviceType = firstMatching(payload, SERVICE_TYPE_KEYS);
    unitPrice = parsePriceValue(firstMatching(payload, UNIT_PRICE_KEYS));

    if (businessId) {
      return { businessId, serviceType, unitPrice, raw: trimmed, payload };
    }
  }

  // Raw business-id-only fallback (UUID or plain string)
  if (trimmed.length > 0 && !trimmed.includes(' ')) {
    payload.business_id = trimmed;
    return { businessId: trimmed, unitPrice, raw: trimmed, payload };
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
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [pendingJoin, setPendingJoin] = useState<{
    businessId: string;
    businessName: string;
    serviceType?: string;
    serviceName?: string;
    unitPrice: number;
  } | null>(null);
  const joinQueueInSupabase = useStore((s) => s.joinQueueInSupabase);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const [dialog, setDialog] = useState<DialogConfig | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinModalData, setJoinModalData] = useState<{
    businessId: string;
    businessName: string;
    category: string;
    address?: string;
    isOpen: boolean;
    queueLength: number;
    waitTime: string;
    serviceType?: string;
    serviceName?: string;
    estimatedDuration?: number;
    unitPrice: number;
  } | null>(null);

  // Helper function to process business ID (used by both QR scan and manual entry)
  const processBusinessId = async (
    businessId: string,
    serviceType?: string,
    qrPayload?: Record<string, string>,
    qrUnitPrice?: number
  ) => {
    // 1. Validate auth
    if (!isAuthenticated) {
      setDialog({
        title: 'Sign In Required',
        message: 'Please sign in to join a queue.',
        icon: 'log-in-outline',
        iconVariant: 'warning',
        actions: [
          { label: 'Cancel', onPress: () => { setDialog(null); setScanned(false); } },
          { label: 'Sign In', variant: 'primary', onPress: () => { setDialog(null); setScanned(false); router.push('/(auth)/login'); } },
        ],
      });
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
      setDialog({
        title: 'Business Not Found',
        message: 'We could not find this business. The QR code may be outdated.',
        icon: 'alert-circle-outline',
        iconVariant: 'destructive',
        actions: [{ label: 'OK', onPress: () => { setDialog(null); setScanned(false); } }],
      });
      return;
    }

    const biz = bizResult.data;
    const svc = svcResult.data;
    const unitPrice = qrUnitPrice ?? (typeof svc?.price === 'number' ? svc.price : 0) ?? 0;

    // 3. Show beautiful join confirmation modal
    setJoinModalData({
      businessId,
      businessName: biz.name,
      category: biz.category,
      address: (biz as any).address,
      isOpen: biz.is_open,
      queueLength: (biz as any).queue_length ?? 0,
      waitTime: (biz as any).wait_time ?? 'N/A',
      serviceType,
      serviceName: svc?.name,
      estimatedDuration: svc?.estimated_duration ?? undefined,
      unitPrice,
    });
    setShowJoinModal(true);
  };

  const handleJoinFromModal = () => {
    if (!joinModalData) return;
    setShowJoinModal(false);
    setPendingJoin({
      businessId: joinModalData.businessId,
      businessName: joinModalData.businessName,
      serviceType: joinModalData.serviceType,
      serviceName: joinModalData.serviceName,
      unitPrice: joinModalData.unitPrice,
    });
    setQuantity(1);
    setShowQuantityModal(true);
  };

  const handleConfirmJoinWithQuantity = async () => {
    if (!pendingJoin) return;

    const qty = Math.max(1, quantity);
    const totalAmount = pendingJoin.unitPrice * qty;

    setShowQuantityModal(false);
    setJoining(true);

    const result = await joinQueueInSupabase(
      pendingJoin.businessId,
      pendingJoin.serviceType,
      {
        quantity: qty,
        unitPrice: pendingJoin.unitPrice,
        totalAmount,
      }
    );

    setJoining(false);

    if (!result.success || !result.queueEntryId) {
      setDialog({
        title: 'Could Not Join',
        message: result.error ?? 'An error occurred while joining the queue.',
        icon: 'alert-circle-outline',
        iconVariant: 'destructive',
        actions: [{ label: 'OK', onPress: () => { setDialog(null); setScanned(false); } }],
      });
      setPendingJoin(null);
      return;
    }

    setPendingJoin(null);
    setScanned(false);
    router.push(`/queue/${result.queueEntryId}`);
  };

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned || resolving || joining) return;
    setScanned(true);

    // Parse QR data
    const parsed = parseQrData(data);
    if (!parsed) {
      setDialog({
        title: 'Invalid QR Code',
        message: 'This QR code is not a valid BusinessHub Pro queue code.',
        icon: 'alert-circle-outline',
        iconVariant: 'destructive',
        actions: [{ label: 'OK', onPress: () => { setDialog(null); setScanned(false); } }],
      });
      return;
    }

    const { businessId, serviceType, unitPrice, payload } = parsed;
    await processBusinessId(businessId, serviceType, payload, unitPrice);
  };

  // Pick a QR code image from the gallery
  const handleGalleryPick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;

    try {
      const barcodes = await Camera.scanFromURLAsync(result.assets[0].uri, ['qr']);
      if (!barcodes.length) {
        setDialog({
          title: 'No QR Code Found',
          message: 'No QR code was detected in the selected image.',
          icon: 'image-outline',
          iconVariant: 'warning',
          actions: [{ label: 'OK', onPress: () => setDialog(null) }],
        });
        return;
      }
      const parsed = parseQrData(barcodes[0].data);
      if (!parsed) {
        setDialog({
          title: 'Invalid QR Code',
          message: 'This QR code is not a valid BusinessHub Pro queue code.',
          icon: 'alert-circle-outline',
          iconVariant: 'destructive',
          actions: [{ label: 'OK', onPress: () => { setDialog(null); setScanned(false); } }],
        });
        return;
      }
      setScanned(true);
      await processBusinessId(parsed.businessId, parsed.serviceType, parsed.payload, parsed.unitPrice);
    } catch {
      setDialog({
        title: 'Scan Failed',
        message: 'Could not read a QR code from this image. Try a clearer photo.',
        icon: 'alert-circle-outline',
        iconVariant: 'destructive',
        actions: [{ label: 'OK', onPress: () => setDialog(null) }],
      });
    }
  };

  // Manual entry function
  const handleManualEntry = () => {
    setManualBusinessId('');
    setShowManualModal(true);
  };

  const handleManualSubmit = async () => {
    if (!manualBusinessId || manualBusinessId.trim() === '') {
      setDialog({
        title: 'Invalid Input',
        message: 'Please enter a valid business ID.',
        icon: 'alert-circle-outline',
        iconVariant: 'warning',
        actions: [{ label: 'OK', onPress: () => setDialog(null) }],
      });
      return;
    }
    
    setShowManualModal(false);
    setScanned(true);
    await processBusinessId(manualBusinessId.trim());
    setScanned(false);
    setManualBusinessId('');
  };

  // Web: camera-based QR scanning is not available — show manual entry only
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.webFallbackContainer}>
          <View style={[styles.webFallbackIcon, { backgroundColor: colors.secondary }]}>
            <Ionicons name="qr-code-outline" size={56} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.webFallbackTitle, { color: colors.foreground }]}>QR Scanning Unavailable</Text>
          <Text style={[styles.webFallbackDesc, { color: colors.mutedForeground }]}>
            Camera-based QR scanning is only available on the mobile app.{'\n'}
            Use the button below to join a queue by entering the business ID manually.
          </Text>
          <TouchableOpacity
            style={[styles.manualButton, { backgroundColor: colors.primary, marginTop: 24, width: '80%' }]}
            onPress={handleManualEntry}
          >
            <Text style={styles.manualButtonText}>Enter Business ID</Text>
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
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Enter Business ID</Text>
              <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
                Enter the business ID to join its queue
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
                  <Text style={[styles.modalButtonText, { color: colors.foreground }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleManualSubmit}
                >
                  <Text style={[styles.modalButtonText, { color: colors.primaryForeground }]}>Join Queue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Quantity Modal (shared with native) */}
        <Modal
          visible={showQuantityModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => { setShowQuantityModal(false); setPendingJoin(null); setScanned(false); }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.quantityModalContent, { backgroundColor: colors.background }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Select Quantity</Text>
              <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>{pendingJoin?.businessName || 'Business'}</Text>
              <View style={styles.qtyStepperRow}>
                <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: colors.secondary }]} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
                  <Text style={[styles.stepperBtnText, { color: colors.foreground }]}>-</Text>
                </TouchableOpacity>
                <View style={[styles.qtyValueBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Text style={[styles.qtyValueText, { color: colors.foreground }]}>{quantity}</Text>
                </View>
                <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: colors.secondary }]} onPress={() => setQuantity((q) => Math.min(99, q + 1))}>
                  <Text style={[styles.stepperBtnText, { color: colors.foreground }]}>+</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.muted }]} onPress={() => { setShowQuantityModal(false); setPendingJoin(null); setScanned(false); }}>
                  <Text style={[styles.modalButtonText, { color: colors.foreground }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleConfirmJoinWithQuantity}>
                  <Text style={[styles.modalButtonText, { color: colors.primaryForeground }]}>Join Queue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {dialog && <Dialog visible {...dialog} onDismiss={() => setDialog(null)} />}
      </SafeAreaView>
    );
  }

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
      />
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        <ScannerOverlay flashOn={flashOn} onToggleFlash={() => setFlashOn(!flashOn)} />
      </View>

      {busy && (
        <View style={styles.busyOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.busyText}>
            {resolving ? 'Looking up business…' : 'Joining queue…'}
          </Text>
        </View>
      )}

      {/* Bottom action buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
          onPress={handleGalleryPick}
          disabled={busy}
        >
          <Ionicons name="images-outline" size={20} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary, flex: 2 }]}
          onPress={handleManualEntry}
          disabled={busy}
        >
          <Ionicons name="keypad-outline" size={20} color={colors.primaryForeground} />
          <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Enter ID Manually</Text>
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
              Enter the business ID to join its queue
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
                <Text style={[styles.modalButtonText, { color: colors.primaryForeground }]}>
                  Join Queue
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Quantity + Total Modal */}
      <Modal
        visible={showQuantityModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowQuantityModal(false);
          setPendingJoin(null);
          setScanned(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.quantityModalContent, { backgroundColor: colors.background }]}> 
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Select Quantity</Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
              {pendingJoin?.businessName || 'Business'}
            </Text>

            {pendingJoin?.serviceName ? (
              <View style={[styles.serviceChip, { backgroundColor: colors.secondary }]}> 
                <Text style={[styles.serviceChipText, { color: colors.foreground }]}>
                  {pendingJoin.serviceName}
                </Text>
              </View>
            ) : null}

            <View style={styles.qtyStepperRow}>
              <TouchableOpacity
                style={[styles.stepperBtn, { backgroundColor: colors.secondary }]}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Text style={[styles.stepperBtnText, { color: colors.foreground }]}>-</Text>
              </TouchableOpacity>

              <View style={[styles.qtyValueBox, { borderColor: colors.border, backgroundColor: colors.card }]}> 
                <Text style={[styles.qtyValueText, { color: colors.foreground }]}>{quantity}</Text>
              </View>

              <TouchableOpacity
                style={[styles.stepperBtn, { backgroundColor: colors.secondary }]}
                onPress={() => setQuantity((q) => Math.min(99, q + 1))}
              >
                <Text style={[styles.stepperBtnText, { color: colors.foreground }]}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.priceSummary, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Unit Price</Text>
                <Text style={[styles.priceValue, { color: colors.foreground }]}>
                  Rs. {(pendingJoin?.unitPrice ?? 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Quantity</Text>
                <Text style={[styles.priceValue, { color: colors.foreground }]}>{quantity}</Text>
              </View>
              <View style={[styles.priceRow, styles.priceRowTotal]}>
                <Text style={[styles.totalLabel, { color: colors.primary }]}>Total Amount</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>
                  Rs. {((pendingJoin?.unitPrice ?? 0) * quantity).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.muted }]}
                onPress={() => {
                  setShowQuantityModal(false);
                  setPendingJoin(null);
                  setScanned(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleConfirmJoinWithQuantity}
              >
                <Text style={[styles.modalButtonText, { color: colors.primaryForeground }]}>Join Queue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* ── Join Queue Confirmation Bottom Sheet ── */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowJoinModal(false); setScanned(false); }}
      >
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheet, { backgroundColor: colors.card ?? colors.background }]}>
            {/* Handle */}
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            {/* Business header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                <View style={[styles.categoryBadge, { backgroundColor: colors.secondary }]}>
                  <Ionicons name="storefront-outline" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.categoryText, { color: colors.mutedForeground }]}>
                    {joinModalData?.category || 'Business'}
                  </Text>
                </View>
                <Text style={[styles.bizName, { color: colors.foreground }]} numberOfLines={2}>
                  {joinModalData?.businessName}
                </Text>
                {joinModalData?.address ? (
                  <View style={styles.addressRow}>
                    <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.addressText, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {joinModalData.address}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={[styles.openBadge, {
                backgroundColor: joinModalData?.isOpen ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              }]}>
                <View style={[styles.openDot, {
                  backgroundColor: joinModalData?.isOpen ? '#22c55e' : '#ef4444',
                }]} />
                <Text style={[styles.openText, {
                  color: joinModalData?.isOpen ? '#22c55e' : '#ef4444',
                }]}>
                  {joinModalData?.isOpen ? 'Open' : 'Closed'}
                </Text>
              </View>
            </View>

            {/* Queue stats row */}
            <View style={[styles.statsRow, { borderColor: colors.border }]}>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={20} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {joinModalData?.queueLength ?? 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>waiting</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {joinModalData?.waitTime ?? 'N/A'}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>est. wait</Text>
              </View>
              {joinModalData?.estimatedDuration ? (
                <>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.statItem}>
                    <Ionicons name="timer-outline" size={20} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.foreground }]}>
                      {joinModalData.estimatedDuration} min
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>per person</Text>
                  </View>
                </>
              ) : null}
            </View>

            {/* Service + price */}
            {joinModalData?.serviceName ? (
              <View style={[styles.serviceRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <View>
                  <Text style={[styles.serviceLabel, { color: colors.mutedForeground }]}>Service</Text>
                  <Text style={[styles.serviceName, { color: colors.foreground }]}>
                    {joinModalData.serviceName}
                  </Text>
                </View>
                <View style={styles.priceBlock}>
                  <Text style={[styles.serviceLabel, { color: colors.mutedForeground }]}>Price</Text>
                  <Text style={[styles.servicePrice, { color: colors.primary }]}>
                    Rs. {joinModalData.unitPrice.toLocaleString()}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Actions */}
            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: colors.primary }]}
              onPress={handleJoinFromModal}
              activeOpacity={0.85}
            >
              <Text style={[styles.joinBtnText, { color: colors.primaryForeground }]}>
                Join Queue
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => { setShowJoinModal(false); setScanned(false); }}
            >
              <Text style={[styles.cancelLinkText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {dialog && <Dialog visible {...dialog} onDismiss={() => setDialog(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  webFallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[8],
    gap: Spacing[4],
  },
  webFallbackIcon: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  webFallbackTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  webFallbackDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
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
    flexDirection: 'row',
    gap: Spacing[3],
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.DEFAULT,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  // kept for web fallback path
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
  quantityModalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: BorderRadius.LG,
    padding: Spacing[6],
    gap: Spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing[2],
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
  serviceChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: 999,
  },
  serviceChipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  qtyStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 30,
  },
  qtyValueBox: {
    minWidth: 96,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[4],
  },
  qtyValueText: {
    fontSize: 24,
    fontWeight: '800',
  },
  priceSummary: {
    borderWidth: 1,
    borderRadius: BorderRadius.DEFAULT,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceRowTotal: {
    marginTop: Spacing[2],
    paddingTop: Spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(127,127,127,0.35)',
  },
  priceLabel: {
    fontSize: Typography.fontSize.sm,
  },
  priceValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  totalLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
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
  // ── Join confirmation bottom sheet ──
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing[6],
    paddingBottom: Spacing[8],
    gap: Spacing[4],
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing[2],
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing[3],
  },
  sheetHeaderLeft: { flex: 1, gap: Spacing[1] },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 2,
  },
  categoryText: { fontSize: 11, fontWeight: '600' },
  bizName: { fontSize: 22, fontWeight: '800', lineHeight: 28 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  addressText: { fontSize: 12, flex: 1 },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  openDot: { width: 7, height: 7, borderRadius: 4 },
  openText: { fontSize: 12, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: BorderRadius.DEFAULT,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing[3],
    gap: 3,
  },
  statDivider: { width: 1 },
  statValue: { fontSize: 15, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[4],
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: 1,
  },
  serviceLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  serviceName: { fontSize: 15, fontWeight: '700' },
  priceBlock: { alignItems: 'flex-end' },
  servicePrice: { fontSize: 18, fontWeight: '800' },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.DEFAULT,
    marginTop: Spacing[2],
  },
  joinBtnText: { fontSize: Typography.fontSize.base, fontWeight: '700' },
  cancelLink: { alignItems: 'center', paddingVertical: Spacing[2] },
  cancelLinkText: { fontSize: Typography.fontSize.sm },
});
