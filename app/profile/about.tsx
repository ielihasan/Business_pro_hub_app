import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

const APP_VERSION   = '1.0.0';
const BUILD_NUMBER  = '2026.02.25';
const CONTACT_EMAIL = 'support@businesshubpro.app';

const FEATURES = [
  { icon: 'people-outline',           label: 'Virtual Queue Management',   desc: 'Join & track queues remotely — no physical waiting' },
  { icon: 'qr-code-outline',          label: 'QR Code Scanner',            desc: 'Scan a business QR code to instantly join their queue' },
  { icon: 'time-outline',             label: 'Real-Time Wait Updates',     desc: 'Live queue position & estimated wait time notifications' },
  { icon: 'location-outline',         label: 'Nearby Business Discovery',  desc: 'Find open businesses around you with ratings & info' },
  { icon: 'bag-outline',              label: 'Order Tracking',             desc: 'Place orders and track them from preparation to pickup' },
  { icon: 'star-outline',             label: 'Loyalty & Rewards',          desc: 'Earn points on every visit and feedback, redeem rewards' },
  { icon: 'card-outline',             label: 'Multiple Payment Methods',   desc: 'Pay via JazzCash, Easypaisa, or Bank Transfer' },
  { icon: 'notifications-outline',    label: 'Smart Notifications',        desc: 'Get alerted when it is your turn or order is ready' },
  { icon: 'map-outline',              label: 'Interactive Map',            desc: 'View and navigate to businesses on a live map' },
  { icon: 'language-outline',         label: '10 Languages Supported',     desc: 'English, Urdu, Arabic, Hindi, French, and more' },
  { icon: 'moon-outline',             label: 'Dark & Black Themes',        desc: 'System adaptive, dark (#131313), or AMOLED black mode' },
  { icon: 'shield-checkmark-outline', label: 'Secure Authentication',      desc: 'Email verification, OAuth (Google/Apple), encrypted data' },
];

const TECH_STACK = [
  { label: 'Framework',       value: 'React Native 0.81 + Expo SDK 54' },
  { label: 'Language',        value: 'TypeScript 5.9' },
  { label: 'Navigation',      value: 'Expo Router (file-based)' },
  { label: 'State',           value: 'Zustand 4.5 + AsyncStorage' },
  { label: 'Backend',         value: 'Supabase (Auth + PostgreSQL)' },
  { label: 'Maps',            value: 'React Native Maps' },
  { label: 'Animations',      value: 'React Native Reanimated 4' },
  { label: 'Notifications',   value: 'Expo Notifications' },
  { label: 'Camera/QR',       value: 'Expo Camera' },
];

const LINKS = [
  { icon: 'mail-outline',      label: 'Support',          value: CONTACT_EMAIL,                              url: `mailto:${CONTACT_EMAIL}` },
  { icon: 'globe-outline',     label: 'Website',          value: 'businesshubpro.app',                       url: 'https://businesshubpro.app' },
  { icon: 'logo-github',       label: 'GitHub',           value: 'github.com/meeru456',                      url: 'https://github.com/meeru456' },
];

const CHANGELOG = [
  { version: '1.0.0', date: 'Feb 2026', notes: [
    'Initial public release',
    'Virtual queue management with QR scanning',
    'Real-time notifications & order tracking',
    'Loyalty points & rewards system',
    'Multi-language support (10 languages)',
    'Dark mode & accessibility improvements',
  ]},
];

export default function AboutScreen() {
  const { colors } = useTheme();

  const open = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const sectionTitle = (title: string) => (
    <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── App Hero ── */}
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.appIconBg, { backgroundColor: colors.brand }]}>
            <Ionicons name="business" size={36} color={colors.brandForeground} />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>BusinessHub Pro</Text>
          <Text style={[styles.appTagline, { color: colors.mutedForeground }]}>
            Skip the line. Save your time.
          </Text>
          <View style={styles.versionRow}>
            <View style={[styles.versionBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.versionText, { color: colors.mutedForeground }]}>v{APP_VERSION}</Text>
            </View>
            <View style={[styles.versionBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.versionText, { color: colors.mutedForeground }]}>Build {BUILD_NUMBER}</Text>
            </View>
          </View>
        </View>

        {/* ── Mission ── */}
        {sectionTitle('OUR MISSION')}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="rocket-outline" size={24} color={colors.foreground} style={{ marginBottom: Spacing[2] }} />
          <Text style={[styles.missionText, { color: colors.mutedForeground }]}>
            BusinessHub Pro eliminates physical queues by connecting customers with local businesses digitally. We believe your time is valuable — so whether you're waiting at a salon, clinic, restaurant, or repair shop, you should be able to wait from wherever you want and arrive only when it's your turn.
          </Text>
        </View>

        {/* ── Features ── */}
        {sectionTitle('FEATURES')}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {FEATURES.map((f, i) => (
            <View key={i}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <View style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: colors.secondary }]}>
                  <Ionicons name={f.icon as any} size={20} color={colors.foreground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featureLabel, { color: colors.foreground }]}>{f.label}</Text>
                  <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>{f.desc}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ── Tech Stack ── */}
        {sectionTitle('TECH STACK')}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {TECH_STACK.map((t, i) => (
            <View key={i}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <View style={styles.techRow}>
                <Text style={[styles.techLabel, { color: colors.mutedForeground }]}>{t.label}</Text>
                <Text style={[styles.techValue, { color: colors.foreground }]}>{t.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Changelog ── */}
        {sectionTitle("WHAT'S NEW")}
        {CHANGELOG.map((entry) => (
          <View key={entry.version} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.changelogHeader}>
              <Text style={[styles.changelogVersion, { color: colors.foreground }]}>
                Version {entry.version}
              </Text>
              <Text style={[styles.changelogDate, { color: colors.mutedForeground }]}>{entry.date}</Text>
            </View>
            {entry.notes.map((note, i) => (
              <View key={i} style={styles.changelogRow}>
                <Ionicons name="checkmark-circle" size={14} color={colors.foreground} />
                <Text style={[styles.changelogNote, { color: colors.mutedForeground }]}>{note}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* ── Contact & Links ── */}
        {sectionTitle('CONTACT & LINKS')}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {LINKS.map((link, i) => (
            <View key={i}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <TouchableOpacity style={styles.linkRow} onPress={() => open(link.url)} activeOpacity={0.7}>
                <View style={[styles.linkIcon, { backgroundColor: colors.secondary }]}>
                  <Ionicons name={link.icon as any} size={20} color={colors.foreground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.linkLabel, { color: colors.mutedForeground }]}>{link.label}</Text>
                  <Text style={[styles.linkValue, { color: colors.foreground }]}>{link.value}</Text>
                </View>
                <Ionicons name="open-outline" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ── Legal ── */}
        {sectionTitle('LEGAL')}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/profile/terms')} activeOpacity={0.7}>
            <View style={[styles.linkIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="document-text-outline" size={20} color={colors.foreground} />
            </View>
            <Text style={[styles.featureLabel, { color: colors.foreground, flex: 1 }]}>
              Terms of Service & Privacy Policy
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.legalTextRow}>
            <Ionicons name="shield-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.legalText, { color: colors.mutedForeground }]}>
              Your data is protected with AES-256 encryption. We never sell your personal information.
            </Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Made with ❤️ for Pakistan
          </Text>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            © 2026 BusinessHub Pro. All rights reserved.
          </Text>
          <Text style={[styles.footerSub, { color: colors.mutedForeground }]}>
            Built with React Native & Expo
          </Text>
        </View>

        <View style={{ height: Spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700' },

  content: { paddingHorizontal: Spacing[4], paddingTop: Spacing[5] },

  /* hero */
  hero: {
    alignItems: 'center',
    padding: Spacing[6],
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing[5],
  },
  appIconBg: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  appName: { fontSize: Typography.fontSize['2xl'], fontWeight: '800', marginBottom: Spacing[1] },
  appTagline: { fontSize: Typography.fontSize.base, marginBottom: Spacing[3] },
  versionRow: { flexDirection: 'row', gap: Spacing[2] },
  versionBadge: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: 20,
    borderWidth: 1,
  },
  versionText: { fontSize: Typography.fontSize.xs, fontWeight: '600' },

  /* section title */
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing[3],
    marginTop: Spacing[1],
  },

  /* card */
  card: {
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: Spacing[5],
  },

  /* mission */
  missionText: { fontSize: Typography.fontSize.sm, lineHeight: 22, padding: Spacing[4] },

  /* features */
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing[4],
    gap: Spacing[3],
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  featureLabel: { fontSize: Typography.fontSize.sm, fontWeight: '700', marginBottom: 2 },
  featureDesc: { fontSize: Typography.fontSize.xs, lineHeight: 18 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: Spacing[4] },

  /* tech */
  techRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[3],
  },
  techLabel: { fontSize: Typography.fontSize.sm, width: 110, flexShrink: 0 },
  techValue: { fontSize: Typography.fontSize.sm, fontWeight: '600', flex: 1, textAlign: 'right' },

  /* changelog */
  changelogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  changelogVersion: { fontSize: Typography.fontSize.base, fontWeight: '800' },
  changelogDate: { fontSize: Typography.fontSize.xs },
  changelogRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: 4,
  },
  changelogNote: { fontSize: Typography.fontSize.sm, flex: 1, lineHeight: 20 },

  /* links */
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    gap: Spacing[3],
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  linkLabel: { fontSize: Typography.fontSize.xs },
  linkValue: { fontSize: Typography.fontSize.sm, fontWeight: '600' },

  /* legal */
  legalTextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
    padding: Spacing[4],
  },
  legalText: { fontSize: Typography.fontSize.xs, lineHeight: 18, flex: 1 },

  /* footer */
  footer: { alignItems: 'center', gap: Spacing[1], marginTop: Spacing[2] },
  footerText: { fontSize: Typography.fontSize.sm },
  footerSub: { fontSize: Typography.fontSize.xs, marginTop: Spacing[1] },
});
