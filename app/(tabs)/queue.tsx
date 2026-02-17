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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { ActiveQueueItem, PastQueueItem, QueueEmptyState } from '@/components/queue';

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
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleLeaveQueue = (queueId: string) => {
    Alert.alert(
      t('queue.leave_modal.title'),
      t('queue.leave_modal.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('queue.leave_modal.confirm_action'),
          style: 'destructive',
          onPress: () => console.log('Leaving queue:', queueId),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Tabs */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'active' ? colors.foreground : colors.mutedForeground }]}>
            {t('queue.tabs.active')} ({activeQueues.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'history' ? colors.foreground : colors.mutedForeground }]}>
            {t('queue.tabs.history')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'active' ? (
          activeQueues.length > 0 ? (
            <View style={styles.list}>
              {activeQueues.map((q) => (
                <ActiveQueueItem key={q.id} queue={q} onLeave={handleLeaveQueue} />
              ))}
            </View>
          ) : (
            <QueueEmptyState type="active" />
          )
        ) : pastQueues.length > 0 ? (
          <View style={styles.list}>
            {pastQueues.map((q) => (
              <PastQueueItem key={q.id} queue={q} />
            ))}
          </View>
        ) : (
          <QueueEmptyState type="history" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: Spacing[4], alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: {},
  tabText: { fontSize: Typography.fontSize.base },
  scrollContent: { padding: Spacing[4], paddingBottom: Spacing[8] },
  list: { gap: Spacing[4] },
});
