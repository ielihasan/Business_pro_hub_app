import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import Dialog, { DialogConfig } from '@/components/ui/Dialog';
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
import {
  fetchQueueEntry,
  subscribeToQueueEntry,
  QueueEntryRecord,
  ticketLabel,
  formatWait,
} from '@/lib/queue';
import { useStore } from '@/store/useStore';

function buildTimeline(entry: QueueEntryRecord) {
  const joinedTime = new Date(entry.joined_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const isActive = entry.status === 'waiting' || entry.status === 'in_progress';
  return [
    { time: joinedTime, event: 'Joined queue', status: 'completed' },
    {
      time: entry.status === 'in_progress' ? 'Now' : (isActive ? 'Pending' : 'Done'),
      event: 'Currently being served',
      status: entry.status === 'in_progress' ? 'upcoming' : (entry.status === 'completed' ? 'completed' : 'pending'),
    },
    {
      time: entry.status === 'completed' ? 'Done' : 'Pending',
      event: 'Service completed',
      status: entry.status === 'completed' ? 'completed' : 'pending',
    },
  ];
}

export default function QueueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<QueueEntryRecord | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogConfig | null>(null);
  const leaveQueueInSupabase = useStore((s) => s.leaveQueueInSupabase);

  // Load queue entry from Supabase
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await fetchQueueEntry(id);
      if (error || !data) {
        setFetchError(error ?? 'Queue entry not found');
      } else {
        setQueue(data);
      }
    })();
  }, [id]);

  // Real-time subscription for position/status updates
  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToQueueEntry(id, (updated) => {
      setQueue((prev) =>
        prev ? ({ ...prev, ...updated } as QueueEntryRecord) : prev
      );
    });
    return unsubscribe;
  }, [id]);

  const progressPercent = queue
    ? ((( queue.business?.queue_length ?? queue.position) - queue.position + 1) / (queue.business?.queue_length ?? queue.position)) * 100
    : 0;

  const handleLeaveQueue = () => {
    if (!queue) return;
    setDialog({
      title: 'Leave Queue',
      message: 'Are you sure you want to leave this queue? You will lose your position.',
      icon: 'exit-outline',
      iconVariant: 'destructive',
      actions: [
        { label: 'Cancel', onPress: () => setDialog(null) },
        {
          label: 'Leave Queue',
          variant: 'destructive',
          onPress: async () => {
            setDialog(null);
            setLoading(true);
            const result = await leaveQueueInSupabase(queue.id);
            setLoading(false);
            if (!result.success) {
              setDialog({
                title: 'Error',
                message: result.error ?? 'Failed to leave queue.',
                icon: 'alert-circle-outline',
                iconVariant: 'destructive',
                actions: [{ label: 'OK', onPress: () => setDialog(null) }],
              });
              return;
            }
            router.replace('/(tabs)/queue');
          },
        },
      ],
    });
  };

  const handleViewBusiness = () => {
    if (queue?.business_id) router.push(`/business/${queue.business_id}`);
  };

  // Loading / error states
  if (!queue && !fetchError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (fetchError || !queue) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.destructive} />
          <Text style={{ color: colors.foreground, marginTop: 12, textAlign: 'center' }}>
            {fetchError ?? 'Queue entry not found.'}
          </Text>
          <Button onPress={() => router.replace('/(tabs)/queue')} style={{ marginTop: 16 }}>
            Go to My Queues
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const timeline = buildTimeline(queue);

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
              {ticketLabel(queue.position)}
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
                    of {queue.business?.queue_length ?? queue.position} in queue
                  </Text>
                </View>
                <View style={[styles.positionDivider, { backgroundColor: colors.border }]} />
                <View style={styles.positionBox}>
                  <Text style={[styles.positionLabel, { color: colors.mutedForeground }]}>
                    Est. Wait Time
                  </Text>
                  <Text style={[styles.positionValue, { color: colors.foreground }]}>
                    {formatWait(queue.estimated_wait_time)}
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
                      {queue.business?.name ?? 'Unknown Business'}
                    </Text>
                    <Text style={[styles.businessCategory, { color: colors.mutedForeground }]}>
                      {queue.business?.category ?? ''}
                    </Text>
                    <View style={styles.businessLocation}>
                      <Ionicons name="location-outline" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.businessAddress, { color: colors.mutedForeground }]}>
                        {queue.business?.address ?? ''}
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
                {timeline.map((item: any, index: number) => (
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
                      {index < timeline.length - 1 && (
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
                      {new Date(queue.joined_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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
      {dialog && <Dialog visible {...dialog} onDismiss={() => setDialog(null)} />}
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
