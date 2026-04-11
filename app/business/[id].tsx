import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Share,
  StatusBar,
  Modal,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Avatar, Button, SkeletonBusinessDetail } from '@/components/ui';
import Dialog, { DialogConfig } from '@/components/ui/Dialog';
import { resolveBusinessById, fetchServicesByBusiness, ServiceRecord } from '@/lib/queue';
import { COMMITMENT_RATE } from '@/lib/wallet';
import { useStore } from '@/store/useStore';


export default function BusinessDetailScreen() {
  const { id }     = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();

  const [loading,    setLoading]    = useState(false);
  const [business,   setBusiness]   = useState<any | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dialog,     setDialog]     = useState<DialogConfig | null>(null);

  // ── Service picker state ──
  const [services,           setServices]           = useState<ServiceRecord[]>([]);
  const [showServiceModal,   setShowServiceModal]   = useState(false);
  const [showQuantityModal,  setShowQuantityModal]  = useState(false);
  const [quantity,           setQuantity]           = useState(1);
  const [pendingJoin, setPendingJoin] = useState<{
    serviceType?: string;
    serviceName?: string;
    unitPrice: number;
  } | null>(null);

  const joinQueueInSupabase = useStore((s) => s.joinQueueInSupabase);
  const toggleFavorite      = useStore((s) => s.toggleFavorite);
  const favoriteBusinesses  = useStore((s) => s.favoriteBusinesses);
  const isAuthenticated     = useStore((s) => s.isAuthenticated);
  const isFavorite          = !!(business?.id && favoriteBusinesses.includes(business.id));

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await resolveBusinessById(id);
      if (error || !data) setFetchError(error ?? 'Business not found');
      else                setBusiness(data);
    })();
  }, [id]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleJoinQueue = async () => {
    if (!business) return;
    if (!isAuthenticated) {
      setDialog({
        title: 'Sign In Required',
        message: 'Please sign in to join a queue.',
        icon: 'log-in-outline',
        iconVariant: 'warning',
        actions: [
          { label: 'Cancel',  variant: 'secondary', onPress: () => setDialog(null) },
          { label: 'Sign In', variant: 'primary',   onPress: () => { setDialog(null); router.push('/(auth)/login'); } },
        ],
      });
      return;
    }

    // Fetch available services for this business
    setLoading(true);
    const { data: svcs } = await fetchServicesByBusiness(business.id);
    setLoading(false);

    setServices(svcs);
    setQuantity(1);

    if (svcs.length === 0) {
      // No services — join as a general queue (no service type, free)
      setPendingJoin({ unitPrice: 0 });
      setShowQuantityModal(true);
    } else if (svcs.length === 1) {
      // Only one service — skip picker, go straight to quantity
      const svc = svcs[0];
      setPendingJoin({ serviceType: svc.id, serviceName: svc.name, unitPrice: svc.price ?? 0 });
      setShowQuantityModal(true);
    } else {
      // Multiple services — show picker
      setShowServiceModal(true);
    }
  };

  const handleSelectService = (svc: ServiceRecord | null) => {
    setShowServiceModal(false);
    setPendingJoin(
      svc
        ? { serviceType: svc.id, serviceName: svc.name, unitPrice: svc.price ?? 0 }
        : { unitPrice: 0 }
    );
    setQuantity(1);
    setShowQuantityModal(true);
  };

  const handleConfirmJoin = async () => {
    if (!business || !pendingJoin) return;
    const qty = Math.max(1, quantity);
    const totalAmount = pendingJoin.unitPrice * qty;

    setShowQuantityModal(false);
    setLoading(true);
    const result = await joinQueueInSupabase(
      business.id,
      pendingJoin.serviceType,
      { quantity: qty, unitPrice: pendingJoin.unitPrice, totalAmount }
    );
    setLoading(false);

    if (!result.success || !result.queueEntryId) {
      if (result.error === 'NO_PAYMENT_METHOD') {
        setDialog({
          title: 'Payment Method Required',
          message: 'You need to add a payment method before joining a queue. Set one up in your wallet — it only takes a moment.',
          icon: 'card-outline', iconVariant: 'warning',
          actions: [
            { label: 'Not Now',    variant: 'secondary', onPress: () => setDialog(null) },
            { label: 'Add Method', variant: 'primary',   onPress: () => { setDialog(null); router.push('/profile/payment'); } },
          ],
        });
      } else if (result.error?.startsWith('INSUFFICIENT_BALANCE:')) {
        const [, balance, required] = result.error.split(':');
        setDialog({
          title: 'Insufficient Wallet Balance',
          message: `Your wallet has Rs ${Number(balance).toLocaleString('en-PK')} but Rs ${Number(required).toLocaleString('en-PK')} is required as a 20% advance. Top up your wallet to continue.`,
          icon: 'wallet-outline', iconVariant: 'warning',
          actions: [
            { label: 'Not Now', variant: 'secondary', onPress: () => setDialog(null) },
            { label: 'Top Up',  variant: 'primary',   onPress: () => { setDialog(null); router.push('/profile/payment'); } },
          ],
        });
      } else {
        setDialog({
          title: 'Could Not Join',
          message: result.error ?? 'An error occurred. Please try again.',
          icon: 'alert-circle-outline', iconVariant: 'destructive',
          actions: [{ label: 'OK', variant: 'secondary', onPress: () => setDialog(null) }],
        });
      }
      setPendingJoin(null);
      return;
    }

    setPendingJoin(null);
    router.push(`/queue/${result.queueEntryId}`);
  };

  const handleCall = async () => {
    const phone = (business?.phone ?? '').trim().replace(/\s+/g, '');
    if (!phone) {
      setDialog({
        title: 'No Phone Number',
        message: 'This business has not provided a phone number.',
        icon: 'call-outline', iconVariant: 'warning',
        actions: [{ label: 'OK', onPress: () => setDialog(null) }],
      });
      return;
    }
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch {
      setDialog({
        title: 'Copy Number',
        message: `Could not open dialer. Copy ${phone} to your clipboard?`,
        icon: 'copy-outline', iconVariant: 'warning',
        actions: [
          { label: 'Cancel', variant: 'secondary', onPress: () => setDialog(null) },
          { label: 'Copy', variant: 'primary', onPress: async () => {
            await Clipboard.setStringAsync(phone);
            setDialog({ title: 'Copied', message: 'Phone number copied to clipboard.', icon: 'checkmark-circle-outline', iconVariant: 'success', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
          }},
        ],
      });
    }
  };

  const handleDirections = async () => {
    const hasCoords = typeof business?.latitude === 'number' && typeof business?.longitude === 'number';
    const url = hasCoords
      ? `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business?.address || business?.name || '')}`;
    if (!(await Linking.canOpenURL(url))) {
      setDialog({
        title: 'Maps Unavailable',
        message: 'Could not open maps on this device.',
        icon: 'alert-circle-outline', iconVariant: 'destructive',
        actions: [{ label: 'OK', onPress: () => setDialog(null) }],
      });
      return;
    }
    await Linking.openURL(url);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${business.name} on BusinessHub Pro.\nbusinesshubpro://business/${business.id}`,
        title: business.name,
      });
    } catch { /* dismissed */ }
  };

  // ── Loading / Error states ───────────────────────────────────────────────────
  if (!business && !fetchError) {
    return (
      <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SkeletonBusinessDetail />
      </SafeAreaView>
    );
  }

  if (fetchError || !business) {
    return (
      <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.errorBox}>
          <View style={[styles.errorIcon, { backgroundColor: colors.secondary }]}>
            <Ionicons name="storefront-outline" size={36} color={colors.destructive} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>Business Not Found</Text>
          <Text style={[styles.errorSub, { color: colors.mutedForeground }]}>
            {fetchError ?? 'We could not load this business.'}
          </Text>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.foreground }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backBtnText, { color: colors.background }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const BG       = colors.background;
  const FG       = colors.foreground;
  const BRAND    = colors.brand;
  const CTA      = colors.primary;
  const CTA_FG   = colors.primaryForeground;
  const MUTED    = colors.mutedForeground;
  const BORDER   = colors.border;
  const CARD   = colors.card;

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: BG }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <View style={[styles.hero, { backgroundColor: CARD, borderBottomColor: BORDER }]}>
          {/* Top row: Back + Actions */}
          <View style={styles.heroTopRow}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: BG, borderColor: BORDER }]}
              onPress={() => router.back()}
              activeOpacity={0.75}
            >
              <Ionicons name="arrow-back" size={20} color={FG} />
            </TouchableOpacity>
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: BG, borderColor: BORDER }]}
                onPress={() => business?.id && toggleFavorite(business.id)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFavorite ? colors.destructive : FG}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: BG, borderColor: BORDER }]}
                onPress={handleShare}
                activeOpacity={0.75}
              >
                <Ionicons name="share-outline" size={20} color={FG} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Avatar + identity */}
          <View style={styles.identity}>
            <Avatar name={business.name} size="xl" />
            <View style={styles.identityText}>
              <Text style={[styles.bizName, { color: FG }]} numberOfLines={2}>
                {business.name}
              </Text>
              <Text style={[styles.bizCategory, { color: MUTED }]}>
                {business.category || 'Business'}
              </Text>
              {/* Open / Closed badge */}
              <View style={[
                styles.statusBadge,
                { backgroundColor: business.is_open ? colors.success + '20' : colors.secondary },
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: business.is_open ? colors.success : MUTED },
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: business.is_open ? colors.success : MUTED },
                ]}>
                  {business.is_open ? 'Open Now' : 'Closed'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Queue Status ──────────────────────────────────────────────────── */}
        <View style={styles.pad}>
          <View style={[styles.queueCard, { backgroundColor: CARD, borderColor: BORDER }]}>
            <View style={styles.queueTop}>
              <View>
                <Text style={[styles.queueLabel, { color: MUTED }]}>ESTIMATED WAIT</Text>
                <Text style={[styles.queueWait, { color: FG }]}>
                  {business.wait_time ?? 'N/A'}
                </Text>
              </View>
              <View style={[styles.queueCountBox, { backgroundColor: BG, borderColor: BORDER }]}>
                <Text style={[styles.queueCount, { color: FG }]}>
                  {business.queue_length ?? 0}
                </Text>
                <Text style={[styles.queueCountLabel, { color: MUTED }]}>IN QUEUE</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Quick Actions ─────────────────────────────────────────────────── */}
        <View style={[styles.row, styles.pad, { gap: 12 }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: CARD, borderColor: BORDER }]}
            onPress={handleCall}
            activeOpacity={0.75}
          >
            <Ionicons name="call-outline" size={22} color={FG} />
            <Text style={[styles.actionBtnText, { color: FG }]}>Call</Text>
            {!!business.phone && (
              <Text style={[styles.actionBtnSub, { color: MUTED }]} numberOfLines={1}>
                {business.phone}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: CARD, borderColor: BORDER }]}
            onPress={handleDirections}
            activeOpacity={0.75}
          >
            <Ionicons name="navigate-outline" size={22} color={FG} />
            <Text style={[styles.actionBtnText, { color: FG }]}>Directions</Text>
            {!!business.address && (
              <Text style={[styles.actionBtnSub, { color: MUTED }]} numberOfLines={1}>
                {business.address}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── About ────────────────────────────────────────────────────────── */}
        {!!(business.description) && (
          <View style={styles.pad}>
            <Text style={[styles.sectionLabel, { color: MUTED }]}>ABOUT</Text>
            <Text style={[styles.description, { color: FG }]}>
              {business.description}
            </Text>
          </View>
        )}


        {/* ── Rating (if available) ────────────────────────────────────────── */}
        {typeof business.rating === 'number' && business.rating > 0 && (
          <View style={styles.pad}>
            <Text style={[styles.sectionLabel, { color: MUTED }]}>RATING</Text>
            <View style={[styles.ratingCard, { backgroundColor: CARD, borderColor: BORDER }]}>
              <Ionicons name="star" size={28} color={colors.warning} />
              <Text style={[styles.ratingVal, { color: FG }]}>
                {business.rating.toFixed(1)}
              </Text>
              <Text style={[styles.ratingScale, { color: MUTED }]}>/ 5.0</Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── Sticky Join Footer ── */}
      <View style={[styles.joinFooter, { backgroundColor: BG, borderTopColor: BORDER }]}>
        <TouchableOpacity
          style={[styles.joinBtn, { backgroundColor: CTA }]}
          onPress={handleJoinQueue}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={CTA_FG} />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color={CTA_FG} />
              <Text style={[styles.joinBtnText, { color: CTA_FG }]}>JOIN QUEUE</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Service Picker Modal ── */}
      <Modal
        visible={showServiceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowServiceModal(false)}
      >
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Select a Service</Text>
            <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>{business?.name}</Text>

            <FlatList
              data={services}
              keyExtractor={(s) => s.id}
              style={{ maxHeight: 380 }}
              ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: colors.border }]} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.svcRow}
                  activeOpacity={0.7}
                  onPress={() => handleSelectService(item)}
                >
                  <View style={[styles.svcIconBox, { backgroundColor: colors.brand + '20' }]}>
                    <Ionicons name="storefront-outline" size={18} color={colors.brand} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.svcName, { color: colors.foreground }]}>{item.name}</Text>
                    {!!item.description && (
                      <Text style={[styles.svcDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={[styles.svcPrice, { color: item.price ? colors.foreground : colors.mutedForeground }]}>
                      {item.price ? `Rs ${item.price.toLocaleString('en-PK')}` : 'Free'}
                    </Text>
                    {!!item.estimated_duration && (
                      <Text style={[styles.svcDuration, { color: colors.mutedForeground }]}>
                        ~{item.estimated_duration} min
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: colors.secondary }]}
              onPress={() => setShowServiceModal(false)}
              activeOpacity={0.75}
            >
              <Text style={[styles.cancelBtnText, { color: colors.foreground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Quantity Modal ── */}
      <Modal
        visible={showQuantityModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowQuantityModal(false); setPendingJoin(null); }}
      >
        <View style={styles.qtyOverlay}>
          <View style={[styles.qtyBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Select Quantity</Text>
            <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>{business?.name}</Text>

            {pendingJoin?.serviceName && (
              <View style={[styles.svcChip, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.svcChipText, { color: colors.foreground }]}>{pendingJoin.serviceName}</Text>
              </View>
            )}

            <View style={styles.stepperRow}>
              <TouchableOpacity style={[styles.stepBtn, { backgroundColor: colors.secondary }]} onPress={() => setQuantity(q => Math.max(1, q - 1))}>
                <Text style={[styles.stepBtnText, { color: colors.foreground }]}>−</Text>
              </TouchableOpacity>
              <View style={[styles.qtyVal, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.qtyValText, { color: colors.foreground }]}>{quantity}</Text>
              </View>
              <TouchableOpacity style={[styles.stepBtn, { backgroundColor: colors.secondary }]} onPress={() => setQuantity(q => Math.min(99, q + 1))}>
                <Text style={[styles.stepBtnText, { color: colors.foreground }]}>+</Text>
              </TouchableOpacity>
            </View>

            {(() => {
              const unitPrice = pendingJoin?.unitPrice ?? 0;
              const total     = unitPrice * quantity;
              const advance   = Math.ceil(total * COMMITMENT_RATE);
              const pct       = Math.round(COMMITMENT_RATE * 100);
              return (
                <View style={[styles.priceSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Unit Price</Text>
                    <Text style={[styles.priceValue, { color: colors.foreground }]}>Rs {unitPrice.toLocaleString('en-PK')}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Quantity</Text>
                    <Text style={[styles.priceValue, { color: colors.foreground }]}>{quantity}</Text>
                  </View>
                  <View style={[styles.priceRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4, paddingTop: 8 }]}>
                    <Text style={[styles.priceLabel, { color: colors.brand, fontWeight: '700' }]}>Total</Text>
                    <Text style={[styles.priceValue, { color: colors.brand, fontWeight: '700' }]}>Rs {total.toLocaleString('en-PK')}</Text>
                  </View>
                  {total > 0 && (
                    <View style={styles.priceRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Advance ({pct}%)</Text>
                        <Text style={{ fontSize: 10, color: colors.mutedForeground }}>Deducted from wallet</Text>
                      </View>
                      <Text style={[styles.priceValue, { color: colors.destructive, fontWeight: '700' }]}>− Rs {advance.toLocaleString('en-PK')}</Text>
                    </View>
                  )}
                </View>
              );
            })()}

            <View style={styles.qtyBtns}>
              <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.secondary }]} onPress={() => { setShowQuantityModal(false); setPendingJoin(null); }}>
                <Text style={[styles.qtyBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.brand }]} onPress={handleConfirmJoin}>
                <Text style={[styles.qtyBtnText, { color: '#fff' }]}>Join Queue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {dialog && <Dialog visible {...dialog} onDismiss={() => setDialog(null)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },

  /* ── Error state ── */
  errorBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12,
  },
  errorIcon: {
    width: 80, height: 80, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  errorTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  errorSub:   { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  backBtn:    { marginTop: 8, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  backBtnText:{ fontSize: 15, fontWeight: '800' },

  /* ── Hero ── */
  hero: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24,
    borderBottomWidth: 1,
  },
  heroTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  heroActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },

  identity: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  identityText: { flex: 1, gap: 6 },
  bizName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, lineHeight: 28 },
  bizCategory: { fontSize: 13, fontWeight: '500' },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusDot:  { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },

  /* ── Queue card ── */
  pad: { paddingHorizontal: 20, marginTop: 20 },
  row: { flexDirection: 'row' },

  queueCard: {
    borderRadius: 20, borderWidth: 1,
    padding: 20, gap: 16,
  },
  queueTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  queueLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  queueWait:  { fontSize: 32, fontWeight: '900', letterSpacing: -1 },

  queueCountBox: {
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 10,
    alignItems: 'center',
  },
  queueCount:      { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  queueCountLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },

  joinFooter: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
    borderTopWidth: 1,
  },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 18,
  },
  joinBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 1 },

  /* ── Quick actions ── */
  actionBtn: {
    flex: 1, alignItems: 'center', gap: 4,
    borderRadius: 16, borderWidth: 1,
    paddingVertical: 18, paddingHorizontal: 10,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  actionBtnSub:  { fontSize: 11, fontWeight: '400', textAlign: 'center' },

  /* ── Section label ── */
  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2,
    marginBottom: 10,
  },

  /* ── About ── */
  description: { fontSize: 14, lineHeight: 22 },

  /* ── Contact card ── */
  contactCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contactIcon: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  contactText: { flex: 1, fontSize: 14, fontWeight: '500' },

  /* ── Rating ── */
  ratingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 16, borderWidth: 1,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  ratingVal:   { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  ratingScale: { fontSize: 14, fontWeight: '500', marginTop: 4 },

  /* ── Service picker sheet ── */
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 4 },
  sheetHandle:  { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:   { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  sheetSub:     { fontSize: 13, marginBottom: 12 },
  sep:          { height: 1 },
  svcRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  svcIconBox:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  svcName:      { fontSize: 14, fontWeight: '700' },
  svcDesc:      { fontSize: 12, marginTop: 2 },
  svcPrice:     { fontSize: 13, fontWeight: '700' },
  svcDuration:  { fontSize: 11 },
  cancelBtn:    { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  cancelBtnText:{ fontSize: 14, fontWeight: '700' },

  /* ── Quantity modal ── */
  qtyOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 20 },
  qtyBox:       { borderRadius: 24, padding: 24, gap: 12 },
  svcChip:      { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  svcChipText:  { fontSize: 12, fontWeight: '600' },
  stepperRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginVertical: 4 },
  stepBtn:      { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  stepBtnText:  { fontSize: 22, fontWeight: '700', lineHeight: 26 },
  qtyVal:       { width: 64, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyValText:   { fontSize: 22, fontWeight: '800' },
  priceSummary: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  priceRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel:   { fontSize: 13 },
  priceValue:   { fontSize: 13, fontWeight: '600' },
  qtyBtns:      { flexDirection: 'row', gap: 10, marginTop: 4 },
  qtyBtn:       { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  qtyBtnText:   { fontSize: 14, fontWeight: '800' },
});
