import { useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

import { useTheme } from '@/hooks/useTheme';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { Button, ImageViewer, ProfilePhotoModal, LanguageSelectorModal } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { ProfileHeader, ProfileStatsCard, ProfileMenuSection } from '@/components/profile';

type MenuItem = {
  id: string;
  icon: string;
  label: string;
  type: 'link' | 'toggle';
  badge?: string;
  value?: boolean | string;
};

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout, isLoading, theme, toggleDarkMode } = useStore();
  const { i18n: i18nInstance, t } = useTranslation();
  const { isUploading, handleEditPhoto } = useProfilePhoto();

  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18nInstance.language || 'en');
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
    notifications: true,
    location: true,
    theme: theme === 'dark',
  });

  const displayUser = user || {
    name: t('profile.guest'),
    email: 'guest@example.com',
    phone: '',
    loyaltyPoints: 0,
    totalVisits: 0,
    memberSince: 'Today',
  };

  const menuSections: Array<{ title: string; items: MenuItem[] }> = [
    {
      title: t('profile.sections.account'),
      items: [
        { id: 'edit-profile', icon: 'person-outline', label: t('profile.menu.edit_profile'), type: 'link' },
        { id: 'loyalty', icon: 'star-outline', label: t('profile.menu.loyalty'), type: 'link', badge: '1,250 pts' },
        { id: 'payment', icon: 'card-outline', label: t('profile.menu.payment'), type: 'link' },
        { id: 'addresses', icon: 'location-outline', label: t('profile.menu.addresses'), type: 'link' },
      ],
    },
    {
      title: t('profile.sections.preferences'),
      items: [
        { id: 'notifications', icon: 'notifications-outline', label: t('profile.menu.notifications'), type: 'toggle', value: true },
        { id: 'location', icon: 'navigate-outline', label: t('profile.menu.location'), type: 'toggle', value: true },
        { id: 'language', icon: 'language-outline', label: t('profile.menu.language'), type: 'link', value: currentLanguage.toUpperCase() },
        { id: 'theme', icon: 'moon-outline', label: t('profile.menu.dark_mode'), type: 'toggle', value: theme === 'dark' },
      ],
    },
    {
      title: t('profile.sections.support'),
      items: [
        { id: 'help', icon: 'help-circle-outline', label: t('profile.menu.help'), type: 'link' },
        { id: 'feedback', icon: 'chatbubble-outline', label: t('profile.menu.feedback'), type: 'link' },
        { id: 'about', icon: 'information-circle-outline', label: t('profile.menu.about'), type: 'link' },
        { id: 'terms', icon: 'document-text-outline', label: t('profile.menu.terms'), type: 'link' },
      ],
    },
  ];

  const handleToggle = (id: string, value: boolean) => {
    setToggleStates((prev) => ({ ...prev, [id]: value }));
    if (id === 'theme') toggleDarkMode();
  };

  const handleSelectLanguage = async (langCode: string) => {
    try {
      await i18n.changeLanguage(langCode);
      setCurrentLanguage(langCode);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const handleMenuPress = (itemId: string) => {
    switch (itemId) {
      case 'edit-profile':
        router.push('/profile/edit');
        break;
      case 'language':
        setLanguageSelectorVisible(true);
        break;
      case 'payment':
        router.push('/profile/payment');
        break;
      default:
        break;
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader
          name={displayUser.name}
          email={displayUser.email}
          avatarUri={user?.avatar}
          isUploading={isUploading}
          onAvatarPress={() => setPhotoModalVisible(true)}
        />

        <ProfileStatsCard
          loyaltyPoints={displayUser.loyaltyPoints}
          totalVisits={displayUser.totalVisits}
          memberSince={displayUser.memberSince}
        />

        {menuSections.map((section) => (
          <ProfileMenuSection
            key={section.title}
            title={section.title}
            items={section.items}
            toggleStates={toggleStates}
            onToggle={handleToggle}
            onMenuPress={handleMenuPress}
          />
        ))}

        {/* Logout Button */}
        <View style={styles.section}>
          <Button
            variant="outline"
            onPress={handleLogout}
            loading={isLoading}
            disabled={isLoading}
            style={{ ...styles.logoutButton, borderColor: colors.destructive }}
            textStyle={{ color: colors.destructive }}
            icon={<Ionicons name="log-out-outline" size={20} color={colors.destructive} />}
          >
            {t('profile.logout_title')}
          </Button>
        </View>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>{t('profile.version')}</Text>
        <View style={{ height: Spacing[6] }} />
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

      <LanguageSelectorModal
        visible={languageSelectorVisible}
        currentLanguage={currentLanguage}
        onSelectLanguage={handleSelectLanguage}
        onClose={() => setLanguageSelectorVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { paddingHorizontal: Spacing[6], marginBottom: Spacing[6] },
  logoutButton: { width: '100%' },
  version: { textAlign: 'center', fontSize: 12, marginTop: Spacing[4] },
});
