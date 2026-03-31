import { useState } from 'react';
import {
  Animated,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useScreenEntrance } from '@/hooks/useScreenEntrance';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/useTheme';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { ImageViewer, ProfilePhotoModal } from '@/components/ui';
import { useStore } from '@/store/useStore';
import { ProfileHeader, ProfileStatsCard, ProfileMenuSection } from '@/components/profile';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import Dialog, { DialogConfig } from '@/components/ui/Dialog';

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
  const { colors, isDark }                                   = useTheme();
  const { entranceStyle }                                    = useScreenEntrance();
  const { user, logout, isLoading, notificationsEnabled, unreadCount, paymentMethods } = useStore();
  const totalBadge = unreadCount + (paymentMethods.length === 0 ? 1 : 0);
  const { t }                                                = useTranslation();
  const { isUploading, uploadProgress, handleEditPhoto }     = useProfilePhoto();

  const [photoModalVisible,         setPhotoModalVisible]         = useState(false);
  const [imageViewerVisible,        setImageViewerVisible]        = useState(false);
  const [notificationsPanelVisible, setNotificationsPanelVisible] = useState(false);
  const [dialog,                    setDialog]                    = useState<DialogConfig | null>(null);

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
        { id: 'help',     icon: 'help-circle-outline', label: t('profile.menu.help'),     subtitle: 'FAQs & support',      type: 'link' },
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
        setDialog({
          title: loyaltyBadge,
          message: `You have ${displayUser.loyaltyPoints.toLocaleString()} loyalty points.\n\nEarn points by joining queues (+10 pts), submitting feedback (+50 pts), and completing orders (+25 pts).\n\nPoints can be redeemed for discounts at participating businesses.`,
          icon: 'star',
          iconVariant: 'warning',
          actions: [{ label: 'Got It', variant: 'primary', onPress: () => setDialog(null) }],
        });
        break;
      default: break;
    }
  };

  const handleLogout = () => {
    setDialog({
      title: t('profile.logout_title'),
      message: t('profile.logout_message'),
      icon: 'log-out-outline',
      iconVariant: 'destructive',
      actions: [
        { label: t('common.cancel'),          variant: 'secondary',    onPress: () => setDialog(null) },
        { label: t('profile.logout_title'),   variant: 'destructive',  onPress: async () => { setDialog(null); await logout(); router.replace('/(auth)/welcome'); } },
      ],
    });
  };

  const BG     = colors.background;
  const FG     = colors.foreground;
  const MUTED  = colors.mutedForeground;
  const BORDER = colors.border;
  const CARD   = colors.card;

  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.View style={[{ flex: 1 }, entranceStyle]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: BG }}>
        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.screenLabel, { color: MUTED }]}>ACCOUNT</Text>
            <Text style={[styles.screenTitle, { color: FG }]}>PROFILE</Text>
          </View>
          <TouchableOpacity
            style={[styles.bellBtn, { backgroundColor: CARD, borderColor: BORDER }]}
            onPress={() => setNotificationsPanelVisible(true)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={notificationsEnabled ? 'notifications' : 'notifications-off-outline'}
              size={18}
              color={FG}
            />
            {totalBadge > 0 && (
              <View style={[styles.bellDot, { backgroundColor: colors.destructive }]}>
                <Text style={[styles.bellDotText, { color: colors.destructiveForeground }]}>{totalBadge > 9 ? '9+' : totalBadge}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Profile Hero Card ── */}
        <ProfileHeader
          name={displayUser.name}
          email={displayUser.email}
          phone={displayUser.phone}
          avatarUri={user?.avatar}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          loyaltyPoints={displayUser.loyaltyPoints}
          onAvatarPress={() => setPhotoModalVisible(true)}
        />

        {/* ── Stats Bento ── */}
        <ProfileStatsCard
          loyaltyPoints={displayUser.loyaltyPoints}
          totalVisits={displayUser.totalVisits}
          memberSince={displayUser.memberSince}
        />

        {/* ── Menu Sections ── */}
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

        {/* ── Logout ── */}
        <View style={styles.logoutWrap}>
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: BORDER }]}
            onPress={handleLogout}
            disabled={isLoading}
            activeOpacity={0.75}
          >
            <View style={[styles.logoutIconWrap, { backgroundColor: CARD }]}>
              <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
            </View>
            <Text style={[styles.logoutText, { color: colors.destructive }]}>
              {isLoading ? 'Signing out…' : t('profile.logout_title')}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.destructive} />
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={12} color={MUTED} />
          <Text style={[styles.versionText, { color: MUTED }]}>{t('profile.version')}</Text>
        </View>

        <View style={{ height: 96 }} />
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

      {dialog && (
        <Dialog
          visible
          {...dialog}
          onDismiss={() => setDialog(null)}
        />
      )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  /* ── Top bar ── */
  topBar: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16,
  },
  screenLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  screenTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },

  bellBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  bellDot: {
    position: 'absolute', top: 5, right: 5,
    borderRadius: 7,
    minWidth: 14, height: 14, paddingHorizontal: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  bellDotText: { fontSize: 8, fontWeight: '800' },

  /* ── Scroll ── */
  scroll: { paddingTop: 4 },

  /* ── Logout ── */
  logoutWrap: { paddingHorizontal: 16, marginTop: 8, marginBottom: 8 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14, paddingHorizontal: 16, gap: 12,
  },
  logoutIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  logoutText: { flex: 1, fontSize: 15, fontWeight: '700' },

  /* ── Footer ── */
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 8,
  },
  versionText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
});
