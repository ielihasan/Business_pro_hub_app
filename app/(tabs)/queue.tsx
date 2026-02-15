import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import {
  Card,
  CardContent,
  Button,
  Avatar,
  QueueStatusBadge,
  Progress,
  Separator,
} from '@/components/ui';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
<<<<<<< HEAD
import { useTranslation } from 'react-i18next';
=======
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5

// Mock data for active queues
const activeQueues = [
  {
    id: 'q1',
    businessId: '1',
    businessName: 'Campus Coffee Shop',
    businessCategory: 'Food & Beverage',
    position: 3,
    totalInQueue: 8,
    estimatedWait: '8 min',
    status: 'waiting' as const,
    joinedAt: '10:30 AM',
    ticketNumber: 'CC-042',
  },
];

const pastQueues = [
  {
    id: 'q2',
    businessId: '2',
    businessName: 'UniPrint Station',
    businessCategory: 'Print Services',
    status: 'completed' as const,
    completedAt: 'Today, 9:15 AM',
    serviceTime: '12 min',
    ticketNumber: 'UP-089',
  },
  {
    id: 'q3',
    businessId: '3',
    businessName: 'Quick Fix Mobile',
    businessCategory: 'Phone Repair',
    status: 'completed' as const,
    completedAt: 'Yesterday, 4:30 PM',
    serviceTime: '25 min',
    ticketNumber: 'QF-156',
  },
  {
    id: 'q4',
    businessId: '1',
    businessName: 'Campus Coffee Shop',
    businessCategory: 'Food & Beverage',
    status: 'cancelled' as const,
    completedAt: 'Yesterday, 11:00 AM',
    ticketNumber: 'CC-038',
  },
];

export default function QueueScreen() {
  const { colors } = useTheme();
<<<<<<< HEAD
  const { t } = useTranslation();
=======
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleLeaveQueue = (queueId: string) => {
    Alert.alert(
<<<<<<< HEAD
      t('queue.leave_modal.title'),
      t('queue.leave_modal.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('queue.leave_modal.confirm_action'),
=======
      'Leave Queue',
      'Are you sure you want to leave this queue? You will lose your position.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Queue',
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
          style: 'destructive',
          onPress: () => {
            // Handle leave queue
            console.log('Leaving queue:', queueId);
          },
        },
      ]
    );
  };

  const renderActiveQueue = (queue: typeof activeQueues[0]) => {
    const progressPercent = ((queue.totalInQueue - queue.position + 1) / queue.totalInQueue) * 100;

    return (
      <TouchableOpacity
        key={queue.id}
        onPress={() => router.push(`/queue/${queue.id}`)}
      >
        <Card style={styles.queueCard}>
          <CardContent style={styles.queueCardContent}>
            {/* Header */}
            <View style={styles.queueHeader}>
              <Avatar name={queue.businessName} size="lg" />
              <View style={styles.queueInfo}>
                <Text style={[styles.businessName, { color: colors.foreground }]}>
                  {queue.businessName}
                </Text>
                <Text style={[styles.businessCategory, { color: colors.mutedForeground }]}>
                  {queue.businessCategory}
                </Text>
                <View style={styles.ticketRow}>
                  <Ionicons name="ticket-outline" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.ticketNumber, { color: colors.mutedForeground }]}>
                    {queue.ticketNumber}
                  </Text>
                </View>
              </View>
              <QueueStatusBadge status={queue.status} />
            </View>

            <Separator style={{ marginVertical: Spacing[4] }} />

            {/* Position & Wait Time */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
<<<<<<< HEAD
                  {t('queue.card.your_position')}
=======
                  Your Position
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
                </Text>
                <Text style={[styles.statValueLarge, { color: colors.foreground }]}>
                  #{queue.position}
                </Text>
                <Text style={[styles.statSubtext, { color: colors.mutedForeground }]}>
<<<<<<< HEAD
                  of {queue.totalInQueue} {t('queue.card.in_queue')}
=======
                  of {queue.totalInQueue} in queue
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
<<<<<<< HEAD
                  {t('queue.card.est_wait')}
=======
                  Est. Wait Time
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
                </Text>
                <Text style={[styles.statValueLarge, { color: colors.foreground }]}>
                  {queue.estimatedWait}
                </Text>
                <Text style={[styles.statSubtext, { color: colors.mutedForeground }]}>
<<<<<<< HEAD
                  {t('queue.card.joined_at')} {queue.joinedAt}
=======
                  Joined at {queue.joinedAt}
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
                </Text>
              </View>
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
<<<<<<< HEAD
                  {t('queue.card.progress')}
=======
                  Queue Progress
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
                </Text>
                <Text style={[styles.progressPercent, { color: colors.foreground }]}>
                  {Math.round(progressPercent)}%
                </Text>
              </View>
              <Progress value={progressPercent} />
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <Button
                variant="outline"
                size="sm"
                onPress={() => handleLeaveQueue(queue.id)}
                style={styles.actionButton}
                icon={<Ionicons name="exit-outline" size={16} color={colors.foreground} />}
              >
<<<<<<< HEAD
                {t('queue.card.leave')}
=======
                Leave Queue
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
              </Button>
              <Button
                size="sm"
                onPress={() => router.push(`/queue/${queue.id}`)}
                style={styles.actionButton}
                icon={<Ionicons name="eye-outline" size={16} color={colors.primaryForeground} />}
              >
<<<<<<< HEAD
                {t('common.view_details')}
=======
                View Details
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
              </Button>
            </View>
          </CardContent>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderPastQueue = (queue: typeof pastQueues[0]) => (
    <TouchableOpacity
      key={queue.id}
      onPress={() => router.push(`/business/${queue.businessId}`)}
    >
      <Card style={styles.pastQueueCard}>
        <CardContent style={styles.pastQueueContent}>
          <View style={styles.pastQueueHeader}>
            <Avatar name={queue.businessName} size="md" />
            <View style={styles.pastQueueInfo}>
              <Text style={[styles.pastBusinessName, { color: colors.foreground }]}>
                {queue.businessName}
              </Text>
              <Text style={[styles.pastBusinessCategory, { color: colors.mutedForeground }]}>
                {queue.ticketNumber} • {queue.completedAt}
              </Text>
            </View>
            <QueueStatusBadge status={queue.status} />
          </View>
          {queue.status === 'completed' && queue.serviceTime && (
            <View style={styles.serviceTimeRow}>
              <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.serviceTimeText, { color: colors.mutedForeground }]}>
<<<<<<< HEAD
                {t('queue.card.service_time')}: {queue.serviceTime}
=======
                Service time: {queue.serviceTime}
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
              </Text>
            </View>
          )}
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Tab Selector */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'active' && [styles.activeTab, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('active')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'active' ? colors.foreground : colors.mutedForeground },
            ]}
          >
<<<<<<< HEAD
            {t('queue.tabs.active')} ({activeQueues.length})
=======
            Active ({activeQueues.length})
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'history' && [styles.activeTab, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('history')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'history' ? colors.foreground : colors.mutedForeground },
            ]}
          >
<<<<<<< HEAD
            {t('queue.tabs.history')}
=======
            History
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'active' ? (
          activeQueues.length > 0 ? (
            <View style={styles.queueList}>
              {activeQueues.map(renderActiveQueue)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name="list-outline" size={48} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
<<<<<<< HEAD
                {t('queue.empty.active_title')}
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t('queue.empty.active_desc')}
=======
                No Active Queues
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Scan a QR code or search for a business to join a queue
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
              </Text>
              <Button
                onPress={() => router.push('/(tabs)/scan')}
                style={styles.emptyButton}
                icon={<Ionicons name="qr-code-outline" size={18} color={colors.primaryForeground} />}
              >
<<<<<<< HEAD
                {t('queue.empty.scan_button')}
=======
                Scan QR Code
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
              </Button>
            </View>
          )
        ) : (
          pastQueues.length > 0 ? (
            <View style={styles.pastQueueList}>
              {pastQueues.map(renderPastQueue)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name="time-outline" size={48} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
<<<<<<< HEAD
                {t('queue.empty.history_title')}
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t('queue.empty.history_desc')}
=======
                No Queue History
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Your past queue visits will appear here
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
              </Text>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  scrollContent: {
    padding: Spacing[6],
    flexGrow: 1,
  },
  queueList: {
    gap: Spacing[4],
  },
  queueCard: {
    marginBottom: 0,
  },
  queueCardContent: {
    padding: Spacing[4],
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  queueInfo: {
    flex: 1,
    marginLeft: Spacing[4],
  },
  businessName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[0.5],
  },
  businessCategory: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing[2],
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  ticketNumber: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing[2],
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    marginBottom: Spacing[1],
  },
  statValueLarge: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  statSubtext: {
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing[1],
  },
  statDivider: {
    width: 1,
    height: 60,
    marginHorizontal: Spacing[4],
  },
  progressContainer: {
    marginTop: Spacing[4],
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
    fontWeight: Typography.fontWeight.medium,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
  actionButton: {
    flex: 1,
  },
  // Past queues
  pastQueueList: {
    gap: Spacing[3],
  },
  pastQueueCard: {
    marginBottom: 0,
  },
  pastQueueContent: {
    padding: Spacing[4],
  },
  pastQueueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pastQueueInfo: {
    flex: 1,
    marginLeft: Spacing[3],
  },
  pastBusinessName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing[0.5],
  },
  pastBusinessCategory: {
    fontSize: Typography.fontSize.sm,
  },
  serviceTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    marginTop: Spacing[3],
  },
  serviceTimeText: {
    fontSize: Typography.fontSize.sm,
  },
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing[16],
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[2],
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    marginBottom: Spacing[6],
    maxWidth: 280,
  },
  emptyButton: {
    minWidth: 180,
  },
});
