import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/store/useStore';
import { useTranslation } from 'react-i18next';

export default function SettingsScreen() {
  const { colors, isDark, theme } = useTheme();
  const { user } = useStore();
  const { i18n } = useTranslation();

  const themeLabel =
    theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System';
  const langLabel =
    ({ en: 'English', ur: 'Urdu', ar: 'Arabic', hi: 'Hindi', fr: 'French', de: 'German', es: 'Spanish', zh: 'Chinese' } as any)
    [i18n.language?.slice(0, 2)] ?? 'English';

  const BG     = colors.background;
  const FG     = colors.foreground;
  const MUTED  = colors.mutedForeground;
  const BORDER = colors.border;
  const CARD   = colors.card;
  const SEC    = colors.secondary;

  const ITEMS = [
    { icon: 'color-palette-outline',      label: 'Theme',              right: themeLabel, route: '/profile/theme'        },
    { icon: 'language-outline',           label: 'Language',           right: langLabel,  route: '/profile/language'     },
    { icon: 'notifications-outline',      label: 'Notifications',                         route: '/profile/notifications'},
    { icon: 'shield-checkmark-outline',   label: 'Privacy & Location',                    route: '/profile/privacy'      },
    { icon: 'person-circle-outline',      label: 'Account & Security',                    route: '/profile/account'      },
    { icon: 'help-circle-outline',        label: 'Help & Support',                        route: '/profile/support'      },
    { icon: 'information-circle-outline', label: 'About',                                 route: '/profile/about-menu'   },
  ] as const;

  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: BG }}>
        <View style={[styles.navBar, { borderBottomColor: BORDER }]}>
          <TouchableOpacity style={styles.navBack} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={FG} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: FG }]}>SETTINGS</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Identity — read only */}
        {user && (
          <View style={[styles.identity, { backgroundColor: CARD, borderColor: BORDER }]}>
            <View style={[styles.avatar, { backgroundColor: FG }]}>
              <Text style={[styles.avatarText, { color: BG }]}>
                {(user.name?.[0] ?? 'U').toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.identityName, { color: FG }]}>{user.name}</Text>
              <Text style={[styles.identityEmail, { color: MUTED }]}>{user.email}</Text>
            </View>
          </View>
        )}

        {/* Flat setting list */}
        <View style={[styles.list, { borderColor: BORDER }]}>
          {ITEMS.map((item, idx) => {
            const last = idx === ITEMS.length - 1;
            return (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.row,
                  { borderBottomColor: BORDER },
                  !last && styles.rowBorder,
                ]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.75}
              >
                <View style={[styles.rowIcon, { backgroundColor: SEC }]}>
                  <Ionicons name={item.icon as any} size={17} color={FG} />
                </View>
                <Text style={[styles.rowLabel, { color: FG }]}>{item.label}</Text>
                {'right' in item && item.right ? (
                  <Text style={[styles.rowRight, { color: MUTED }]}>{item.right}</Text>
                ) : null}
                <Ionicons name="chevron-forward" size={16} color={MUTED} />
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.version, { color: MUTED }]}>
          BusinessHub Pro · v1.0.0 · Build 2026.02.25
        </Text>
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

  identity:     { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  avatar:       { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarText:   { fontSize: 22, fontWeight: '900' },
  identityName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  identityEmail:{ fontSize: 12 },

  list:      { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth },
  rowIcon:   { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rowLabel:  { flex: 1, fontSize: 14, fontWeight: '600' },
  rowRight:  { fontSize: 12, fontWeight: '500', marginRight: 4 },

  version: { textAlign: 'center', fontSize: 11, marginTop: 24 },
});
