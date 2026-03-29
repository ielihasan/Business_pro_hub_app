import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');

const STEP   = width - 48 + 16;
const CARD_W = STEP - 16;

const FEATURES = [
  { icon: 'qr-code-sharp' as const, label: 'Scan and Join',    desc: 'Point your camera at any QR code and step into the queue instantly.',              n: '01' },
  { icon: 'time'          as const, label: 'Live Wait Times',  desc: 'Watch your position update in real time. Know exactly when to leave.',              n: '02' },
  { icon: 'notifications' as const, label: 'Smart Alerts',     desc: 'We notify you the moment it is your turn. Spend the wait doing something better.',  n: '03' },
  { icon: 'trophy'        as const, label: 'Earn Rewards',     desc: 'Every visit earns loyalty points. Turn your wait into wins.',                       n: '04' },
];

// Dot-grid background decoration
function DotGrid({ color }: { color: string }) {
  return (
    <View style={grid.wrap} pointerEvents="none">
      {Array.from({ length: 7 }).map((_, r) => (
        <View key={r} style={grid.row}>
          {Array.from({ length: 9 }).map((_, c) => (
            <View key={c} style={[grid.dot, { backgroundColor: color }]} />
          ))}
        </View>
      ))}
    </View>
  );
}
const grid = StyleSheet.create({
  wrap: { gap: 14 },
  row:  { flexDirection: 'row', gap: 14 },
  dot:  { width: 2.5, height: 2.5, borderRadius: 1.25, opacity: 0.15 },
});

// Feature card — inverts contrast per theme (dark mode: light card; light mode: dark card)
function FeatureCard({
  item, index, scrollX,
}: {
  item: typeof FEATURES[number];
  index: number;
  scrollX: Animated.Value;
}) {
  const { colors, isDark } = useTheme();
  const inputRange = [(index - 1) * STEP, index * STEP, (index + 1) * STEP];
  const scale   = scrollX.interpolate({ inputRange, outputRange: [0.94, 1, 0.94], extrapolate: 'clamp' });
  const opacity = scrollX.interpolate({ inputRange, outputRange: [0.55, 1, 0.55], extrapolate: 'clamp' });

  // Intentionally inverted: foreground bg with background-colored text for contrast
  const cardBg    = colors.foreground;
  const cardFg    = colors.background;
  const cardMuted = isDark ? '#666666' : '#999999';
  const cardNum   = isDark ? '#888888' : '#777777';

  return (
    <Animated.View style={[card.root, { backgroundColor: cardBg, transform: [{ scale }], opacity }]}>
      <View style={card.top}>
        <Text style={[card.num, { color: cardNum }]}>{item.n} / 04</Text>
        <View style={[card.iconWrap, { backgroundColor: cardFg }]}>
          <Ionicons name={item.icon} size={18} color={cardBg} />
        </View>
      </View>
      <View>
        <Text style={[card.title, { color: cardFg }]}>{item.label}</Text>
        <Text style={[card.desc,  { color: cardMuted }]}>{item.desc}</Text>
      </View>
    </Animated.View>
  );
}
const card = StyleSheet.create({
  root:     { width: CARD_W, borderRadius: 20, padding: 22, minHeight: 160, justifyContent: 'space-between' },
  top:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  num:      { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: 22, fontWeight: '900', letterSpacing: -0.6, marginBottom: 6 },
  desc:     { fontSize: 13, lineHeight: 20 },
});

// Main screen
export default function WelcomeScreen() {
  const { colors, isDark } = useTheme();
  const scrollX = useRef(new Animated.Value(0)).current;

  const heroFade  = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(24)).current;
  const ctaFade   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroFade,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(heroSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(ctaFade, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView edges={['top']} style={[s.root, { backgroundColor: colors.background }]}>
      {/* Brand bar */}
      <View style={s.brandBar}>
        <Text style={[s.wordmark, { color: colors.foreground }]}>BUSINESSHUB PRO</Text>
        <View style={[s.betaBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[s.betaText, { color: colors.mutedForeground }]}>BETA</Text>
        </View>
      </View>

      {/* Hero */}
      <Animated.View style={[s.hero, { opacity: heroFade, transform: [{ translateY: heroSlide }] }]}>
        <View style={s.gridPos}>
          <DotGrid color={colors.foreground} />
        </View>

        <View style={[s.accentLine, { backgroundColor: colors.foreground }]} />

        <Text style={[s.headline, { color: colors.foreground }]}>
          Skip the{'\n'}
          <Text style={s.headlineItalic}>queue.</Text>
        </Text>

        <Text style={[s.subheadline, { color: colors.mutedForeground }]}>
          Pakistan's smartest virtual queue platform. Join, track and get notified from your phone.
        </Text>

        <View style={s.pillRow}>
          {['Real-time', 'QR Scan', 'Notifications', 'Rewards'].map(tag => (
            <View key={tag} style={[s.pill, { borderColor: colors.border }]}>
              <Text style={[s.pillText, { color: colors.mutedForeground }]}>{tag}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Cards carousel */}
      <View style={s.carouselWrap}>
        <Animated.FlatList
          data={FEATURES}
          horizontal
          keyExtractor={(_, i) => String(i)}
          showsHorizontalScrollIndicator={false}
          snapToInterval={STEP}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={s.cardsContainer}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          renderItem={({ item, index }) => (
            <FeatureCard item={item} index={index} scrollX={scrollX} />
          )}
        />

        {/* 4 fixed dots — only color changes based on active card */}
        <View style={s.dotsRow}>
          {FEATURES.map((_, i) => {
            const inputRange = [(i - 1) * STEP, i * STEP, (i + 1) * STEP];
            const bgColor = scrollX.interpolate({
              inputRange,
              outputRange: [colors.border, colors.foreground, colors.border],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[s.dot, { backgroundColor: bgColor }]}
              />
            );
          })}
        </View>
      </View>

      {/* CTAs */}
      <Animated.View style={{ opacity: ctaFade }}>
        <SafeAreaView edges={['bottom']} style={s.ctaSection}>
          <TouchableOpacity
            style={[s.btnPrimary, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.85}
          >
            <Text style={[s.btnPrimaryText, { color: colors.primaryForeground }]}>Create Account</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.btnSecondary}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.7}
          >
            <Text style={[s.btnSecondaryText, { color: colors.mutedForeground }]}>
              Already have an account?{'  '}
              <Text style={[s.btnSecondaryBold, { color: colors.foreground }]}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  brandBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingTop: 6, paddingBottom: 4 },
  wordmark:  { fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  betaBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  betaText:  { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },

  hero: { flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, justifyContent: 'flex-end', overflow: 'hidden' },
  gridPos:    { position: 'absolute', top: 12, right: 16 },
  accentLine: { width: 40, height: 3, borderRadius: 2, marginBottom: 16 },

  headline:       { fontSize: 52, fontWeight: '900', letterSpacing: -2, lineHeight: 56, marginBottom: 14 },
  headlineItalic: { fontStyle: 'italic' },
  subheadline:    { fontSize: 14, lineHeight: 22, marginBottom: 20, maxWidth: '85%' },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:    { borderWidth: 1, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5 },
  pillText:{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  carouselWrap:   { paddingBottom: 4 },
  cardsContainer: { paddingHorizontal: 24, gap: 16 },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14, marginBottom: 4 },
  dot:     { width: 8, height: 8, borderRadius: 4 },

  ctaSection:       { paddingHorizontal: 24, paddingTop: 12 },
  btnPrimary:       { height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  btnPrimaryText:   { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  btnSecondary:     { height: 44, alignItems: 'center', justifyContent: 'center' },
  btnSecondaryText: { fontSize: 13, fontWeight: '500' },
  btnSecondaryBold: { fontWeight: '800' },
});
