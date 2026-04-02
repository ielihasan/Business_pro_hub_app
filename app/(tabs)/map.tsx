import React, { useState, useMemo } from 'react';
import {
  Animated, View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator,
} from 'react-native';
import { useScreenEntrance } from '@/hooks/useScreenEntrance';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/store/useStore';
import { fetchBusinesses, BusinessRecord } from '@/lib/business';

// ── City → Province mapping (2023 census) ───────────────────────────────────
const CITY_PROVINCE: Record<string, string> = {
  'Abbottabad': 'Khyber Pakhtunkhwa',
  'Ahmedpur East': 'Punjab',
  'Arif Wala': 'Punjab',
  'Attock': 'Punjab',
  'Badin': 'Sindh',
  'Bahawalnagar': 'Punjab',
  'Bahawalpur': 'Punjab',
  'Barikot': 'Khyber Pakhtunkhwa',
  'Bhakkar': 'Punjab',
  'Bhalwal': 'Punjab',
  'Bholari': 'Sindh',
  'Burewala': 'Punjab',
  'Chakwal': 'Punjab',
  'Chaman': 'Balochistan',
  'Charsadda': 'Khyber Pakhtunkhwa',
  'Chichawatni': 'Punjab',
  'Chiniot': 'Punjab',
  'Chishtian': 'Punjab',
  'Dadu': 'Sindh',
  'Daska': 'Punjab',
  'Dera Ghazi Khan': 'Punjab',
  'Dera Ismail Khan': 'Khyber Pakhtunkhwa',
  'Dera Murad Jamali': 'Balochistan',
  'Dipalpur': 'Punjab',
  'Faisalabad': 'Punjab',
  'Farooqabad': 'Punjab',
  'Ferozwala': 'Punjab',
  'Ghotki': 'Sindh',
  'Gojra': 'Punjab',
  'Gujar Khan': 'Punjab',
  'Gujranwala': 'Punjab',
  'Gujranwala Cantonment': 'Punjab',
  'Gujrat': 'Punjab',
  'Hafizabad': 'Punjab',
  'Haroonabad': 'Punjab',
  'Hasilpur': 'Punjab',
  'Haveli Lakha': 'Punjab',
  'Hub': 'Balochistan',
  'Hyderabad': 'Sindh',
  'Islamabad': 'Islamabad Capital Territory',
  'Jacobabad': 'Sindh',
  'Jalalpur Jattan': 'Punjab',
  'Jampur': 'Punjab',
  'Jaranwala': 'Punjab',
  'Jatoi': 'Punjab',
  'Jauharabad': 'Punjab',
  'Jhang': 'Punjab',
  'Jhelum': 'Punjab',
  'Kabal': 'Khyber Pakhtunkhwa',
  'Kamalia': 'Punjab',
  'Kamber Ali Khan': 'Sindh',
  'Kamoke': 'Punjab',
  'Karachi': 'Sindh',
  'Kasur': 'Punjab',
  'Khairpur': 'Sindh',
  'Khanewal': 'Punjab',
  'Khanpur': 'Punjab',
  'Kharian': 'Punjab',
  'Khushab': 'Punjab',
  'Khuzdar': 'Balochistan',
  'Kohat': 'Khyber Pakhtunkhwa',
  'Kot Abdul Malik': 'Punjab',
  'Kot Addu': 'Punjab',
  'Kot Radha Kishan': 'Punjab',
  'Kotri': 'Sindh',
  'Lahore': 'Punjab',
  'Lala Musa': 'Punjab',
  'Larkana': 'Sindh',
  'Layyah': 'Punjab',
  'Lodhran': 'Punjab',
  'Ludhewala Waraich': 'Punjab',
  'Mailsi': 'Punjab',
  'Mandi Bahauddin': 'Punjab',
  'Mansehra': 'Khyber Pakhtunkhwa',
  'Mardan': 'Khyber Pakhtunkhwa',
  'Mian Channu': 'Punjab',
  'Mianwali': 'Punjab',
  'Mingora': 'Khyber Pakhtunkhwa',
  'Mirpur': 'Azad Kashmir',
  'Mirpur Khas': 'Sindh',
  'Moro': 'Sindh',
  'Multan': 'Punjab',
  'Muridke': 'Punjab',
  'Muzaffarabad': 'Azad Kashmir',
  'Muzaffargarh': 'Punjab',
  'Narowal': 'Punjab',
  'Nawabshah': 'Sindh',
  'Nowshera': 'Khyber Pakhtunkhwa',
  'Okara': 'Punjab',
  'Pakpattan': 'Punjab',
  'Panjgur': 'Balochistan',
  'Pasrur': 'Punjab',
  'Pattoki': 'Punjab',
  'Peshawar': 'Khyber Pakhtunkhwa',
  'Phool Nagar': 'Punjab',
  'Pishin': 'Balochistan',
  'Quetta': 'Balochistan',
  'Rahim Yar Khan': 'Punjab',
  'Rajanpur': 'Punjab',
  'Rawalpindi': 'Punjab',
  'Renala Khurd': 'Punjab',
  'Sadiqabad': 'Punjab',
  'Sahiwal': 'Punjab',
  'Sambrial': 'Punjab',
  'Samundri': 'Punjab',
  'Sangla Hill': 'Punjab',
  'Sargodha': 'Punjab',
  'Shabqadar': 'Khyber Pakhtunkhwa',
  'Shahdadkot': 'Sindh',
  'Shahdadpur': 'Sindh',
  'Shakargarh': 'Punjab',
  'Sheikhupura': 'Punjab',
  'Shikarpur': 'Sindh',
  'Shujabad': 'Punjab',
  'Sialkot': 'Punjab',
  'Sukkur': 'Sindh',
  'Swabi': 'Khyber Pakhtunkhwa',
  'Tando Adam': 'Sindh',
  'Tando Allahyar': 'Sindh',
  'Tando Muhammad Khan': 'Sindh',
  'Taunsa': 'Punjab',
  'Taxila': 'Punjab',
  'Turbat': 'Balochistan',
  'Umerkot': 'Sindh',
  'Vehari': 'Punjab',
  'Wah Cantonment': 'Punjab',
  'Wazirabad': 'Punjab',
};

const ALL_CITIES = Object.keys(CITY_PROVINCE).sort();

const POPULAR_CITIES = [
  'Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi',
  'Gujranwala', 'Multan', 'Islamabad', 'Peshawar',
  'Quetta', 'Hyderabad', 'Sialkot', 'Sargodha',
];

type BizResult = BusinessRecord & { distanceKm: number; address?: string | null };

export default function DiscoverScreen() {
  const { colors }         = useTheme();
  const { entranceStyle }  = useScreenEntrance();
  const favoriteBusinesses = useStore((s) => s.favoriteBusinesses);
  const toggleFavorite     = useStore((s) => s.toggleFavorite);

  const [query,      setQuery]      = useState('');
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [results,    setResults]    = useState<BizResult[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [searched,   setSearched]   = useState(false);

  // ── Suggestions (shown as body when typing) ──────────────────────────────
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_CITIES.filter(c => c.toLowerCase().includes(q));
  }, [query]);

  const isTyping = query.trim().length > 0 && !searched;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const doSearch = async (city: string) => {
    setActiveCity(city);
    setLoading(true);
    setSearched(true);
    try {
      const [byName, all] = await Promise.all([
        fetchBusinesses({ query: city, limit: 200 }) as Promise<BizResult[]>,
        fetchBusinesses({ limit: 200 })              as Promise<BizResult[]>,
      ]);
      const seen   = new Set(byName.map(b => b.id));
      const merged = [...byName];
      for (const b of all) {
        if (!seen.has(b.id) &&
            ((b as any).address ?? '').toLowerCase().includes(city.toLowerCase())) {
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

  const selectCity = (city: string) => {
    setQuery(city);
    doSearch(city);
  };

  const clearSearch = () => {
    setActiveCity(null);
    setResults([]);
    setSearched(false);
    setQuery('');
  };

  const { background: BG, foreground: FG, mutedForeground: MUTED,
          border: BORDER, card: CARD, secondary: SEC } = colors;

  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <Animated.View style={[{ flex: 1 }, entranceStyle]}>

        <SafeAreaView edges={['top']} style={{ backgroundColor: BG }}>
          {/* ── Header ── */}
          <View style={styles.header}>
            {activeCity ? (
              <TouchableOpacity
                onPress={clearSearch}
                style={[styles.iconBtn, { backgroundColor: SEC }]}
              >
                <Ionicons name="arrow-back" size={18} color={FG} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
            <Text style={[styles.headerTitle, { color: FG }]}>
              {activeCity ? activeCity.toUpperCase() : 'DISCOVER'}
            </Text>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: favoriteBusinesses.length > 0 ? colors.brand + '22' : SEC, borderWidth: favoriteBusinesses.length > 0 ? 1 : 0, borderColor: colors.brand }]}
              onPress={() => router.push('/profile/saved')}
              activeOpacity={0.75}
            >
              <Ionicons
                name={favoriteBusinesses.length > 0 ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={favoriteBusinesses.length > 0 ? colors.brand : FG}
              />
            </TouchableOpacity>
          </View>

          {/* ── Search bar ── */}
          <View style={[styles.searchBar, { backgroundColor: SEC, borderColor: BORDER }]}>
            <Ionicons name="search-outline" size={16} color={MUTED} />
            <TextInput
              style={[styles.searchInput, { color: FG }]}
              placeholder="Type a city name…"
              placeholderTextColor={MUTED}
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                // reset results so typing after a search re-opens suggestions
                if (searched) { setSearched(false); setActiveCity(null); setResults([]); }
              }}
              onSubmitEditing={() => {
                if (suggestions.length > 0) selectCity(suggestions[0]);
                else if (query.trim()) doSearch(query.trim());
              }}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="words"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={clearSearch} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={MUTED} />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>

        {/* ── Body ──────────────────────────────────────────────────────────
            Priority: suggestions → popular grid → loading → empty → results
        ─────────────────────────────────────────────────────────────────── */}

        {isTyping ? (
          /* Suggestion list replaces the body while typing */
          suggestions.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="search-outline" size={40} color={MUTED} />
              <Text style={[styles.noMatchText, { color: MUTED }]}>
                No city matches "{query}"
              </Text>
            </View>
          ) : (
            <FlatList
              key="suggestions"
              data={suggestions}
              keyExtractor={item => item}
              keyboardShouldPersistTaps="always"
              contentContainerStyle={styles.suggestionList}
              ListHeaderComponent={
                <Text style={[styles.sectionLabel, { color: MUTED }]}>
                  {suggestions.length} {suggestions.length === 1 ? 'CITY' : 'CITIES'} FOUND
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.suggestionRow, { backgroundColor: CARD, borderColor: BORDER }]}
                  onPress={() => selectCity(item)}
                  activeOpacity={0.72}
                >
                  <View style={[styles.suggestionIcon, { backgroundColor: SEC }]}>
                    <Ionicons name="location-outline" size={16} color={FG} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.suggestionCity, { color: FG }]}>{item}</Text>
                    <Text style={[styles.suggestionProvince, { color: MUTED }]}>
                      {CITY_PROVINCE[item] ?? 'Pakistan'}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={14} color={MUTED} />
                </TouchableOpacity>
              )}
            />
          )
        ) : !searched ? (
          /* Popular cities grid */
          <FlatList
            key="popular-grid"
            data={POPULAR_CITIES}
            keyExtractor={item => item}
            numColumns={2}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={styles.cityGrid}
            ListHeaderComponent={
              <Text style={[styles.sectionLabel, { color: MUTED }]}>POPULAR CITIES</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.cityCard, { backgroundColor: CARD, borderColor: BORDER }]}
                onPress={() => selectCity(item)}
                activeOpacity={0.75}
              >
                <View style={[styles.cityIconWrap, { backgroundColor: SEC }]}>
                  <Ionicons name="location-outline" size={22} color={FG} />
                </View>
                <Text style={[styles.cityName, { color: FG }]}>{item}</Text>
                <Text style={[styles.cityProvince, { color: MUTED }]}>
                  {CITY_PROVINCE[item] ?? 'Pakistan'}
                </Text>
              </TouchableOpacity>
            )}
          />
        ) : loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={FG} />
            <Text style={[styles.loadingText, { color: MUTED }]}>Searching…</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.center}>
            <View style={[styles.emptyIcon, { backgroundColor: SEC, borderColor: BORDER }]}>
              <Ionicons name="storefront-outline" size={36} color={FG} />
            </View>
            <Text style={[styles.emptyTitle, { color: FG }]}>No Businesses Found</Text>
            <Text style={[styles.emptyDesc, { color: MUTED }]}>
              No businesses listed in {activeCity} yet.
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: FG }]}
              onPress={clearSearch}
            >
              <Text style={[styles.retryText, { color: BG }]}>Search Another City</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            key="results"
            data={results}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={styles.resultsList}
            ListHeaderComponent={
              <Text style={[styles.sectionLabel, { color: MUTED }]}>
                {results.length} BUSINESS{results.length !== 1 ? 'ES' : ''} IN {activeCity?.toUpperCase()}
              </Text>
            }
            renderItem={({ item }) => {
              const isFav = favoriteBusinesses.includes(item.id);
              return (
                <TouchableOpacity
                  style={[styles.bizCard, { backgroundColor: CARD, borderColor: BORDER }]}
                  onPress={() => router.push(`/business/${item.id}`)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.bizAvatar, { backgroundColor: SEC }]}>
                    <Text style={[styles.bizAvatarText, { color: FG }]}>
                      {item.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.bizInfo}>
                    <Text style={[styles.bizName, { color: FG }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.bizMeta, { color: MUTED }]} numberOfLines={1}>
                      {item.category || 'Business'}
                    </Text>
                    {!!(item as any).address && (
                      <Text style={[styles.bizMeta, { color: MUTED }]} numberOfLines={1}>
                        {(item as any).address}
                      </Text>
                    )}
                  </View>
                  <View style={styles.bizRight}>
                    {item.is_open != null && (
                      <View style={[styles.openBadge, {
                        backgroundColor: item.is_open ? colors.success + '20' : SEC,
                      }]}>
                        <View style={[styles.openDot, {
                          backgroundColor: item.is_open ? colors.success : MUTED,
                        }]} />
                        <Text style={[styles.openText, {
                          color: item.is_open ? colors.success : MUTED,
                        }]}>
                          {item.is_open ? 'Open' : 'Closed'}
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => toggleFavorite(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                      style={{ marginTop: 6 }}
                    >
                      <Ionicons
                        name={isFav ? 'heart' : 'heart-outline'}
                        size={18}
                        color={isFav ? colors.destructive : MUTED}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

      </Animated.View>
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
    marginHorizontal: 20, marginBottom: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
    marginBottom: 12, paddingHorizontal: 20,
  },

  /* ── Suggestions ── */
  suggestionList: { paddingTop: 8, paddingBottom: 24 },
  suggestionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 8,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  suggestionIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  suggestionCity:     { fontSize: 15, fontWeight: '700' },
  suggestionProvince: { fontSize: 12, marginTop: 2 },
  noMatchText:        { fontSize: 14, marginTop: 12, textAlign: 'center' },

  /* ── Popular cities grid ── */
  cityGrid:    { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 20 },
  cityCard: {
    flex: 1, margin: 8, padding: 20, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', gap: 8,
  },
  cityIconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cityName:     { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  cityProvince: { fontSize: 11, fontWeight: '500', textAlign: 'center' },

  /* ── States ── */
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

  /* ── Results ── */
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
