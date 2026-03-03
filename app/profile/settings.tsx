import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/store/useStore';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { LanguageSelectorModal } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

// ─── Types ────────────────────────────────────────────────────────────────────

type RowType = 'toggle' | 'link' | 'action' | 'value';

interface SettingRow {
  id: string;
  icon: string;
  iconBg: string;
  label: string;
  description?: string;
  type: RowType;
  value?: boolean | string;
  destructive?: boolean;
}

interface SettingSection {
  key: string;
  title: string;
  subtitle?: string;
  rows: SettingRow[];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const { i18n: i18nInstance } = useTranslation();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18nInstance.language || 'en');

  const {
    notificationsEnabled, toggleNotifications,
    locationEnabled, toggleLocation,
    toggleDarkMode, theme,
    soundEnabled, toggleSound,
    vibrationEnabled, toggleVibration,
    queueNotificationsEnabled, toggleQueueNotifications,
    orderNotificationsEnabled, toggleOrderNotifications,
    promoNotificationsEnabled, togglePromoNotifications,
    analyticsEnabled, toggleAnalytics,
    compactViewEnabled, toggleCompactView,
    clearCache,
    logout,
    deleteAccount,
    isLoading,
    user,
  } = useStore();

  // ── Language ──────────────────────────────────────────────────────────────
  const handleSelectLanguage = async (code: string) => {
    try {
      await i18n.changeLanguage(code);
      setCurrentLanguage(code);
    } catch {}
  };

  const LANGUAGE_LABELS: Record<string, string> = {
    en: 'English', ur: 'اردو', ar: 'العربية', hi: 'हिंदी',
    fr: 'Français', de: 'Deutsch', es: 'Español',
    pt: 'Português', ru: 'Русский', zh: '中文',
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove cached order history and past queue records. Your account and active data remain safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearCache();
            Alert.alert('Done', 'Cache cleared successfully.');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your queues, orders, and loyalty points will be erased immediately.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              'Final Confirmation',
              'Your account will be deleted right now. This cannot be reversed.',
              [
                { text: 'Go Back', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    const result = await deleteAccount();
                    if (result.success) {
                      router.replace('/(auth)/welcome');
                    } else {
                      Alert.alert('Error', result.error ?? 'Could not delete account. Please try again.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleRateApp = () => {
    const url = Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/id000000'
      : 'https://play.google.com/store/apps/details?id=com.businesshubpro';
    Linking.openURL(url).catch(() =>
      Alert.alert('Not Available', 'App store page is not available yet.')
    );
  };

  const handleReportBug = () => {
    Linking.openURL('mailto:support@businesshubpro.app?subject=Bug%20Report&body=Describe%20the%20issue%20here...')
      .catch(() => Alert.alert('Email', 'Please send your report to support@businesshubpro.app'));
  };

  const handle2FA = () => {
    Alert.alert(
      'Two-Factor Authentication',
      'For extra security, 2FA sends a verification code to your email whenever you sign in from a new device. This feature is being rolled out — stay tuned!',
      [{ text: 'Got It' }]
    );
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@businesshubpro.app?subject=Support%20Request')
      .catch(() => Alert.alert('Contact', 'Email us at support@businesshubpro.app'));
  };

  const handleRow = (id: string) => {
    switch (id) {
      case 'change-password':   router.push('/profile/change-password'); break;
      case '2fa':               handle2FA(); break;
      case 'delete-account':    handleDeleteAccount(); break;
      case 'language':          setLanguageModalVisible(true); break;
      case 'dark-mode':         toggleDarkMode(); break;
      case 'clear-cache':       handleClearCache(); break;
      case 'help':              router.push('/profile/help'); break;
      case 'feedback':          router.push('/profile/feedback'); break;
      case 'terms':             router.push('/profile/terms'); break;
      case 'about':             router.push('/profile/about'); break;
      case 'rate-app':          handleRateApp(); break;
      case 'report-bug':        handleReportBug(); break;
      case 'contact-support':   handleContactSupport(); break;
      case 'notifications':     toggleNotifications(); break;
      case 'location':          toggleLocation(); break;
      case 'sound':             toggleSound(); break;
      case 'vibration':         toggleVibration(); break;
      case 'queue-notif':       toggleQueueNotifications(); break;
      case 'order-notif':       toggleOrderNotifications(); break;
      case 'promo-notif':       togglePromoNotifications(); break;
      case 'analytics':         toggleAnalytics(); break;
      case 'compact-view':      toggleCompactView(); break;
    }
  };

  // ── Section Definitions ──────────────────────────────────────────────────
  const SECTIONS: SettingSection[] = [
    {
      key: 'account',
      title: 'Account & Security',
      subtitle: 'Manage your login and security preferences',
      rows: [
        { id: 'change-password', icon: 'lock-closed-outline', iconBg: '#3B82F6', label: 'Change Password', description: 'Update your account password', type: 'link' },
        { id: '2fa', icon: 'shield-checkmark-outline', iconBg: '#8B5CF6', label: 'Two-Factor Authentication', description: 'Extra layer of sign-in security', type: 'link' },
        { id: 'delete-account', icon: 'trash-outline', iconBg: '#EF4444', label: 'Delete Account', description: 'Permanently remove all your data', type: 'action', destructive: true },
      ],
    },
    {
      key: 'notifications',
      title: 'Notifications',
      subtitle: 'Control what alerts you receive',
      rows: [
        { id: 'notifications', icon: 'notifications-outline', iconBg: '#F59E0B', label: 'Push Notifications', description: 'All app alerts and reminders', type: 'toggle', value: notificationsEnabled },
        { id: 'queue-notif', icon: 'people-outline', iconBg: '#10B981', label: 'Queue Updates', description: 'When your turn is approaching', type: 'toggle', value: queueNotificationsEnabled },
        { id: 'order-notif', icon: 'bag-outline', iconBg: '#06B6D4', label: 'Order Alerts', description: 'Order ready and status changes', type: 'toggle', value: orderNotificationsEnabled },
        { id: 'promo-notif', icon: 'pricetag-outline', iconBg: '#EC4899', label: 'Promotions & Offers', description: 'Deals from nearby businesses', type: 'toggle', value: promoNotificationsEnabled },
        { id: 'sound', icon: 'volume-high-outline', iconBg: '#6366F1', label: 'Notification Sound', description: 'Play sound with alerts', type: 'toggle', value: soundEnabled },
        { id: 'vibration', icon: 'phone-portrait-outline', iconBg: '#64748B', label: 'Vibration', description: 'Vibrate on notification', type: 'toggle', value: vibrationEnabled },
      ],
    },
    {
      key: 'appearance',
      title: 'Appearance',
      subtitle: 'Customize how the app looks',
      rows: [
        { id: 'dark-mode', icon: 'moon-outline', iconBg: '#1E293B', label: 'Dark Mode', description: 'Switch to dark interface', type: 'toggle', value: theme === 'dark' },
        { id: 'language', icon: 'language-outline', iconBg: '#7C3AED', label: 'Language', description: 'Choose your preferred language', type: 'value', value: LANGUAGE_LABELS[currentLanguage] ?? currentLanguage.toUpperCase() },
        { id: 'compact-view', icon: 'grid-outline', iconBg: '#0EA5E9', label: 'Compact View', description: 'Show more content with less spacing', type: 'toggle', value: compactViewEnabled },
      ],
    },
    {
      key: 'privacy',
      title: 'Privacy & Location',
      subtitle: 'Control your data and location access',
      rows: [
        { id: 'location', icon: 'location-outline', iconBg: '#EF4444', label: 'Location Services', description: 'Find nearby businesses', type: 'toggle', value: locationEnabled },
        { id: 'analytics', icon: 'bar-chart-outline', iconBg: '#059669', label: 'Analytics & Diagnostics', description: 'Help improve the app with usage data', type: 'toggle', value: analyticsEnabled },
      ],
    },
    {
      key: 'storage',
      title: 'Storage & Data',
      subtitle: 'Manage app data and storage',
      rows: [
        { id: 'clear-cache', icon: 'trash-bin-outline', iconBg: '#DC2626', label: 'Clear Cache', description: 'Free up space by clearing cached data', type: 'action' },
      ],
    },
    {
      key: 'support',
      title: 'Help & Support',
      subtitle: 'We are here to help',
      rows: [
        { id: 'help', icon: 'help-circle-outline', iconBg: '#3B82F6', label: 'Help Center', description: 'Browse FAQs and guides', type: 'link' },
        { id: 'contact-support', icon: 'mail-outline', iconBg: '#10B981', label: 'Contact Support', description: 'Email our support team', type: 'link' },
        { id: 'report-bug', icon: 'bug-outline', iconBg: '#F59E0B', label: 'Report a Bug', description: 'Found an issue? Let us know', type: 'link' },
        { id: 'feedback', icon: 'chatbubble-ellipses-outline', iconBg: '#8B5CF6', label: 'Send Feedback', description: 'Rate your experience', type: 'link' },
        { id: 'rate-app', icon: 'star-outline', iconBg: '#F97316', label: 'Rate BusinessHub Pro', description: 'Love the app? Leave a review', type: 'link' },
      ],
    },
    {
      key: 'about',
      title: 'About',
      rows: [
        { id: 'terms', icon: 'document-text-outline', iconBg: '#64748B', label: 'Terms & Privacy Policy', type: 'link' },
        { id: 'about', icon: 'information-circle-outline', iconBg: '#0EA5E9', label: 'About BusinessHub Pro', type: 'link' },
      ],
    },
  ];

  // ── Row Renderer ────────────────────────────────────────────────────────
  const renderRow = (row: SettingRow, isLast: boolean) => {
    const isToggle = row.type === 'toggle';
    const isDestructive = row.destructive;
    const textColor = isDestructive ? colors.destructive : colors.foreground;

    return (
      <TouchableOpacity
        key={row.id}
        style={[
          styles.row,
          { backgroundColor: colors.card },
          !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        ]}
        onPress={() => handleRow(row.id)}
        activeOpacity={isToggle ? 1 : 0.65}
      >
        {/* Icon pill */}
        <View style={[styles.iconPill, { backgroundColor: row.iconBg }]}>
          <Ionicons name={row.icon as any} size={18} color="#fff" />
        </View>

        {/* Labels */}
        <View style={styles.rowText}>
          <Text style={[styles.rowLabel, { color: textColor }]}>{row.label}</Text>
          {row.description && (
            <Text style={[styles.rowDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
              {row.description}
            </Text>
          )}
        </View>

        {/* Right element */}
        {isToggle ? (
          <Switch
            value={row.value as boolean}
            onValueChange={() => handleRow(row.id)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={Platform.OS === 'android' ? (row.value ? colors.primaryForeground : '#f0f0f0') : undefined}
          />
        ) : row.type === 'value' ? (
          <View style={styles.valueRight}>
            <Text style={[styles.valueText, { color: colors.mutedForeground }]}>{row.value as string}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </View>
        ) : row.type === 'link' ? (
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        ) : null}
      </TouchableOpacity>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Settings</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User identity badge */}
        {user && (
          <View style={[styles.identityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarInitial, { color: colors.primaryForeground }]}>
                {(user.name?.[0] ?? 'U').toUpperCase()}
              </Text>
            </View>
            <View style={styles.identityInfo}>
              <Text style={[styles.identityName, { color: colors.foreground }]}>{user.name}</Text>
              <Text style={[styles.identityEmail, { color: colors.mutedForeground }]}>{user.email}</Text>
            </View>
            <TouchableOpacity
              style={[styles.editBadge, { backgroundColor: colors.secondary }]}
              onPress={() => router.push('/profile/edit')}
              activeOpacity={0.7}
            >
              <Text style={[styles.editBadgeText, { color: colors.foreground }]}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sections */}
        {SECTIONS.map((section) => (
          <View key={section.key} style={styles.section}>
            {/* Section heading */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{section.title}</Text>
              {section.subtitle && (
                <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>{section.subtitle}</Text>
              )}
            </View>

            {/* Section card */}
            <View style={[
              styles.sectionCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                ...Shadows.sm,
                shadowColor: isDark ? 'transparent' : '#000',
              },
            ]}>
              {section.rows.map((row, idx) =>
                renderRow(row, idx === section.rows.length - 1)
              )}
            </View>
          </View>
        ))}

        {/* Version footer */}
        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          BusinessHub Pro v1.0.0 · Build 2026.02.25
        </Text>
        <View style={{ height: Spacing[8] }} />
      </ScrollView>

      <LanguageSelectorModal
        visible={languageModalVisible}
        currentLanguage={currentLanguage}
        onSelectLanguage={handleSelectLanguage}
        onClose={() => setLanguageModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: Spacing[2],
    borderRadius: BorderRadius.full,
    width: 40,
    alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },

  scrollContent: { paddingTop: Spacing[4] },

  // Identity card
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[5],
    padding: Spacing[4],
    borderRadius: BorderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  avatarInitial: { fontSize: 20, fontWeight: '700' },
  identityInfo: { flex: 1 },
  identityName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  identityEmail: { fontSize: 13 },
  editBadge: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
  },
  editBadgeText: { fontSize: 13, fontWeight: '600' },

  // Section
  section: { marginBottom: Spacing[5], paddingHorizontal: Spacing[4] },
  sectionHeader: { marginBottom: Spacing[2], paddingHorizontal: Spacing[1] },
  sectionTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  sectionSubtitle: { fontSize: 12, marginTop: 2 },

  // Section card
  sectionCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    minHeight: 56,
  },
  iconPill: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  rowText: { flex: 1, marginRight: Spacing[2] },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowDesc: { fontSize: 12, marginTop: 1 },

  // Value row
  valueRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  valueText: { fontSize: 14, fontWeight: '500' },

  // Footer
  version: { textAlign: 'center', fontSize: 12, marginTop: Spacing[2] },
});
