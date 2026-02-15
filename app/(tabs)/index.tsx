import { useState } from 'react';
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
<<<<<<< HEAD
import { useTranslation } from 'react-i18next';
=======
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5

const { width } = Dimensions.get('window');

// Mock data for businesses
const categories = [
<<<<<<< HEAD
  { id: 'all', name: 'home.categories.all', icon: 'grid-outline' },
  { id: 'food', name: 'home.categories.food', icon: 'restaurant-outline' },
  { id: 'print', name: 'home.categories.print', icon: 'print-outline' },
  { id: 'health', name: 'home.categories.health', icon: 'medical-outline' },
  { id: 'repair', name: 'home.categories.repair', icon: 'construct-outline' },
  { id: 'salon', name: 'home.categories.salon', icon: 'cut-outline' },
=======
  { id: 'all', name: 'All', icon: 'grid-outline' },
  { id: 'food', name: 'Food', icon: 'restaurant-outline' },
  { id: 'print', name: 'Print', icon: 'print-outline' },
  { id: 'health', name: 'Health', icon: 'medical-outline' },
  { id: 'repair', name: 'Repair', icon: 'construct-outline' },
  { id: 'salon', name: 'Salon', icon: 'cut-outline' },
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
];

const nearbyBusinesses = [
  {
    id: '1',
    name: 'Campus Coffee Shop',
    category: 'Food & Beverage',
    distance: '0.2 km',
    waitTime: '~10 min',
    queueLength: 5,
    rating: 4.8,
    isOpen: true,
    image: null,
  },
  {
    id: '2',
    name: 'UniPrint Station',
    category: 'Print Services',
    distance: '0.3 km',
    waitTime: '~15 min',
    queueLength: 8,
    rating: 4.5,
    isOpen: true,
    image: null,
  },
  {
    id: '3',
    name: 'Quick Fix Mobile',
    category: 'Phone Repair',
    distance: '0.5 km',
    waitTime: '~25 min',
    queueLength: 3,
    rating: 4.7,
    isOpen: true,
    image: null,
  },
  {
    id: '4',
    name: 'Student Health Center',
    category: 'Healthcare',
    distance: '0.7 km',
    waitTime: '~45 min',
    queueLength: 12,
    rating: 4.2,
    isOpen: true,
    image: null,
  },
];

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
<<<<<<< HEAD
  const { t } = useTranslation();
=======
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

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
<<<<<<< HEAD
              placeholder={t('common.search_placeholder')}
=======
              placeholder="Search businesses..."
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
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
<<<<<<< HEAD
                      {t('home.active_queue.title')}
=======
                      Currently in queue
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
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
<<<<<<< HEAD
                      {t('home.active_queue.position')}
=======
                      Position
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
                    </Text>
                  </View>
                  <View style={[styles.activeQueueDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.activeQueueStat}>
                    <Text style={[styles.activeQueueStatValue, { color: colors.foreground }]}>
                      {activeQueue.estimatedWait}
                    </Text>
                    <Text style={[styles.activeQueueStatLabel, { color: colors.mutedForeground }]}>
<<<<<<< HEAD
                      {t('home.active_queue.est_wait')}
=======
                      Est. Wait
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
                    </Text>
                  </View>
                </View>
                <View style={styles.viewDetailsRow}>
                  <Text style={[styles.viewDetailsText, { color: colors.primary }]}>
<<<<<<< HEAD
                    {t('common.view_details')}
=======
                    View Details
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
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
<<<<<<< HEAD
            {t('home.categories.title')}
=======
            Categories
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
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
<<<<<<< HEAD
                  {t(category.name)}
=======
                  {category.name}
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Nearby Businesses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
<<<<<<< HEAD
              {t('home.nearby.title')}
            </Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                {t('common.see_all')}
=======
              Nearby Businesses
            </Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                See All
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.businessList}>
            {nearbyBusinesses.map((business) => (
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
                              {business.distance}
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
                          {business.queueLength}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
<<<<<<< HEAD
                          {t('home.nearby.in_queue')}
=======
                          in queue
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.foreground }]}>
                          {business.waitTime}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
<<<<<<< HEAD
                          {t('home.nearby.wait_time')}
                        </Text>
                      </View>
                      <Badge variant={business.isOpen ? 'success' : 'secondary'}>
                        {business.isOpen ? t('common.open') : t('common.closed')}
=======
                          wait time
                        </Text>
                      </View>
                      <Badge variant={business.isOpen ? 'success' : 'secondary'}>
                        {business.isOpen ? 'Open' : 'Closed'}
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
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
