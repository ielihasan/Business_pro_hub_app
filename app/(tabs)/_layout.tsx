import { Tabs } from 'expo-router';
import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Platform, Animated, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useStore } from '@/store/useStore';

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_CONFIG: Record<string, { filled: IconName; outline: IconName; label: string }> = {
  queue:   { filled: 'hourglass',  outline: 'hourglass-outline', label: 'Queue'   },
  map:     { filled: 'search',      outline: 'search-outline',    label: 'Discover'},
  index:   { filled: 'home',        outline: 'home-outline',      label: 'Home'    },
  orders:  { filled: 'receipt',    outline: 'receipt-outline',   label: 'Orders'  },
  profile: { filled: 'person',     outline: 'person-outline',    label: 'Profile' },
};

const BAR_H = 64;

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets      = useSafeAreaInsets();
  const bottomInset = insets.bottom;

  const unreadCount    = useStore((s) => s.unreadCount);
  const paymentMethods = useStore((s) => s.paymentMethods);
  const totalBadge     = unreadCount + (paymentMethods.length === 0 ? 1 : 0);

  const BAR_BG     = isDark
    ? colors.background + 'f5'   // slight transparency
    : colors.background + 'f5';
  const BORDER_CLR = colors.border;
  const ACTIVE_CLR = colors.foreground;
  const MUTED_CLR  = colors.mutedForeground;
  const CENTER_BG  = colors.foreground;
  const CENTER_ICO = colors.background;
  const RING_CLR   = colors.border;

  // ── Tab animations ───────────────────────────────────────────────────
  const scaleAnims = useRef(state.routes.map(() => new Animated.Value(1))).current;
  const dotAnims   = useRef(
    state.routes.map((_, i) => new Animated.Value(i === state.index ? 1 : 0)),
  ).current;
  const prevIndexRef = useRef(state.index);

  useEffect(() => {
    const prev = prevIndexRef.current;
    if (prev === state.index) return;
    prevIndexRef.current = state.index;

    // Fade the old indicator out, fade the new one in
    Animated.timing(dotAnims[prev], {
      toValue: 0, duration: 200, useNativeDriver: true,
    }).start();
    Animated.timing(dotAnims[state.index], {
      toValue: 1, duration: 240, useNativeDriver: true,
    }).start();

    // Bounce the newly active tab icon
    Animated.sequence([
      Animated.timing(scaleAnims[state.index], {
        toValue: 0.78, duration: 75, useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[state.index], {
        toValue: 1, friction: 4, tension: 200, useNativeDriver: true,
      }),
    ]).start();
  }, [state.index]);

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomInset }]}>
      <View style={[styles.bar, { backgroundColor: BAR_BG, borderTopColor: BORDER_CLR, height: BAR_H + (bottomInset > 0 ? 0 : 4) }]}>
        {state.routes.map((route, index) => {
          const cfg = TAB_CONFIG[route.name];
          if (!cfg) return null;

          const focused  = state.index === index;
          const isCenter = route.name === 'index';

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          if (isCenter) {
            return (
              <TouchableOpacity key={route.key} onPress={onPress} style={styles.centerWrap} activeOpacity={0.82}>
                {/* Outer ring */}
                <View style={[styles.centerRing, { borderColor: RING_CLR, backgroundColor: colors.secondary }]}>
                  <Animated.View style={[styles.centerCircle, { backgroundColor: CENTER_BG, transform: [{ scale: scaleAnims[index] }] }]}>
                    <Ionicons name={focused ? cfg.filled : cfg.outline} size={24} color={CENTER_ICO} />
                  </Animated.View>
                </View>
                <Text style={[styles.centerLabel, { color: focused ? ACTIVE_CLR : MUTED_CLR }]}>
                  {cfg.label}
                </Text>
              </TouchableOpacity>
            );
          }

          const showBadge = route.name === 'profile' && totalBadge > 0;

          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={styles.tab} activeOpacity={0.65}>
              <View style={styles.iconWrap}>
                <Animated.View style={{ transform: [{ scale: scaleAnims[index] }] }}>
                  <Ionicons
                    name={focused ? cfg.filled : cfg.outline}
                    size={21}
                    color={focused ? ACTIVE_CLR : MUTED_CLR}
                  />
                </Animated.View>
                {showBadge && (
                  <View style={[styles.tabBadge, { backgroundColor: colors.destructive }]}>
                    <Text style={styles.tabBadgeText}>{totalBadge > 9 ? '9+' : totalBadge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, { color: focused ? ACTIVE_CLR : MUTED_CLR }, focused && styles.tabLabelActive]}>
                {cfg.label}
              </Text>
              {/* Focus indicator pill — always rendered to avoid layout shift */}
              <Animated.View
                style={[styles.tabIndicator, { backgroundColor: ACTIVE_CLR, opacity: dotAnims[index] }]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'visible',
  },

  tab: {
    flex: 1, alignItems: 'center', justifyContent: 'flex-end',
    gap: 3, paddingBottom: 2,
  },
  iconWrap: { position: 'relative' },
  tabBadge: {
    position: 'absolute', top: -5, right: -8,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: { fontSize: 9, fontWeight: '900', color: '#fff' },
  tabLabel:       { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  tabLabelActive: { fontWeight: '800' },
  tabIndicator: {
    width: 18, height: 3, borderRadius: 1.5,
    marginTop: 2,
  },

  centerWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'flex-end',
    gap: 4, paddingBottom: 2,
  },
  centerRing: {
    width: 66, height: 66, borderRadius: 33,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    marginTop: -34,
  },
  centerCircle: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  centerLabel: {
    fontSize: 9, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
});

export default function TabLayout() {
  const { t }      = useTranslation();
  const insets     = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isAuthenticated, isLoading } = useStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/welcome');
    }
  }, [isAuthenticated, isLoading]);


  if (!isLoading && !isAuthenticated) return null;

  // Scene bottom padding = bar height + bottom safe inset + buffer for floating button ring
  const BOTTOM_PAD = BAR_H + insets.bottom + 24;

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      backBehavior="history"
      screenOptions={{ headerShown: false, sceneStyle: { paddingBottom: BOTTOM_PAD, backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="queue"   options={{ title: t('tabs.queue')   }} />
      <Tabs.Screen name="map"     options={{ title: t('tabs.map')     }} />
      <Tabs.Screen name="index"   options={{ title: t('tabs.home')    }} />
      <Tabs.Screen name="orders"  options={{ title: t('tabs.orders')  }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
      <Tabs.Screen name="scan"    options={{ title: t('tabs.scan'), href: null }} />
    </Tabs>
  );
}
