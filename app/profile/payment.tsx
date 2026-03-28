import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import Dialog, { DialogConfig } from '@/components/ui/Dialog';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import {
  PAYMENT_METHODS,
  PaymentMethodId,
  PaymentMethodConfig,
  generateTransactionId,
  openPaymentApp,
  pickReceiptImage,
  captureReceiptCamera,
  createTransaction,
  uploadReceiptAndUpdateTransaction,
  ReceiptPickerResult,
} from '@/lib/payment';

type Step = 'select' | 'instructions' | 'upload' | 'done';

// ────────────────────────────────────────────────────────────────────────────

export default function PaymentScreen() {
  const { colors } = useTheme();
  const { user } = useStore();

  const [step, setStep]               = useState<Step>('select');
  const [selectedId, setSelectedId]   = useState<PaymentMethodId | null>(null);
  const [amount, setAmount]           = useState('');
  const [txnId, setTxnId]             = useState('');
  const [receipt, setReceipt]         = useState<ReceiptPickerResult | null>(null);
  const [receiptUrl, setReceiptUrl]   = useState('');
  const [externalTxnId, setExternalTxnId] = useState('');
  const [isSaving, setIsSaving]           = useState(false);
  const [isUploading, setIsUploading]     = useState(false);
  const [openingApp, setOpeningApp]       = useState(false);
  const [dialog, setDialog] = useState<DialogConfig | null>(null);

  const method = selectedId ? PAYMENT_METHODS.find(m => m.id === selectedId)! : null;

  // ── Step 1: Select method + amount ─────────────────────────────────────────
  const handleProceed = async () => {
    if (!selectedId) {
      setDialog({ title: 'Select Method', message: 'Please choose a payment method.', icon: 'card-outline', iconVariant: 'warning', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
      return;
    }
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setDialog({ title: 'Invalid Amount', message: 'Please enter a valid amount greater than 0.', icon: 'alert-circle-outline', iconVariant: 'warning', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
      return;
    }
    if (!user?.id) {
      setDialog({ title: 'Not Logged In', message: 'Please log in first.', icon: 'log-in-outline', iconVariant: 'warning', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
      return;
    }

    setIsSaving(true);
    const newTxnId = generateTransactionId(user.id);
    setTxnId(newTxnId);
    const { error } = await createTransaction({
      transaction_id: newTxnId,
      user_id: user.id,
      payment_method: selectedId,
      amount: parsed,
    });
    setIsSaving(false);
    if (error) console.warn('Transaction create warn:', error);
    setStep('instructions');
  };

  // ── Step 2: Open payment app ────────────────────────────────────────────────
  const handleOpenApp = async () => {
    if (!method) return;
    setOpeningApp(true);
    await openPaymentApp(method, amount, txnId);
    setOpeningApp(false);
  };

  const handleCopy = (text: string) => {
    Clipboard.setStringAsync(text);
    setDialog({ title: 'Copied!', message: 'Copied to clipboard.', icon: 'checkmark-circle', iconVariant: 'success', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
  };

  // ── Step 3: Upload receipt ──────────────────────────────────────────────────
  const handlePickImage = useCallback(async (source: 'gallery' | 'camera') => {
    const result = source === 'gallery' ? await pickReceiptImage() : await captureReceiptCamera();
    if (!result) {
      setDialog({ title: 'Permission Required', message: `Please allow ${source === 'gallery' ? 'photo library' : 'camera'} access in Settings.`, icon: 'alert-circle-outline', iconVariant: 'warning', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
      return;
    }
    setReceipt(result);
  }, []);

  const handleSubmitReceipt = async () => {
    if (!receipt) {
      setDialog({ title: 'No Receipt', message: 'Please upload your payment receipt first.', icon: 'image-outline', iconVariant: 'warning', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
      return;
    }
    if (!user?.id) {
      setDialog({ title: 'Not Logged In', message: 'Please log in first.', icon: 'log-in-outline', iconVariant: 'warning', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
      return;
    }
    if (method?.id !== 'bank' && !externalTxnId.trim()) {
      setDialog({ title: 'Missing Transaction ID', message: `Please enter the ${method?.name} Transaction ID shown on your payment confirmation.`, icon: 'alert-circle-outline', iconVariant: 'warning', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
      return;
    }
    setIsUploading(true);
    const { receiptUrl: url, error } = await uploadReceiptAndUpdateTransaction(receipt, txnId, user.id, externalTxnId.trim() || undefined);
    setIsUploading(false);
    if (error) {
      setDialog({ title: 'Upload Failed', message: `Could not upload receipt: ${error}\n\nNote your Transaction ID and contact support.`, icon: 'alert-circle-outline', iconVariant: 'destructive', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
      return;
    }
    setReceiptUrl(url ?? '');
    setStep('done');
  };

  // ── Shared header ───────────────────────────────────────────────────────────
  const renderHeader = (title: string, subtitle?: string) => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => {
        if (step === 'select') router.back();
        else if (step === 'instructions') setStep('select');
        else if (step === 'upload') setStep('instructions');
      }}>
        {step !== 'done' && <Ionicons name="arrow-back" size={24} color={colors.foreground} />}
      </TouchableOpacity>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
      </View>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderStepDots = () => (
    <View style={styles.stepDots}>
      {(['select', 'instructions', 'upload', 'done'] as Step[]).map((s, i) => {
        const idx = ['select', 'instructions', 'upload', 'done'].indexOf(step);
        const completed = idx > i;
        const active    = step === s;
        return <View key={s} style={[styles.stepDot, { backgroundColor: completed || active ? colors.primary : colors.border, width: active ? 20 : 8 }]} />;
      })}
    </View>
  );

  // ── STEP 1 ──────────────────────────────────────────────────────────────────
  const renderSelect = () => (
    <>
      {renderHeader('Payment Methods', 'Choose how you want to pay')}
      {renderStepDots()}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PAYMENT METHOD</Text>
        {PAYMENT_METHODS.map((m) => {
          const active = selectedId === m.id;
          return (
            <TouchableOpacity key={m.id} activeOpacity={0.8}
              style={[styles.methodCard, {
                backgroundColor: active ? colors.secondary : colors.card,
                borderColor: active ? colors.foreground : colors.border,
                borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
              }]}
              onPress={() => setSelectedId(m.id)}
            >
              <View style={[styles.methodIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name={m.icon as any} size={28} color={colors.foreground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodName, { color: colors.foreground }]}>{m.name}</Text>
                <Text style={[styles.methodSub, { color: colors.mutedForeground }]}>
                  {m.id === 'bank' ? 'IBFT / Bank Transfer' : 'Mobile Wallet'}
                </Text>
              </View>
              <View style={[styles.radioCircle, { borderColor: active ? colors.foreground : colors.border, backgroundColor: active ? colors.foreground : 'transparent' }]}>
                {active && <Ionicons name="checkmark" size={14} color={colors.background} />}
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: Spacing[6] }]}>AMOUNT (PKR)</Text>
        <View style={[styles.amountBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.currencyLabel, { color: colors.mutedForeground }]}>Rs.</Text>
          <TextInput
            style={[styles.amountInput, { color: colors.foreground }]}
            placeholder="0.00" placeholderTextColor={colors.mutedForeground}
            value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad" returnKeyType="done"
          />
        </View>

        <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.foreground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            A unique Transaction ID will be generated for your payment — this protects against fraud and helps us verify your receipt.
          </Text>
        </View>

        <TouchableOpacity activeOpacity={0.85}
          style={[styles.proceedBtn, { backgroundColor: selectedId ? (method?.color ?? colors.primary) : colors.border }]}
          onPress={handleProceed} disabled={isSaving || !selectedId}
        >
          {isSaving ? <ActivityIndicator color="#fff" /> : <>
            <Text style={styles.proceedBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </>}
        </TouchableOpacity>
        <View style={{ height: Spacing[8] }} />
      </ScrollView>
    </>
  );

  // ── STEP 2 ──────────────────────────────────────────────────────────────────
  const renderInstructions = () => {
    if (!method) return null;
    const lines = method.instructions.map(l => l.replace('{amount}', amount).replace('{txnId}', txnId));
    return (
      <>
        {renderHeader(method.name, 'Follow these steps')}
        {renderStepDots()}
        <ScrollView contentContainerStyle={styles.content}>

          {/* TXN ID */}
          <View style={[styles.txnCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.txnCardHeader}>
              <Ionicons name="receipt-outline" size={18} color={colors.foreground} />
              <Text style={[styles.txnLabel, { color: colors.foreground }]}>Your Transaction ID</Text>
            </View>
            <Text style={[styles.txnId, { color: colors.foreground }]}>{txnId}</Text>
            <TouchableOpacity style={[styles.copyBtn, { borderColor: colors.border }]} onPress={() => handleCopy(txnId)} activeOpacity={0.7}>
              <Ionicons name="copy-outline" size={15} color={colors.foreground} />
              <Text style={[styles.copyBtnText, { color: colors.foreground }]}>Copy Transaction ID</Text>
            </TouchableOpacity>
            <Text style={[styles.txnNote, { color: colors.mutedForeground }]}>
              ⚠️ Use this ID as the payment reference/remarks. Required for verification.
            </Text>
          </View>

          {/* Amount badge */}
          <View style={[styles.amountBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={[styles.amountBadgeLabel, { color: colors.mutedForeground }]}>Amount to Pay</Text>
            <Text style={[styles.amountBadgeValue, { color: colors.foreground }]}>Rs. {parseFloat(amount).toLocaleString()}</Text>
          </View>

          {/* Wallet / Bank account details */}
          {(method.accountDetails || method.bankDetails) && (() => {
            const details = method.accountDetails ?? method.bankDetails!;
            const title = method.id === 'bank'
              ? 'Bank Account Details'
              : `Send Money to This ${method.name} Account`;
            return (
              <View style={[styles.bankBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.bankBoxHeaderRow}>
                  <Ionicons name={method.id === 'bank' ? 'business-outline' : 'phone-portrait-outline'} size={18} color={colors.foreground} />
                  <Text style={[styles.bankBoxTitle, { color: colors.foreground }]}>{title}</Text>
                </View>
                {details.map((d) => (
                  <View key={d.label} style={styles.bankRow}>
                    <Text style={[styles.bankLabel, { color: colors.mutedForeground }]}>{d.label}</Text>
                    <TouchableOpacity style={styles.bankValueRow} onPress={() => handleCopy(d.value)} activeOpacity={0.7}>
                      <Text style={[styles.bankValue, { color: colors.foreground }]}>{d.value}</Text>
                      <Ionicons name="copy-outline" size={14} color={colors.mutedForeground} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={[styles.tapToCopyHint, { borderTopColor: colors.border }]}>
                  <Ionicons name="finger-print-outline" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.tapToCopyText, { color: colors.mutedForeground }]}>Tap any value to copy</Text>
                </View>
              </View>
            );
          })()}

          {/* Step instructions */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>STEPS TO FOLLOW</Text>
          <View style={[styles.instructionsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {lines.map((line, i) => (
              <View key={i} style={[styles.instructionRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <Text style={[styles.instructionText, { color: colors.foreground }]}>{line}</Text>
              </View>
            ))}
          </View>

          {/* Open App */}
          {method.id !== 'bank' && (
            <TouchableOpacity activeOpacity={0.85}
              style={[styles.openAppBtn, { backgroundColor: colors.foreground }]}
              onPress={handleOpenApp} disabled={openingApp}
            >
              {openingApp ? <ActivityIndicator color={colors.background} /> : <>
                <Ionicons name="phone-portrait-outline" size={20} color={colors.background} />
                <Text style={[styles.openAppBtnText, { color: colors.background }]}>Open {method.name}</Text>
              </>}
            </TouchableOpacity>
          )}

          <TouchableOpacity activeOpacity={0.85}
            style={[styles.proceedBtn, { backgroundColor: colors.foreground, marginTop: Spacing[3] }]}
            onPress={() => setStep('upload')}
          >
            <Text style={styles.proceedBtnText}>I've Paid — Upload Receipt</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ height: Spacing[8] }} />
        </ScrollView>
      </>
    );
  };

  // ── STEP 3 ──────────────────────────────────────────────────────────────────
  const renderUpload = () => {
    if (!method) return null;
    return (
      <>
        {renderHeader('Upload Receipt', 'Proof of your payment')}
        {renderStepDots()}
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.txnReminder, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={[styles.txnReminderLabel, { color: colors.mutedForeground }]}>Our Transaction ID (for your reference)</Text>
            <Text style={[styles.txnReminderValue, { color: colors.foreground }]}>{txnId}</Text>
          </View>

          {/* External TXN ID (Easypaisa/JazzCash generated) */}
          {method.id !== 'bank' && (
            <View style={[styles.externalTxnBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.externalTxnHeader}>
                <Ionicons name="receipt-outline" size={18} color={colors.foreground} />
                <Text style={[styles.externalTxnTitle, { color: colors.foreground }]}>
                  {method.name} Transaction ID *
                </Text>
              </View>
              <Text style={[styles.externalTxnDesc, { color: colors.mutedForeground }]}>
                Enter the Transaction ID shown on your {method.name} payment confirmation screen or SMS.
              </Text>
              <TextInput
                style={[styles.externalTxnInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
                placeholder={`e.g. EP12345678 or ETP-XXXXXXXX`}
                placeholderTextColor={colors.mutedForeground}
                value={externalTxnId}
                onChangeText={setExternalTxnId}
                autoCapitalize="characters"
                returnKeyType="done"
              />
            </View>
          )}

          {receipt ? (
            <View style={styles.receiptPreviewWrap}>
              <Image source={{ uri: receipt.uri }} style={styles.receiptPreview} resizeMode="cover" />
              <TouchableOpacity activeOpacity={0.7}
                style={[styles.changeReceiptBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setReceipt(null)}
              >
                <Ionicons name="refresh-outline" size={16} color={colors.foreground} />
                <Text style={[styles.changeReceiptText, { color: colors.foreground }]}>Change Receipt</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadArea}>
              <View style={[styles.uploadPlaceholder, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Ionicons name="cloud-upload-outline" size={48} color={colors.mutedForeground} />
                <Text style={[styles.uploadTitle, { color: colors.foreground }]}>Upload Receipt</Text>
                <Text style={[styles.uploadDesc, { color: colors.mutedForeground }]}>
                  Screenshot or photo of your payment confirmation
                </Text>
              </View>
              <View style={styles.uploadBtns}>
                <TouchableOpacity activeOpacity={0.8}
                  style={[styles.uploadBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  onPress={() => handlePickImage('gallery')}
                >
                  <Ionicons name="images-outline" size={22} color={colors.foreground} />
                  <Text style={[styles.uploadBtnText, { color: colors.foreground }]}>Photo Library</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8}
                  style={[styles.uploadBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  onPress={() => handlePickImage('camera')}
                >
                  <Ionicons name="camera-outline" size={22} color={colors.foreground} />
                  <Text style={[styles.uploadBtnText, { color: colors.foreground }]}>Camera</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.foreground} />
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              Your receipt is matched against your unique Transaction ID. Mismatched or fraudulent receipts will be automatically rejected.
            </Text>
          </View>

          <TouchableOpacity activeOpacity={0.85}
            style={[styles.proceedBtn, { backgroundColor: (receipt && (method.id === 'bank' || externalTxnId.trim())) ? colors.foreground : colors.border }]}
            onPress={handleSubmitReceipt} disabled={isUploading || !receipt || (method.id !== 'bank' && !externalTxnId.trim())}
          >
            {isUploading ? <ActivityIndicator color={colors.background} /> : <>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.background} />
              <Text style={styles.proceedBtnText}>Submit Receipt</Text>
            </>}
          </TouchableOpacity>
          <View style={{ height: Spacing[8] }} />
        </ScrollView>
      </>
    );
  };

  // ── STEP 4 ──────────────────────────────────────────────────────────────────
  const renderDone = () => (
    <>
      {renderHeader('Payment Submitted', '')}
      <ScrollView contentContainerStyle={[styles.content, styles.doneContent]}>
        <View style={[styles.doneIcon, { backgroundColor: colors.secondary }]}>
          <Ionicons name="checkmark-circle" size={72} color={colors.foreground} />
        </View>
        <Text style={[styles.doneTitle, { color: colors.foreground }]}>Receipt Submitted!</Text>
        <Text style={[styles.doneDesc, { color: colors.mutedForeground }]}>
          Your payment receipt has been submitted for verification. We'll update your account within 24 hours.
        </Text>

        <View style={[styles.doneTxnBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.doneTxnLabel, { color: colors.mutedForeground }]}>Transaction ID</Text>
          <Text style={[styles.doneTxnValue, { color: colors.foreground }]}>{txnId}</Text>
          <View style={[styles.doneStatusBadge, { backgroundColor: colors.secondary, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>
            <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
            <Text style={[styles.doneStatusText, { color: colors.mutedForeground }]}>Pending Verification</Text>
          </View>
        </View>

        {receiptUrl ? <Image source={{ uri: receiptUrl }} style={styles.doneReceiptThumb} resizeMode="cover" /> : null}

        <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.foreground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Keep your Transaction ID ({txnId}) as proof. Contact support if verification takes more than 24 hours.
          </Text>
        </View>

        <TouchableOpacity activeOpacity={0.85}
          style={[styles.proceedBtn, { backgroundColor: colors.primary, marginTop: Spacing[4] }]}
          onPress={() => router.replace('/(tabs)/profile')}
        >
          <Ionicons name="home-outline" size={20} color="#fff" />
          <Text style={styles.proceedBtnText}>Back to Profile</Text>
        </TouchableOpacity>
        <View style={{ height: Spacing[8] }} />
      </ScrollView>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {step === 'select'       && renderSelect()}
        {step === 'instructions' && renderInstructions()}
        {step === 'upload'       && renderUpload()}
        {step === 'done'         && renderDone()}
      </KeyboardAvoidingView>
      {dialog && <Dialog visible {...dialog} onDismiss={() => setDialog(null)} />}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700', textAlign: 'center' },
  headerSub: { fontSize: Typography.fontSize.xs, marginTop: 2, textAlign: 'center' },

  stepDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: Spacing[3] },
  stepDot: { height: 8, borderRadius: 4 },

  content: { padding: Spacing[4] },

  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing[3] },

  methodCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing[4], borderRadius: BorderRadius.DEFAULT, marginBottom: Spacing[3],
  },
  methodIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginRight: Spacing[3] },
  methodName: { fontSize: Typography.fontSize.base, fontWeight: '700' },
  methodSub: { fontSize: Typography.fontSize.xs, marginTop: 2 },
  radioCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },

  amountBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderRadius: BorderRadius.DEFAULT,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    marginBottom: Spacing[4], gap: Spacing[2],
  },
  currencyLabel: { fontSize: 18, fontWeight: '700' },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '800' },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[2],
    padding: Spacing[4], borderRadius: BorderRadius.DEFAULT,
    borderWidth: 1, marginBottom: Spacing[4],
  },
  infoText: { flex: 1, fontSize: Typography.fontSize.xs, lineHeight: 18 },

  proceedBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing[2], paddingVertical: Spacing[4], borderRadius: BorderRadius.DEFAULT,
  },
  proceedBtnText: { color: '#fff', fontSize: Typography.fontSize.base, fontWeight: '700' },

  txnCard: { borderRadius: BorderRadius.DEFAULT, borderWidth: 1.5, padding: Spacing[4], marginBottom: Spacing[4] },
  txnCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[2] },
  txnLabel: { fontSize: Typography.fontSize.sm, fontWeight: '700', textTransform: 'uppercase' },
  txnId: { fontSize: 18, fontWeight: '800', letterSpacing: 1.2, marginBottom: Spacing[3] },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[1],
    alignSelf: 'flex-start', borderWidth: 1,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    borderRadius: BorderRadius.DEFAULT, marginBottom: Spacing[3],
  },
  copyBtnText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  txnNote: { fontSize: Typography.fontSize.xs, lineHeight: 16 },

  amountBadge: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing[4], borderRadius: BorderRadius.DEFAULT, borderWidth: 1, marginBottom: Spacing[4],
  },
  amountBadgeLabel: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  amountBadgeValue: { fontSize: 22, fontWeight: '800' },

  bankBox: { borderRadius: BorderRadius.DEFAULT, padding: Spacing[4], marginBottom: Spacing[4] },
  bankBoxHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[3] },
  bankBoxTitle: { fontSize: Typography.fontSize.base, fontWeight: '700' },
  tapToCopyHint: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: Spacing[3], borderTopWidth: StyleSheet.hairlineWidth, marginTop: Spacing[1] },
  tapToCopyText: { fontSize: 11 },
  bankRow: { marginBottom: Spacing[3] },
  bankLabel: { fontSize: Typography.fontSize.xs, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  bankValueRow: { flexDirection: 'row', alignItems: 'center' },
  bankValue: { fontSize: Typography.fontSize.sm, fontWeight: '500' },

  instructionsBox: { borderRadius: BorderRadius.DEFAULT, borderWidth: StyleSheet.hairlineWidth, marginBottom: Spacing[4], overflow: 'hidden' },
  instructionRow: { padding: Spacing[4] },
  instructionText: { fontSize: Typography.fontSize.sm, lineHeight: 20 },

  openAppBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing[2], paddingVertical: Spacing[4], borderRadius: BorderRadius.DEFAULT, marginBottom: Spacing[2],
  },
  openAppBtnText: { fontSize: Typography.fontSize.base, fontWeight: '700' },

  txnReminder: { padding: Spacing[4], borderRadius: BorderRadius.DEFAULT, borderWidth: 1, marginBottom: Spacing[4], alignItems: 'center' },
  txnReminderLabel: { fontSize: Typography.fontSize.xs, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  txnReminderValue: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },

  uploadArea: { marginBottom: Spacing[4] },
  uploadPlaceholder: {
    alignItems: 'center', padding: Spacing[8],
    borderRadius: BorderRadius.DEFAULT, borderWidth: 2,
    borderStyle: 'dashed', marginBottom: Spacing[4],
  },
  uploadTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700', marginTop: Spacing[3], marginBottom: Spacing[2] },
  uploadDesc: { fontSize: Typography.fontSize.sm, textAlign: 'center', lineHeight: 18 },
  uploadBtns: { flexDirection: 'row', gap: Spacing[3] },
  uploadBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing[2], paddingVertical: Spacing[4], borderRadius: BorderRadius.DEFAULT, borderWidth: 1,
  },
  uploadBtnText: { fontSize: Typography.fontSize.sm, fontWeight: '700' },

  receiptPreviewWrap: { marginBottom: Spacing[4], borderRadius: BorderRadius.DEFAULT, overflow: 'hidden' },
  receiptPreview: { width: '100%', height: 220, borderRadius: BorderRadius.DEFAULT },
  changeReceiptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2],
    paddingVertical: Spacing[3], borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomLeftRadius: BorderRadius.DEFAULT, borderBottomRightRadius: BorderRadius.DEFAULT,
  },
  changeReceiptText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },

  doneContent: { alignItems: 'center', paddingTop: Spacing[6] },
  doneIcon: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing[5] },
  doneTitle: { fontSize: 26, fontWeight: '800', marginBottom: Spacing[3], textAlign: 'center' },
  doneDesc: { fontSize: Typography.fontSize.base, textAlign: 'center', lineHeight: 22, marginBottom: Spacing[6], paddingHorizontal: Spacing[4] },
  doneTxnBox: { width: '100%', borderRadius: BorderRadius.DEFAULT, borderWidth: StyleSheet.hairlineWidth, padding: Spacing[4], alignItems: 'center', marginBottom: Spacing[4] },
  doneTxnLabel: { fontSize: Typography.fontSize.xs, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  doneTxnValue: { fontSize: 18, fontWeight: '800', letterSpacing: 1, marginBottom: Spacing[3] },
  doneStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing[3], paddingVertical: Spacing[1], borderRadius: 20 },
  doneStatusText: { fontSize: Typography.fontSize.xs, fontWeight: '700' },
  doneReceiptThumb: { width: '100%', height: 180, borderRadius: BorderRadius.DEFAULT, marginBottom: Spacing[4] },

  externalTxnBox: { borderRadius: BorderRadius.DEFAULT, borderWidth: 1.5, padding: Spacing[4], marginBottom: Spacing[4] },
  externalTxnHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[2] },
  externalTxnTitle: { fontSize: Typography.fontSize.sm, fontWeight: '700', textTransform: 'uppercase' },
  externalTxnDesc: { fontSize: Typography.fontSize.xs, lineHeight: 17, marginBottom: Spacing[3] },
  externalTxnInput: {
    borderWidth: 1.5, borderRadius: BorderRadius.DEFAULT,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    fontSize: Typography.fontSize.base, fontWeight: '600', letterSpacing: 0.5,
  },
});
