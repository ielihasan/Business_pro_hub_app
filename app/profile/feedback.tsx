import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/store/useStore';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

const FEEDBACK_POINTS = 50; // points awarded per feedback submission

const CATEGORIES = [
  { id: 'app_experience',   label: 'App Experience',       icon: 'phone-portrait-outline' },
  { id: 'queue_system',     label: 'Queue System',         icon: 'people-outline' },
  { id: 'order_system',     label: 'Orders & Payment',    icon: 'bag-outline' },
  { id: 'loyalty_rewards',  label: 'Loyalty & Rewards',   icon: 'star-outline' },
  { id: 'suggestion',       label: 'Suggestion',           icon: 'bulb-outline' },
  { id: 'other',            label: 'Other',                icon: 'chatbubble-outline' },
];

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export default function FeedbackScreen() {
  const { colors } = useTheme();
  const { user, submitFeedback } = useStore();

  const [rating, setRating]       = useState(0);
  const [category, setCategory]   = useState('');
  const [message, setMessage]     = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg]   = useState('');
  const [errors, setErrors]       = useState<{ rating?: string; category?: string; message?: string }>({});

  /* ── validation ── */
  const validate = () => {
    const e: typeof errors = {};
    if (rating === 0)           e.rating   = 'Please select a rating';
    if (!category)              e.category = 'Please select a category';
    if (message.trim().length < 10)
                                e.message  = 'Please write at least 10 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── submit ── */
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitState('loading');
    setErrorMsg('');
    const result = await submitFeedback({ rating, category, message: message.trim() });
    if (result.success) {
      setSubmitState('success');
    } else {
      setSubmitState('error');
      setErrorMsg(result.error ?? 'Something went wrong. Please try again.');
    }
  };

  /* ── success screen ── */
  if (submitState === 'success') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.successContainer}>
          <View style={[styles.successIconBg, { backgroundColor: colors.secondary }]}>
            <Ionicons name="checkmark-circle" size={72} color={colors.foreground} />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Thank You!</Text>
          <Text style={[styles.successSubtitle, { color: colors.mutedForeground }]}>
            Your feedback has been submitted successfully.
          </Text>

          {/* Points earned banner */}
          <View style={[styles.pointsBanner, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Ionicons name="star" size={24} color={colors.foreground} />
            <View>
              <Text style={[styles.pointsEarnedLabel, { color: colors.mutedForeground }]}>
                You earned
              </Text>
              <Text style={[styles.pointsEarnedValue, { color: colors.foreground }]}>
                +{FEEDBACK_POINTS} Loyalty Points!
              </Text>
            </View>
          </View>

          <Text style={[styles.successDesc, { color: colors.mutedForeground }]}>
            Your points have been added to your account. Keep sharing feedback to earn more rewards!
          </Text>

          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={[styles.doneButtonText, { color: colors.primaryForeground }]}>
              Back to Profile
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ── main feedback form ── */
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Send Feedback</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Points reward banner */}
          <View style={[styles.rewardBanner, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Ionicons name="star" size={20} color={colors.foreground} />
            <Text style={[styles.rewardText, { color: colors.mutedForeground }]}>
              Submit feedback and earn <Text style={{ fontWeight: '800' }}>+{FEEDBACK_POINTS} loyalty points</Text>!
            </Text>
          </View>

          {/* ── Star Rating ── */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Overall Rating *</Text>
            <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>How would you rate your experience with {'\u202f'}BusinessHub Pro?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => { setRating(star); setErrors((e) => ({ ...e, rating: undefined })); }}
                  activeOpacity={0.7}
                  style={styles.starBtn}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={38}
                    color={star <= rating ? colors.foreground : colors.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={[styles.ratingLabel, { color: colors.foreground }]}>
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
              </Text>
            )}
            {errors.rating && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.rating}</Text>}
          </View>

          {/* ── Category ── */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Category *</Text>
            <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>What area is your feedback about?</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.secondary,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => { setCategory(cat.id); setErrors((e) => ({ ...e, category: undefined })); }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={16}
                      color={isSelected ? colors.primaryForeground : colors.mutedForeground}
                    />
                    <Text style={[styles.categoryChipText, { color: isSelected ? colors.primaryForeground : colors.foreground }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.category && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.category}</Text>}
          </View>

          {/* ── Message ── */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Your Feedback *</Text>
            <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>Tell us what you think — every detail helps us improve!</Text>
            <TextInput
              style={[
                styles.textarea,
                {
                  backgroundColor: colors.secondary,
                  borderColor: errors.message ? colors.destructive : colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="Write your feedback here... (min. 10 characters)"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={message}
              onChangeText={(t) => { setMessage(t); setErrors((e) => ({ ...e, message: undefined })); }}
              maxLength={500}
            />
            <View style={styles.charCountRow}>
              {errors.message && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.message}</Text>}
              <Text style={[styles.charCount, { color: colors.mutedForeground, marginLeft: 'auto' }]}>{message.length}/500</Text>
            </View>
          </View>

          {/* ── Error banner ── */}
          {submitState === 'error' && (
            <View style={[styles.errorBanner, { backgroundColor: colors.secondary, borderColor: colors.destructive + '44' }]}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.destructive} />
              <Text style={[styles.errorBannerText, { color: colors.destructive }]}>{errorMsg}</Text>
            </View>
          )}

          {/* ── Submit button ── */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary, opacity: submitState === 'loading' ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={submitState === 'loading'}
            activeOpacity={0.8}
          >
            {submitState === 'loading' ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color={colors.primaryForeground} />
                <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>
                  Submit & Earn {FEEDBACK_POINTS} Points
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: Spacing[10] }} />
        </ScrollView>
      </KeyboardAvoidingView>
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

  scrollContent: { paddingHorizontal: Spacing[5], paddingTop: Spacing[5] },

  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: 1,
    marginBottom: Spacing[5],
  },
  rewardText: { fontSize: Typography.fontSize.sm, flex: 1 },

  fieldBlock: { marginBottom: Spacing[6] },
  fieldLabel: { fontSize: Typography.fontSize.base, fontWeight: '700', marginBottom: Spacing[1] },
  fieldHint: { fontSize: Typography.fontSize.sm, marginBottom: Spacing[3] },

  starsRow: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[2] },
  starBtn: { padding: Spacing[1] },
  ratingLabel: { fontSize: Typography.fontSize.base, fontWeight: '700', textAlign: 'center', marginTop: Spacing[1] },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: { fontSize: Typography.fontSize.sm, fontWeight: '500' },

  textarea: {
    borderWidth: 1,
    borderRadius: BorderRadius.DEFAULT,
    padding: Spacing[4],
    fontSize: Typography.fontSize.base,
    minHeight: 120,
    lineHeight: 22,
  },
  charCountRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing[1] },
  charCount: { fontSize: Typography.fontSize.xs },
  errorText: { fontSize: Typography.fontSize.xs, marginTop: Spacing[1] },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    padding: Spacing[4],
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: 1,
    marginBottom: Spacing[4],
  },
  errorBannerText: { fontSize: Typography.fontSize.sm, flex: 1 },

  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.DEFAULT,
    marginTop: Spacing[2],
  },
  submitButtonText: { fontSize: Typography.fontSize.base, fontWeight: '700' },

  /* success */
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing[8] },
  successIconBg: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing[5] },
  successTitle: { fontSize: Typography.fontSize['3xl'], fontWeight: '800', marginBottom: Spacing[2] },
  successSubtitle: { fontSize: Typography.fontSize.base, textAlign: 'center', marginBottom: Spacing[5] },
  pointsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.DEFAULT,
    borderWidth: 1,
    marginBottom: Spacing[5],
  },
  pointsEarnedLabel: { fontSize: Typography.fontSize.sm },
  pointsEarnedValue: { fontSize: Typography.fontSize.xl, fontWeight: '800' },
  successDesc: { fontSize: Typography.fontSize.sm, textAlign: 'center', lineHeight: 22, marginBottom: Spacing[8] },
  doneButton: {
    width: '100%',
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.DEFAULT,
    alignItems: 'center',
  },
  doneButtonText: { fontSize: Typography.fontSize.base, fontWeight: '700' },
});
