import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

type Props = {
  visible: boolean;
  email: string;
  /** Return null on success, error string on failure — modal stays open on failure */
  onVerify: (code: string) => Promise<string | null>;
  onResend: () => Promise<void>;
  onClose?: () => void;
};

export function OtpModal({ visible, email, onVerify, onResend, onClose }: Props) {
  const { colors, isDark } = useTheme();
  const [code, setCode]             = useState('');
  const [verifying, setVerifying]   = useState(false);
  const [resending, setResending]   = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [timer, setTimer]           = useState(60);
  const inputRef = useRef<TextInput>(null);

  const BG     = colors.card;
  const FG     = colors.foreground;
  const MUTED  = colors.mutedForeground;
  const BORDER = colors.border;
  const SEC    = colors.secondary;
  const DESTR  = colors.destructive;

  const startTimer = () => {
    setTimer(60);
    let t = 60;
    const id = setInterval(() => {
      t -= 1;
      setTimer(t);
      if (t <= 0) clearInterval(id);
    }, 1000);
    return id;
  };

  useEffect(() => {
    if (!visible) { setCode(''); setLocalError(null); return; }
    setCode('');
    setLocalError(null);
    const id = startTimer();
    const focusId = setTimeout(() => inputRef.current?.focus(), 400);
    return () => { clearInterval(id); clearTimeout(focusId); };
  }, [visible]);

  const handleSubmit = async () => {
    if (code.length !== 6 || verifying) return;
    Keyboard.dismiss();
    setVerifying(true);
    setLocalError(null);
    const err = await onVerify(code);
    setVerifying(false);
    if (err) { setLocalError(err); setCode(''); }
  };

  const handleResend = async () => {
    setResending(true);
    setLocalError(null);
    await onResend();
    setResending(false);
    setCode('');
    startTimer();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={Keyboard.dismiss} activeOpacity={1} />

        <View style={[styles.sheet, { backgroundColor: BG, borderColor: BORDER }]}>
          {onClose && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={MUTED} />
            </TouchableOpacity>
          )}

          <View style={[styles.iconWrap, { backgroundColor: SEC }]}>
            <Ionicons name="mail-outline" size={28} color={FG} />
          </View>

          <Text style={[styles.title, { color: FG }]}>Verify Your Email</Text>
          <Text style={[styles.subtitle, { color: MUTED }]}>
            {'Enter the 6-digit code sent to\n'}
            <Text style={{ color: FG, fontWeight: '700' }}>{email}</Text>
          </Text>

          {/* OTP Boxes */}
          <TouchableOpacity
            style={styles.otpRow}
            onPress={() => { inputRef.current?.blur(); setTimeout(() => inputRef.current?.focus(), 50); }}
            activeOpacity={1}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.otpBox,
                  { backgroundColor: colors.input },
                  {
                    borderColor: localError
                      ? DESTR
                      : code[i] ? FG : (code.length === i ? colors.ring : BORDER),
                  },
                ]}
              >
                <Text style={[styles.otpDigit, { color: FG }]}>{code[i] || ''}</Text>
              </View>
            ))}
          </TouchableOpacity>

          {/* Hidden input captures keyboard */}
          <TextInput
            ref={inputRef}
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0.01, top: 0, left: 0 }}
            value={code}
            onChangeText={v => { setCode(v.replace(/\D/g, '').slice(0, 6)); setLocalError(null); }}
            keyboardType="number-pad"
            maxLength={6}
            caretHidden
            keyboardAppearance={isDark ? 'dark' : 'light'}
          />

          {!!localError && (
            <Text style={[styles.errorText, { color: DESTR }]}>{localError}</Text>
          )}

          <TouchableOpacity
            style={[
              styles.btnVerify,
              { backgroundColor: code.length === 6 ? FG : BORDER },
              (verifying || code.length < 6) && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            disabled={code.length !== 6 || verifying}
            activeOpacity={0.85}
          >
            {verifying
              ? <ActivityIndicator color={code.length === 6 ? colors.background : MUTED} />
              : <Text style={[styles.btnVerifyText, { color: code.length === 6 ? colors.background : MUTED }]}>
                  Verify Email
                </Text>
            }
          </TouchableOpacity>

          <View style={styles.resendRow}>
            <Text style={[styles.resendLabel, { color: MUTED }]}>Didn't receive it?</Text>
            {timer > 0
              ? <Text style={[styles.resendLabel, { color: MUTED }]}>{' '}Resend in {timer}s</Text>
              : (
                <TouchableOpacity onPress={handleResend} disabled={resending}>
                  <Text style={[styles.resendLink, { color: FG }]}>
                    {resending ? ' Sending…' : ' Resend Code'}
                  </Text>
                </TouchableOpacity>
              )
            }
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 52,
    alignItems: 'center',
    gap: 16,
  },
  closeBtn: {
    position: 'absolute', top: 20, right: 20,
    width: 32, height: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  title:    { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, lineHeight: 21, textAlign: 'center' },

  otpRow: { flexDirection: 'row', gap: 10 },
  otpBox: {
    width: 46, height: 58, borderRadius: 12, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  otpDigit: { fontSize: 22, fontWeight: '800' },

  errorText: { fontSize: 13, textAlign: 'center', marginTop: -4 },

  btnVerify: {
    width: '100%', height: 54, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  btnVerifyText: { fontSize: 16, fontWeight: '800' },

  resendRow:  { flexDirection: 'row', alignItems: 'center' },
  resendLabel:{ fontSize: 13 },
  resendLink: { fontSize: 13, fontWeight: '700' },
});
