import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, Avatar, Badge, Separator, Button } from '@/components/ui';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

// Mock user data
const user = {
  name: 'Ali Hassan',
  email: 'ali.hassan@uog.edu.pk',
  phone: '+92 300 1234567',
  avatar: null,
  loyaltyPoints: 1250,
  totalVisits: 47,
  memberSince: 'January 2024',
};

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
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
    notifications: true,
    location: true,
    theme: false,
  });

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
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
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
          <TouchableOpacity style={styles.avatarContainer}>
            <Avatar name={user.name} size="xl" />
            <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={14} color={colors.primaryForeground} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {user.name}
          </Text>
          <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
            {user.email}
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
                  {user.loyaltyPoints.toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Points
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: colors.info + '20' }]}>
                  <Ionicons name="location" size={20} color={colors.info} />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {user.totalVisits}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Visits
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="calendar" size={20} color={colors.success} />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {user.memberSince.split(' ')[0]}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Since
                </Text>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
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
                          value={toggleStates[item.id] ?? item.value}
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
            style={[styles.logoutButton, { borderColor: colors.destructive }]}
            textStyle={{ color: colors.destructive }}
            icon={<Ionicons name="log-out-outline" size={20} color={colors.destructive} />}
          >
            Sign Out
          </Button>
        </View>

        {/* App Version */}
        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          BusinessHub Pro v1.0.0
        </Text>

        <View style={{ height: Spacing[6] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
