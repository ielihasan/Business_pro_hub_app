import { useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/useTheme';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { ImageViewer, ProfilePhotoModal } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { ProfileHeader, ProfileStatsCard, ProfileMenuSection } from '@/components/profile';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';

type MenuItem = {
  id: string;
  icon: string;
  label: string;
  subtitle?: string;
  type: 'link' | 'toggle';
  badge?: string;
  value?: boolean | string;
};

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout, isLoading, notificationsEnabled, unreadCount } = useStore();
  const { t } = useTranslation();
  const { isUploading, handleEditPhoto } = useProfilePhoto();

  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [notificationsPanelVisible, setNotificationsPanelVisible] = useState(false);

  const displayUser = user || {
    name: t('profile.guest'),
    email: 'guest@example.com',
    phone: '',
    loyaltyPoints: 0,
    totalVisits: 0,
    memberSince: 'Today',
  };

  const loyaltyBadge = displayUser.loyaltyPoints > 0
    ? `${displayUser.loyaltyPoints.toLocaleString()} pts`
    : '0 pts';

  const menuSections: Array<{ title: string; items: MenuItem[] }> = [
    {
      title: t('profile.sections.account'),
      items: [
        { id: 'edit-profile', icon: 'person-outline',   label: t('profile.menu.edit_profile'), subtitle: 'Update your info & photo', type: 'link' },
        { id: 'loyalty',      icon: 'star-outline',     label: t('profile.menu.loyalty'),        subtitle: 'Points & rewards',          type: 'link', badge: loyaltyBadge },
        { id: 'payment',      icon: 'card-outline',     label: t('profile.menu.payment'),        subtitle: 'Saved cards & billing',     type: 'link' },
      ],
    },
    {
      title: t('profile.sections.preferences'),
      items: [
        { id: 'settings', icon: 'settings-outline', label: 'Settings', subtitle: 'Notifications, theme & more', type: 'link' },
      ],
    },
    {
      title: t('profile.sections.support'),
      items: [
        { id: 'help',     icon: 'help-circle-outline', label: t('profile.menu.help'),     subtitle: 'FAQs & support',    type: 'link' },
        { id: 'feedback', icon: 'chatbubble-outline',  label: t('profile.menu.feedback'), subtitle: 'Share your thoughts', type: 'link' },
      ],
    },
  ];

  const handleMenuPress = (itemId: string) => {
    switch (itemId) {
      case 'settings':     router.push('/profile/settings'); break;
      case 'edit-profile': router.push('/profile/edit');     break;
      case 'payment':      router.push('/profile/payment');  break;
      case 'feedback':     router.push('/profile/feedback'); break;
      case 'help':         router.push('/profile/help');     break;
      case 'loyalty':
        Alert.alert(
          `⭐ ${loyaltyBadge}`,
          `You have ${displayUser.loyaltyPoints.toLocaleString()} loyalty points.\n\nEarn points by:\n• Joining queues (+10 pts per visit)\n• Submitting feedback (+50 pts)\n• Completing orders (+25 pts)\n\nPoints can be redeemed for discounts at participating businesses.`,
          [{ text: 'Got It' }]
        );
        break;
      default: break;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout_title'),
      t('profile.logout_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout_title'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* ── Top bar ── */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.topTitle, { color: colors.foreground }]}>{t('profile.title')}</Text>
        <TouchableOpacity
          style={[styles.bellWrap, { backgroundColor: colors.secondary }]}
          onPress={() => setNotificationsPanelVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={notificationsEnabled ? 'notifications' : 'notifications-off-outline'}
            size={20}
            color={notificationsEnabled ? colors.foreground : colors.mutedForeground}
          />
          {notificationsEnabled && unreadCount > 0 && (
            <View style={styles.bellDot}>
              <Text style={styles.bellDotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero card */}
        <ProfileHeader
          name={displayUser.name}
          email={displayUser.email}
          phone={displayUser.phone}
          avatarUri={user?.avatar}
          isUploading={isUploading}
          loyaltyPoints={displayUser.loyaltyPoints}
          onAvatarPress={() => setPhotoModalVisible(true)}
        />

        {/* Stats row */}
        <ProfileStatsCard
          loyaltyPoints={displayUser.loyaltyPoints}
          totalVisits={displayUser.totalVisits}
          memberSince={displayUser.memberSince}
        />

        {/* Menu sections */}
        {menuSections.map((section) => (
          <ProfileMenuSection
            key={section.title}
            title={section.title}
            items={section.items}
            toggleStates={{}}
            onToggle={() => {}}
            onMenuPress={handleMenuPress}
          />
        ))}

        {/* Logout row */}
        <View style={styles.logoutWrap}>
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
            onPress={handleLogout}
            disabled={isLoading}
            activeOpacity={0.75}
          >
            <View style={styles.logoutIconWrap}>
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            </View>
            <Text style={styles.logoutText}>
              {isLoading ? 'Signing out…' : t('profile.logout_title')}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={[styles.version, { color: colors.mutedForeground }]}>{t('profile.version')}</Text>
        <View style={{ height: Spacing[8] }} />
      </ScrollView>

      <ProfilePhotoModal
        visible={photoModalVisible}
        hasPhoto={!!user?.avatar}
        onViewPhoto={() => setImageViewerVisible(true)}
        onEditPhoto={handleEditPhoto}
        onCancel={() => setPhotoModalVisible(false)}
      />

      {imageViewerVisible && user?.avatar && (
        <ImageViewer
          image={user.avatar}
          title={t('profile.photo.view_title')}
          onClose={() => setImageViewerVisible(false)}
        />
      )}

      <NotificationsPanel
        visible={notificationsPanelVisible}
        onClose={() => setNotificationsPanelVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  bellWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellDotText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  scroll: { paddingTop: Spacing[4] },

  logoutWrap: { paddingHorizontal: Spacing[4], marginBottom: Spacing[4] },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 13,
    paddingHorizontal: Spacing[4],
    gap: Spacing[3],
  },
  logoutIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#DC2626' },

  version: { textAlign: 'center', fontSize: 12, marginTop: Spacing[2] },
});
