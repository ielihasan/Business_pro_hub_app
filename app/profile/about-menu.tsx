import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

const ITEMS = [
  { icon: 'document-text-outline',      label: 'Terms & Privacy Policy', sub: 'Read our terms of service and privacy policy', route: '/profile/terms' },
  { icon: 'information-circle-outline', label: 'About BusinessHub Pro',  sub: 'Version, credits, and app information',         route: '/profile/about' },
];

export default function AboutMenuScreen() {
  const { colors, isDark } = useTheme();

  const BG     = colors.background;
  const FG     = colors.foreground;
  const MUTED  = colors.mutedForeground;
  const BORDER = colors.border;
  const SEC    = colors.secondary;

  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: BG }}>
        <View style={[styles.navBar, { borderBottomColor: BORDER }]}>
          <TouchableOpacity style={styles.navBack} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={FG} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: FG }]}>ABOUT</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.list, { borderColor: BORDER }]}>
          {ITEMS.map((item, idx) => {
            const last = idx === ITEMS.length - 1;
            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.row, { borderBottomColor: BORDER }, !last && styles.rowBorder]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.75}
              >
                <View style={[styles.rowIcon, { backgroundColor: SEC }]}>
                  <Ionicons name={item.icon as any} size={17} color={FG} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={[styles.rowLabel, { color: FG }]}>{item.label}</Text>
                  <Text style={[styles.rowSub, { color: MUTED }]}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={MUTED} />
              </TouchableOpacity>
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
