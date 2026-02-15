import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, Badge, Avatar, QueueStatusBadge } from '@/components/ui';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import * as Location from 'expo-location';
import { fetchBusinesses, subscribeToBusinesses, BusinessRecord } from '@/lib/business';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

// Categories
const categories = [
  { id: 'all', name: 'home.categories.all', icon: 'grid-outline' },
  { id: 'food', name: 'home.categories.food', icon: 'restaurant-outline' },
  { id: 'print', name: 'home.categories.print', icon: 'print-outline' },
  { id: 'health', name: 'home.categories.health', icon: 'medical-outline' },
  { id: 'repair', name: 'home.categories.repair', icon: 'construct-outline' },
  { id: 'salon', name: 'home.categories.salon', icon: 'cut-outline' },
];

// runtime business list
let _placeholder: Array<BusinessRecord & { distanceKm: number }> = [];

// Mock active queue
const activeQueue = {
  id: 'q1',
  businessName: 'Campus Coffee Shop',
  position: 3,
  estimatedWait: '8 min',
  status: 'waiting' as const,
};

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nearbyBusinesses, setNearbyBusinesses] = useState<Array<any>>(_placeholder);
  const [radiusKm, setRadiusKm] = useState<number>(5);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  useEffect(() => {
    let unsub: (() => Promise<void>) | null = null;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude } = pos.coords;
        setUserLocation({ latitude, longitude });
        const businesses = await fetchBusinesses({ latitude, longitude, radiusKm, category: selectedCategory, query: searchQuery });
        setNearbyBusinesses(businesses);

        unsub = subscribeToBusinesses((payload) => {
          // On change, refetch nearby businesses
          (async () => {
            if (!userLocation) return;
            const bs = await fetchBusinesses({ latitude: userLocation.latitude, longitude: userLocation.longitude, radiusKm, category: selectedCategory, query: searchQuery });
            setNearbyBusinesses(bs);
          })();
        });
      } catch (err) {
        console.warn('Location / fetch error', err);
      }
    })();

    return () => { if (unsub) unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // refetch when filters change
        (async () => {
      try {
        if (!userLocation) return;
        const bs = await fetchBusinesses({ latitude: userLocation.latitude, longitude: userLocation.longitude, radiusKm, category: selectedCategory, query: searchQuery });
        setNearbyBusinesses(bs);
      } catch (err) {
        console.warn('Refetch failed', err);
      }
    })();
  }, [selectedCategory, searchQuery, userLocation, radiusKm]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <Ionicons name="search-outline" size={20} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder={t('common.search_placeholder')}
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="options-outline" size={20} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>

        {/* Active Queue Card */}
        {activeQueue && (
          <TouchableOpacity
            style={styles.section}
            onPress={() => router.push(`/queue/${activeQueue.id}`)}
          >
            <Card
              style={[
                styles.activeQueueCard,
                { borderColor: colors.primary, borderWidth: 2 },
              ]}
            >
              <CardContent style={styles.activeQueueContent}>
                <View style={styles.activeQueueHeader}>
                  <View>
                    <Text style={[styles.activeQueueLabel, { color: colors.mutedForeground }]}>
                      {t('home.active_queue.title')}
                    </Text>
                    <Text style={[styles.activeQueueBusiness, { color: colors.foreground }]}>
                      {activeQueue.businessName}
                    </Text>
                  </View>
                  <QueueStatusBadge status={activeQueue.status} />
                </View>
                <View style={styles.activeQueueStats}>
                  <View style={styles.activeQueueStat}>
                    <Text style={[styles.activeQueueStatValue, { color: colors.foreground }]}>
                      #{activeQueue.position}
                    </Text>
                    <Text style={[styles.activeQueueStatLabel, { color: colors.mutedForeground }]}>
                      {t('home.active_queue.position')}
                    </Text>
                  </View>
                  <View style={[styles.activeQueueDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.activeQueueStat}>
                    <Text style={[styles.activeQueueStatValue, { color: colors.foreground }]}>
                      {activeQueue.estimatedWait}
                    </Text>
                    <Text style={[styles.activeQueueStatLabel, { color: colors.mutedForeground }]}>
                      {t('home.active_queue.est_wait')}
                    </Text>
                  </View>
                </View>
                <View style={styles.viewDetailsRow}>
                  <Text style={[styles.viewDetailsText, { color: colors.primary }]}>
                    {t('common.view_details')}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </View>
              </CardContent>
            </Card>
          </TouchableOpacity>
        )}

        {/* Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('home.categories.title')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      selectedCategory === category.id
                        ? colors.primary
                        : colors.secondary,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons
                  name={category.icon as any}
                  size={18}
                  color={
                    selectedCategory === category.id
                      ? colors.primaryForeground
                      : colors.foreground
                  }
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color:
                        selectedCategory === category.id
                          ? colors.primaryForeground
                          : colors.foreground,
                    },
                  ]}
                >
                  {t(category.name)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Radius Filter */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Radius</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusContainer}>
            {[1, 3, 5, 10].map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRadiusKm(r)}
                style={[
                  styles.radiusChip,
                  {
                    backgroundColor: radiusKm === r ? colors.primary : colors.secondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={{ color: radiusKm === r ? colors.primaryForeground : colors.foreground }}>{r} km</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Nearby Businesses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('home.nearby.title')}
            </Text>
            <TouchableOpacity onPress={() => router.push('/map')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                {t('common.see_all')}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.businessList}>
            {nearbyBusinesses.map((business: any) => (
              <TouchableOpacity
                key={business.id}
                onPress={() => router.push(`/business/${business.id}`)}
              >
                <Card style={styles.businessCard}>
                  <CardContent style={styles.businessCardContent}>
                    <View style={styles.businessHeader}>
                      <Avatar name={business.name} size="lg" />
                      <View style={styles.businessInfo}>
                        <Text
                          style={[styles.businessName, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {business.name}
                        </Text>
                        <Text
                          style={[styles.businessCategory, { color: colors.mutedForeground }]}
                        >
                          {business.category}
                        </Text>
                        <View style={styles.businessMeta}>
                          <View style={styles.metaItem}>
                            <Ionicons
                              name="location-outline"
                              size={14}
                              color={colors.mutedForeground}
                            />
                            <Text
                              style={[styles.metaText, { color: colors.mutedForeground }]}
                            >
                              {business.distanceKm ? `${business.distanceKm.toFixed(2)} km` : '-'}
                            </Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Ionicons
                              name="star"
                              size={14}
                              color="#F59E0B"
                            />
                            <Text
                              style={[styles.metaText, { color: colors.mutedForeground }]}
                            >
                              {business.rating}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.businessStats, { borderTopColor: colors.border }]}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.foreground }]}>
                          {business.queue_length ?? '-'}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                          {t('home.nearby.in_queue')}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.foreground }]}>
                          {business.wait_time ?? '-'}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                          {t('home.nearby.wait_time')}
                        </Text>
                      </View>
                      <Badge variant={business.isOpen ? 'success' : 'secondary'}>
                        {business.is_open ? t('common.open') : t('common.closed')}
                      </Badge>
                    </View>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: Spacing[6] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    gap: Spacing[3],
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    height: 48,
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: 1,
    gap: Spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    height: '100%',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: Spacing[6],
    marginBottom: Spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[4],
  },
  seeAllText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  // Active Queue Card
  activeQueueCard: {
    marginBottom: 0,
  },
  activeQueueContent: {
    padding: Spacing[4],
  },
  activeQueueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[4],
  },
  activeQueueLabel: {
    fontSize: Typography.fontSize.xs,
    marginBottom: Spacing[1],
  },
  activeQueueBusiness: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  activeQueueStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  activeQueueStat: {
    flex: 1,
    alignItems: 'center',
  },
  activeQueueStatValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  activeQueueStatLabel: {
    fontSize: Typography.fontSize.xs,
  },
  activeQueueDivider: {
    width: 1,
    height: 40,
    marginHorizontal: Spacing[4],
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1],
  },
  viewDetailsText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  // Categories
  categoriesContainer: {
    paddingRight: Spacing[6],
    gap: Spacing[2],
  },
  radiusContainer: {
    paddingHorizontal: Spacing[2],
    flexDirection: 'row',
    gap: Spacing[3],
  },
  radiusChip: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2.5],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing[2],
  },
  categoryChipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  // Business List
  businessList: {
    gap: Spacing[4],
  },
  businessCard: {
    marginBottom: 0,
  },
  businessCardContent: {
    padding: Spacing[4],
  },
  businessHeader: {
    flexDirection: 'row',
    marginBottom: Spacing[4],
  },
  businessInfo: {
    flex: 1,
    marginLeft: Spacing[4],
  },
  businessName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[0.5],
  },
  businessCategory: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing[2],
  },
  businessMeta: {
    flexDirection: 'row',
    gap: Spacing[4],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  metaText: {
    fontSize: Typography.fontSize.xs,
  },
  businessStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing[4],
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
  },
});
