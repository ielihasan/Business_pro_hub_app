import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

const EFFECTIVE_DATE = 'February 25, 2026';
const APP_NAME = 'BusinessHub Pro';
const CONTACT_EMAIL = 'support@businesshubpro.app';

type Tab = 'terms' | 'privacy';

interface Section {
  heading: string;
  body: string;
}

const TERMS_SECTIONS: Section[] = [
  {
    heading: '1. Acceptance of Terms',
    body: `By downloading, installing, or using ${APP_NAME} ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, please do not use the App. These Terms apply to all users, including visitors, registered users, and business owners.`,
  },
  {
    heading: '2. Description of Service',
    body: `${APP_NAME} is a mobile platform that allows users to:\n\n• Join and manage queues at registered businesses\n• Scan business QR codes to enter queues\n• Track real-time queue position and estimated wait time\n• Place and track orders at participating businesses\n• Earn and redeem loyalty points\n• Manage payment methods (JazzCash, Easypaisa, Bank Transfer)\n\nThe App connects customers with local businesses to reduce physical waiting times.`,
  },
  {
    heading: '3. User Accounts',
    body: `To use most features of ${APP_NAME}, you must create an account. You agree to:\n\n• Provide accurate, complete, and current information\n• Maintain the security of your password\n• Accept responsibility for all activities under your account\n• Notify us immediately of any unauthorized use at ${CONTACT_EMAIL}\n\nWe reserve the right to suspend or terminate accounts that violate these Terms.`,
  },
  {
    heading: '4. Queue & Order Rules',
    body: `When joining a queue or placing an order through the App:\n\n• You must arrive at the business within a reasonable time after your turn\n• Repeated no-shows may result in temporary suspension from queue services\n• Orders placed are subject to the business's own cancellation and refund policies\n• ${APP_NAME} acts as a technology intermediary and is not responsible for service quality provided by individual businesses\n• Estimated wait times are approximate and may vary`,
  },
  {
    heading: '5. Loyalty Points',
    body: `Loyalty points earned through ${APP_NAME}:\n\n• Are non-transferable and have no cash value\n• Expire after 12 months of account inactivity\n• May be forfeited if an account is suspended or terminated for policy violations\n• Are subject to change; we will notify users of significant changes via the App or email`,
  },
  {
    heading: '6. Payments',
    body: `${APP_NAME} facilitates payments through third-party payment providers (JazzCash, Easypaisa, Bank Transfer). By making a payment:\n\n• You authorize us to process the transaction through your selected payment method\n• You agree to provide valid and accurate payment information\n• All transactions are subject to verification and may be declined\n• ${APP_NAME} does not store full payment credentials on our servers\n• Disputes must be raised within 7 days of the transaction date`,
  },
  {
    heading: '7. Prohibited Conduct',
    body: `You agree not to:\n\n• Use the App for any unlawful purpose\n• Join queues on behalf of others without their knowledge\n• Attempt to manipulate queue positions or loyalty points fraudulently\n• Reverse-engineer, decompile, or disassemble any part of the App\n• Transmit any viruses, malware, or harmful code\n• Harass, abuse, or harm other users or business staff\n• Create multiple accounts to abuse referral or loyalty programs`,
  },
  {
    heading: '8. Intellectual Property',
    body: `All content in ${APP_NAME}, including but not limited to logos, text, graphics, UI design, and code, is owned by ${APP_NAME} or its licensors and is protected by applicable intellectual property laws. You may not copy, reproduce, or distribute any content without prior written permission.`,
  },
  {
    heading: '9. Disclaimers & Limitation of Liability',
    body: `The App is provided "as is" without warranties of any kind. ${APP_NAME} is not liable for:\n\n• Inaccurate wait time estimates\n• Service interruptions or technical errors\n• Actions or failures of third-party businesses or payment providers\n• Loss of data due to device failure or connectivity issues\n\nTo the maximum extent permitted by law, our total liability shall not exceed the amount you paid us in the 30 days preceding the claim.`,
  },
  {
    heading: '10. Changes to Terms',
    body: `We reserve the right to update these Terms at any time. We will notify you of material changes via in-app notification or email. Continued use of the App after changes take effect constitutes acceptance of the revised Terms.`,
  },
  {
    heading: '11. Governing Law',
    body: `These Terms are governed by the laws of Pakistan. Any disputes shall be resolved through good-faith negotiation or, if necessary, through the competent courts of Pakistan.`,
  },
  {
    heading: '12. Contact',
    body: `For questions about these Terms, contact us at:\n\n📧 ${CONTACT_EMAIL}`,
  },
];

const PRIVACY_SECTIONS: Section[] = [
  {
    heading: '1. Information We Collect',
    body: `We collect the following information when you use ${APP_NAME}:\n\n**Account Information**\n• Full name, email address, phone number\n• Profile photo (optional)\n• Password (stored as a cryptographic hash)\n\n**Usage Information**\n• Queue history and order history\n• Businesses visited, loyalty points\n• In-app activity and feature usage\n\n**Device & Technical Information**\n• Device type, operating system, app version\n• Push notification token (for alerts)\n• IP address and general location (city-level)\n\n**Location Information**\n• Precise GPS location (only when you grant permission, used to find nearby businesses)`,
  },
  {
    heading: '2. How We Use Your Information',
    body: `We use your information to:\n\n• Create and manage your account\n• Process queue entries and orders\n• Send real-time queue position updates and order alerts\n• Calculate and display loyalty points\n• Show nearby businesses on the map\n• Improve App features and fix bugs\n• Prevent fraud and abuse\n• Comply with legal obligations\n\nWe do NOT sell your personal data to third parties.`,
  },
  {
    heading: '3. Push Notifications',
    body: `With your permission, we send push notifications for:\n\n• Queue position updates ("Almost your turn!", "It's your turn!")\n• Order status changes (e.g., "Order ready for pickup")\n• Loyalty point rewards\n• Important account and app updates\n\nYou can disable notifications at any time from the Profile → Notifications toggle, or through your device's system Settings.`,
  },
  {
    heading: '4. Location Data',
    body: `We request location permission to show businesses near you on the map and to calculate distances. Location data is:\n\n• Only collected when the App is active and permission is granted\n• Not shared with businesses without your consent\n• Not sold to advertisers\n\nYou can revoke location permission at any time via your device settings.`,
  },
  {
    heading: '5. Data Sharing',
    body: `We share your data only in the following limited cases:\n\n• **Businesses you interact with** – Your name and contact details are shared with a business when you join their queue or place an order, so they can serve you\n• **Payment providers** – JazzCash, Easypaisa, or bank services process payment transactions\n• **Infrastructure providers** – Supabase (database & auth), Expo (push notifications) under strict data processing agreements\n• **Legal requirements** – If required by law or to protect rights and safety`,
  },
  {
    heading: '6. Data Retention',
    body: `We retain your data for as long as your account is active. You may request deletion at any time (see Section 8). After account deletion:\n\n• Personal data is deleted within 30 days\n• Transaction records may be retained for up to 5 years for legal and financial compliance\n• Anonymized, aggregated usage data may be retained indefinitely`,
  },
  {
    heading: '7. Data Security',
    body: `We protect your data using:\n\n• AES-256 encryption at rest via Supabase\n• TLS/HTTPS encryption in transit\n• Row-level security (RLS) so users can only access their own data\n• Hashed passwords (never stored in plain text)\n• Regular security audits\n\nNo method of transmission over the internet is 100% secure. We cannot guarantee absolute security but commit to industry-standard practices.`,
  },
  {
    heading: '8. Your Rights',
    body: `You have the right to:\n\n• **Access** – Request a copy of your personal data\n• **Correction** – Update inaccurate data via Profile → Edit Profile\n• **Deletion** – Request account and data deletion by emailing ${CONTACT_EMAIL}\n• **Portability** – Request your data in a machine-readable format\n• **Opt-out** – Disable notifications, location, and marketing communications at any time\n\nWe will respond to all requests within 30 days.`,
  },
  {
    heading: '9. Children\'s Privacy',
    body: `${APP_NAME} is not directed at children under 13. We do not knowingly collect personal data from children under 13. If you believe a child has provided us personal information, please contact us at ${CONTACT_EMAIL} and we will delete it promptly.`,
  },
  {
    heading: '10. Third-Party Links',
    body: `The App may contain links to third-party websites or services (e.g., business websites). We are not responsible for the privacy practices of those third parties. We encourage you to review their privacy policies.`,
  },
  {
    heading: '11. Changes to This Policy',
    body: `We may update this Privacy Policy. We will notify you of significant changes via in-app notification or email before they take effect. Continued use of the App after changes constitutes acceptance.`,
  },
  {
    heading: '12. Contact Us',
    body: `For privacy-related questions or to exercise your rights, contact:\n\n📧 ${CONTACT_EMAIL}\n\nWe aim to respond within 30 days.`,
  },
];

export default function TermsScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('terms');

  const sections = activeTab === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Terms & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab switcher */}
      <View style={[styles.tabBar, { backgroundColor: colors.secondary, borderBottomColor: colors.border }]}>
        {(['terms', 'privacy'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { backgroundColor: colors.primary, borderRadius: BorderRadius.DEFAULT },
            ]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={tab === 'terms' ? 'document-text-outline' : 'shield-checkmark-outline'}
              size={16}
              color={activeTab === tab ? colors.primaryForeground : colors.mutedForeground}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
              {tab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Effective date */}
        <View style={[styles.dateRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Ionicons name="calendar-outline" size={14} color={colors.mutedForeground} />
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
            Effective Date: {EFFECTIVE_DATE}
          </Text>
        </View>

        {/* Intro banner */}
        <View style={[styles.introBanner, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Ionicons name={activeTab === 'terms' ? 'document-text' : 'shield-checkmark'} size={28} color={colors.foreground} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.introBannerTitle, { color: colors.foreground }]}>
              {activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            </Text>
            <Text style={[styles.introBannerDesc, { color: colors.mutedForeground }]}>
              {activeTab === 'terms'
                ? `Please read these terms carefully before using ${APP_NAME}.`
                : `Your privacy matters to us. Here's how we collect, use, and protect your data.`}
            </Text>
          </View>
        </View>

        {/* Sections */}
        {sections.map((section, index) => (
          <View
            key={index}
            style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
              {section.heading}
            </Text>
            <Text style={[styles.sectionBody, { color: colors.mutedForeground }]}>
              {section.body}
            </Text>
          </View>
        ))}

        {/* Contact footer */}
        <View style={[styles.footer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Ionicons name="mail-outline" size={20} color={colors.mutedForeground} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.footerTitle, { color: colors.foreground }]}>Questions?</Text>
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}>
              <Text style={[styles.footerEmail, { color: colors.foreground }]}>{CONTACT_EMAIL}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: Spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700' },

  tabBar: {
    flexDirection: 'row',
    padding: Spacing[2],
    gap: Spacing[1],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[2],
  },
  tabText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },

  scrollContent: { paddingHorizontal: Spacing[4], paddingTop: Spacing[4] },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: 1,
    marginBottom: Spacing[4],
  },
  dateText: { fontSize: Typography.fontSize.xs },

  introBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: 1,
    marginBottom: Spacing[4],
  },
  introBannerTitle: { fontSize: Typography.fontSize.base, fontWeight: '700', marginBottom: 2 },
  introBannerDesc: { fontSize: Typography.fontSize.sm, lineHeight: 20 },

  section: {
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
  sectionHeading: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    marginBottom: Spacing[2],
  },
  sectionBody: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 22,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: 1,
    marginTop: Spacing[2],
  },
  footerTitle: { fontSize: Typography.fontSize.sm, fontWeight: '600', marginBottom: 2 },
  footerEmail: { fontSize: Typography.fontSize.sm, textDecorationLine: 'underline' },
});
