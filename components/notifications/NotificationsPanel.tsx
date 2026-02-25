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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useStore, Notification } from '@/store/useStore';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

interface NotificationsPanelProps {
  visible: boolean;
  onClose: () => void;
}

// Icon & color config per notification type
const TYPE_CONFIG: Record<
  Notification['type'],
  { icon: string; color: string; bg: string }
> = {
  queue_update: { icon: 'people-outline',         color: '#3B82F6', bg: '#EFF6FF' },
  order_ready:  { icon: 'bag-check-outline',       color: '#16A34A', bg: '#F0FDF4' },
  loyalty:      { icon: 'star-outline',            color: '#F59E0B', bg: '#FFFBEB' },
  promo:        { icon: 'megaphone-outline',        color: '#8B5CF6', bg: '#F5F3FF' },
};

const TYPE_CONFIG_DARK: Record<
  Notification['type'],
  { icon: string; color: string; bg: string }
> = {
  queue_update: { icon: 'people-outline',         color: '#60A5FA', bg: '#1E3A5F' },
  order_ready:  { icon: 'bag-check-outline',       color: '#4ADE80', bg: '#14532D' },
  loyalty:      { icon: 'star-outline',            color: '#FCD34D', bg: '#451A03' },
  promo:        { icon: 'megaphone-outline',        color: '#A78BFA', bg: '#2E1065' },
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
  isDark,
  onPress,
  onDelete,
}: {
  item: Notification;
  isDark: boolean;
  onPress: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { colors } = useTheme();
  const typeConfig = isDark ? TYPE_CONFIG_DARK[item.type] : TYPE_CONFIG[item.type];

  return (
    <TouchableOpacity
      style={[
        styles.notifItem,
        {
          backgroundColor: item.read ? colors.background : (isDark ? '#1C1C1E' : '#F8FAFF'),
          borderBottomColor: colors.border,
        },
      ]}
      activeOpacity={0.7}
      onPress={() => onPress(item.id)}
    >
      {/* Unread dot */}
      {!item.read && (
        <View style={[styles.unreadDot, { backgroundColor: '#3B82F6' }]} />
      )}

      {/* Icon */}
      <View style={[styles.notifIcon, { backgroundColor: typeConfig.bg }]}>
        <Ionicons name={typeConfig.icon as any} size={22} color={typeConfig.color} />
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
        <Ionicons name="trash-outline" size={17} color={isDark ? '#6B7280' : '#9CA3AF'} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export function NotificationsPanel({ visible, onClose }: NotificationsPanelProps) {
  const { colors, isDark } = useTheme();

  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications, notificationsEnabled } = useStore();

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
      <View style={[styles.emptyIconBg, { backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6' }]}>
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
    <NotificationItem item={item} isDark={isDark} onPress={handleItemPress} onDelete={handleDelete} />
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
            {unreadCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>

          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={[styles.markAllBtn, { backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6' }]}
                onPress={markAllNotificationsRead}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-done-outline" size={16} color={colors.foreground} />
                <Text style={[styles.markAllText, { color: colors.foreground }]}>Mark all read</Text>
              </TouchableOpacity>
            )}
            {notifications.length > 0 && (
              <TouchableOpacity
                style={[styles.markAllBtn, { backgroundColor: isDark ? '#2C1010' : '#FEF2F2' }]}
                onPress={clearAllNotifications}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={[styles.markAllText, { color: '#EF4444' }]}>Clear all</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notification type filter pills */}
        {notifications.length > 0 && (
          <View style={[styles.summaryBar, { borderBottomColor: colors.border, backgroundColor: isDark ? '#111' : '#FAFAFA' }]}>
            {(['queue_update', 'order_ready', 'loyalty', 'promo'] as const).map((type) => {
              const count = notifications.filter((n) => n.type === type).length;
              if (count === 0) return null;
              const cfg = isDark ? TYPE_CONFIG_DARK[type] : TYPE_CONFIG[type];
              const labels: Record<string, string> = {
                queue_update: 'Queue',
                order_ready: 'Orders',
                loyalty: 'Rewards',
                promo: 'Promos',
              };
              return (
                <View key={type} style={[styles.summaryPill, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                  <Text style={[styles.summaryPillText, { color: cfg.color }]}>
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
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
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
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.DEFAULT,
  },
  markAllText: { fontSize: Typography.fontSize.xs, fontWeight: '600' },
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
});
