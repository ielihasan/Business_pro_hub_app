import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SkeletonBusinessCard } from '@/components/ui/Skeleton';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { fetchBusinesses, BusinessRecord } from '@/lib/business';
import { BusinessCard } from '@/components/home/BusinessCard';

type BizItem = BusinessRecord & { distanceKm: number | null };

export default function AllBusinessesScreen() {
  const { colors, isDark } = useTheme();

  const [allBusinesses, setAllBusinesses] = useState<BizItem[]>([]);
  const [loading, setLoading]             = useState(true);
  const [query, setQuery]                 = useState('');

  useEffect(() => {
    fetchBusinesses({ limit: 500 })
      .then((data) => setAllBusinesses(data))
      .catch(() => setAllBusinesses([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allBusinesses;
    return allBusinesses.filter((b) =>
      b.name.toLowerCase().includes(q) ||
      (b.category ?? '').toLowerCase().includes(q)
    );
  }, [allBusinesses, query]);

  const BG     = colors.background;
  const FG     = colors.foreground;
  const MUTED  = colors.mutedForeground;
  const BORDER = colors.border;
  const CARD   = colors.card;

  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <SafeAreaView edges={['top']} style={{ backgroundColor: BG }}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: CARD, borderColor: BORDER }]}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-back" size={20} color={FG} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.headerLabel, { color: MUTED }]}>DIRECTORY</Text>
            <Text style={[styles.headerTitle, { color: FG }]}>ALL BUSINESSES</Text>
          </View>
        </View>

        {/* ── Search bar ── */}
        <View style={[styles.searchBar, { backgroundColor: CARD, borderColor: BORDER }]}>
          <Ionicons name="search-outline" size={16} color={MUTED} />
          <TextInput
            style={[styles.searchInput, { color: FG }]}
            placeholder="Search by name or category…"
            placeholderTextColor={MUTED}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={MUTED} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* ── Result count ── */}
      {!loading && (
        <View style={[styles.countRow, { borderBottomColor: BORDER }]}>
          <Text style={[styles.countText, { color: MUTED }]}>
            {filtered.length} {filtered.length === 1 ? 'BUSINESS' : 'BUSINESSES'}
            {query.length > 0 ? ` FOR "${query.toUpperCase()}"` : ' REGISTERED'}
          </Text>
        </View>
      )}

      {/* ── List ── */}
      {loading ? (
        <View style={styles.skeletonList}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBusinessCard key={i} />
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: CARD, borderColor: BORDER }]}>
            <Ionicons name="storefront-outline" size={36} color={MUTED} />
          </View>
          <Text style={[styles.emptyTitle, { color: FG }]}>No Results</Text>
          <Text style={[styles.emptySub, { color: MUTED }]}>
            {query.length > 0
              ? `No business matches "${query}"`
              : 'No businesses registered yet.'}
          </Text>
          {query.length > 0 && (
            <TouchableOpacity
              style={[styles.clearBtn, { backgroundColor: FG }]}
              onPress={() => setQuery('')}
            >
              <Text style={[styles.clearBtnText, { color: BG }]}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => <BusinessCard business={item} />}
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  /* ── Header ── */
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 2 },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1, lineHeight: 30 },

  /* ── Search ── */
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 6,
    paddingHorizontal: 14, paddingVertical: 13,
    borderRadius: 14, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  /* ── Count row ── */
  countRow: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },

  /* ── List ── */
  list:         { paddingHorizontal: 16, paddingTop: 14 },
  skeletonList: { paddingHorizontal: 16, paddingTop: 14 },

  /* ── States ── */
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 40, gap: 12,
  },

  emptyIcon: {
    width: 80, height: 80, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  emptySub:   { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  clearBtn:   { marginTop: 8, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  clearBtnText: { fontSize: 14, fontWeight: '800' },
});
