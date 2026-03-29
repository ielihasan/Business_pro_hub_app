import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/store/useStore';
import Dialog, { DialogConfig } from '@/components/ui/Dialog';

export default function AccountScreen() {
  const { colors, isDark } = useTheme();
  const { session, clearCache, deleteAccount } = useStore();
  const [dialog, setDialog] = useState<DialogConfig | null>(null);

  const isGoogleUser =
    session?.user?.app_metadata?.provider === 'google' ||
    (session?.user?.identities ?? []).some((id: any) => id.provider === 'google');

  const handleClearCache = () => {
    setDialog({
      title: 'Clear Cache',
      message: 'This will remove cached order history and past queue records. Active data remains safe.',
      icon: 'trash-outline', iconVariant: 'warning',
      actions: [
        { label: 'Cancel', variant: 'secondary', onPress: () => setDialog(null) },
        { label: 'Clear', variant: 'destructive', onPress: () => {
          setDialog(null); clearCache();
          setDialog({ title: 'Done', message: 'Cache cleared successfully.', icon: 'checkmark-circle-outline', iconVariant: 'success', actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }] });
        }},
      ],
    });
  };

  const handleDeleteAccount = () => {
    setDialog({
      title: 'Delete Account',
      message: 'This is permanent. All queues, orders, and data will be erased immediately.',
      icon: 'warning-outline', iconVariant: 'destructive',
      actions: [
        { label: 'Cancel', variant: 'secondary', onPress: () => setDialog(null) },
        { label: 'Delete My Account', variant: 'destructive', onPress: () => {
          setDialog({
            title: 'Final Confirmation',
            message: 'Your account will be deleted right now. This cannot be reversed.',
            icon: 'skull-outline', iconVariant: 'destructive',
            actions: [
              { label: 'Go Back', variant: 'secondary', onPress: () => setDialog(null) },
              { label: 'Yes, Delete Everything', variant: 'destructive', onPress: async () => {
                setDialog(null);
                const r = await deleteAccount();
                if (r.success) router.replace('/(auth)/welcome');
                else setDialog({ title: 'Error', message: r.error ?? 'Could not delete account.', icon: 'alert-circle-outline', iconVariant: 'destructive', actions: [{ label: 'OK', variant: 'primary', onPress: () => setDialog(null) }] });
              }},
            ],
          });
        }},
      ],
    });
  };

  const BG     = colors.background;
  const FG     = colors.foreground;
  const MUTED  = colors.mutedForeground;
  const BORDER = colors.border;
  const CARD   = colors.card;
  const SEC    = colors.secondary;

  const ROWS = [
    ...(!isGoogleUser ? [{
      icon: 'lock-closed-outline', label: 'Change Password', sub: 'Update your account password',
      onPress: () => router.push('/profile/change-password'), destructive: false,
    }] : []),
    { icon: 'trash-bin-outline', label: 'Clear Cache',    sub: 'Free up space by clearing cached data', onPress: handleClearCache,     destructive: false },
    { icon: 'trash-outline',     label: 'Delete Account', sub: 'Permanently remove all your data',       onPress: handleDeleteAccount,   destructive: true  },
  ];

  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: BG }}>
        <View style={[styles.navBar, { borderBottomColor: BORDER }]}>
          <TouchableOpacity style={styles.navBack} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={FG} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: FG }]}>ACCOUNT & SECURITY</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.list, { borderColor: BORDER }]}>
          {ROWS.map((row, idx) => {
            const last = idx === ROWS.length - 1;
            return (
              <TouchableOpacity
                key={row.icon}
                style={[styles.row, { borderBottomColor: BORDER }, !last && styles.rowBorder]}
                onPress={row.onPress}
                activeOpacity={0.75}
              >
                <View style={[styles.rowIcon, { backgroundColor: row.destructive ? colors.destructive + '18' : SEC }]}>
                  <Ionicons name={row.icon as any} size={17} color={row.destructive ? colors.destructive : FG} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={[styles.rowLabel, { color: row.destructive ? colors.destructive : FG }]}>{row.label}</Text>
                  <Text style={[styles.rowSub, { color: MUTED }]}>{row.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={MUTED} />
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 56 }} />
      </ScrollView>

      {dialog && <Dialog visible {...dialog} onDismiss={() => setDialog(null)} />}
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
