import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/store/useStore';

const ROWS = [
  { id: 'notifications',  icon: 'notifications-outline',    label: 'Push Notifications',   sub: 'Master switch for all alerts'            },
  { id: 'queue-notif',    icon: 'people-outline',           label: 'Queue Updates',         sub: 'Position changes and turn alerts'        },
  { id: 'order-notif',    icon: 'bag-outline',              label: 'Order Alerts',          sub: 'Order ready and status changes'          },
  { id: 'promo-notif',    icon: 'pricetag-outline',         label: 'Promotions & Offers',   sub: 'Deals from nearby businesses'            },
  { id: 'sound',          icon: 'volume-high-outline',      label: 'Sound',                 sub: 'Play sound with alerts'                  },
  { id: 'vibration',      icon: 'phone-portrait-outline',   label: 'Vibration',             sub: 'Vibrate on notification'                 },
];

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const {
    notificationsEnabled,      toggleNotifications,
    soundEnabled,              toggleSound,
    vibrationEnabled,          toggleVibration,
    queueNotificationsEnabled, toggleQueueNotifications,
    orderNotificationsEnabled, toggleOrderNotifications,
    promoNotificationsEnabled, togglePromoNotifications,
  } = useStore();

  const values: Record<string, boolean> = {
    notifications: notificationsEnabled,
    'queue-notif':  queueNotificationsEnabled,
    'order-notif':  orderNotificationsEnabled,
    'promo-notif':  promoNotificationsEnabled,
    sound:          soundEnabled,
    vibration:      vibrationEnabled,
  };
  const handlers: Record<string, () => void> = {
    notifications: toggleNotifications,
    'queue-notif':  toggleQueueNotifications,
    'order-notif':  toggleOrderNotifications,
    'promo-notif':  togglePromoNotifications,
    sound:          toggleSound,
    vibration:      toggleVibration,
  };

  const BG     = colors.background;
  const FG     = colors.foreground;
  const MUTED  = colors.mutedForeground;
  const BORDER = colors.border;
  const CARD   = colors.card;
  const SEC    = colors.secondary;

  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: BG }}>
        <View style={[styles.navBar, { borderBottomColor: BORDER }]}>
          <TouchableOpacity style={styles.navBack} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={FG} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: FG }]}>NOTIFICATIONS</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.list, { borderColor: BORDER }]}>
          {ROWS.map((row, idx) => {
            const last = idx === ROWS.length - 1;
            const val  = values[row.id];
            return (
              <View
                key={row.id}
                style={[
                  styles.row,
                  { borderBottomColor: BORDER },
                  !last && styles.rowBorder,
                ]}
              >
                <View style={[styles.rowIcon, { backgroundColor: SEC }]}>
                  <Ionicons name={row.icon as any} size={17} color={FG} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={[styles.rowLabel, { color: FG }]}>{row.label}</Text>
                  <Text style={[styles.rowSub, { color: MUTED }]}>{row.sub}</Text>
                </View>
                <Switch
                  value={val}
                  onValueChange={handlers[row.id]}
                  trackColor={{ false: BORDER, true: FG }}
                  thumbColor={Platform.OS === 'android' ? (val ? BG : '#f0f0f0') : undefined}
                />
              </View>
            );
          })}
        </View>
        <View style={{ height: 56 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  navBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: 1 },
  navBack:  { width: 36, height: 36, justifyContent: 'center' },
  navTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  list:     { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder:{ borderBottomWidth: StyleSheet.hairlineWidth },
  rowIcon:  { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rowBody:  { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '600' },
  rowSub:   { fontSize: 11, marginTop: 2 },
});
