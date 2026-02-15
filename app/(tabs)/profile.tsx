import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
<<<<<<< HEAD
  ActivityIndicator,
=======
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
<<<<<<< HEAD
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, Avatar, Badge, Separator, Button, ImageViewer, ProfilePhotoModal, LanguageSelectorModal } from '@/components/ui';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

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
  const { user, logout, isLoading, updateProfile, theme, toggleDarkMode } = useStore();
  const { i18n: i18nInstance, t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18nInstance.language || 'en');
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
    notifications: true,
    location: true,
    theme: theme === 'dark',
  });

  // Dynamic menu sections with translations
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
        { id: 'theme', icon: 'moon-outline', label: t('profile.menu.dark_mode'), type: 'toggle', value: false },
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

  const displayUser = user || {
    name: t('profile.guest'),
=======
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, Avatar, Badge, Separator, Button } from '@/components/ui';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useStore } from '@/store/useStore';

const menuSections = [
  {
    title: 'Account',
    items: [
      { id: 'edit-profile', icon: 'person-outline', label: 'Edit Profile', type: 'link' },
      { id: 'loyalty', icon: 'star-outline', label: 'Loyalty & Rewards', type: 'link', badge: '1,250 pts' },
      { id: 'payment', icon: 'card-outline', label: 'Payment Methods', type: 'link' },
      { id: 'addresses', icon: 'location-outline', label: 'Saved Addresses', type: 'link' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { id: 'notifications', icon: 'notifications-outline', label: 'Notifications', type: 'toggle', value: true },
      { id: 'location', icon: 'navigate-outline', label: 'Location Services', type: 'toggle', value: true },
      { id: 'language', icon: 'language-outline', label: 'Language', type: 'link', value: 'English' },
      { id: 'theme', icon: 'moon-outline', label: 'Dark Mode', type: 'toggle', value: false },
    ],
  },
  {
    title: 'Support',
    items: [
      { id: 'help', icon: 'help-circle-outline', label: 'Help Center', type: 'link' },
      { id: 'feedback', icon: 'chatbubble-outline', label: 'Send Feedback', type: 'link' },
      { id: 'about', icon: 'information-circle-outline', label: 'About', type: 'link' },
      { id: 'terms', icon: 'document-text-outline', label: 'Terms & Privacy', type: 'link' },
    ],
  },
];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout, isLoading } = useStore();
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
    notifications: true,
    location: true,
    theme: false,
  });

  // Default user data if not logged in (shouldn't happen, but fallback)
  const displayUser = user || {
    name: 'Guest User',
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
    email: 'guest@example.com',
    phone: '',
    loyaltyPoints: 0,
    totalVisits: 0,
    memberSince: 'Today',
  };

<<<<<<< HEAD
  const handleAvatarPress = () => {
    setPhotoModalVisible(true);
  };

  const handleViewPhoto = () => {
    setImageViewerVisible(true);
  };

  const handleEditPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required.');
        return;
      }

      Alert.alert(
        'Edit Profile Photo',
        'What would you like to do?',
        [
          {
            text: 'Choose New Photo',
            onPress: async () => {
              await uploadNewPhoto();
            },
          },
          {
            text: 'Remove Photo',
            style: 'destructive',
            onPress: async () => {
              Alert.alert(
                'Remove Photo',
                'Are you sure you want to remove your profile photo?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: removePhoto,
                  },
                ]
              );
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to edit photo');
    }
  };

  const uploadNewPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets[0].base64) return;

      setIsUploading(true);
      const file = result.assets[0];
      const fileExt = file.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(file.base64 || ''), {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const response = await updateProfile({ avatar_url: publicUrl });
      if (!response.success) throw response.error;

      Alert.alert('Success', 'Profile picture updated!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = async () => {
    try {
      setIsUploading(true);

      // If user has an avatar, delete it from Supabase storage
      if (user?.avatar) {
        // Extract the file path from the public URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/avatars/[userId]/[filename]
        const urlParts = user.avatar.split('/avatars/');
        if (urlParts.length === 2) {
          const filePath = `avatars/${urlParts[1]}`;
          
          // Delete from storage
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([filePath]);

          if (deleteError) {
            console.warn('Storage deletion warning:', deleteError);
            // Continue even if storage deletion fails, but log it
          }
        }
      }

      // Update profile to remove avatar_url
      const response = await updateProfile({ avatar_url: null });
      if (!response.success) throw response.error;

      Alert.alert('Success', 'Profile picture removed!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remove photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggle = (id: string, value: boolean) => {
    setToggleStates((prev) => ({ ...prev, [id]: value }));
    
    // Handle dark mode toggle
    if (id === 'theme') {
      toggleDarkMode();
    }
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
    if (itemId === 'edit-profile') {
      router.push('/profile/edit');
    } else if (itemId === 'language') {
      setLanguageSelectorVisible(true);
    }
    switch (itemId) {
      case 'edit-profile': 
        break;
      case 'language':
        break;
      case 'loyalty':
        break;
      case 'payment':
        break;
      case 'help':
=======
  const handleToggle = (id: string, value: boolean) => {
    setToggleStates((prev) => ({ ...prev, [id]: value }));
  };

  const handleMenuPress = (itemId: string) => {
    switch (itemId) {
      case 'edit-profile':
        // router.push('/profile/edit');
        break;
      case 'loyalty':
        // router.push('/profile/loyalty');
        break;
      case 'payment':
        // router.push('/profile/payment');
        break;
      case 'help':
        // Open help center
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    Alert.alert(
<<<<<<< HEAD
      t('profile.logout_title'),
      t('profile.logout_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout_title'),
=======
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
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
        {/* Profile Header */}
        <View style={styles.header}>
<<<<<<< HEAD
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={handleAvatarPress}
            disabled={isUploading}
          >
            <Avatar 
              source={user?.avatar ? { uri: user.avatar } : undefined}
              name={displayUser.name} 
              size="xl" 
            />
            <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
              {isUploading ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Ionicons name="image" size={14} color={colors.primaryForeground} />
              )}
=======
          <TouchableOpacity style={styles.avatarContainer}>
            <Avatar name={displayUser.name} size="xl" />
            <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={14} color={colors.primaryForeground} />
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
            </View>
          </TouchableOpacity>
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {displayUser.name}
          </Text>
          <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
            {displayUser.email}
          </Text>
        </View>

        {/* Stats Card */}
        <View style={styles.section}>
          <Card>
            <CardContent style={styles.statsContent}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: colors.warning + '20' }]}>
                  <Ionicons name="star" size={20} color={colors.warning} />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {displayUser.loyaltyPoints.toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
<<<<<<< HEAD
                  {t('profile.stats.points')}
=======
                  Points
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: colors.info + '20' }]}>
                  <Ionicons name="location" size={20} color={colors.info} />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {displayUser.totalVisits}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
<<<<<<< HEAD
                  {t('profile.stats.visits')}
=======
                  Visits
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="calendar" size={20} color={colors.success} />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {displayUser.memberSince.split(' ')[0]}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
<<<<<<< HEAD
                  {t('profile.stats.since')}
=======
                  Since
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
                </Text>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Menu Sections */}
<<<<<<< HEAD
        {menuSections.map((section) => (
=======
        {menuSections.map((section, sectionIndex) => (
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              {section.title}
            </Text>
            <Card>
              <CardContent style={styles.menuContent}>
                {section.items.map((item, itemIndex) => (
                  <View key={item.id}>
                    {itemIndex > 0 && <Separator style={{ marginVertical: 0 }} />}
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => item.type === 'link' && handleMenuPress(item.id)}
                      disabled={item.type === 'toggle'}
                    >
                      <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
                        <Ionicons
                          name={item.icon as any}
                          size={20}
                          color={colors.foreground}
                        />
                      </View>
                      <Text style={[styles.menuLabel, { color: colors.foreground }]}>
                        {item.label}
                      </Text>
                      {item.type === 'toggle' ? (
                        <Switch
<<<<<<< HEAD
                          value={toggleStates[item.id] ?? (typeof item.value === 'boolean' ? item.value : false)}
=======
                          value={toggleStates[item.id] ?? item.value}
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
                          onValueChange={(value) => handleToggle(item.id, value)}
                          trackColor={{ false: colors.border, true: colors.primary }}
                          thumbColor={colors.primaryForeground}
                        />
                      ) : (
                        <View style={styles.menuRight}>
                          {item.badge && (
                            <Badge variant="secondary" style={styles.menuBadge}>
                              {item.badge}
                            </Badge>
                          )}
                          {item.value && typeof item.value === 'string' && !item.badge && (
                            <Text style={[styles.menuValue, { color: colors.mutedForeground }]}>
                              {item.value}
                            </Text>
                          )}
                          <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={colors.mutedForeground}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </CardContent>
            </Card>
          </View>
        ))}

        {/* Logout Button */}
        <View style={styles.section}>
          <Button
            variant="outline"
            onPress={handleLogout}
            loading={isLoading}
            disabled={isLoading}
<<<<<<< HEAD
            style={{ ...styles.logoutButton, borderColor: colors.destructive }}
            textStyle={{ color: colors.destructive }}
            icon={<Ionicons name="log-out-outline" size={20} color={colors.destructive} />}
          >
            {t('profile.logout_title')}
=======
            style={[styles.logoutButton, { borderColor: colors.destructive }]}
            textStyle={{ color: colors.destructive }}
            icon={<Ionicons name="log-out-outline" size={20} color={colors.destructive} />}
          >
            Sign Out
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
          </Button>
        </View>

        {/* App Version */}
        <Text style={[styles.version, { color: colors.mutedForeground }]}>
<<<<<<< HEAD
          {t('profile.version')}
=======
          BusinessHub Pro v1.0.0
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
        </Text>

        <View style={{ height: Spacing[6] }} />
      </ScrollView>
<<<<<<< HEAD

      {/* Profile Photo Modal */}
      <ProfilePhotoModal
        visible={photoModalVisible}
        hasPhoto={!!user?.avatar}
        onViewPhoto={handleViewPhoto}
        onEditPhoto={handleEditPhoto}
        onCancel={() => setPhotoModalVisible(false)}
      />

      {/* Image Viewer Modal */}
      {imageViewerVisible && user?.avatar && (
        <ImageViewer
          image={user.avatar}
          title={t('profile.photo.view_title')}
          onClose={() => setImageViewerVisible(false)}
        />
      )}

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        visible={languageSelectorVisible}
        currentLanguage={currentLanguage}
        onSelectLanguage={handleSelectLanguage}
        onClose={() => setLanguageSelectorVisible(false)}
      />
=======
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  container: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: Spacing[6], paddingHorizontal: Spacing[6] },
  avatarContainer: { position: 'relative', marginBottom: Spacing[4] },
=======
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing[6],
    paddingHorizontal: Spacing[6],
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing[4],
  },
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
<<<<<<< HEAD
  userName: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, marginBottom: Spacing[1] },
  userEmail: { fontSize: Typography.fontSize.sm },
  section: { paddingHorizontal: Spacing[6], marginBottom: Spacing[6] },
  sectionTitle: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing[3] },
  statsContent: { flexDirection: 'row', alignItems: 'center', padding: Spacing[4] },
  statItem: { flex: 1, alignItems: 'center' },
  statIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing[2] },
  statValue: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold },
  statLabel: { fontSize: Typography.fontSize.xs, marginTop: Spacing[0.5] },
  statDivider: { width: 1, height: 50, marginHorizontal: Spacing[2] },
  menuContent: { padding: 0 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing[3], paddingHorizontal: Spacing[4] },
  menuIcon: { width: 36, height: 36, borderRadius: BorderRadius.DEFAULT, justifyContent: 'center', alignItems: 'center', marginRight: Spacing[3] },
  menuLabel: { flex: 1, fontSize: Typography.fontSize.base },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  menuBadge: { marginRight: Spacing[1] },
  menuValue: { fontSize: Typography.fontSize.sm },
  logoutButton: { width: '100%' },
  version: { textAlign: 'center', fontSize: Typography.fontSize.xs, marginTop: Spacing[4] },
});
=======
  userName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[1],
  },
  userEmail: {
    fontSize: Typography.fontSize.sm,
  },
  section: {
    paddingHorizontal: Spacing[6],
    marginBottom: Spacing[6],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing[3],
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  statValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing[0.5],
  },
  statDivider: {
    width: 1,
    height: 50,
    marginHorizontal: Spacing[2],
  },
  menuContent: {
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  menuLabel: {
    flex: 1,
    fontSize: Typography.fontSize.base,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  menuBadge: {
    marginRight: Spacing[1],
  },
  menuValue: {
    fontSize: Typography.fontSize.sm,
  },
  logoutButton: {
    width: '100%',
  },
  version: {
    textAlign: 'center',
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing[4],
  },
});
>>>>>>> 57767a09a5d820a64e21b0c825da668d705595a5
