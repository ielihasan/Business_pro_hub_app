import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Animated,
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SkeletonOrderCard } from '@/components/ui/Skeleton';
import { useScreenEntrance } from '@/hooks/useScreenEntrance';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { OrderCard } from '@/components/orders';
import { useStore } from '@/store/useStore';
import { fetchUserQueueHistory, OrderHistoryEntry } from '@/lib/queue';
import { useSmartPolling } from '@/hooks/useSmartPolling';

type Filter = 'all' | 'active' | 'completed';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',       label: 'ALL'       },
  { key: 'active',    label: 'ACTIVE'    },
  { key: 'completed', label: 'COMPLETED' },
];

export default function OrdersScreen() {
  const { colors, isDark }    = useTheme();
  const { entranceStyle }     = useScreenEntrance();
  const user = useStore((s) => s.user);

  const [orders, setOrders]       = useState<OrderHistoryEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]       = useState<Filter>('all');

  const loadOrders = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await fetchUserQueueHistory(user.id);
    setOrders(data);
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    loadOrders().finally(() => setLoading(false));
  }, [loadOrders]);

  // Auto-refresh every 30 s; pauses when app goes to background
  useSmartPolling(loadOrders, 30_000);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (filter === 'active')    return orders.filter(o => ['waiting', 'in_progress'].includes(o.status));
    if (filter === 'completed') return orders.filter(o => ['completed', 'cancelled'].includes(o.status));
    return orders;
  }, [orders, filter]);

  // Summary stats
  const totalSpent = useMemo(() =>
    orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.total_price ?? 0), 0),
    [orders]
  );
  const completedCount = orders.filter(o => o.status === 'completed').length;

  const BG    = colors.background;
  const FG    = colors.foreground;
  const BRAND = colors.brand;
  const MUTED = colors.mutedForeground;
  const BORDER = colors.border;
  const CARD  = colors.card;

  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.View style={[{ flex: 1 }, entranceStyle]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: BG }}>
        {/* ── Header ── */}
        <View style={[styles.header, { borderBottomColor: BORDER }]}>
          <View>
            <Text style={[styles.headerLabel, { color: MUTED }]}>TRANSACTION HISTORY</Text>
            <Text style={[styles.headerTitle, { color: FG }]}>ORDERS</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Stats strip ── */}
      {!loading && orders.length > 0 && (
        <View style={[styles.statsStrip, { borderBottomColor: BORDER, backgroundColor: CARD }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: FG }]}>{orders.length}</Text>
            <Text style={[styles.statLbl, { color: MUTED }]}>TOTAL QUEUES</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: BORDER }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: FG }]}>{completedCount}</Text>
            <Text style={[styles.statLbl, { color: MUTED }]}>COMPLETED</Text>
          </View>
          {totalSpent > 0 && (
            <>
              <View style={[styles.statDivider, { backgroundColor: BORDER }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: FG }]}>Rs {totalSpent.toLocaleString()}</Text>
                <Text style={[styles.statLbl, { color: MUTED }]}>TOTAL SPENT</Text>
              </View>
            </>
          )}
        </View>
      )}

      {/* ── Filter tabs ── */}
      <View style={[styles.filterRow, { borderBottomColor: BORDER }]}>
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.filterTab, active && { borderBottomColor: BRAND, borderBottomWidth: 2 }]}
              onPress={() => setFilter(key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, { color: active ? BRAND : MUTED }]}>
                {label}
              </Text>
              {key !== 'all' && (
                <View style={[styles.filterCount, { backgroundColor: active ? BRAND : BORDER }]}>
                  <Text style={[styles.filterCountText, { color: active ? CARD : MUTED }]}>
                    {key === 'active'
                      ? orders.filter(o => ['waiting', 'in_progress'].includes(o.status)).length
                      : orders.filter(o => ['completed', 'cancelled'].includes(o.status)).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={FG} colors={[FG]} />
        }
        contentContainerStyle={styles.scroll}
      >
        {loading ? (
          <View style={styles.list}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonOrderCard key={i} />
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { borderColor: BORDER }]}>
              <Ionicons name="receipt-outline" size={32} color={MUTED} />
            </View>
            <Text style={[styles.emptyTitle, { color: FG }]}>NO ORDERS YET</Text>
            <Text style={[styles.emptySub, { color: MUTED }]}>
              {filter === 'active'
                ? 'You have no active queues right now.'
                : filter === 'completed'
                ? 'No completed orders to show.'
                : 'Scan a QR code to join your first queue.'}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity
                style={[styles.scanCta, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/scan')}
                activeOpacity={0.85}
              >
                <Ionicons name="qr-code-outline" size={16} color={colors.primaryForeground} />
                <Text style={[styles.scanCtaText, { color: colors.primaryForeground }]}>SCAN QR CODE</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  /* Header */
  header: {
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontSize: 36, fontWeight: '900', letterSpacing: -1.5 },

  /* Stats */
  statsStrip: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1,
  },
  statItem:   { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statVal:    { fontSize: 16, fontWeight: '900', marginBottom: 2 },
  statLbl:    { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  statDivider: { width: 1, height: 32 },

  /* Filters */
  filterRow: {
    flexDirection: 'row', borderBottomWidth: 1,
  },
  filterTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, marginBottom: -1,
  },
  filterText:      { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  filterCount:     { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, minWidth: 18, alignItems: 'center' },
  filterCountText: { fontSize: 9, fontWeight: '800' },

  /* Content */
  scroll: { paddingHorizontal: 16, paddingTop: 16, flexGrow: 1 },
  list:   { gap: 12 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 20, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  emptySub:   { fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  scanCta: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, marginTop: 4,
  },
  scanCtaText: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
});
