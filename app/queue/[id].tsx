import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import Dialog, { DialogConfig } from '@/components/ui/Dialog';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import {
  fetchQueueEntry,
  subscribeToQueueEntry,
  fetchServiceById,
  QueueEntryRecord,
  ticketLabel,
  formatWait,
} from '@/lib/queue';
import { useStore } from '@/store/useStore';

/** Returns true if the string looks like a UUID */
function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function buildTimeline(entry: QueueEntryRecord) {
  const joinedTime = new Date(entry.joined_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const isActive = entry.status === 'waiting' || entry.status === 'in_progress';
  return [
    { time: joinedTime, event: 'Joined queue', status: 'completed' },
    {
      time: entry.status === 'in_progress' ? 'Now' : (isActive ? 'Pending' : 'Done'),
      event: 'Currently being served',
      status: entry.status === 'in_progress' ? 'active' : (entry.status === 'completed' ? 'completed' : 'pending'),
    },
    {
      time: entry.status === 'completed' ? 'Done' : 'Pending',
      event: 'Service completed',
      status: entry.status === 'completed' ? 'completed' : 'pending',
    },
  ];
}

function statusColor(status: string, colors: any) {
  if (status === 'waiting')     return colors.statusWaiting ?? '#F59E0B';
  if (status === 'in_progress') return colors.statusInProgress ?? '#3B82F6';
  if (status === 'completed')   return colors.success;
  if (status === 'cancelled')   return colors.destructive;
  return colors.mutedForeground;
}

function statusLabel(status: string) {
  if (status === 'waiting')     return 'WAITING';
  if (status === 'in_progress') return 'IN PROGRESS';
  if (status === 'completed')   return 'COMPLETED';
  if (status === 'cancelled')   return 'CANCELLED';
  return status.toUpperCase();
}

export default function QueueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<QueueEntryRecord | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogConfig | null>(null);
  const [serviceName, setServiceName] = useState<string | null>(null);
  const leaveQueueInSupabase = useStore((s) => s.leaveQueueInSupabase);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await fetchQueueEntry(id);
      if (error || !data) { setFetchError(error ?? 'Queue entry not found'); return; }
      setQueue(data);
      // Resolve service name if service_type is a UUID
      if (data.service_type && isUuid(data.service_type)) {
        const { data: svc } = await fetchServiceById(data.service_type);
        if (svc?.name) setServiceName(svc.name);
      } else if (data.service_type) {
        setServiceName(data.service_type);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToQueueEntry(id, (updated) => {
      setQueue((prev) => prev ? ({ ...prev, ...updated } as QueueEntryRecord) : prev);
    });
    return unsubscribe;
  }, [id]);

  const queueLen    = queue?.business?.queue_length ?? queue?.position ?? 1;
  const progressPct = queue ? Math.max(0, Math.min(100,
    ((queueLen - queue.position + 1) / queueLen) * 100
  )) : 0;

  const handleLeaveQueue = () => {
    if (!queue) return;
    setDialog({
      title: 'Leave Queue',
      message: 'Are you sure you want to leave this queue? You will lose your position.',
      icon: 'exit-outline',
      iconVariant: 'destructive',
      actions: [
        { label: 'Cancel', onPress: () => setDialog(null) },
        {
          label: 'Leave Queue',
          variant: 'destructive',
          onPress: async () => {
            setDialog(null);
            setLoading(true);
            const result = await leaveQueueInSupabase(queue.id);
            setLoading(false);
            if (!result.success) {
              setDialog({
                title: 'Error',
                message: result.error ?? 'Failed to leave queue.',
                icon: 'alert-circle-outline',
                iconVariant: 'destructive',
                actions: [{ label: 'OK', onPress: () => setDialog(null) }],
              });
              return;
            }
            router.replace('/(tabs)/queue');
          },
        },
      ],
    });
  };

  const handleViewBusiness = () => {
    if (queue?.business_id) router.push(`/business/${queue.business_id}`);
  };

  if (!queue && !fetchError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (fetchError || !queue) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.foreground }]}>
            {fetchError ?? 'Queue entry not found.'}
          </Text>
          <TouchableOpacity
            style={[styles.errorBtn, { borderColor: colors.border }]}
            onPress={() => router.replace('/(tabs)/queue')}
          >
            <Text style={[styles.errorBtnText, { color: colors.foreground }]}>GO TO MY QUEUES</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const timeline = buildTimeline(queue);
  const sColor   = statusColor(queue.status, colors);
  const initials = (queue.business?.name ?? 'B').slice(0, 2).toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Nav Bar ── */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <View style={[styles.navBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.navBack} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.foreground }]}>QUEUE STATUS</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero — Ticket Number ── */}
        <View style={[styles.hero, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
          {/* Status pill */}
          <View style={[styles.statusPill, { borderColor: sColor }]}>
            <View style={[styles.statusDot, { backgroundColor: sColor }]} />
            <Text style={[styles.statusPillText, { color: sColor }]}>
              {statusLabel(queue.status)}
            </Text>
          </View>

          {/* Big ticket number */}
          <Text style={[styles.ticketNum, { color: colors.foreground }]}>
            {ticketLabel(queue.position)}
          </Text>
          <Text style={[styles.ticketSub, { color: colors.mutedForeground }]}>
            YOUR TICKET NUMBER
          </Text>
        </View>

        {/* ── Position + Wait ── */}
        <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>POSITION</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>#{queue.position}</Text>
            <Text style={[styles.statSub, { color: colors.mutedForeground }]}>
              of {queueLen} in queue
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>EST. WAIT</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {formatWait(queue.estimated_wait_time)}
            </Text>
            <Text style={[styles.statSub, { color: colors.mutedForeground }]}>Updated just now</Text>
          </View>
        </View>

        {/* ── Progress ── */}
        <View style={[styles.progressSection, { borderBottomColor: colors.border }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>QUEUE PROGRESS</Text>
            <Text style={[styles.progressPct, { color: colors.foreground }]}>
              {Math.round(progressPct)}%
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[styles.progressFill, {
                width: `${progressPct}%` as any,
                backgroundColor: colors.primary,
              }]}
            />
          </View>
        </View>

        {/* ── Business ── */}
        <View style={[styles.sectionWrap, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>BUSINESS</Text>
            <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
          </View>
          <TouchableOpacity
            style={[styles.businessRow, { borderColor: colors.border }]}
            onPress={handleViewBusiness}
            activeOpacity={0.7}
          >
            <View style={[styles.bizAvatar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.bizInitials, { color: colors.foreground }]}>{initials}</Text>
            </View>
            <View style={styles.bizInfo}>
              <Text style={[styles.bizName, { color: colors.foreground }]} numberOfLines={1}>
                {queue.business?.name ?? 'Unknown Business'}
              </Text>
              <Text style={[styles.bizMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                {[queue.business?.category, queue.business?.address].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* Service & price strip if available */}
          {(serviceName || queue.total_price) && (
            <View style={[styles.serviceStrip, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {serviceName && (
                <View style={styles.serviceItem}>
                  <Text style={[styles.serviceLabel, { color: colors.mutedForeground }]}>SERVICE</Text>
                  <Text style={[styles.serviceValue, { color: colors.foreground }]} numberOfLines={2}>{serviceName}</Text>
                </View>
              )}
              {queue.quantity != null && (
                <View style={styles.serviceItem}>
                  <Text style={[styles.serviceLabel, { color: colors.mutedForeground }]}>QTY</Text>
                  <Text style={[styles.serviceValue, { color: colors.foreground }]}>×{queue.quantity}</Text>
                </View>
              )}
              {queue.total_price != null && (
                <View style={styles.serviceItem}>
                  <Text style={[styles.serviceLabel, { color: colors.mutedForeground }]}>TOTAL</Text>
                  <Text style={[styles.serviceValue, { color: colors.foreground }]}>
                    ${queue.total_price.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── Timeline ── */}
        <View style={[styles.sectionWrap, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>TIMELINE</Text>
            <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
          </View>
          <View style={styles.timeline}>
            {timeline.map((item, index) => {
              const isCompleted = item.status === 'completed';
              const isActive    = item.status === 'active';
              const dotColor    = isCompleted ? colors.success : isActive ? colors.statusInProgress ?? '#3B82F6' : colors.border;
              return (
                <View key={index} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.tlDot, { backgroundColor: dotColor, borderColor: dotColor }]}>
                      {isCompleted && <Ionicons name="checkmark" size={10} color="#fff" />}
                      {isActive    && <Ionicons name="time-outline" size={9}  color="#fff" />}
                    </View>
                    {index < timeline.length - 1 && (
                      <View style={[styles.tlLine, { backgroundColor: isCompleted ? colors.success : colors.border }]} />
                    )}
                  </View>
                  <View style={styles.timelineRight}>
                    <Text style={[
                      styles.tlEvent,
                      { color: isCompleted || isActive ? colors.foreground : colors.mutedForeground },
                    ]}>
                      {item.event}
                    </Text>
                    <Text style={[styles.tlTime, { color: colors.mutedForeground }]}>{item.time}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Info strip ── */}
        <View style={[styles.infoStrip, { borderBottomColor: colors.border }]}>
          <Ionicons name="time-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Joined at {new Date(queue.joined_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <View style={[styles.infoDot, { backgroundColor: colors.border }]} />
          <Ionicons name="notifications-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            You'll be notified when near
          </Text>
        </View>

        {/* ── Actions ── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.leaveBtn, { borderColor: colors.destructive }]}
            onPress={handleLeaveQueue}
            disabled={loading}
            activeOpacity={0.75}
          >
            {loading
              ? <ActivityIndicator size="small" color={colors.destructive} />
              : <>
                  <Ionicons name="exit-outline" size={18} color={colors.destructive} />
                  <Text style={[styles.leaveBtnText, { color: colors.destructive }]}>LEAVE QUEUE</Text>
                </>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bizBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={handleViewBusiness}
            activeOpacity={0.8}
          >
            <Ionicons name="storefront-outline" size={18} color={colors.primaryForeground} />
            <Text style={[styles.bizBtnText, { color: colors.primaryForeground }]}>VIEW BUSINESS</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {dialog && <Dialog visible {...dialog} onDismiss={() => setDialog(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* ── Errors ── */
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  errorText:      { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  errorBtn:       { marginTop: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  errorBtnText:   { fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },

  /* ── Nav ── */
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: 1,
  },
  navBack:  { width: 36, height: 36, justifyContent: 'center' },
  navTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 2 },

  /* ── Hero ── */
  hero: {
    alignItems: 'center', paddingTop: 40, paddingBottom: 36, paddingHorizontal: 24,
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    marginBottom: 24,
  },
  statusDot:      { width: 7, height: 7, borderRadius: 4 },
  statusPillText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  ticketNum:      { fontSize: 80, fontWeight: '900', letterSpacing: -4, lineHeight: 84, marginBottom: 6 },
  ticketSub:      { fontSize: 11, fontWeight: '700', letterSpacing: 2.5 },

  /* ── Stats row ── */
  statsRow: {
    flexDirection: 'row', borderBottomWidth: 1,
  },
  statBox: {
    flex: 1, alignItems: 'center', paddingVertical: 28, paddingHorizontal: 12,
  },
  statDivider: { width: 1, marginVertical: 24 },
  statLabel:   { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  statValue:   { fontSize: 36, fontWeight: '900', letterSpacing: -1.5, lineHeight: 40, marginBottom: 4 },
  statSub:     { fontSize: 11, fontWeight: '500' },

  /* ── Progress ── */
  progressSection: {
    paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel:  { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  progressPct:    { fontSize: 12, fontWeight: '800' },
  progressTrack:  { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill:   { height: '100%', borderRadius: 2 },

  /* ── Sections ── */
  sectionWrap:   { paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sectionTitle:  { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  sectionLine:   { flex: 1, height: 1 },

  /* ── Business row ── */
  businessRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderRadius: 14, padding: 14,
  },
  bizAvatar:   { width: 46, height: 46, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  bizInitials: { fontSize: 16, fontWeight: '900' },
  bizInfo:     { flex: 1 },
  bizName:     { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  bizMeta:     { fontSize: 12, lineHeight: 16 },

  /* ── Service strip ── */
  serviceStrip: {
    flexDirection: 'row', borderWidth: 1, borderRadius: 12,
    marginTop: 12, overflow: 'hidden',
  },
  serviceItem: {
    flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8,
  },
  serviceLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  serviceValue: { fontSize: 14, fontWeight: '800' },

  /* ── Timeline ── */
  timeline:     { gap: 0 },
  timelineRow:  { flexDirection: 'row', gap: 16, minHeight: 56 },
  timelineLeft: { alignItems: 'center', width: 20 },
  tlDot: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  tlLine: { width: 2, flex: 1, marginTop: 4, minHeight: 24, borderRadius: 1 },
  timelineRight: { flex: 1, paddingTop: 1, paddingBottom: 20 },
  tlEvent: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  tlTime:  { fontSize: 11, fontWeight: '500' },

  /* ── Info strip ── */
  infoStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1,
    flexWrap: 'wrap',
  },
  infoText: { fontSize: 12, flex: 1, flexShrink: 1 },
  infoDot:  { width: 4, height: 4, borderRadius: 2 },

  /* ── Actions ── */
  actions: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 24, paddingTop: 24,
  },
  leaveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderRadius: 14, paddingVertical: 15,
  },
  leaveBtnText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  bizBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderRadius: 14, paddingVertical: 15,
  },
  bizBtnText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
});
