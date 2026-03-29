import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { fetchBusinesses, BusinessRecord } from '@/lib/business';

const CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi',
  'Peshawar', 'Quetta', 'Faisalabad', 'Multan',
];

type BizResult = BusinessRecord & { distanceKm: number; address?: string | null };

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const [query, setQuery]           = useState('');
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [results, setResults]       = useState<BizResult[]>([]);
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState(false);

  const doSearch = async (city: string) => {
    setActiveCity(city);
    setLoading(true);
    setSearched(true);
    try {
      const [byName, all] = await Promise.all([
        fetchBusinesses({ query: city, limit: 200 }) as Promise<BizResult[]>,
        fetchBusinesses({ limit: 200 }) as Promise<BizResult[]>,
      ]);
      const seen = new Set(byName.map(b => b.id));
      const merged = [...byName];
      for (const b of all) {
        if (!seen.has(b.id) && ((b as any).address ?? '').toLowerCase().includes(city.toLowerCase())) {
          seen.add(b.id);
          merged.push(b);
        }
      }
      setResults(merged);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setActiveCity(null);
    setResults([]);
    setSearched(false);
    setQuery('');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <View style={styles.header}>
          {activeCity ? (
            <TouchableOpacity
              onPress={clearSearch}
              style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
            >
              <Ionicons name="arrow-back" size={18} color={colors.foreground} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.iconBtn, { backgroundColor: colors.secondary }]}>
              <Ionicons name="location-outline" size={18} color={colors.foreground} />
            </View>
          )}
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {activeCity ? activeCity.toUpperCase() : 'DISCOVER'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search by city or business…"
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => { if (query.trim()) doSearch(query.trim()); }}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); clearSearch(); }}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* ── City grid ── */}
      {!searched ? (
        <FlatList
          data={CITIES}
          keyExtractor={item => item}
          numColumns={2}
          contentContainerStyle={styles.cityGrid}
          ListHeaderComponent={
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>POPULAR CITIES</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.cityCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => { setQuery(item); doSearch(item); }}
              activeOpacity={0.75}
            >
              <View style={[styles.cityIconWrap, { backgroundColor: colors.secondary }]}>
                <Ionicons name="location-outline" size={22} color={colors.foreground} />
              </View>
              <Text style={[styles.cityName, { color: colors.foreground }]}>{item}</Text>
              <Text style={[styles.cityCountry, { color: colors.mutedForeground }]}>Pakistan</Text>
            </TouchableOpacity>
          )}
        />
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.foreground} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Searching…</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Ionicons name="storefront-outline" size={36} color={colors.foreground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Businesses Found</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            No businesses listed in {activeCity} yet.
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.foreground }]}
            onPress={clearSearch}
          >
            <Text style={[styles.retryText, { color: colors.background }]}>Search Another City</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Results list ── */
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.resultsList}
          ListHeaderComponent={
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {results.length} BUSINESS{results.length !== 1 ? 'ES' : ''} IN {activeCity?.toUpperCase()}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.bizCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/business/${item.id}`)}
              activeOpacity={0.75}
            >
              <View style={[styles.bizAvatar, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.bizAvatarText, { color: colors.foreground }]}>
                  {item.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                </Text>
              </View>
              <View style={styles.bizInfo}>
                <Text style={[styles.bizName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.bizMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {item.category || 'Business'}
                </Text>
                {!!(item as any).address && (
                  <Text style={[styles.bizMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {(item as any).address}
                  </Text>
                )}
              </View>
              <View style={styles.bizRight}>
                {item.is_open != null && (
                  <View style={[styles.openBadge, {
                    backgroundColor: item.is_open ? colors.success + '20' : colors.secondary,
                  }]}>
                    <View style={[styles.openDot, {
                      backgroundColor: item.is_open ? colors.success : colors.mutedForeground,
                    }]} />
                    <Text style={[styles.openText, {
                      color: item.is_open ? colors.success : colors.mutedForeground,
                    }]}>
                      {item.is_open ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} style={{ marginTop: 6 }} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12,
  },
  iconBtn:     { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 16,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
    marginBottom: 14, paddingHorizontal: 20,
  },

  cityGrid:    { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 20 },
  cityCard: {
    flex: 1, margin: 8, padding: 20, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', gap: 10,
  },
  cityIconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cityName:     { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  cityCountry:  { fontSize: 11, fontWeight: '500' },

  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { fontSize: 14, marginTop: 14, fontWeight: '500' },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '900', marginBottom: 8, letterSpacing: -0.3 },
  emptyDesc:  { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  retryBtn:   { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  retryText:  { fontSize: 15, fontWeight: '800' },

  resultsList: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  bizCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, marginBottom: 10, borderRadius: 16, borderWidth: 1,
  },
  bizAvatar:     { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bizAvatarText: { fontSize: 16, fontWeight: '900' },
  bizInfo:       { flex: 1, gap: 2 },
  bizName:       { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  bizMeta:       { fontSize: 12, fontWeight: '500' },
  bizRight:      { alignItems: 'flex-end' },
  openBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  openDot:       { width: 6, height: 6, borderRadius: 3 },
  openText:      { fontSize: 11, fontWeight: '700' },
});
