import { useState, useEffect } from 'react';
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
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { ActiveQueueItem, PastQueueItem, QueueEmptyState } from '@/components/queue';
import { useStore } from '@/store/useStore';

export default function QueueScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const activeQueues = useStore((s) => s.activeQueues);
  const queueHistory = useStore((s) => s.queueHistory);
  const leaveQueueInSupabase = useStore((s) => s.leaveQueueInSupabase);
  const syncQueuesFromSupabase = useStore((s) => s.syncQueuesFromSupabase);
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  // Sync on mount
  useEffect(() => {
    if (isAuthenticated) syncQueuesFromSupabase();
  }, [isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await syncQueuesFromSupabase();
    setRefreshing(false);
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
          onPress: async () => {
            const result = await leaveQueueInSupabase(queueId);
            if (!result.success) {
              Alert.alert('Error', result.error ?? 'Failed to leave queue.');
            }
          },
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
                <TouchableOpacity key={q.id} onPress={() => router.push(`/queue/${q.id}`)}>
                  <ActiveQueueItem queue={q} onLeave={handleLeaveQueue} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <QueueEmptyState type="active" />
          )
        ) : queueHistory.length > 0 ? (
          <View style={styles.list}>
            {queueHistory.map((q) => (
              <PastQueueItem
                key={q.id}
                queue={{
                  id: q.id,
                  businessId: q.businessId,
                  businessName: q.businessName,
                  businessCategory: q.businessCategory,
                  ticketNumber: q.ticketNumber,
                  status: q.status === 'completed' || q.status === 'cancelled' ? q.status : 'completed',
                  completedAt: q.completedAt ?? q.joinedAt,
                }}
              />
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
