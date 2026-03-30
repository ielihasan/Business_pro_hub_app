import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { useStore, SavedPaymentMethod, WalletPaymentType } from '@/store/useStore';
import { COMMITMENT_FEE, PAKISTAN_BANKS } from '@/lib/wallet';
import Dialog, { DialogConfig } from '@/components/ui/Dialog';

// ─── Types ────────────────────────────────────────────────────────────────────

type MethodType = WalletPaymentType;

const METHOD_META: Record<
  MethodType,
  { label: string; icon: string; color: string; placeholder: string; hint: string }
> = {
  easypaisa: {
    label:       'Easypaisa',
    icon:        'phone-portrait-outline',
    color:       '#37B34A',
    placeholder: '03XX-XXXXXXX',
    hint:        'Enter your registered Easypaisa mobile number',
  },
  jazzcash: {
    label:       'JazzCash',
    icon:        'phone-portrait-outline',
    color:       '#BF202F',
    placeholder: '03XX-XXXXXXX',
    hint:        'Enter your registered JazzCash mobile number',
  },
  bank: {
    label:       'Bank Account',
    icon:        'business-outline',
    color:       '#2563EB',
    placeholder: 'PK00XXXX0000000000000000',
    hint:        'Enter your IBAN (24-digit account number)',
  },
};

function maskNumber(num: string, type: MethodType): string {
  if (type === 'bank') {
    if (num.length <= 6) return num;
    return `${num.slice(0, 6)}••••••••${num.slice(-4)}`;
  }
  // Mobile number: 0311-1234567 → 0311-•••4567
  const digits = num.replace(/\D/g, '');
  if (digits.length <= 7) return num;
  return `${digits.slice(0, 4)}-•••${digits.slice(-4)}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WalletPaymentScreen() {
  const { colors, isDark } = useTheme();

  const user           = useStore((s) => s.user);
  const paymentMethods = useStore((s) => s.paymentMethods);
  const loadWallet     = useStore((s) => s.loadWallet);
  const addMethod      = useStore((s) => s.addWalletPaymentMethod);
  const removeMethod   = useStore((s) => s.removeWalletPaymentMethod);
  const setDefault     = useStore((s) => s.setDefaultWalletPaymentMethod);

  const [refreshing, setRefreshing] = useState(false);
  const [dialog,     setDialog]     = useState<DialogConfig | null>(null);
  const [showAdd,    setShowAdd]    = useState(false);

  // Add-method form state
  const [selType,       setSelType]       = useState<MethodType>('easypaisa');
  const [accountTitle,  setAccountTitle]  = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName,      setBankName]      = useState('');
  const [showBankList,  setShowBankList]  = useState(false);
  const [saving,        setSaving]        = useState(false);

  // ── Load wallet on mount
  useEffect(() => {
    loadWallet();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallet();
    setRefreshing(false);
  };

  const resetForm = () => {
    setSelType('easypaisa');
    setAccountTitle('');
    setAccountNumber('');
    setBankName('');
    setShowBankList(false);
  };

  // ── Add method ──────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!accountTitle.trim()) {
      setDialog({
        title: 'Missing Name', message: 'Please enter your account title / full name.',
        icon: 'person-outline', iconVariant: 'warning',
        actions: [{ label: 'OK', onPress: () => setDialog(null) }],
      });
      return;
    }
    if (!accountNumber.trim()) {
      setDialog({
        title: 'Missing Number', message: 'Please enter your account / mobile number.',
        icon: 'call-outline', iconVariant: 'warning',
        actions: [{ label: 'OK', onPress: () => setDialog(null) }],
      });
      return;
    }
    if (selType === 'bank' && !bankName.trim()) {
      setDialog({
        title: 'Select Bank', message: 'Please select your bank from the list.',
        icon: 'business-outline', iconVariant: 'warning',
        actions: [{ label: 'OK', onPress: () => setDialog(null) }],
      });
      return;
    }

    setSaving(true);
    const result = await addMethod({
      type:          selType,
      accountTitle:  accountTitle.trim(),
      accountNumber: accountNumber.trim(),
      bankName:      selType === 'bank' ? bankName.trim() : undefined,
    });
    setSaving(false);

    if (!result.success) {
      setDialog({
        title: 'Error', message: result.error ?? 'Failed to save payment method.',
        icon: 'alert-circle-outline', iconVariant: 'destructive',
        actions: [{ label: 'OK', onPress: () => setDialog(null) }],
      });
      return;
    }

    setShowAdd(false);
    resetForm();
    setDialog({
      title: 'Method Saved!',
      message: `Your ${METHOD_META[selType].label} account has been saved successfully.`,
      icon: 'checkmark-circle-outline', iconVariant: 'success',
      actions: [{ label: 'OK', onPress: () => setDialog(null) }],
    });
  };

  // ── Delete method ──────────────────────────────────────────────────────────
  const handleDelete = (method: SavedPaymentMethod) => {
    setDialog({
      title: 'Remove Method',
      message: `Remove ${METHOD_META[method.type].label} ending in ${method.accountNumber.slice(-4)}?`,
      icon: 'trash-outline', iconVariant: 'destructive',
      actions: [
        { label: 'Cancel',  variant: 'secondary', onPress: () => setDialog(null) },
        {
          label: 'Remove', variant: 'destructive',
          onPress: async () => {
            setDialog(null);
            const res = await removeMethod(method.id);
            if (!res.success) {
              setDialog({
                title: 'Error', message: res.error ?? 'Could not remove method.',
                icon: 'alert-circle-outline', iconVariant: 'destructive',
                actions: [{ label: 'OK', onPress: () => setDialog(null) }],
              });
            }
          },
        },
      ],
    });
  };

  // ── Theme ──────────────────────────────────────────────────────────────────
  const BG     = colors.background;
  const FG     = colors.foreground;
  const MUTED  = colors.mutedForeground;
  const BORDER = colors.border;
  const CARD   = colors.card;
  const SEC    = colors.secondary;

  const walletBalance = user?.walletBalance ?? null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <SafeAreaView edges={['top']} style={{ backgroundColor: BG }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: BORDER }]}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: CARD, borderColor: BORDER }]}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-back" size={20} color={FG} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.headerLabel, { color: MUTED }]}>ACCOUNT</Text>
            <Text style={[styles.headerTitle, { color: FG }]}>WALLET & PAYMENTS</Text>
          </View>
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: CARD, borderColor: BORDER }]}
            onPress={onRefresh}
            activeOpacity={0.75}
            disabled={refreshing}
          >
            {refreshing
              ? <ActivityIndicator size="small" color={FG} />
              : <Ionicons name="refresh-outline" size={18} color={FG} />}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Wallet Card ──────────────────────────────────────────────────── */}
        <View style={[styles.walletCard, { backgroundColor: FG }]}>
          {/* Logo row */}
          <View style={styles.walletTop}>
            <View style={styles.walletBrandRow}>
              <Ionicons name="wallet-outline" size={18} color={BG} />
              <Text style={[styles.walletBrand, { color: BG }]}>BusinessHub Pro</Text>
            </View>
            <Text style={[styles.walletTag, { color: BG + 'AA' }]}>DIGITAL WALLET</Text>
          </View>

          {/* Balance */}
          <View style={styles.walletMid}>
            <Text style={[styles.walletBalLabel, { color: BG + '99' }]}>AVAILABLE BALANCE</Text>
            {walletBalance === null ? (
              <ActivityIndicator color={BG} style={{ marginTop: 6 }} />
            ) : (
              <Text style={[styles.walletBal, { color: BG }]}>
                Rs {walletBalance.toLocaleString('en-PK')}
              </Text>
            )}
          </View>

          {/* Holder row */}
          <View style={styles.walletBottom}>
            <View>
              <Text style={[styles.walletHolderLabel, { color: BG + '77' }]}>ACCOUNT HOLDER</Text>
              <Text style={[styles.walletHolder, { color: BG }]} numberOfLines={1}>
                {user?.name ?? '—'}
              </Text>
            </View>
            <View style={[styles.walletChip, { backgroundColor: BG + '22', borderColor: BG + '44' }]}>
              <Text style={[styles.walletChipText, { color: BG }]}>PKR</Text>
            </View>
          </View>
        </View>

        {/* ── Commitment Fee Info ───────────────────────────────────────────── */}
        <View style={[styles.infoCard, { backgroundColor: CARD, borderColor: BORDER }]}>
          <View style={[styles.infoIconWrap, { backgroundColor: SEC, borderColor: BORDER }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={FG} />
          </View>
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: FG }]}>Queue Commitment Fee</Text>
            <Text style={[styles.infoSub, { color: MUTED }]}>
              Rs {COMMITMENT_FEE} is deducted from your wallet each time you join a queue. This ensures customers show up and keeps wait times accurate.
            </Text>
          </View>
        </View>

        {/* ── Payment Methods ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { color: MUTED }]}>SAVED PAYMENT METHODS</Text>
            <Text style={[styles.sectionCount, { color: MUTED }]}>{paymentMethods.length}</Text>
          </View>

          {paymentMethods.length === 0 ? (
            <View style={[styles.emptyMethods, { backgroundColor: CARD, borderColor: BORDER }]}>
              <Ionicons name="card-outline" size={32} color={MUTED} />
              <Text style={[styles.emptyTitle, { color: FG }]}>No payment methods saved</Text>
              <Text style={[styles.emptySub, { color: MUTED }]}>
                Add EasyPaisa, JazzCash, or a bank account to get started.
              </Text>
            </View>
          ) : (
            <View style={styles.methodsList}>
              {paymentMethods.map((method) => {
                const meta = METHOD_META[method.type];
                return (
                  <View
                    key={method.id}
                    style={[
                      styles.methodCard,
                      {
                        backgroundColor: CARD,
                        borderColor: method.isDefault ? FG : BORDER,
                        borderWidth: method.isDefault ? 1.5 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.methodIconWrap, { backgroundColor: meta.color + '18', borderColor: meta.color + '44' }]}>
                      <Ionicons name={meta.icon as any} size={22} color={meta.color} />
                    </View>

                    <View style={styles.methodInfo}>
                      <View style={styles.methodNameRow}>
                        <Text style={[styles.methodName, { color: FG }]}>{meta.label}</Text>
                        {method.isDefault && (
                          <View style={[styles.defaultBadge, { backgroundColor: FG }]}>
                            <Text style={[styles.defaultBadgeText, { color: BG }]}>DEFAULT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.methodTitle, { color: MUTED }]}>{method.accountTitle}</Text>
                      <Text style={[styles.methodNumber, { color: FG }]}>
                        {maskNumber(method.accountNumber, method.type)}
                      </Text>
                      {method.bankName ? (
                        <Text style={[styles.methodBank, { color: MUTED }]}>{method.bankName}</Text>
                      ) : null}
                    </View>

                    <View style={styles.methodActions}>
                      {!method.isDefault && (
                        <TouchableOpacity
                          style={[styles.methodActionBtn, { borderColor: BORDER }]}
                          onPress={() => setDefault(method.id)}
                          activeOpacity={0.75}
                        >
                          <Ionicons name="star-outline" size={15} color={FG} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.methodActionBtn, { borderColor: BORDER }]}
                        onPress={() => handleDelete(method)}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="trash-outline" size={15} color={colors.destructive} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Add button */}
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: FG }]}
            onPress={() => { resetForm(); setShowAdd(true); }}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={20} color={BG} />
            <Text style={[styles.addBtnText, { color: BG }]}>Add Payment Method</Text>
          </TouchableOpacity>
        </View>

        {/* ── Accepted Methods Info ─────────────────────────────────────────── */}
        <View style={[styles.acceptedCard, { backgroundColor: CARD, borderColor: BORDER }]}>
          <Text style={[styles.acceptedTitle, { color: MUTED }]}>ACCEPTED METHODS</Text>
          <View style={styles.acceptedRow}>
            {(['easypaisa', 'jazzcash', 'bank'] as MethodType[]).map((t) => {
              const meta = METHOD_META[t];
              return (
                <View key={t} style={[styles.acceptedItem, { backgroundColor: SEC, borderColor: BORDER }]}>
                  <Ionicons name={meta.icon as any} size={16} color={meta.color} />
                  <Text style={[styles.acceptedLabel, { color: FG }]}>{meta.label}</Text>
                </View>
              );
            })}
          </View>
          <Text style={[styles.acceptedNote, { color: MUTED }]}>
            20+ Pakistan banks supported including HBL, UBL, MCB, Meezan, Alfalah, Allied, BOP, Faysal and more.
          </Text>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* ── Add Method Modal ───────────────────────────────────────────────────── */}
      <Modal
        visible={showAdd}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAdd(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => { if (!showBankList) setShowAdd(false); }}
          />

          <View style={[styles.modalSheet, { backgroundColor: BG, borderColor: BORDER }]}>
            {/* Sheet handle */}
            <View style={[styles.sheetHandle, { backgroundColor: BORDER }]} />

            <View style={[styles.sheetHeader, { borderBottomColor: BORDER }]}>
              <Text style={[styles.sheetTitle, { color: FG }]}>Add Payment Method</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={FG} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Type selector */}
              <Text style={[styles.fieldLabel, { color: MUTED }]}>TYPE</Text>
              <View style={styles.typeRow}>
                {(['easypaisa', 'jazzcash', 'bank'] as MethodType[]).map((t) => {
                  const meta   = METHOD_META[t];
                  const active = selType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeChip,
                        {
                          backgroundColor: active ? FG : CARD,
                          borderColor:     active ? FG : BORDER,
                          flex: 1,
                        },
                      ]}
                      onPress={() => { setSelType(t); setAccountNumber(''); setBankName(''); }}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={meta.icon as any}
                        size={16}
                        color={active ? BG : meta.color}
                      />
                      <Text style={[styles.typeChipText, { color: active ? BG : FG }]}>
                        {meta.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Account title */}
              <Text style={[styles.fieldLabel, { color: MUTED }]}>ACCOUNT TITLE / FULL NAME</Text>
              <View style={[styles.inputBox, { backgroundColor: CARD, borderColor: BORDER }]}>
                <Ionicons name="person-outline" size={16} color={MUTED} />
                <TextInput
                  style={[styles.input, { color: FG }]}
                  placeholder="e.g. Muhammad Ali Khan"
                  placeholderTextColor={MUTED}
                  value={accountTitle}
                  onChangeText={setAccountTitle}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              {/* Account number */}
              <Text style={[styles.fieldLabel, { color: MUTED }]}>
                {selType === 'bank' ? 'IBAN / ACCOUNT NUMBER' : 'MOBILE NUMBER'}
              </Text>
              <View style={[styles.inputBox, { backgroundColor: CARD, borderColor: BORDER }]}>
                <Ionicons
                  name={selType === 'bank' ? 'card-outline' : 'call-outline'}
                  size={16}
                  color={MUTED}
                />
                <TextInput
                  style={[styles.input, { color: FG }]}
                  placeholder={METHOD_META[selType].placeholder}
                  placeholderTextColor={MUTED}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType={selType === 'bank' ? 'default' : 'phone-pad'}
                  autoCapitalize="characters"
                  returnKeyType="next"
                />
              </View>
              <Text style={[styles.fieldHint, { color: MUTED }]}>
                {METHOD_META[selType].hint}
              </Text>

              {/* Bank selector (only for bank type) */}
              {selType === 'bank' && (
                <>
                  <Text style={[styles.fieldLabel, { color: MUTED }]}>BANK NAME</Text>
                  <TouchableOpacity
                    style={[styles.inputBox, { backgroundColor: CARD, borderColor: BORDER }]}
                    onPress={() => setShowBankList(!showBankList)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="business-outline" size={16} color={MUTED} />
                    <Text style={[styles.input, { color: bankName ? FG : MUTED, flex: 1 }]}>
                      {bankName || 'Select your bank…'}
                    </Text>
                    <Ionicons
                      name={showBankList ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={MUTED}
                    />
                  </TouchableOpacity>

                  {showBankList && (
                    <View style={[styles.bankDropdown, { backgroundColor: CARD, borderColor: BORDER }]}>
                      {PAKISTAN_BANKS.map((bank) => (
                        <TouchableOpacity
                          key={bank.id}
                          style={[
                            styles.bankOption,
                            { borderBottomColor: BORDER },
                            bankName === bank.name && { backgroundColor: SEC },
                          ]}
                          onPress={() => { setBankName(bank.name); setShowBankList(false); }}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.bankOptShort, { color: MUTED }]}>{bank.shortName}</Text>
                          <Text style={[styles.bankOptName, { color: FG }]}>{bank.name}</Text>
                          {bankName === bank.name && (
                            <Ionicons name="checkmark" size={16} color={FG} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}

              {/* Save button */}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: FG, opacity: saving ? 0.6 : 1 }]}
                onPress={handleAdd}
                activeOpacity={0.85}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={BG} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color={BG} />
                    <Text style={[styles.saveBtnText, { color: BG }]}>Save Payment Method</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {dialog && <Dialog visible {...dialog} onDismiss={() => setDialog(null)} />}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  headerText:  { flex: 1 },
  headerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.8 },

  scroll: { paddingHorizontal: 20, paddingTop: 20 },

  /* Wallet card */
  walletCard: {
    borderRadius: 20, padding: 22,
    marginBottom: 16, gap: 16,
    shadowColor: '#000', shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
    elevation: 6,
  },
  walletTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletBrand:    { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
  walletTag:      { fontSize: 9, fontWeight: '700', letterSpacing: 2 },
  walletMid:      {},
  walletBalLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  walletBal:      { fontSize: 36, fontWeight: '900', letterSpacing: -1.5 },
  walletBottom:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  walletHolderLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1.5, marginBottom: 3 },
  walletHolder:   { fontSize: 14, fontWeight: '700', maxWidth: 200 },
  walletChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  walletChipText: { fontSize: 12, fontWeight: '800' },

  /* Info card */
  infoCard: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    borderRadius: 14, borderWidth: 1,
    padding: 14, marginBottom: 20,
  },
  infoIconWrap: {
    width: 40, height: 40, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  infoText:  { flex: 1, gap: 3 },
  infoTitle: { fontSize: 13, fontWeight: '800' },
  infoSub:   { fontSize: 12, lineHeight: 18 },

  /* Section */
  section:      { marginBottom: 20 },
  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  sectionCount: { fontSize: 11, fontWeight: '700' },

  /* Empty state */
  emptyMethods: {
    borderRadius: 14, borderWidth: 1, paddingVertical: 32,
    alignItems: 'center', gap: 8, marginBottom: 14,
  },
  emptyTitle: { fontSize: 14, fontWeight: '800' },
  emptySub:   { fontSize: 12, textAlign: 'center', paddingHorizontal: 24 },

  /* Methods list */
  methodsList: { gap: 10, marginBottom: 14 },
  methodCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 14,
  },
  methodIconWrap: {
    width: 46, height: 46, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  methodInfo:    { flex: 1, gap: 2 },
  methodNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  methodName:    { fontSize: 13, fontWeight: '800' },
  defaultBadge:  { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  defaultBadgeText: { fontSize: 8, fontWeight: '800' },
  methodTitle:   { fontSize: 11 },
  methodNumber:  { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  methodBank:    { fontSize: 10 },
  methodActions: { gap: 8, alignItems: 'center' },
  methodActionBtn: {
    width: 34, height: 34, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Add button */
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 15,
  },
  addBtnText: { fontSize: 15, fontWeight: '800' },

  /* Accepted card */
  acceptedCard: {
    borderRadius: 14, borderWidth: 1, padding: 16,
    gap: 12, marginBottom: 16,
  },
  acceptedTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  acceptedRow:   { flexDirection: 'row', gap: 10 },
  acceptedItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1, flex: 1, justifyContent: 'center',
  },
  acceptedLabel: { fontSize: 11, fontWeight: '700' },
  acceptedNote:  { fontSize: 11, lineHeight: 16 },

  /* Modal */
  modalOverlay:  { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: '#00000060' },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderBottomWidth: 0,
    maxHeight: '90%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle:   { fontSize: 17, fontWeight: '800' },
  sheetScroll:  {},
  sheetContent: { padding: 20 },

  /* Form */
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, marginTop: 16 },
  fieldHint:  { fontSize: 11, marginTop: 6, marginBottom: 4 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  input: { flex: 1, fontSize: 14, padding: 0 },

  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  typeChipText: { fontSize: 10, fontWeight: '700' },

  /* Bank dropdown */
  bankDropdown: {
    borderRadius: 12, borderWidth: 1,
    marginTop: 4, overflow: 'hidden',
  },
  bankOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    gap: 10, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bankOptShort: { fontSize: 11, fontWeight: '700', width: 60 },
  bankOptName:  { flex: 1, fontSize: 13 },

  /* Save button */
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 15, marginTop: 20,
  },
  saveBtnText: { fontSize: 15, fontWeight: '800' },
});
