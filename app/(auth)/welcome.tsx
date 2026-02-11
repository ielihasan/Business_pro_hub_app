import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');

const features = [
  {
    icon: 'qr-code-outline' as const,
    title: 'Quick Queue Join',
    description: 'Scan QR codes to instantly join queues at your favorite businesses',
  },
  {
    icon: 'time-outline' as const,
    title: 'Real-Time Tracking',
    description: 'Track your position and get accurate wait time estimates',
  },
  {
    icon: 'notifications-outline' as const,
    title: 'Smart Notifications',
    description: 'Never miss your turn with timely push notifications',
  },
  {
    icon: 'star-outline' as const,
    title: 'Earn Rewards',
    description: 'Collect loyalty points and unlock exclusive rewards',
  },
];

export default function WelcomeScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo & Header */}
        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Text style={[styles.logoText, { color: colors.primaryForeground }]}>
              BH
            </Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            BusinessHub Pro
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Smart queue management for modern customers
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {features.map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={[styles.featureIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons
                  name={feature.icon}
                  size={24}
                  color={colors.foreground}
                />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.foreground }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, { color: colors.mutedForeground }]}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA Buttons */}
        <View style={styles.actions}>
          <Button
            onPress={() => router.push('/(auth)/register')}
            style={styles.primaryButton}
          >
            Get Started
          </Button>
          <Button
            variant="outline"
            onPress={() => router.push('/(auth)/login')}
            style={styles.secondaryButton}
          >
            I already have an account
          </Button>
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[8],
    paddingBottom: Spacing[6],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing[8],
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  logoText: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    maxWidth: width * 0.8,
  },
  features: {
    gap: Spacing[3],
    marginBottom: Spacing[8],
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[4],
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[1],
  },
  featureDescription: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  actions: {
    gap: Spacing[3],
    marginBottom: Spacing[6],
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
  footer: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    lineHeight: Typography.fontSize.xs * Typography.lineHeight.relaxed,
  },
});
