import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, Avatar, Badge, Separator, Button } from '@/components/ui';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

type MenuItem = {
  id: string;
  icon: string;
  label: string;
  type: 'link' | 'toggle' | 'select';
  badge?: string;
  value?: boolean | string;
};

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout, isLoading, updateProfile, theme, setTheme } = useStore();
  const { t, i18n } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
    notifications: true,
    location: true,
  });

  const displayUser = user || {
    name: t('profile.guest'),
    email: 'guest@example.com',
    phone: '',
    loyaltyPoints: 0,
    totalVisits: 0,
    memberSince: t('profile.stats.since') + ' Today',
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
        {
          id: 'language',
          icon: 'language-outline',
          label: t('profile.menu.language'),
          type: 'link',
          value: {
            en: 'English',
            ur: 'اردو',
            es: 'Español',
            fr: 'Français',
            de: 'Deutsch',
            zh: '中文',
            ar: 'العربية',
            hi: 'हिन्दी',
            pt: 'Português',
            ru: 'Русский',
          }[i18n.language] || 'English'
        },
        { id: 'theme-dark', icon: 'moon', label: t('profile.menu.dark_mode') || 'Dark Mode', type: 'select', value: theme === 'dark' },
        { id: 'theme-light', icon: 'sunny', label: t('profile.menu.light_mode') || 'Light Mode', type: 'select', value: theme === 'light' },
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

  const handlePhotoUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required.');
        return;
      }

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

  const handleToggle = (id: string, value: boolean) => {
    setToggleStates((prev) => ({ ...prev, [id]: value }));
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setShowLanguageModal(false);
  };

  const handleMenuPress = (itemId: string) => {
    if (itemId === 'edit-profile') {
      router.push('/profile/edit');
      return;
    }

    if (itemId === 'language') {
      setShowLanguageModal(true);
      return;
    }

    switch (itemId) {
      case 'edit-profile':
        break;
      case 'loyalty':
        break;
      case 'payment':
        break;
      case 'help':
        break;
      case 'theme-dark':
        setTheme('dark');
        break;
      case 'theme-light':
        setTheme('light');
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.confirm_sign_out.title'),
      t('profile.confirm_sign_out.message'),
      [
        { text: t('profile.confirm_sign_out.cancel'), style: 'cancel' },
        {
          text: t('profile.confirm_sign_out.confirm'),
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
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handlePhotoUpload}
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
                <Ionicons name="camera" size={14} color={colors.primaryForeground} />
              )}
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
                  {t('profile.stats.points')}
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
                  {t('profile.stats.visits')}
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
                  {t('profile.stats.since')}
                </Text>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              {section.title}
            </Text>
            <Card>
              <CardContent style={styles.menuContent}>
                {section.items.map((item, itemIndex) => (
                  <View key={item.id + item.label}>
                    {itemIndex > 0 && <Separator style={{ marginVertical: 0 }} />}
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => item.type !== 'toggle' && handleMenuPress(item.id)}
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
                          value={toggleStates[item.id] ?? (typeof item.value === 'boolean' ? item.value : false)}
                          // onValueChange={(value) => handleToggle(item.id, value)}
                          onValueChange={() => { }} // Disabled for now to prevent errors
                          trackColor={{ false: colors.border, true: colors.primary }}
                          thumbColor={colors.primaryForeground}
                        />
                      ) : item.type === 'select' ? (
                        <View style={styles.menuRight}>
                          {item.value && (
                            <Ionicons name="checkmark" size={20} color={colors.primary} />
                          )}
                        </View>
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
            style={{ ...styles.logoutButton, borderColor: colors.destructive }}
            textStyle={{ color: colors.destructive }}
            icon={<Ionicons name="log-out-outline" size={20} color={colors.destructive} />}
          >
            {t('profile.sign_out')}
          </Button>
        </View>

        {/* App Version */}
        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          BusinessHub Pro v1.0.0
        </Text>

        <View style={{ height: Spacing[6] }} />
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLanguageModal}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {t('profile.change_language')}
            </Text>

            {[
              { code: 'en', label: 'English' },
              { code: 'ur', label: 'اردو (Urdu)' },
              { code: 'es', label: 'Español (Spanish)' },
              { code: 'fr', label: 'Français (French)' },
              { code: 'de', label: 'Deutsch (German)' },
              { code: 'zh', label: '中文 (Chinese)' },
              { code: 'ar', label: 'العربية (Arabic)' },
              { code: 'hi', label: 'हिन्दी (Hindi)' },
              { code: 'pt', label: 'Português (Portuguese)' },
              { code: 'ru', label: 'Русский (Russian)' },
            ].map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.languageOption, i18n.language === lang.code && styles.selectedOption]}
                onPress={() => changeLanguage(lang.code)}
              >
                <Text style={[styles.languageText, { color: colors.foreground }]}>{lang.label}</Text>
                {i18n.language === lang.code && (
                  <Ionicons name="checkmark" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <Button
              variant="outline"
              onPress={() => setShowLanguageModal(false)}
              style={styles.closeButton}
            >
              {t('profile.cancel')}
            </Button>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: Spacing[6], paddingHorizontal: Spacing[6] },
  avatarContainer: { position: 'relative', marginBottom: Spacing[4] },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing[6],
    paddingBottom: Spacing[10],
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[4],
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: '#ccc', // You might want to use colors.border here if accessible
  },
  selectedOption: {
    backgroundColor: 'transparent',
  },
  languageText: {
    fontSize: Typography.fontSize.base,
  },
  closeButton: {
    marginTop: Spacing[4],
  },
});