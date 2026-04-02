import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/store/useStore';
import { Avatar } from '@/components/ui';
import { resolveBusinessById } from '@/lib/queue';

export default function SavedBusinessesScreen() {
  const { colors, isDark } = useTheme();
  const favoriteBusinesses = useStore((s) => s.favoriteBusinesses);
  const toggleFavorite     = useStore((s) => s.toggleFavorite);

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (favoriteBusinesses.length === 0) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const results = await Promise.all(
        favoriteBusinesses.map((id) => resolveBusinessById(id))
      );
      setBusinesses(results.filter((r) => r.data).map((r) => r.data!));
      setLoading(false);
    })();
  }, [favoriteBusinesses]);

  const BG     = colors.background;
  const FG     = colors.foreground;
  const MUTED  = colors.mutedForeground;
  const BORDER = colors.border;
  const CARD   = colors.card;

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: BG }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: BORDER }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: CARD, borderColor: BORDER }]}
          onPress={() => router.back()}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={20} color={FG} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerSub, { color: MUTED }]}>MY</Text>
          <Text style={[styles.headerTitle, { color: FG }]}>SAVED</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : businesses.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: CARD, borderColor: BORDER }]}>
            <Ionicons name="heart-outline" size={36} color={MUTED} />
          </View>
          <Text style={[styles.emptyTitle, { color: FG }]}>No saved businesses</Text>
          <Text style={[styles.emptySub, { color: MUTED }]}>
            Tap the heart icon on any business to save it here.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {businesses.map((biz) => (
            <TouchableOpacity
              key={biz.id}
              style={[styles.card, { backgroundColor: CARD, borderColor: BORDER }]}
              onPress={() => router.push(`/business/${biz.id}`)}
              activeOpacity={0.85}
            >
              <Avatar
                name={biz.name}
                source={biz.avatar_url ? { uri: biz.avatar_url } : null}
                size="md"
              />
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { color: FG }]} numberOfLines={1}>
                  {biz.name}
                </Text>
                <Text style={[styles.cardMeta, { color: MUTED }]} numberOfLines={1}>
                  {biz.category || 'Business'}
                  {biz.address ? `  ·  ${biz.address}` : ''}
                </Text>
                <View style={styles.cardStats}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: biz.is_open ? colors.success : MUTED },
                  ]} />
                  <Text style={[styles.cardMeta, { color: biz.is_open ? colors.success : MUTED }]}>
                    {biz.is_open ? 'Open' : 'Closed'}
                  </Text>
                  <Text style={[styles.cardMeta, { color: MUTED }]}>
                    ·  {biz.queue_length ?? 0} in queue
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => toggleFavorite(biz.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="heart" size={22} color={colors.destructive} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  headerSub:   { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },

  emptyIcon: {
    width: 80, height: 80, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptySub:   { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  list: { padding: 16, gap: 10 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  cardInfo:  { flex: 1, gap: 4 },
  cardName:  { fontSize: 15, fontWeight: '800' },
  cardMeta:  { fontSize: 12 },
  cardStats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
});
