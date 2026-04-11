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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Avatar, Button, SkeletonBusinessDetail } from '@/components/ui';
import Dialog, { DialogConfig } from '@/components/ui/Dialog';
import { resolveBusinessById } from '@/lib/queue';
import { useStore } from '@/store/useStore';


export default function BusinessDetailScreen() {
  const { id }     = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();

  const [loading,    setLoading]    = useState(false);
  const [business,   setBusiness]   = useState<any | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dialog,     setDialog]     = useState<DialogConfig | null>(null);

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
  const handleJoinQueue = () => {
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

    setDialog({
      title:   'Confirm Queue Join',
      message: `${business.name}\n\nQueue: ${business.queue_length ?? 0} waiting  ·  Wait: ${business.wait_time ?? 'N/A'}`,
      icon:    'people-outline',
      iconVariant: 'default',
      actions: [
        { label: 'Cancel', variant: 'secondary', onPress: () => setDialog(null) },
        {
          label: 'Join Queue',
          variant: 'primary',
          onPress: async () => {
            setDialog(null);
            setLoading(true);
            const result = await joinQueueInSupabase(business.id);
            setLoading(false);
            if (!result.success || !result.queueEntryId) {
              if (result.error === 'NO_PAYMENT_METHOD') {
                setDialog({
                  title: 'Payment Method Required',
                  message: 'You need to add a payment method before joining a queue. Set one up in your wallet — it only takes a moment.',
                  icon: 'card-outline', iconVariant: 'warning',
                  actions: [
                    { label: 'Not Now', variant: 'secondary', onPress: () => setDialog(null) },
                    { label: 'Add Method', variant: 'primary', onPress: () => { setDialog(null); router.push('/profile/payment'); } },
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
              return;
            }
            router.push(`/queue/${result.queueEntryId}`);
          },
        },
      ],
    });
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
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: CARD, borderColor: BORDER }]}
            onPress={handleDirections}
            activeOpacity={0.75}
          >
            <Ionicons name="navigate-outline" size={22} color={FG} />
            <Text style={[styles.actionBtnText, { color: FG }]}>Directions</Text>
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

        {/* ── Contact Info ─────────────────────────────────────────────────── */}
        {(business.phone || business.address) && (
          <View style={styles.pad}>
            <Text style={[styles.sectionLabel, { color: MUTED }]}>CONTACT</Text>
            <View style={[styles.contactCard, { backgroundColor: CARD, borderColor: BORDER }]}>
              {!!business.phone && (
                <TouchableOpacity
                  style={[styles.contactRow, { borderBottomColor: BORDER }]}
                  onPress={handleCall}
                  activeOpacity={0.7}
                >
                  <View style={[styles.contactIcon, { backgroundColor: BG }]}>
                    <Ionicons name="call-outline" size={16} color={FG} />
                  </View>
                  <Text style={[styles.contactText, { color: FG }]}>{business.phone}</Text>
                  <Ionicons name="chevron-forward" size={14} color={MUTED} />
                </TouchableOpacity>
              )}
              {!!business.address && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={handleDirections}
                  activeOpacity={0.7}
                >
                  <View style={[styles.contactIcon, { backgroundColor: BG }]}>
                    <Ionicons name="location-outline" size={16} color={FG} />
                  </View>
                  <Text style={[styles.contactText, { color: FG }]} numberOfLines={2}>
                    {business.address}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={MUTED} />
                </TouchableOpacity>
              )}
            </View>
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
    flex: 1, alignItems: 'center', gap: 8,
    borderRadius: 16, borderWidth: 1,
    paddingVertical: 18,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },

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
});
