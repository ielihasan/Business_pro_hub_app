import { useState } from 'react';
import {
  Animated,
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  TextInput,
  StatusBar,
} from 'react-native';
import { useScreenEntrance } from '@/hooks/useScreenEntrance';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useNearbyBusinesses } from '@/hooks/useNearbyBusinesses';
import { useStore } from '@/store/useStore';
import {
  ActiveQueueCard,
  CategoryFilter,
  NearbyBusinesses,
} from '@/components/home';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

export default function HomeScreen() {
  const { colors, isDark }     = useTheme();
  const { entranceStyle }      = useScreenEntrance();
  const user                = useStore((s) => s.user);
  const activeQueues        = useStore((s) => s.activeQueues);
  const unreadCount         = useStore((s) => s.unreadCount);
  const paymentMethods      = useStore((s) => s.paymentMethods);
  const totalBadge          = unreadCount + (paymentMethods.length === 0 ? 1 : 0);

  const [refreshing,                setRefreshing]                = useState(false);
  const [selectedCategory,          setSelectedCategory]          = useState('all');
  const [searchQuery,               setSearchQuery]               = useState('');
  const [notificationsPanelVisible, setNotificationsPanelVisible] = useState(false);

  const { businesses, loading: businessesLoading, refresh: refreshBusinesses } = useNearbyBusinesses({
    category: selectedCategory,
    query: searchQuery,
  });

  const activeQueue            = activeQueues[0] ?? null;
  const syncQueuesFromSupabase = useStore((s) => s.syncQueuesFromSupabase);
  const walletBalance          = user?.walletBalance ?? null;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshBusinesses(), syncQueuesFromSupabase()]);
    setRefreshing(false);
  };

  const firstName    = user?.name?.split(' ')[0] ?? 'there';
  const avatarInitial = (user?.name ?? 'U')[0].toUpperCase();

  const BG     = colors.background;
  const FG     = colors.foreground;
  const MUTED  = colors.mutedForeground;
  const BORDER = colors.border;
  const CARD   = colors.card;

  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.View style={[{ flex: 1 }, entranceStyle]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: BG }}>
        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: CARD, borderColor: BORDER }]}>
                <Text style={[styles.avatarInitial, { color: FG }]}>{avatarInitial}</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.wordmark, { color: FG }]}>BUSINESSHUB PRO</Text>

          <View style={styles.topBarRight}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: CARD, borderColor: BORDER }]}
              onPress={() => router.push('/(tabs)/scan')}
              activeOpacity={0.75}
            >
              <Ionicons name="qr-code-outline" size={18} color={FG} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bellBtn, { backgroundColor: CARD, borderColor: BORDER }]}
              onPress={() => setNotificationsPanelVisible(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="notifications-outline" size={18} color={FG} />
              {totalBadge > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                  <Text style={[styles.badgeText, { color: colors.destructiveForeground }]}>{totalBadge > 9 ? '9+' : totalBadge}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={FG}
            colors={[FG]}
          />
        }
      >
        {/* ── Greeting ── */}
        <View style={styles.greetSection}>
          <Text style={[styles.greetSub, { color: MUTED }]}>
            {`GOOD ${getGreeting().toUpperCase()}`}
          </Text>
          <Text style={[styles.greetName, { color: FG }]} numberOfLines={1}>
            {firstName.toUpperCase()}.
          </Text>
          <View style={styles.greetRow}>
            <Text style={[styles.greetTag, { color: MUTED }]}>Your queue status at a glance.</Text>
            {walletBalance !== null && (
              <View style={[styles.balancePill, { backgroundColor: CARD, borderColor: BORDER }]}>
                <Text style={[styles.balanceText, { color: FG }]}>
                  Rs {walletBalance.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Active Queue / Empty State ── */}
        {activeQueue ? (
          <ActiveQueueCard queue={activeQueue} />
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.noQueueCard, { backgroundColor: CARD, borderColor: BORDER }]}
            onPress={() => router.push('/(tabs)/scan')}
          >
            <View style={[styles.noQueueIconWrap, { borderColor: BORDER }]}>
              <Ionicons name="qr-code-outline" size={26} color={FG} />
            </View>
            <View style={styles.noQueueTextWrap}>
              <Text style={[styles.noQueueTitle, { color: FG }]}>NO ACTIVE QUEUE</Text>
              <Text style={[styles.noQueueSub, { color: MUTED }]}>Scan a QR to join a queue</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={MUTED} />
          </TouchableOpacity>
        )}

        {/* ── Search ── */}
        <View style={[styles.searchWrap, { backgroundColor: CARD, borderColor: BORDER }]}>
          <Ionicons name="search-outline" size={16} color={MUTED} />
          <TextInput
            style={[styles.searchInput, { color: FG }]}
            placeholder="Search businesses…"
            placeholderTextColor={MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={MUTED} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Categories ── */}
        <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

        {/* ── Available Businesses (capped at 3 on home) ── */}
        <NearbyBusinesses businesses={businesses} loading={businessesLoading} limit={3} />

        <View style={{ height: 96 }} />
      </ScrollView>

      <NotificationsPanel
        visible={notificationsPanelVisible}
        onClose={() => setNotificationsPanelVisible(false)}
      />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  /* ── Top bar ── */
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12,
  },
  wordmark: { fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },

  avatarImg: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 14, fontWeight: '800' },

  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  bellBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  badge: {
    position: 'absolute', top: 4, right: 4,
    width: 14, height: 14, borderRadius: 7,
    justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { fontSize: 8, fontWeight: '800' },

  /* ── Greeting ── */
  greetSection: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  greetSub: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: 6,
  },
  greetName: { fontSize: 44, fontWeight: '900', letterSpacing: -1.5, lineHeight: 46, marginBottom: 8 },
  greetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  greetTag:  { fontSize: 14, lineHeight: 20, flex: 1 },
  balancePill: {
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  balanceText: { fontSize: 12, fontWeight: '800' },

  /* ── No-queue card ── */
  noQueueCard: {
    marginHorizontal: 24, marginBottom: 20, borderRadius: 16, borderWidth: 1,
    padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  noQueueIconWrap: {
    width: 54, height: 54, borderRadius: 14, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  noQueueTextWrap: { flex: 1 },
  noQueueTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, marginBottom: 4 },
  noQueueSub:   { fontSize: 13, lineHeight: 18 },

  /* ── Search ── */
  searchWrap: {
    marginHorizontal: 24, marginBottom: 20, borderRadius: 12, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13, gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

});
