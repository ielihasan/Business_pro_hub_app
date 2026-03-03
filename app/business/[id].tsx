import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Avatar,
  Separator,
  Progress,
} from '@/components/ui';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { fetchBusinessById, resolveBusinessById, BusinessDetail } from '@/lib/queue';
import { useStore } from '@/store/useStore';

const { width } = Dimensions.get('window');

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const joinQueueInSupabase = useStore((s) => s.joinQueueInSupabase);
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!id) return;
    (async () => {
      // resolveBusinessById checks 'businesses' first, then 'admins'
      const { data, error } = await resolveBusinessById(id);
      if (error || !data) {
        setFetchError(error ?? 'Business not found');
      } else {
        // Cast resolved data to BusinessDetail shape (it has all needed fields)
        setBusiness(data as unknown as BusinessDetail);
      }
    })();
  }, [id]);

  const handleJoinQueue = () => {
    if (!business) return;

    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to join a queue.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    Alert.alert(
      `Join Queue — ${business.name}`,
      `Current queue: ${business.queue_length} people\nEstimated wait: ${business.wait_time ?? 'N/A'}\n\nWould you like to join?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join Queue',
          onPress: async () => {
            setLoading(true);
            const result = await joinQueueInSupabase(business.id);
            setLoading(false);
            if (!result.success || !result.queueEntryId) {
              Alert.alert('Could Not Join', result.error ?? 'An error occurred.');
              return;
            }
            router.push(`/queue/${result.queueEntryId}`);
          },
        },
      ]
    );
  };

  // Loading / error states
  if (!business && !fetchError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (fetchError || !business) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.destructive} />
          <Text style={{ color: colors.foreground, marginTop: 12, textAlign: 'center' }}>
            {fetchError ?? 'Business not found.'}
          </Text>
          <Button onPress={() => router.back()} style={{ marginTop: 16 }}>Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = () => {
    // Share functionality
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  const handleCall = () => {
    // Open phone dialer
    Alert.alert('Call', `Calling ${business.phone}`);
  };

  const handleDirections = () => {
    // Open maps
    Alert.alert('Directions', 'Opening maps for directions...');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={[styles.hero, { backgroundColor: colors.secondary }]}>
          {/* Back button */}
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.background }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Avatar name={business.name} size="xl" style={styles.heroAvatar} />
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={[styles.heroButton, { backgroundColor: colors.background }]}
              onPress={() => setIsFavorite(!isFavorite)}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? colors.destructive : colors.foreground}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.heroButton, { backgroundColor: colors.background }]}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Business Info */}
          <View style={styles.section}>
            <View style={styles.titleRow}>
              <View style={styles.titleInfo}>
                <Text style={[styles.businessName, { color: colors.foreground }]}>
                  {business.name}
                </Text>
                <Text style={[styles.businessCategory, { color: colors.mutedForeground }]}>
                  {business.category}
                </Text>
              </View>
              <Badge variant={business.is_open ? 'success' : 'secondary'}>
                {business.is_open ? 'Open' : 'Closed'}
              </Badge>
            </View>

            {/* Rating & Stats */}
            <View style={styles.statsRow}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={18} color="#F59E0B" />
                <Text style={[styles.ratingText, { color: colors.foreground }]}>
                  {business.rating ?? 'N/A'}
                </Text>
                <Text style={[styles.reviewCount, { color: colors.mutedForeground }]}>
                  ({business.review_count ?? 0} reviews)
                </Text>
              </View>
              <View style={styles.queueInfo}>
                <Ionicons name="people-outline" size={18} color={colors.mutedForeground} />
                <Text style={[styles.queueText, { color: colors.mutedForeground }]}>
                  {business.queue_length} in queue
                </Text>
              </View>
            </View>

            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {business.description || 'A registered business on BusinessHub Pro.'}
            </Text>
          </View>

          {/* Queue Status Card */}
          <View style={styles.section}>
            <Card style={[styles.queueCard, { borderColor: colors.primary, borderWidth: 2 }]}>
              <CardContent style={styles.queueCardContent}>
                <View style={styles.queueHeader}>
                  <View>
                    <Text style={[styles.queueLabel, { color: colors.mutedForeground }]}>
                      Estimated Wait Time
                    </Text>
                    <Text style={[styles.queueTime, { color: colors.foreground }]}>
                      {business.wait_time ?? 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.queueStats}>
                    <View style={styles.queueStatItem}>
                      <Text style={[styles.queueStatValue, { color: colors.foreground }]}>
                        {business.queue_length}
                      </Text>
                      <Text style={[styles.queueStatLabel, { color: colors.mutedForeground }]}>
                        in queue
                      </Text>
                    </View>
                  </View>
                </View>
                <Button
                  onPress={handleJoinQueue}
                  loading={loading}
                  style={styles.joinButton}
                  icon={<Ionicons name="add-circle-outline" size={20} color={colors.primaryForeground} />}
                >
                  Join Queue
                </Button>
              </CardContent>
            </Card>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: colors.secondary }]}
                onPress={handleCall}
              >
                <Ionicons name="call-outline" size={22} color={colors.foreground} />
                <Text style={[styles.quickActionText, { color: colors.foreground }]}>
                  Call
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: colors.secondary }]}
                onPress={handleDirections}
              >
                <Ionicons name="navigate-outline" size={22} color={colors.foreground} />
                <Text style={[styles.quickActionText, { color: colors.foreground }]}>
                  Directions
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: colors.secondary }]}
              >
                <Ionicons name="globe-outline" size={22} color={colors.foreground} />
                <Text style={[styles.quickActionText, { color: colors.foreground }]}>
                  Website
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Services — omitted (not in Supabase schema); kept intentionally blank */}

          {/* Business Hours */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Hours
            </Text>
            <Card>
              <CardContent style={styles.hoursContent}>
                <View style={styles.hoursRow}>
                  <Ionicons name="time-outline" size={20} color={colors.mutedForeground} />
                  <View style={styles.hoursInfo}>
                    <Text style={[styles.hoursText, { color: colors.foreground }]}>
                      {business.is_open ? 'Currently open' : 'Currently closed'}
                    </Text>
                    <Text style={[styles.hoursStatus, { color: business.is_open ? colors.success : colors.destructive }]}>
                      {business.is_open ? 'Open now' : 'Closed'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
                </View>
              </CardContent>
            </Card>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Location
            </Text>
            <Card>
              <CardContent style={styles.locationContent}>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={20} color={colors.mutedForeground} />
                  <Text style={[styles.locationText, { color: colors.foreground }]}>
                    {business.address || `Lat: ${business.latitude?.toFixed(4)}, Lng: ${business.longitude?.toFixed(4)}`}
                  </Text>
                </View>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={handleDirections}
                  style={styles.directionsButton}
                >
                  Get Directions
                </Button>
              </CardContent>
            </Card>
          </View>

          {/* Amenities — loaded from Supabase when available */}

          <View style={{ height: Spacing[6] }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Spacing[4],
    left: Spacing[4],
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  heroAvatar: {
    marginTop: Spacing[4],
  },
  heroActions: {
    position: 'absolute',
    top: Spacing[4],
    right: Spacing[4],
    flexDirection: 'row',
    gap: Spacing[2],
  },
  heroButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
  },
  section: {
    marginBottom: Spacing[6],
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[3],
  },
  titleInfo: {
    flex: 1,
    marginRight: Spacing[4],
  },
  businessName: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[1],
  },
  businessCategory: {
    fontSize: Typography.fontSize.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[6],
    marginBottom: Spacing[4],
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  ratingText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  reviewCount: {
    fontSize: Typography.fontSize.sm,
  },
  queueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  queueText: {
    fontSize: Typography.fontSize.sm,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  // Queue Card
  queueCard: {
    marginBottom: 0,
  },
  queueCardContent: {
    padding: Spacing[4],
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[4],
  },
  queueLabel: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing[1],
  },
  queueTime: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  queueStats: {
    alignItems: 'flex-end',
  },
  queueStatItem: {
    alignItems: 'center',
  },
  queueStatValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  queueStatLabel: {
    fontSize: Typography.fontSize.xs,
  },
  joinButton: {
    width: '100%',
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.DEFAULT,
    gap: Spacing[2],
  },
  quickActionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  // Services
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[4],
  },
  servicesList: {
    gap: Spacing[3],
  },
  serviceCard: {
    marginBottom: 0,
  },
  serviceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[4],
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing[0.5],
  },
  serviceTime: {
    fontSize: Typography.fontSize.sm,
  },
  // Hours
  hoursContent: {
    padding: Spacing[4],
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursInfo: {
    flex: 1,
    marginLeft: Spacing[3],
  },
  hoursText: {
    fontSize: Typography.fontSize.base,
    marginBottom: Spacing[0.5],
  },
  hoursStatus: {
    fontSize: Typography.fontSize.sm,
  },
  // Location
  locationContent: {
    padding: Spacing[4],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing[4],
  },
  locationText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    marginLeft: Spacing[3],
  },
  directionsButton: {
    width: '100%',
  },
  // Amenities
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    gap: Spacing[1.5],
  },
  amenityText: {
    fontSize: Typography.fontSize.sm,
  },
});
