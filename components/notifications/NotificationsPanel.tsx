import React, { useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useStore, Notification } from '@/store/useStore';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { COMMITMENT_RATE } from '@/lib/wallet';

interface NotificationsPanelProps {
  visible: boolean;
  onClose: () => void;
}

const TYPE_ICONS: Record<Notification['type'], string> = {
  queue_update: 'people-outline',
  order_ready:  'bag-check-outline',
  loyalty:      'star-outline',
  promo:        'megaphone-outline',
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (mins  <  1)  return 'Just now';
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  <  7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function NotificationItem({
  item,
  onPress,
  onDelete,
}: {
  item: Notification;
  onPress: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.notifItem,
        {
          backgroundColor: item.read ? colors.background : colors.card,
          borderBottomColor: colors.border,
        },
      ]}
      activeOpacity={0.7}
      onPress={() => onPress(item.id)}
    >
      {/* Unread dot */}
      {!item.read && (
        <View style={[styles.unreadDot, { backgroundColor: colors.brand }]} />
      )}

      {/* Icon */}
      <View style={[styles.notifIcon, { backgroundColor: colors.brand + '20' }]}>
        <Ionicons name={TYPE_ICONS[item.type] as any} size={22} color={colors.brand} />
      </View>

      {/* Content */}
      <View style={styles.notifContent}>
        <Text
          style={[
            styles.notifTitle,
            {
              color: colors.foreground,
              fontWeight: item.read ? '400' : '700',
            },
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          style={[styles.notifMessage, { color: colors.mutedForeground }]}
          numberOfLines={2}
        >
          {item.message}
        </Text>
        <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
          {formatRelativeTime(item.createdAt)}
        </Text>
      </View>

      {/* Delete button */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(item.id)}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={17} color={colors.mutedForeground} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Pinned action card shown when no payment method is set up ─────────────────
function SetupActionCard({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme();
  const advancePct = Math.round(COMMITMENT_RATE * 100);

  return (
    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.destructive + '60' }]}
      activeOpacity={0.85}
      onPress={() => { onClose(); router.push('/profile/payment'); }}
    >
      {/* Red urgency strip on left */}
      <View style={[styles.actionStrip, { backgroundColor: colors.destructive }]} />

      <View style={[styles.actionIconBox, { backgroundColor: colors.destructive + '18' }]}>
        <Ionicons name="wallet-outline" size={22} color={colors.destructive} />
      </View>

      <View style={styles.actionBody}>
        <View style={styles.actionTitleRow}>
          <View style={[styles.actionUrgentBadge, { backgroundColor: colors.destructive }]}>
            <Text style={styles.actionUrgentText}>ACTION REQUIRED</Text>
          </View>
        </View>
        <Text style={[styles.actionTitle, { color: colors.foreground }]}>
          Set up a payment method
        </Text>
        <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>
          A {advancePct}% wallet advance is required to join any priced queue. Add EasyPaisa, JazzCash, or a bank account to get started.
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

export function NotificationsPanel({ visible, onClose }: NotificationsPanelProps) {
  const { colors } = useTheme();

  const { notifications, unreadCount, paymentMethods, markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications, notificationsEnabled } = useStore();
  const needsPaymentSetup = paymentMethods.length === 0;

  const handleItemPress = useCallback(
    (id: string) => {
      markNotificationRead(id);
    },
    [markNotificationRead]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteNotification(id);
    },
    [deleteNotification]
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconBg, { backgroundColor: colors.secondary }]}>
        <Ionicons name="notifications-off-outline" size={48} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Notifications</Text>
      <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
        {notificationsEnabled
          ? "You're all caught up! Queue updates, order alerts, and rewards will appear here."
          : 'Enable notifications in Settings to receive queue updates and alerts.'}
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: Notification }) => (
    <NotificationItem item={item} onPress={handleItemPress} onDelete={handleDelete} />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Notifications</Text>
            {(unreadCount + (needsPaymentSetup ? 1 : 0)) > 0 && (
              <View style={[styles.headerBadge, { backgroundColor: colors.brand }]}>
                <Text style={[styles.headerBadgeText, { color: '#fff' }]}>
                  {(unreadCount + (needsPaymentSetup ? 1 : 0)) > 99 ? '99+' : (unreadCount + (needsPaymentSetup ? 1 : 0))}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
                onPress={markAllNotificationsRead}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-done-outline" size={18} color={colors.brand} />
              </TouchableOpacity>
            )}
            {notifications.length > 0 && (
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
                onPress={clearAllNotifications}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color={colors.destructive} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notification type filter pills */}
        {notifications.length > 0 && (
          <View style={[styles.summaryBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
            {(['queue_update', 'order_ready', 'loyalty', 'promo'] as const).map((type) => {
              const count = notifications.filter((n) => n.type === type).length;
              if (count === 0) return null;
              const labels: Record<string, string> = {
                queue_update: 'Queue',
                order_ready: 'Orders',
                loyalty: 'Rewards',
                promo: 'Promos',
              };
              return (
                <View key={type} style={[styles.summaryPill, { backgroundColor: colors.brand + '20' }]}>
                  <Ionicons name={TYPE_ICONS[type] as any} size={12} color={colors.brand} />
                  <Text style={[styles.summaryPillText, { color: colors.brand }]}>
                    {labels[type]} {count}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Notification list */}
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={needsPaymentSetup ? <SetupActionCard onClose={onClose} /> : null}
          ListEmptyComponent={needsPaymentSetup ? null : renderEmpty}
          contentContainerStyle={notifications.length === 0 && !needsPaymentSetup ? styles.emptyList : undefined}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => null}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  headerTitle: { fontSize: Typography.fontSize['2xl'], fontWeight: '700' },
  headerBadge: {
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBadgeText: { fontSize: 12, fontWeight: '700' },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtn: { padding: Spacing[1] },

  summaryBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: 20,
  },
  summaryPillText: { fontSize: 11, fontWeight: '600' },

  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    left: Spacing[2],
    top: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notifIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
    flexShrink: 0,
  },
  notifContent: { flex: 1, paddingRight: Spacing[2] },
  notifTitle: { fontSize: Typography.fontSize.base, marginBottom: 2, lineHeight: 20 },
  notifMessage: { fontSize: Typography.fontSize.sm, lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: Typography.fontSize.xs },
  deleteBtn: {
    alignSelf: 'center',
    padding: Spacing[1],
    marginLeft: Spacing[1],
    flexShrink: 0,
  },

  emptyList: { flex: 1, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', paddingHorizontal: Spacing[8], paddingVertical: Spacing[10] },
  emptyIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[5],
  },
  emptyTitle: { fontSize: Typography.fontSize.xl, fontWeight: '700', marginBottom: Spacing[2], textAlign: 'center' },
  emptyDesc: { fontSize: Typography.fontSize.sm, textAlign: 'center', lineHeight: 20 },

  // ── Action card ──
  actionCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing[4], marginVertical: Spacing[3],
    borderRadius: 16, borderWidth: 1.5,
    overflow: 'hidden', paddingRight: 14, paddingVertical: 14,
    gap: 12,
  },
  actionStrip:      { width: 4, alignSelf: 'stretch', flexShrink: 0 },
  actionIconBox:    {
    width: 46, height: 46, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  actionBody:       { flex: 1, gap: 4 },
  actionTitleRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionUrgentBadge: {
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  actionUrgentText: { fontSize: 8, fontWeight: '900', color: '#fff', letterSpacing: 0.8 },
  actionTitle:      { fontSize: 14, fontWeight: '800', lineHeight: 20 },
  actionSub:        { fontSize: 12, lineHeight: 17 },
});
