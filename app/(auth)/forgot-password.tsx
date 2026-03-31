import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Dialog, { DialogConfig } from '@/components/ui/Dialog';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { resetPassword } from '@/lib/auth';

// ── Design tokens (always dark) ──
const BG      = '#000000';
const SURFACE = '#141414';
const BORDER  = '#2a2a2a';
const FG      = '#ffffff';
const MUTED   = '#919191';
const BRAND   = '#D97706';   // amber CTA
const BRAND_FG = '#FFFFFF';
const PLACEHOLDER = '#555555';

export default function ForgotPasswordScreen() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);
  const [dialog, setDialog]   = useState<DialogConfig | null>(null);

  const handleSubmit = async () => {
    if (!email) { setError('Email is required'); return; }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) { setError('Please enter a valid email'); return; }
    setLoading(true);
    setError('');
    const result = await resetPassword(normalizedEmail);
    setLoading(false);
    if (!result.success) setError(result.error || 'Could not send reset email right now.');
    else { setEmail(normalizedEmail); setSent(true); }
  };

  const handleResend = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setDialog({ title: 'Missing Email', message: 'Please enter a valid email first.', icon: 'mail-outline', iconVariant: 'warning', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
      return;
    }
    setLoading(true);
    const result = await resetPassword(normalizedEmail);
    setLoading(false);
    if (!result.success) {
      setDialog({ title: 'Error', message: result.error || 'Could not resend reset email right now.', icon: 'alert-circle-outline', iconVariant: 'destructive', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
    } else {
      setEmail(normalizedEmail);
      setDialog({ title: 'Sent', message: 'A new reset link has been sent to your email.', icon: 'checkmark-circle', iconVariant: 'success', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
    }
  };

  /* ── Success state ── */
  if (sent) {
    return (
      <View style={[styles.root, { backgroundColor: BG }]}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={FG} />
            </TouchableOpacity>
            <Text style={[styles.wordmark, { color: FG }]}>BUSINESSHUB PRO</Text>
            <View style={{ width: 32 }} />
          </View>

          <View style={styles.successBody}>
            <View style={[styles.successIconWrap, { backgroundColor: SURFACE, borderColor: BORDER }]}>
              <Ionicons name="mail-outline" size={40} color={FG} />
            </View>
            <Text style={[styles.heroTitle, { color: FG }]}>Check{'\n'}Your Email</Text>
            <Text style={[styles.heroSub, { color: MUTED }]}>
              We've sent a password reset link to{'\n'}
              <Text style={{ color: FG, fontWeight: '700' }}>{email}</Text>
            </Text>

            <View style={[styles.tipsCard, { backgroundColor: SURFACE, borderColor: BORDER }]}>
              {['Check your spam / junk folder', 'Email may take a few minutes to arrive'].map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                  <Text style={[styles.tipText, { color: MUTED }]}>{tip}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.btnSecondary, { borderColor: BORDER }, loading && { opacity: 0.6 }]}
              onPress={handleResend}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? <ActivityIndicator color={FG} /> : <Text style={[styles.btnSecondaryText, { color: FG }]}>Resend Reset Link</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: BRAND }]} onPress={() => router.push('/(auth)/login')} activeOpacity={0.88}>
              <Text style={[styles.btnPrimaryText, { color: BRAND_FG }]}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        {dialog && <Dialog visible {...dialog} onDismiss={() => setDialog(null)} />}
      </View>
    );
  }

  /* ── Input state ── */
  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <SafeAreaView edges={['top']}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={FG} />
              </TouchableOpacity>
              <Text style={[styles.wordmark, { color: FG }]}>BUSINESSHUB PRO</Text>
              <View style={{ width: 32 }} />
            </View>
          </SafeAreaView>

          <View style={styles.heroSection}>
            <Text style={[styles.heroTitle, { color: FG }]}>Forgot{'\n'}Password</Text>
            <Text style={[styles.heroSub, { color: MUTED }]}>Enter your email and we'll send a recovery link to your inbox.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: MUTED }]}>REGISTERED EMAIL</Text>
              <TextInput
                style={[styles.input, { borderColor: error ? '#ffb4ab' : BORDER, color: FG }]}
                placeholder="name@business.com"
                placeholderTextColor={PLACEHOLDER}
                value={email}
                onChangeText={(v) => { setEmail(v); if (error) setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
              {!!error && <Text style={styles.fieldError}>{error}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: BRAND }, loading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? <ActivityIndicator color={BRAND_FG} /> : <Text style={[styles.btnPrimaryText, { color: BRAND_FG }]}>Send Reset Link</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.backRow} onPress={() => router.push('/(auth)/login')}>
            <Text style={[styles.backText, { color: MUTED }]}>Return to Sign In</Text>
          </TouchableOpacity>

          {/* Security badge */}
          <View style={styles.secBadge}>
            <Ionicons name="shield-checkmark-outline" size={13} color={MUTED} />
            <Text style={[styles.secText, { color: MUTED }]}>SECURITY PROTOCOL V4.2</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
      {dialog && <Dialog visible {...dialog} onDismiss={() => setDialog(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 48 },

  topBar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
  wordmark: { fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },
  closeBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },

  heroSection: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 36 },
  heroTitle:   { fontSize: 48, fontWeight: '900', letterSpacing: -1.5, lineHeight: 50, marginBottom: 16 },
  heroSub:     { fontSize: 15, lineHeight: 22 },

  form: { paddingHorizontal: 24, gap: 20, marginBottom: 32 },

  fieldWrap:  { gap: 8 },
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  fieldError: { fontSize: 11, color: '#ffb4ab', marginTop: 2 },
  input: {
    height: 54, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 20, fontSize: 15, backgroundColor: 'transparent',
  },

  btnPrimary:     { height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { fontSize: 16, fontWeight: '800' },
  btnSecondary:   { height: 54, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  btnSecondaryText: { fontSize: 15, fontWeight: '700' },

  backRow: { alignItems: 'center', marginBottom: 32 },
  backText: { fontSize: 14, fontWeight: '600' },

  secBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingBottom: 24 },
  secText:  { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },

  /* Success state */
  successBody: { flex: 1, paddingHorizontal: 24, paddingTop: 32, gap: 20 },
  successIconWrap: { width: 80, height: 80, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  tipsCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  tipRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipText:  { fontSize: 13, flex: 1 },
});
