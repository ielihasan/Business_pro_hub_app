import { useState, useEffect } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useScreenEntrance } from '@/hooks/useScreenEntrance';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { ActiveQueueItem, PastQueueItem, QueueEmptyState } from '@/components/queue';
import { useStore } from '@/store/useStore';
import Dialog, { DialogConfig } from '@/components/ui/Dialog';

export default function QueueScreen() {
  const { colors, isDark }    = useTheme();
  const { entranceStyle }     = useScreenEntrance();
  const { t }              = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState<'active' | 'history'>('active');
  const [dialog,     setDialog]     = useState<DialogConfig | null>(null);

  const activeQueues           = useStore((s) => s.activeQueues);
  const queueHistory           = useStore((s) => s.queueHistory);
  const leaveQueueInSupabase   = useStore((s) => s.leaveQueueInSupabase);
  const syncQueuesFromSupabase = useStore((s) => s.syncQueuesFromSupabase);
  const isAuthenticated        = useStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) syncQueuesFromSupabase();
  }, [isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await syncQueuesFromSupabase();
    setRefreshing(false);
  };

  const handleLeaveQueue = (queueId: string) => {
    setDialog({
      title: t('queue.leave_modal.title'),
      message: t('queue.leave_modal.message'),
      icon: 'exit-outline',
      iconVariant: 'destructive',
      actions: [
        { label: t('common.cancel'), variant: 'secondary', onPress: () => setDialog(null) },
        {
          label: t('queue.leave_modal.confirm_action'),
          variant: 'destructive',
          onPress: async () => {
            setDialog(null);
            const result = await leaveQueueInSupabase(queueId);
            if (!result.success) {
              setDialog({
                title: 'Error',
                message: result.error ?? 'Failed to leave queue.',
                icon: 'alert-circle-outline',
                iconVariant: 'destructive',
                actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }],
              });
            }
          },
        },
      ],
    });
  };

  const BG     = colors.background;
  const FG     = colors.foreground;
  const MUTED  = colors.mutedForeground;
  const BORDER = colors.border;

  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.View style={[{ flex: 1 }, entranceStyle]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: BG }}>
        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.screenLabel, { color: MUTED }]}>ACTIVITY</Text>
            <Text style={[styles.screenTitle, { color: FG }]}>MY QUEUES</Text>
          </View>
          <View style={[styles.countPill, { backgroundColor: colors.card, borderColor: BORDER }]}>
            <Text style={[styles.countText, { color: FG }]}>{activeQueues.length}</Text>
            <Text style={[styles.countLabel, { color: MUTED }]}> ACTIVE</Text>
          </View>
        </View>

        {/* ── Tab Switcher ── */}
        <View style={[styles.tabRow, { borderBottomColor: BORDER }]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'active' && [styles.tabBtnActive, { borderBottomColor: FG }]]}
            onPress={() => setActiveTab('active')}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabBtnText, { color: activeTab === 'active' ? FG : MUTED }]}>
              {t('queue.tabs.active').toUpperCase()}
            </Text>
            {activeQueues.length > 0 && activeTab !== 'active' && (
              <View style={[styles.tabDot, { backgroundColor: FG }]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'history' && [styles.tabBtnActive, { borderBottomColor: FG }]]}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabBtnText, { color: activeTab === 'history' ? FG : MUTED }]}>
              {t('queue.tabs.history').toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── Content ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={FG}
            colors={[FG]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'active' ? (
          activeQueues.length > 0 ? (
            <View style={styles.list}>
              {activeQueues.map((q) => (
                <TouchableOpacity key={q.id} onPress={() => router.push(`/queue/${q.id}`)} activeOpacity={0.85}>
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

        <View style={{ height: 96 }} />
      </ScrollView>

      {dialog && <Dialog visible {...dialog} onDismiss={() => setDialog(null)} />}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  /* ── Top bar ── */
  topBar: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16,
  },
  screenLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  screenTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },

  countPill: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  countText:  { fontSize: 14, fontWeight: '900' },
  countLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },

  /* ── Tab switcher ── */
  tabRow: {
    flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 24, gap: 24,
  },
  tabBtn: {
    paddingBottom: 12, borderBottomWidth: 2,
    borderBottomColor: 'transparent', flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  tabBtnActive:  {},
  tabBtnText:    { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  tabDot:        { width: 5, height: 5, borderRadius: 3 },

  /* ── Scroll content ── */
  scrollContent: { paddingTop: 20, paddingHorizontal: 16, paddingBottom: 16 },
  list:          { gap: 12 },
});
