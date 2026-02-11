import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
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
  QueueStatusBadge,
} from '@/components/ui';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

// Mock queue data
const queueData: Record<string, any> = {
  'q1': {
    id: 'q1',
    ticketNumber: 'CC-042',
    position: 3,
    totalInQueue: 8,
    estimatedWait: '8 min',
    status: 'waiting',
    joinedAt: '10:30 AM',
    business: {
      id: '1',
      name: 'Campus Coffee Shop',
      category: 'Food & Beverage',
      address: 'Block A, University of Gujrat',
    },
    timeline: [
      { time: '10:30 AM', event: 'Joined queue', status: 'completed' },
      { time: '10:35 AM', event: 'Position updated to #5', status: 'completed' },
      { time: '10:40 AM', event: 'Position updated to #3', status: 'completed' },
      { time: 'Soon', event: 'Your turn is coming up', status: 'upcoming' },
      { time: 'Pending', event: 'Service completed', status: 'pending' },
    ],
  },
};

export default function QueueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const queue = queueData[id || 'q1'] || queueData['q1'];

  const progressPercent = ((queue.totalInQueue - queue.position + 1) / queue.totalInQueue) * 100;

  const handleLeaveQueue = () => {
    Alert.alert(
      'Leave Queue',
      'Are you sure you want to leave this queue? You will lose your position.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Queue',
          style: 'destructive',
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              router.replace('/(tabs)/queue');
            }, 1000);
          },
        },
      ]
    );
  };

  const handleViewBusiness = () => {
    router.push(`/business/${queue.business.id}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Ticket Header */}
        <View style={[styles.ticketHeader, { backgroundColor: colors.primary }]}>
          <View style={styles.ticketContent}>
            <Text style={[styles.ticketLabel, { color: colors.primaryForeground + 'CC' }]}>
              Your Ticket Number
            </Text>
            <Text style={[styles.ticketNumber, { color: colors.primaryForeground }]}>
              {queue.ticketNumber}
            </Text>
            <QueueStatusBadge status={queue.status} style={styles.statusBadge} />
          </View>
          <View style={styles.ticketDecoration}>
            {/* Decorative circles on the edge */}
            <View style={[styles.ticketCircle, styles.ticketCircleLeft, { backgroundColor: colors.background }]} />
            <View style={[styles.ticketCircle, styles.ticketCircleRight, { backgroundColor: colors.background }]} />
          </View>
        </View>

        <View style={styles.content}>
          {/* Position Card */}
          <Card style={styles.positionCard}>
            <CardContent style={styles.positionContent}>
              <View style={styles.positionMain}>
                <View style={styles.positionBox}>
                  <Text style={[styles.positionLabel, { color: colors.mutedForeground }]}>
                    Your Position
                  </Text>
                  <Text style={[styles.positionValue, { color: colors.foreground }]}>
                    #{queue.position}
                  </Text>
                  <Text style={[styles.positionSubtext, { color: colors.mutedForeground }]}>
                    of {queue.totalInQueue} in queue
                  </Text>
                </View>
                <View style={[styles.positionDivider, { backgroundColor: colors.border }]} />
                <View style={styles.positionBox}>
                  <Text style={[styles.positionLabel, { color: colors.mutedForeground }]}>
                    Est. Wait Time
                  </Text>
                  <Text style={[styles.positionValue, { color: colors.foreground }]}>
                    {queue.estimatedWait}
                  </Text>
                  <Text style={[styles.positionSubtext, { color: colors.mutedForeground }]}>
                    Updated just now
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                    Queue Progress
                  </Text>
                  <Text style={[styles.progressPercent, { color: colors.foreground }]}>
                    {Math.round(progressPercent)}%
                  </Text>
                </View>
                <Progress value={progressPercent} height={10} />
              </View>
            </CardContent>
          </Card>

          {/* Business Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Business Details
            </Text>
            <TouchableOpacity onPress={handleViewBusiness}>
              <Card>
                <CardContent style={styles.businessContent}>
                  <Avatar name={queue.business.name} size="lg" />
                  <View style={styles.businessInfo}>
                    <Text style={[styles.businessName, { color: colors.foreground }]}>
                      {queue.business.name}
                    </Text>
                    <Text style={[styles.businessCategory, { color: colors.mutedForeground }]}>
                      {queue.business.category}
                    </Text>
                    <View style={styles.businessLocation}>
                      <Ionicons name="location-outline" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.businessAddress, { color: colors.mutedForeground }]}>
                        {queue.business.address}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
                </CardContent>
              </Card>
            </TouchableOpacity>
          </View>

          {/* Timeline */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Queue Timeline
            </Text>
            <Card>
              <CardContent style={styles.timelineContent}>
                {queue.timeline.map((item: any, index: number) => (
                  <View key={index} style={styles.timelineItem}>
                    <View style={styles.timelineIndicator}>
                      <View
                        style={[
                          styles.timelineDot,
                          {
                            backgroundColor:
                              item.status === 'completed' ? colors.success :
                              item.status === 'upcoming' ? colors.warning :
                              colors.border,
                          },
                        ]}
                      >
                        {item.status === 'completed' && (
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        )}
                        {item.status === 'upcoming' && (
                          <Ionicons name="time" size={10} color="#FFFFFF" />
                        )}
                      </View>
                      {index < queue.timeline.length - 1 && (
                        <View
                          style={[
                            styles.timelineLine,
                            {
                              backgroundColor:
                                item.status === 'completed' ? colors.success : colors.border,
                            },
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.timelineText}>
                      <Text style={[styles.timelineEvent, { color: colors.foreground }]}>
                        {item.event}
                      </Text>
                      <Text style={[styles.timelineTime, { color: colors.mutedForeground }]}>
                        {item.time}
                      </Text>
                    </View>
                  </View>
                ))}
              </CardContent>
            </Card>
          </View>

          {/* Quick Info */}
          <View style={styles.section}>
            <Card>
              <CardContent style={styles.infoContent}>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={20} color={colors.mutedForeground} />
                  <View style={styles.infoText}>
                    <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                      Joined at
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.foreground }]}>
                      {queue.joinedAt}
                    </Text>
                  </View>
                </View>
                <Separator style={{ marginVertical: Spacing[3] }} />
                <View style={styles.infoRow}>
                  <Ionicons name="notifications-outline" size={20} color={colors.mutedForeground} />
                  <View style={styles.infoText}>
                    <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                      Notifications
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.foreground }]}>
                      You'll be notified when your turn is near
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <View style={styles.actions}>
              <Button
                variant="outline"
                onPress={handleLeaveQueue}
                loading={loading}
                style={[styles.actionButton, { borderColor: colors.destructive }]}
                textStyle={{ color: colors.destructive }}
                icon={<Ionicons name="exit-outline" size={18} color={colors.destructive} />}
              >
                Leave Queue
              </Button>
              <Button
                variant="outline"
                onPress={handleViewBusiness}
                style={styles.actionButton}
                icon={<Ionicons name="storefront-outline" size={18} color={colors.foreground} />}
              >
                View Business
              </Button>
            </View>
          </View>

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
  ticketHeader: {
    paddingTop: Spacing[8],
    paddingBottom: Spacing[10],
    alignItems: 'center',
    position: 'relative',
  },
  ticketContent: {
    alignItems: 'center',
  },
  ticketLabel: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing[2],
  },
  ticketNumber: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 2,
    marginBottom: Spacing[3],
  },
  statusBadge: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[1.5],
  },
  ticketDecoration: {
    position: 'absolute',
    bottom: -12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  ticketCircleLeft: {
    marginLeft: -12,
  },
  ticketCircleRight: {
    marginRight: -12,
  },
  content: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
  },
  positionCard: {
    marginBottom: Spacing[6],
  },
  positionContent: {
    padding: Spacing[4],
  },
  positionMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  positionBox: {
    flex: 1,
    alignItems: 'center',
  },
  positionLabel: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing[2],
  },
  positionValue: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  positionSubtext: {
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing[1],
  },
  positionDivider: {
    width: 1,
    height: 60,
    marginHorizontal: Spacing[4],
  },
  progressSection: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
  },
  progressLabel: {
    fontSize: Typography.fontSize.sm,
  },
  progressPercent: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  section: {
    marginBottom: Spacing[6],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[4],
  },
  businessContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
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
  businessLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  businessAddress: {
    fontSize: Typography.fontSize.xs,
    flex: 1,
  },
  timelineContent: {
    padding: Spacing[4],
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: Spacing[4],
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: Spacing[4],
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: Spacing[1],
    minHeight: 20,
  },
  timelineText: {
    flex: 1,
    paddingTop: Spacing[0.5],
  },
  timelineEvent: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing[0.5],
  },
  timelineTime: {
    fontSize: Typography.fontSize.xs,
  },
  infoContent: {
    padding: Spacing[4],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: Spacing[3],
  },
  infoLabel: {
    fontSize: Typography.fontSize.xs,
    marginBottom: Spacing[0.5],
  },
  infoValue: {
    fontSize: Typography.fontSize.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  actionButton: {
    flex: 1,
  },
});
