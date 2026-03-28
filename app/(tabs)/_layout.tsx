import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
  const { isDark }  = useTheme();
  const insets      = useSafeAreaInsets();
  const bottomInset = insets.bottom;

  const BAR_BG     = isDark ? 'rgba(10,10,10,0.96)'      : 'rgba(255,255,255,0.96)';
  const BORDER_CLR = isDark ? 'rgba(255,255,255,0.12)'   : 'rgba(0,0,0,0.10)';
  const ACTIVE_CLR = isDark ? '#ffffff'                  : '#000000';
  const MUTED_CLR  = isDark ? 'rgba(255,255,255,0.32)'   : 'rgba(0,0,0,0.25)';
  const CENTER_BG  = isDark ? '#ffffff'                  : '#000000';
  const CENTER_ICO = isDark ? '#000000'                  : '#ffffff';
  const RING_CLR   = isDark ? 'rgba(255,255,255,0.15)'   : 'rgba(0,0,0,0.10)';

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
                <View style={[styles.centerRing, { borderColor: RING_CLR, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                  <View style={[styles.centerCircle, { backgroundColor: CENTER_BG }]}>
                    <Ionicons name={focused ? cfg.filled : cfg.outline} size={24} color={CENTER_ICO} />
                  </View>
                </View>
                <Text style={[styles.centerLabel, { color: focused ? ACTIVE_CLR : MUTED_CLR }]}>
                  {cfg.label}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={styles.tab} activeOpacity={0.65}>
              <Ionicons
                name={focused ? cfg.filled : cfg.outline}
                size={21}
                color={focused ? ACTIVE_CLR : MUTED_CLR}
              />
              <Text style={[styles.tabLabel, { color: focused ? ACTIVE_CLR : MUTED_CLR }, focused && styles.tabLabelActive]}>
                {cfg.label}
              </Text>
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
  tabLabel:       { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  tabLabelActive: { fontWeight: '800' },

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
