import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';

const BUBBLE_DEFS: Array<{ icon: string; color: string; bg: string; top: number; leftRatio: number; size: number }> = [
  { icon: 'qr-code',       color: '#fff', bg: '#6366F1', top: 16,  leftRatio: 0.02,  size: 50 },
  { icon: 'storefront',    color: '#fff', bg: '#0EA5E9', top: 62,  leftRatio: 0.60,  size: 44 },
  { icon: 'time',          color: '#fff', bg: '#10B981', top: 114, leftRatio: 0.04,  size: 40 },
  { icon: 'notifications', color: '#fff', bg: '#F59E0B', top: 90,  leftRatio: 0.40,  size: 36 },
  { icon: 'star',          color: '#fff', bg: '#EC4899', top: 150, leftRatio: 0.66,  size: 42 },
  { icon: 'card',          color: '#fff', bg: '#8B5CF6', top: 154, leftRatio: 0.008, size: 36 },
  { icon: 'people',        color: '#fff', bg: '#14B8A6', top: 34,  leftRatio: 0.36,  size: 42 },
];

const FEATURES = [
  { icon: 'qr-code-outline',       color: '#6366F1', bg: '#EEF2FF', label: 'Scan & Join',     desc: 'Instantly join any queue by scanning a business QR code.' },
  { icon: 'timer-outline',         color: '#10B981', bg: '#F0FDF4', label: 'Live Wait Times', desc: 'Real-time position & accurate wait time estimates.' },
  { icon: 'notifications-outline', color: '#F59E0B', bg: '#FFFBEB', label: 'Smart Alerts',    desc: "Get notified the moment it's your turn." },
  { icon: 'star-outline',          color: '#EC4899', bg: '#FDF2F8', label: 'Earn Rewards',    desc: 'Collect points and unlock exclusive business deals.' },
];

export default function WelcomeScreen() {
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const heroHeight = Math.min(height * 0.43, 340);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} bounces={false}>

        {/* ── Hero ── */}
        <View style={[styles.hero, { backgroundColor: isDark ? '#0F0F1A' : '#F0F1FF', height: heroHeight }]}>
          <View style={[styles.blob1, { backgroundColor: isDark ? '#6366F130' : '#6366F11A' }]} />
          <View style={[styles.blob2, { backgroundColor: isDark ? '#10B98130' : '#10B98115' }]} />

          {BUBBLE_DEFS.map((b, i) => (
            <View
              key={i}
              style={[styles.bubble, { width: b.size, height: b.size, borderRadius: b.size / 2,
                backgroundColor: b.bg, top: b.top, left: b.leftRatio * width, shadowColor: b.bg }]}
            >
              <Ionicons name={b.icon as any} size={b.size * 0.44} color={b.color} />
            </View>
          ))}

          <SafeAreaView edges={['top']} style={styles.heroBottom}>
            <View style={[styles.appPill, { backgroundColor: colors.primary }]}>
              <Ionicons name="grid" size={14} color={colors.primaryForeground} />
              <Text style={[styles.appPillText, { color: colors.primaryForeground }]}>BusinessHub Pro</Text>
            </View>
            <Text style={[styles.heroTitle, { color: isDark ? '#EDEDFF' : '#1A1A3A' }]}>
              Beat the Queue.{"\n"}Not the Clock.
            </Text>
            <Text style={[styles.heroSub, { color: isDark ? '#ABABCC' : '#5C5C8A' }]}>
              Smart queue management — join, track & get rewarded.
            </Text>
          </SafeAreaView>
        </View>

        {/* ── Stats ── */}
        <View style={[styles.statsRow, { backgroundColor: colors.card, borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          {([['50K+','Users'],['1,200+','Businesses'],['4.9★','Rating']] as const).map(([val, lbl], i) => (
            <View key={i} style={[styles.stat, i < 2 && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border }]}>
              <Text style={[styles.statVal, { color: colors.foreground }]}>{val}</Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>{lbl}</Text>
            </View>
          ))}
        </View>

        {/* ── Features ── */}
        <View style={styles.featWrap}>
          <Text style={[styles.secLabel, { color: colors.mutedForeground }]}>EVERYTHING YOU NEED</Text>
          <View style={styles.grid}>
            {FEATURES.map((f, i) => (
              <View key={i} style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.tileIcon, { backgroundColor: isDark ? colors.secondary : f.bg }]}>
                  <Ionicons name={f.icon as any} size={22} color={f.color} />
                </View>
                <Text style={[styles.tileLabel, { color: colors.foreground }]}>{f.label}</Text>
                <Text style={[styles.tileDesc, { color: colors.mutedForeground }]}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── CTA ── */}
        <View style={styles.ctaWrap}>
          <TouchableOpacity
            style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.85}
          >
            <Text style={[styles.btnPrimaryTxt, { color: colors.primaryForeground }]}>Get Started — It's Free</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnSecondary, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.7}
          >
            <Text style={[styles.btnSecondaryTxt, { color: colors.foreground }]}>I already have an account</Text>
          </TouchableOpacity>

          <Text style={[styles.legal, { color: colors.mutedForeground }]}>
            By continuing, you agree to our{' '}
            <Text style={{ fontWeight: '600' }}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={{ fontWeight: '600' }}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { flexGrow: 1 },

  hero: { overflow: 'hidden', position: 'relative' },
  blob1: { position: 'absolute', width: 260, height: 260, borderRadius: 130, top: -80, left: -60 },
  blob2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, bottom: -40, right: -40 },
  bubble: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },
  heroBottom: { position: 'absolute', bottom: 22, left: 22, right: 22 },
  appPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, marginBottom: 10,
  },
  appPillText: { fontSize: 12, fontWeight: '700' },
  heroTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6, lineHeight: 34, marginBottom: 7 },
  heroSub:   { fontSize: 13, lineHeight: 19 },

  statsRow: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  stat:     { flex: 1, alignItems: 'center', paddingVertical: 13 },
  statVal:  { fontSize: 17, fontWeight: '800' },
  statLbl:  { fontSize: 11, marginTop: 1 },

  featWrap: { paddingHorizontal: Spacing[4], paddingTop: Spacing[5] },
  secLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 12, paddingLeft: 2 },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    flex: 1,
    minWidth: 140,
    borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
    padding: 16, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  tileIcon:  { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  tileLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  tileDesc:  { fontSize: 12, lineHeight: 17 },

  ctaWrap: { paddingHorizontal: Spacing[4], paddingTop: Spacing[5], paddingBottom: Spacing[8], gap: 12 },
  btnPrimary: {
    height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
  btnPrimaryTxt:   { fontSize: 16, fontWeight: '700' },
  btnSecondary:    { height: 54, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  btnSecondaryTxt: { fontSize: 15, fontWeight: '600' },
  legal:           { fontSize: 11, textAlign: 'center', lineHeight: 16 },
});
