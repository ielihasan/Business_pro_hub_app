import { useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useNearbyBusinesses } from '@/hooks/useNearbyBusinesses';
import { useStore } from '@/store/useStore';
import { Spacing, Typography } from '@/constants/theme';
import {
  SearchBar,
  ActiveQueueCard,
  CategoryFilter,
  RadiusFilter,
  NearbyBusinesses,
} from '@/components/home';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const user = useStore((s) => s.user);
  const activeQueues = useStore((s) => s.activeQueues);
  const unreadCount = useStore((s) => s.unreadCount);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);

  const { businesses } = useNearbyBusinesses({
    radiusKm,
    category: selectedCategory,
    query: searchQuery,
  });

  const activeQueue = activeQueues[0] ?? null;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const avatarInitial = (user?.name ?? 'U')[0].toUpperCase();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F0F1A' : '#F6F8FF' }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
      >
        {/* ── Header ── */}
        <View style={[styles.header, { backgroundColor: isDark ? '#0F0F1A' : '#F6F8FF' }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={[styles.avatarCircle, { backgroundColor: isDark ? '#1E1E2E' : '#EEF2FF', borderColor: '#6366F1' }]}
              onPress={() => router.push('/(tabs)/profile')}
            >
              {user?.avatar ? (
                <Text style={styles.avatarText}>{avatarInitial}</Text>
              ) : (
                <Text style={[styles.avatarText, { color: '#6366F1' }]}>{avatarInitial}</Text>
              )}
            </TouchableOpacity>
            <View>
              <Text style={[styles.greetSmall, { color: colors.mutedForeground }]}>{getGreeting()} 👋</Text>
              <Text style={[styles.greetName, { color: colors.foreground }]}>{firstName}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.bellBtn, { backgroundColor: isDark ? '#1E1E2E' : '#FFFFFF', borderColor: isDark ? '#2E2E40' : '#E2E8F0' }]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Search ── */}
        <View style={styles.searchWrap}>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* ── Active Queue ── */}
        {activeQueue ? (
          <ActiveQueueCard queue={activeQueue} />
        ) : (
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.noQueueBox, { backgroundColor: isDark ? '#1A1A2E' : '#FAFBFF', borderColor: isDark ? '#2E2E50' : '#E0E7FF' }]}
            onPress={() => router.push('/(tabs)/scan')}
          >
            <View style={[styles.noQueueIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="qr-code-outline" size={22} color="#6366F1" />
            </View>
            <View style={styles.noQueueText}>
              <Text style={[styles.noQueueTitle, { color: colors.foreground }]}>No active queue</Text>
              <Text style={[styles.noQueueSub, { color: colors.mutedForeground }]}>Scan a QR code to join a queue</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6366F1" />
          </TouchableOpacity>
        )}

        {/* ── Categories ── */}
        <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

        {/* ── Radius ── */}
        <RadiusFilter selected={radiusKm} onSelect={setRadiusKm} />

        {/* ── Nearby Businesses ── */}
        <NearbyBusinesses businesses={businesses} />

        <View style={{ height: Spacing[20] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[3],
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#6366F1' },
  greetSmall: { fontSize: Typography.fontSize.xs },
  greetName: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },

  /* Search */
  searchWrap: { paddingTop: Spacing[2] },

  /* No Queue nudge */
  noQueueBox: {
    marginHorizontal: Spacing[6],
    marginBottom: Spacing[5],
    borderRadius: 16,
    borderWidth: 1.5,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  noQueueIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noQueueText: { flex: 1 },
  noQueueTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold },
  noQueueSub: { fontSize: Typography.fontSize.xs, marginTop: 2 },
});

