import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Dialog, { DialogConfig } from '@/components/ui/Dialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/store/useStore';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function ChangePasswordScreen() {
  const { colors } = useTheme();
  const { changePassword, addPassword, isLoading } = useStore();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isAddMode = mode === 'add';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({ current: '', new: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<DialogConfig | null>(null);

  // ── Password strength ─────────────────────────────────────────────────────
  const getStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (!pwd) return { label: '', color: 'transparent', width: '0%' };
    let score = 0;
    if (pwd.length >= 8)                           score++;
    if (/[A-Z]/.test(pwd))                        score++;
    if (/[0-9]/.test(pwd))                        score++;
    if (/[^A-Za-z0-9]/.test(pwd))                score++;
    const map = [
      { label: 'Very Weak',  color: '#ef4444', width: '25%'  },
      { label: 'Weak',       color: '#f97316', width: '40%'  },
      { label: 'Fair',       color: '#eab308', width: '60%'  },
      { label: 'Strong',     color: '#22c55e', width: '85%'  },
      { label: 'Very Strong',color: '#16a34a', width: '100%' },
    ];
    return map[score] ?? map[0];
  };

  const strength = getStrength(newPassword);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e = { current: '', new: '', confirm: '' };
    let ok = true;

    if (!isAddMode && !currentPassword.trim()) {
      e.current = 'Current password is required.';
      ok = false;
    }
    if (!newPassword.trim()) {
      e.new = 'New password is required.';
      ok = false;
    } else if (newPassword.length < 8) {
      e.new = 'Password must be at least 8 characters.';
      ok = false;
    } else if (!isAddMode && newPassword === currentPassword) {
      e.new = 'New password must be different from current.';
      ok = false;
    }
    if (!confirmPassword.trim()) {
      e.confirm = 'Please confirm your new password.';
      ok = false;
    } else if (newPassword !== confirmPassword) {
      e.confirm = 'Passwords do not match.';
      ok = false;
    }

    setErrors(e);
    return ok;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    const result = isAddMode
      ? await addPassword(newPassword)
      : await changePassword(currentPassword, newPassword);
    setSaving(false);

    if (result.success) {
      setDialog({
        title: isAddMode ? 'Password Added' : 'Password Changed',
        message: isAddMode
          ? 'Password set! You can now sign in with your email and this password.'
          : 'Your password has been updated successfully.',
        icon: 'checkmark-circle',
        iconVariant: 'success',
        actions: [{ label: 'OK', onPress: () => { setDialog(null); router.back(); } }],
      });
    } else {
      setDialog({
        title: 'Error',
        message: result.error ?? (isAddMode ? 'Failed to set password.' : 'Failed to change password.'),
        icon: 'alert-circle-outline',
        iconVariant: 'destructive',
        actions: [{ label: 'OK', onPress: () => setDialog(null) }],
      });
    }
  };

  // ── Field ─────────────────────────────────────────────────────────────────
  const PasswordField = ({
    label, value, onChangeText, show, onToggleShow, error, placeholder,
  }: {
    label: string; value: string; onChangeText: (v: string) => void;
    show: boolean; onToggleShow: () => void; error: string; placeholder: string;
  }) => (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={[
        styles.inputRow,
        {
          backgroundColor: colors.card,
          borderColor: error ? colors.destructive : colors.border,
          borderWidth: 1,
          borderRadius: BorderRadius.lg,
        },
      ]}>
        <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
        <TextFieldInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={!show}
          placeholderColor={colors.mutedForeground}
          textColor={colors.foreground}
        />
        <TouchableOpacity onPress={onToggleShow} style={styles.eyeBtn} activeOpacity={0.7}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
      {!!error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{isAddMode ? 'Add Password' : 'Change Password'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info banner */}
          <View style={[styles.banner, { backgroundColor: colors.info + '15', borderColor: colors.info + '40' }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.info} style={{ marginRight: 8 }} />
            <Text style={[styles.bannerText, { color: colors.info }]}>
              {isAddMode
                ? 'Set a password to enable email + password sign-in alongside your Google account.'
                : 'Choose a strong password with at least 8 characters, including uppercase, numbers, and symbols.'}
            </Text>
          </View>

          {/* Fields */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {!isAddMode && (
              <>
                <PasswordField
                  label="Current Password"
                  value={currentPassword}
                  onChangeText={(v) => { setCurrentPassword(v); setErrors(e => ({ ...e, current: '' })); }}
                  show={showCurrent}
                  onToggleShow={() => setShowCurrent(s => !s)}
                  error={errors.current}
                  placeholder="Enter current password"
                />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              </>
            )}

            <PasswordField
              label="New Password"
              value={newPassword}
              onChangeText={(v) => { setNewPassword(v); setErrors(e => ({ ...e, new: '' })); }}
              show={showNew}
              onToggleShow={() => setShowNew(s => !s)}
              error={errors.new}
              placeholder="Create a new password"
            />

            {/* Strength bar */}
            {newPassword.length > 0 && (
              <View style={styles.strengthWrap}>
                <View style={[styles.strengthBarBg, { backgroundColor: colors.border }]}>
                  <View style={[styles.strengthBarFill, { width: strength.width as any, backgroundColor: colors.foreground }]} />
                </View>
                <Text style={[styles.strengthLabel, { color: colors.mutedForeground }]}>{strength.label}</Text>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setErrors(e => ({ ...e, confirm: '' })); }}
              show={showConfirm}
              onToggleShow={() => setShowConfirm(s => !s)}
              error={errors.confirm}
              placeholder="Re-enter new password"
            />
          </View>

          {/* Requirements checklist */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: Spacing[4] }]}>
            <Text style={[styles.reqTitle, { color: colors.mutedForeground }]}>PASSWORD REQUIREMENTS</Text>
            {[
              { label: 'At least 8 characters', met: newPassword.length >= 8 },
              { label: 'An uppercase letter (A–Z)', met: /[A-Z]/.test(newPassword) },
              { label: 'A number (0–9)', met: /[0-9]/.test(newPassword) },
              { label: 'A special character (!@#$...)', met: /[^A-Za-z0-9]/.test(newPassword) },
            ].map((req, i) => (
              <View key={i} style={styles.reqRow}>
                <Ionicons
                  name={req.met ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={req.met ? colors.foreground : colors.mutedForeground}
                />
                <Text style={[styles.reqText, { color: req.met ? colors.foreground : colors.mutedForeground }]}>
                  {req.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: colors.primary },
              (saving || isLoading) && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            disabled={saving || isLoading}
            activeOpacity={0.8}
          >
            {saving || isLoading ? (
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Updating…</Text>
            ) : (
              <>
                <Ionicons name="checkmark-outline" size={20} color={colors.primaryForeground} />
                <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>{isAddMode ? 'Set Password' : 'Update Password'}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      {dialog && <Dialog visible {...dialog} onDismiss={() => setDialog(null)} />}
    </SafeAreaView>
  );
}

// ── Tiny internal TextInput wrapper (avoids prop-spread TS issue) ──────────────
function TextFieldInput({
  value, onChangeText, placeholder, secureTextEntry, placeholderColor, textColor,
}: {
  value: string; onChangeText: (v: string) => void; placeholder: string;
  secureTextEntry: boolean; placeholderColor: string; textColor: string;
}) {
  return (
    <TextInput
      style={[styles.textInput, { color: textColor, flex: 1 }]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderColor}
      secureTextEntry={secureTextEntry}
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: Spacing[2], width: 40, alignItems: 'center', borderRadius: BorderRadius.full },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },

  content: { padding: Spacing[4], paddingBottom: Spacing[10] },

  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing[3],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing[5],
  },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 18 },

  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingVertical: Spacing[2],
  },

  fieldWrap: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: Spacing[2] },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: Spacing[3],
  },
  inputIcon: { marginRight: Spacing[2] },
  textInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  eyeBtn: { padding: Spacing[1] },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing[1] },
  errorText: { fontSize: 12 },

  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: Spacing[4] },

  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    marginTop: Spacing[2],
    gap: Spacing[2],
    marginBottom: Spacing[1],
  },
  strengthBarBg: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  strengthBarFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600', minWidth: 70 },

  reqTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[1],
  },
  reqText: { fontSize: 13 },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    marginTop: Spacing[6],
    height: 52,
    borderRadius: BorderRadius.xl,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700' },
});
