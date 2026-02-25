import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Linking,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

const CONTACT_EMAIL = 'support@businesshubpro.app';

// ─── Data ─────────────────────────────────────────────────────────────────────

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  faqs: FAQ[];
}

const CATEGORIES: Category[] = [
  {
    id: 'queue',
    label: 'Queue Management',
    icon: 'people-outline',
    color: '#3B82F6',
    faqs: [
      {
        id: 'q1',
        question: 'How do I join a queue?',
        answer: 'You can join a queue in two ways:\n\n1. Scan QR Code — Tap the Scan tab at the bottom, point your camera at the business\'s QR code, and confirm to join.\n\n2. Search — Go to the Home tab, find the business nearby, tap "View Details", then tap "Join Queue".\n\nYou\'ll receive your ticket number and estimated wait time immediately.',
      },
      {
        id: 'q2',
        question: 'How will I know when it\'s my turn?',
        answer: 'BusinessHub Pro notifies you automatically:\n\n• Push notification when you\'re 3 positions away — "Almost Your Turn!"\n• Another push notification when you\'re next — "It\'s Your Turn!"\n• Live position updates visible on the Queue tab at all times.\n\nMake sure notifications are enabled in Profile → Notifications.',
      },
      {
        id: 'q3',
        question: 'Can I leave a queue after joining?',
        answer: 'Yes. Go to the Queue tab → tap your active queue → tap "Leave Queue". You\'ll be asked to confirm before your spot is released.\n\nNote: After leaving, your ticket number is cancelled and you\'ll need to rejoin from the back of the queue.',
      },
      {
        id: 'q4',
        question: 'What happens if I miss my turn?',
        answer: 'If you don\'t arrive when it\'s your turn, the business may move to the next customer. Some businesses allow a short grace period.\n\nRepeated no-shows may temporarily restrict your queue access. Always leave the queue if you can no longer attend.',
      },
      {
        id: 'q5',
        question: 'How accurate is the estimated wait time?',
        answer: 'Wait times are calculated based on queue position and the business\'s average service time per customer. They are estimates and may vary depending on:\n\n• Complexity of service for customers ahead\n• Staff availability\n• Walk-in customers\n\nCheck the Queue tab regularly for live updates.',
      },
      {
        id: 'q6',
        question: 'Can I join multiple queues at the same time?',
        answer: 'Yes! You can join queues at multiple businesses simultaneously. All active queues are visible under the Queue tab → Active section. You\'ll get separate notifications for each.',
      },
    ],
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: 'bag-outline',
    color: '#16A34A',
    faqs: [
      {
        id: 'o1',
        question: 'How do I track my order?',
        answer: 'Go to the Orders tab at the bottom. You\'ll see all your orders with real-time status:\n\n• Pending — Order received by business\n• Preparing — Being prepared\n• Ready — Ready for pickup\n• Completed — Picked up\n\nYou\'ll also get a push notification when your order status changes.',
      },
      {
        id: 'o2',
        question: 'My order status hasn\'t updated. What should I do?',
        answer: 'Status updates depend on the business updating their side. If it has been unusually long:\n\n1. Pull down to refresh the Orders screen\n2. Contact the business directly using the phone number on their profile\n3. If the issue persists, contact us at support@businesshubpro.app with your Order ID.',
      },
      {
        id: 'o3',
        question: 'Can I cancel an order?',
        answer: 'Order cancellation depends on the individual business\'s policy. If your order is still in "Pending" status, you may be able to cancel by contacting the business directly.\n\nOnce an order moves to "Preparing", cancellation is typically not possible. Check the business\'s cancellation policy on their profile page.',
      },
      {
        id: 'o4',
        question: 'I didn\'t receive my order but it shows "Completed".',
        answer: 'If your order is marked complete but you didn\'t receive it:\n\n1. Check with the business staff directly first\n2. Email us at support@businesshubpro.app with:\n   • Your Order ID\n   • Business name\n   • Date and time\n   • Screenshot of the order\n\nWe will investigate and resolve within 48 hours.',
      },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: 'card-outline',
    color: '#06B6D4',
    faqs: [
      {
        id: 'p1',
        question: 'What payment methods are accepted?',
        answer: 'BusinessHub Pro supports:\n\n• JazzCash — Mobile wallet payment\n• Easypaisa — Mobile wallet payment\n• Bank Transfer — Direct bank account transfer\n• Cash — Pay directly at the business (selected services)\n\nYou can manage saved payment methods in Profile → Payment Methods.',
      },
      {
        id: 'p2',
        question: 'Is my payment information secure?',
        answer: 'Yes. We take payment security seriously:\n\n• We never store your full card or account credentials\n• All transactions are processed through encrypted connections (TLS/HTTPS)\n• Payment data is handled by trusted third-party providers (JazzCash, Easypaisa)\n• We use AES-256 encryption for all stored data\n\nBusinessHub Pro is only a facilitator — your payment goes directly to the service provider.',
      },
      {
        id: 'p3',
        question: 'I was charged but the transaction failed. What now?',
        answer: 'This can happen due to network issues. Steps to resolve:\n\n1. Check your bank/wallet app for the deduction status\n2. Wait 10 minutes — auto-reversals often happen automatically\n3. If not reversed within 24 hours, email us at support@businesshubpro.app with:\n   • Transaction ID or screenshot\n   • Amount and date\n   • Payment method used\n\nWe\'ll coordinate with the payment provider to resolve it.',
      },
      {
        id: 'p4',
        question: 'How do I get a refund?',
        answer: 'Refunds are processed by the business you transacted with. To request one:\n\n1. Contact the business directly using their profile contact info\n2. If unresolved, email support@businesshubpro.app with your transaction details\n3. Raise a dispute within 7 days of the transaction\n\nRefunds typically take 3–7 business days depending on your bank/wallet.',
      },
    ],
  },
  {
    id: 'loyalty',
    label: 'Loyalty & Rewards',
    icon: 'star-outline',
    color: '#F59E0B',
    faqs: [
      {
        id: 'l1',
        question: 'How do I earn loyalty points?',
        answer: 'You earn points through:\n\n• Joining a queue → points per visit\n• Completing an order → points per order\n• Submitting feedback → 50 points per feedback\n• Special promotions → bonus points\n\nYour total points are displayed on the Profile screen under the Stats card.',
      },
      {
        id: 'l2',
        question: 'Do loyalty points expire?',
        answer: 'Yes. Loyalty points expire after 12 months of account inactivity (no logins or activity).\n\nPoints are also forfeited if your account is suspended for policy violations.\n\nWe will notify you via in-app notification before your points are due to expire.',
      },
      {
        id: 'l3',
        question: 'Why aren\'t my points updating?',
        answer: 'Points update in real-time in the app. If you don\'t see recent points:\n\n1. Pull down to refresh the Profile screen\n2. Log out and log back in\n3. Check the Notifications panel — earned points show as notifications\n\nIf still missing, contact us at support@businesshubpro.app with details of the activity.',
      },
    ],
  },
  {
    id: 'account',
    label: 'Account & Profile',
    icon: 'person-outline',
    color: '#8B5CF6',
    faqs: [
      {
        id: 'a1',
        question: 'How do I update my profile information?',
        answer: 'Go to Profile → Edit Profile. You can update:\n\n• Full name\n• Phone number\n• Profile photo\n\nTap "Save Profile" after making changes. Your information updates instantly across the app.',
      },
      {
        id: 'a2',
        question: 'How do I change my password?',
        answer: 'Go to Profile → Edit Profile → scroll down to "Change Password". You\'ll need to enter your current password first, then set a new one (minimum 8 characters).\n\nIf you\'ve forgotten your password, use the "Forgot Password" option on the Login screen.',
      },
      {
        id: 'a3',
        question: 'How do I delete my account?',
        answer: 'To request account deletion:\n\n1. Email support@businesshubpro.app from your registered email address\n2. Subject: "Account Deletion Request"\n3. Include your full name and registered email\n\nWe will delete your account and personal data within 30 days. Transaction records may be retained up to 5 years for legal compliance.',
      },
      {
        id: 'a4',
        question: 'I forgot my email or can\'t log in. Help!',
        answer: 'If you can\'t access your account:\n\n1. Try "Forgot Password" on the Login screen\n2. Check your spam/junk folder for the reset email\n3. If you no longer have access to the email, contact us at support@businesshubpro.app with your full name and phone number so we can verify your identity.',
      },
      {
        id: 'a5',
        question: 'Can I use the app without creating an account?',
        answer: 'Limited browsing is available without an account — you can view nearby businesses on the map. However, to join queues, place orders, or earn loyalty points, you need a registered account.\n\nRegistration is free and takes less than 1 minute.',
      },
    ],
  },
  {
    id: 'technical',
    label: 'Technical Issues',
    icon: 'construct-outline',
    color: '#EF4444',
    faqs: [
      {
        id: 't1',
        question: 'The app is running slowly or crashing. What should I do?',
        answer: 'Try these steps in order:\n\n1. Force close and reopen the app\n2. Check your internet connection (WiFi or mobile data)\n3. Clear app cache from your phone\'s Settings → Apps → BusinessHub Pro → Clear Cache\n4. Restart your phone\n5. Uninstall and reinstall the app\n\nIf the problem persists, report it to support@businesshubpro.app with your device model and OS version.',
      },
      {
        id: 't2',
        question: 'QR code scanner is not working.',
        answer: 'If the scanner won\'t work:\n\n1. Make sure camera permission is granted — go to your phone Settings → Apps → BusinessHub Pro → Permissions → Camera → Allow\n2. Ensure adequate lighting when scanning\n3. Hold the camera steady, 20–30cm from the QR code\n4. Try cleaning your camera lens\n5. Restart the app and try again\n\nIf still not working, try joining manually through Search instead.',
      },
      {
        id: 't3',
        question: 'I\'m not receiving push notifications.',
        answer: 'To fix missing notifications:\n\n1. Check the toggle in Profile → Notifications is turned ON\n2. Check your phone\'s system settings — Settings → Apps → BusinessHub Pro → Notifications → Allow\n3. Make sure your phone is not in Do Not Disturb or Focus mode\n4. Ensure battery optimization is disabled for the app (Android)\n5. Log out and back in to refresh the notification token',
      },
      {
        id: 't4',
        question: 'My location / nearby businesses are not showing correctly.',
        answer: 'For location issues:\n\n1. Ensure Location permission is granted — Settings → Apps → BusinessHub Pro → Permissions → Location → Allow (While Using)\n2. Turn Location Services ON in your phone settings\n3. Toggle the Location switch in Profile → Location Services off and back on\n4. The map shows businesses within a set radius — try zooming out or widening the search',
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HelpCenterScreen() {
  const { colors, isDark } = useTheme();

  const [searchQuery, setSearchQuery]     = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId]       = useState<string | null>(null);

  // Flatten all FAQs for search
  const allFaqs = useMemo(() => CATEGORIES.flatMap(c => c.faqs.map(f => ({ ...f, categoryId: c.id }))), []);

  // Filtered results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allFaqs.filter(f =>
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  const handleToggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleCategoryPress = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveCategory(prev => (prev === id ? null : id));
    setExpandedId(null);
  };

  const visibleCategories = activeCategory
    ? CATEGORIES.filter(c => c.id === activeCategory)
    : CATEGORIES;

  // ── FAQ Item ──
  const FAQItem = ({ faq, accentColor }: { faq: FAQ; accentColor: string }) => {
    const isOpen = expandedId === faq.id;
    return (
      <View>
        <TouchableOpacity
          style={styles.faqRow}
          onPress={() => handleToggle(faq.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.faqQuestion, { color: colors.foreground, flex: 1, paddingRight: Spacing[2] }]}>
            {faq.question}
          </Text>
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={isOpen ? accentColor : colors.mutedForeground}
          />
        </TouchableOpacity>
        {isOpen && (
          <View style={[styles.faqAnswer, { backgroundColor: isDark ? '#111' : '#FAFAFA', borderTopColor: colors.border }]}>
            <Text style={[styles.faqAnswerText, { color: colors.mutedForeground }]}>{faq.answer}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Help Center</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search bar */}
      <View style={[styles.searchContainer, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6', borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search for help..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Search Results ── */}
        {isSearching ? (
          <View>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            </Text>
            {searchResults.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: isDark ? '#1C1C1E' : '#F9FAFB', borderColor: colors.border }]}>
                <Ionicons name="search-outline" size={40} color={colors.mutedForeground} style={{ marginBottom: Spacing[3] }} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results found</Text>
                <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                  Try different keywords, or contact our support team directly.
                </Text>
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {searchResults.map((faq, i) => {
                  const cat = CATEGORIES.find(c => c.id === faq.categoryId)!;
                  return (
                    <View key={faq.id}>
                      {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                      <View style={styles.searchResultCategory}>
                        <Ionicons name={cat.icon as any} size={12} color={cat.color} />
                        <Text style={[styles.searchResultCategoryText, { color: cat.color }]}>{cat.label}</Text>
                      </View>
                      <FAQItem faq={faq} accentColor={cat.color} />
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* ── Hero banner ── */}
            <View style={[styles.heroBanner, { backgroundColor: isDark ? '#1A2744' : '#EFF6FF', borderColor: isDark ? '#2563EB44' : '#BFDBFE' }]}>
              <Ionicons name="help-buoy-outline" size={32} color="#3B82F6" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.heroTitle, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>How can we help?</Text>
                <Text style={[styles.heroDesc, { color: isDark ? '#93C5FD' : '#2563EB' }]}>
                  Browse topics below or search for a specific question.
                </Text>
              </View>
            </View>

            {/* ── Category pills ── */}
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TOPICS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsRow}
            >
              {CATEGORIES.map(cat => {
                const isActive = activeCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isActive ? cat.color : (isDark ? '#1C1C1E' : '#F3F4F6'),
                        borderColor: isActive ? cat.color : colors.border,
                      },
                    ]}
                    onPress={() => handleCategoryPress(cat.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={cat.icon as any} size={14} color={isActive ? '#fff' : colors.mutedForeground} />
                    <Text style={[styles.pillText, { color: isActive ? '#fff' : colors.foreground }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ── FAQ categories ── */}
            {visibleCategories.map(cat => (
              <View key={cat.id} style={{ marginBottom: Spacing[4] }}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIconBg, { backgroundColor: cat.color + '20' }]}>
                    <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                  </View>
                  <Text style={[styles.categoryTitle, { color: colors.foreground }]}>{cat.label}</Text>
                  <Text style={[styles.categoryCount, { color: colors.mutedForeground }]}>
                    {cat.faqs.length} articles
                  </Text>
                </View>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {cat.faqs.map((faq, i) => (
                    <View key={faq.id}>
                      {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                      <FAQItem faq={faq} accentColor={cat.color} />
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── Still need help? ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: Spacing[2] }]}>STILL NEED HELP?</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: Spacing[4] }]}>

          {/* Email support */}
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=Support Request - BusinessHub Pro`)}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIcon, { backgroundColor: isDark ? '#14532D' : '#F0FDF4' }]}>
              <Ionicons name="mail-outline" size={22} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactTitle, { color: colors.foreground }]}>Email Support</Text>
              <Text style={[styles.contactDesc, { color: colors.mutedForeground }]}>
                We reply within 24 hours
              </Text>
              <Text style={[styles.contactValue, { color: '#16A34A' }]}>{CONTACT_EMAIL}</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Send feedback */}
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => router.push('/profile/feedback')}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIcon, { backgroundColor: isDark ? '#1A2744' : '#EFF6FF' }]}>
              <Ionicons name="chatbubble-outline" size={22} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactTitle, { color: colors.foreground }]}>Send Feedback</Text>
              <Text style={[styles.contactDesc, { color: colors.mutedForeground }]}>
                Share suggestions and earn 50 loyalty points
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Terms & Privacy */}
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => router.push('/profile/terms')}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIcon, { backgroundColor: isDark ? '#2E1065' : '#F5F3FF' }]}>
              <Ionicons name="document-text-outline" size={22} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactTitle, { color: colors.foreground }]}>Terms & Privacy Policy</Text>
              <Text style={[styles.contactDesc, { color: colors.mutedForeground }]}>
                Read our terms of service and privacy policy
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Response time note */}
        <View style={[styles.noteBox, { backgroundColor: isDark ? '#1C1C1E' : '#FFFBEB', borderColor: isDark ? '#92400E44' : '#FDE68A' }]}>
          <Ionicons name="time-outline" size={16} color="#F59E0B" />
          <Text style={[styles.noteText, { color: isDark ? '#FCD34D' : '#92400E' }]}>
            Our support team is available Mon–Sat, 9am–6pm (PKT). We aim to respond to all emails within 24 hours.
          </Text>
        </View>

        <View style={{ height: Spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  searchContainer: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: Typography.fontSize.base, padding: 0 },

  content: { paddingHorizontal: Spacing[4], paddingTop: Spacing[4] },

  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: 1,
    marginBottom: Spacing[5],
  },
  heroTitle: { fontSize: Typography.fontSize.base, fontWeight: '700', marginBottom: 2 },
  heroDesc: { fontSize: Typography.fontSize.sm, lineHeight: 18 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing[3],
  },

  pillsRow: { gap: Spacing[2], paddingBottom: Spacing[4] },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },

  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  categoryIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: { flex: 1, fontSize: Typography.fontSize.base, fontWeight: '700' },
  categoryCount: { fontSize: Typography.fontSize.xs },

  card: {
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: Spacing[4] },

  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
  },
  faqQuestion: { fontSize: Typography.fontSize.sm, fontWeight: '600', lineHeight: 20 },
  faqAnswer: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  faqAnswerText: { fontSize: Typography.fontSize.sm, lineHeight: 22 },

  searchResultCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
  },
  searchResultCategoryText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

  emptyBox: {
    alignItems: 'center',
    padding: Spacing[8],
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: 1,
    marginBottom: Spacing[4],
  },
  emptyTitle: { fontSize: Typography.fontSize.base, fontWeight: '700', marginBottom: Spacing[2] },
  emptyDesc: { fontSize: Typography.fontSize.sm, textAlign: 'center', lineHeight: 20 },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    gap: Spacing[3],
  },
  contactIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  contactTitle: { fontSize: Typography.fontSize.sm, fontWeight: '700', marginBottom: 2 },
  contactDesc: { fontSize: Typography.fontSize.xs, lineHeight: 16 },
  contactValue: { fontSize: Typography.fontSize.xs, fontWeight: '600', marginTop: 2 },

  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
    padding: Spacing[4],
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: 1,
    marginBottom: Spacing[4],
  },
  noteText: { fontSize: Typography.fontSize.xs, lineHeight: 18, flex: 1 },
});
