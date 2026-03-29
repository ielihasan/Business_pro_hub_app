import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/store/useStore';

const OPTIONS: Array<{
  value: 'light' | 'dark' | 'black' | null;
  label: string;
  subtitle: string;
  icon: string;
}> = [
  { value: null,    label: 'System Default', subtitle: 'Follows your device light/dark setting', icon: 'phone-portrait-outline' },
  { value: 'dark',  label: 'Dark',           subtitle: 'Dark grey surfaces, easier on the eyes', icon: 'moon-outline' },
  { value: 'black', label: 'Black (AMOLED)', subtitle: 'Pure black — saves battery on OLED screens', icon: 'ellipse' },
];

export default function ThemeScreen() {
  const { colors, isDark, theme } = useTheme();
  const { setTheme } = useStore();

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
          <Text style={[styles.navTitle, { color: FG }]}>THEME</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <Text style={[styles.hint, { color: MUTED }]}>Select how BusinessHub Pro looks on your device.</Text>

        <View style={styles.list}>
          {OPTIONS.map((opt, idx) => {
            const active = theme === opt.value;
            const last   = idx === OPTIONS.length - 1;
            return (
              <TouchableOpacity
                key={String(opt.value)}
                style={[
                  styles.row,
                  { backgroundColor: active ? CARD : 'transparent', borderColor: active ? FG : BORDER },
                  !last && { marginBottom: 10 },
                ]}
                onPress={() => { setTheme(opt.value); router.back(); }}
                activeOpacity={0.8}
              >
                <View style={[styles.iconWrap, { backgroundColor: active ? FG : SEC }]}>
                  <Ionicons name={opt.icon as any} size={20} color={active ? BG : MUTED} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: FG, fontWeight: active ? '800' : '600' }]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.rowSub, { color: MUTED }]}>{opt.subtitle}</Text>
                </View>
                <View style={[
                  styles.radio,
                  { borderColor: active ? FG : BORDER },
                ]}>
                  {active && <View style={[styles.radioDot, { backgroundColor: FG }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1 },
  navBar:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: 1 },
  navBack: { width: 36, height: 36, justifyContent: 'center' },
  navTitle:{ fontSize: 13, fontWeight: '900', letterSpacing: 2 },

  content: { padding: 24 },
  hint:    { fontSize: 13, lineHeight: 20, marginBottom: 24 },
  list:    { gap: 0 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1.5, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 16,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  rowText:  { flex: 1 },
  rowLabel: { fontSize: 15, marginBottom: 3 },
  rowSub:   { fontSize: 12, lineHeight: 17 },
  radio:    { width: 20, height: 20, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
});
