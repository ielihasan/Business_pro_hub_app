import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Platform, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useStore } from '@/store/useStore';

type IconName = keyof typeof Ionicons.glyphMap;

const ACCENT = '#6366F1';
const { width } = Dimensions.get('window');

const TAB_ICONS: Record<string, { focused: IconName; outline: IconName }> = {
  queue:   { focused: 'list',    outline: 'list-outline' },
  map:     { focused: 'map',     outline: 'map-outline' },
  index:   { focused: 'home',    outline: 'home-outline' },
  orders:  { focused: 'receipt', outline: 'receipt-outline' },
  profile: { focused: 'person',  outline: 'person-outline' },
};

const TAB_LABELS: Record<string, string> = {
  queue:   'Queue',
  map:     'Map',
  index:   'Home',
  orders:  'Orders',
  profile: 'Profile',
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();

  const bgColor     = isDark ? '#16163A' : '#FFFFFF';
  const shadowColor = isDark ? '#000000' : '#6366F1';

  return (
    <View style={[styles.wrapper, { paddingBottom: Platform.OS === 'ios' ? 26 : 10 }]}>
      {/* Floating pill bar */}
      <View style={[styles.bar, { backgroundColor: bgColor, shadowColor }]}>
        {state.routes.map((route, index) => {
          const icons = TAB_ICONS[route.name];
          if (!icons) return null; // skip hidden tabs (scan)

          const focused = state.index === index;
          const isHome  = route.name === 'index';
          const label   = TAB_LABELS[route.name] ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          /* ── Center Home button ── */
          if (isHome) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.centerWrapper}
                activeOpacity={0.85}
              >
                {/* Outer glow ring */}
                <View style={[
                  styles.homeRing,
                  { borderColor: focused ? ACCENT + '55' : 'transparent' },
                ]}>
                  <View style={[styles.homeCircle, { shadowColor: ACCENT }]}>
                    <Ionicons name={icons.focused} size={26} color="#FFF" />
                  </View>
                </View>
                <Text style={[styles.homeLabel, { color: ACCENT }]}>{label}</Text>
              </TouchableOpacity>
            );
          }

          /* ── Regular tab ── */
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              {/* Pill bubble behind icon when active */}
              <View style={[
                styles.iconBubble,
                focused && { backgroundColor: ACCENT + '1A' },
              ]}>
                <Ionicons
                  name={focused ? icons.focused : icons.outline}
                  size={22}
                  color={focused ? ACCENT : colors.mutedForeground}
                />
                {/* Active dot */}
                {focused && <View style={styles.activeDot} />}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { color: focused ? ACCENT : colors.mutedForeground },
                  focused && styles.tabLabelActive,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const BAR_HEIGHT = 62;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bar: {
    flexDirection: 'row',
    width: '100%',
    height: BAR_HEIGHT,
    borderRadius: 32,
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: BAR_HEIGHT,
    gap: 2,
  },
  iconBubble: {
    width: 44,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACCENT,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
  /* Center home */
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: BAR_HEIGHT,
    gap: 2,
  },
  homeRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    marginTop: -28, // lifts the circle above the bar
  },
  homeCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 12,
  },
  homeLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
});

export default function TabLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/welcome');
    }
  }, [isAuthenticated, isLoading]);

  if (!isLoading && !isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Leave extra room at the bottom so content isn't hidden under the floating bar
        sceneStyle: { paddingBottom: Platform.OS === 'ios' ? 110 : 90 },
      }}
    >
      <Tabs.Screen name="queue"   options={{ title: t('tabs.queue') }} />
      <Tabs.Screen name="map"     options={{ title: t('tabs.map') }} />
      <Tabs.Screen name="index"   options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="orders"  options={{ title: t('tabs.orders') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
      <Tabs.Screen name="scan"    options={{ title: t('tabs.scan'), href: null }} />
    </Tabs>
  );
}

