import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Typography } from '@/constants/theme';
import { View, StyleSheet, Platform } from 'react-native';
<<<<<<< HEAD
import { useTranslation } from 'react-i18next';
=======
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5

type IconName = keyof typeof Ionicons.glyphMap;

export default function TabLayout() {
  const { colors, isDark } = useTheme();
<<<<<<< HEAD
  const { t } = useTranslation();
=======
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarLabelStyle: {
          fontSize: Typography.fontSize.xs,
          fontWeight: Typography.fontWeight.medium,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: Typography.fontWeight.semibold,
          fontSize: Typography.fontSize.lg,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
<<<<<<< HEAD
          title: t('tabs.home'),
=======
          title: 'Home',
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
          headerTitle: 'BusinessHub Pro',
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
<<<<<<< HEAD
          title: t('tabs.queue'),
=======
          title: 'My Queue',
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'list' : 'list-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
<<<<<<< HEAD
          title: t('tabs.scan'),
=======
          title: 'Scan',
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.scanButton, { backgroundColor: colors.primary }]}>
              <Ionicons name="qr-code" size={28} color={colors.primaryForeground} />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
<<<<<<< HEAD
          title: t('tabs.orders'),
=======
          title: 'Orders',
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'receipt' : 'receipt-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
<<<<<<< HEAD
          title: t('tabs.profile'),
=======
          title: 'Profile',
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scanButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
