import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
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
import { useStore, SavedPaymentMethod, WalletPaymentType, WalletInfo } from '@/store/useStore';
import { COMMITMENT_RATE, PAKISTAN_BANKS } from '@/lib/wallet';
import Dialog, { DialogConfig } from '@/components/ui/Dialog';

// ─── Constants ────────────────────────────────────────────────────────────────

type MethodType = WalletPaymentType;

const METHOD_META: Record<
  MethodType,
  { label: string; sublabel: string; icon: string; color: string; bgAlpha: string; placeholder: string; hint: string }
> = {
  easypaisa: {
    label:       'Easypaisa',
    sublabel:    'Mobile Wallet',
    icon:        'phone-portrait-outline',
    color:       '#37B34A',
    bgAlpha:     '#37B34A18',
    placeholder: '03XX-XXXXXXX',
    hint:        'Enter your registered Easypaisa mobile number',
  },
  jazzcash: {
    label:       'JazzCash',
    sublabel:    'Mobile Wallet',
    icon:        'phone-portrait-outline',
    color:       '#BF202F',
    bgAlpha:     '#BF202F18',
    placeholder: '03XX-XXXXXXX',
    hint:        'Enter your registered JazzCash mobile number',
  },
  bank: {
    label:       'Bank Account',
    sublabel:    'IBFT / IBAN',
    icon:        'business-outline',
    color:       '#2563EB',
    bgAlpha:     '#2563EB18',
    placeholder: 'PK00XXXX0000000000000000',
    hint:        'Enter your full IBAN (e.g. PK36MEZN0001234567890123)',
  },
};

function maskNumber(num: string, type: MethodType): string {
  if (type === 'bank') {
    if (num.length <= 8) return num;
    return `${num.slice(0, 6)}  ••••  ••••  ${num.slice(-4)}`;
  }
  const digits = num.replace(/\D/g, '');
  if (digits.length <= 7) return num;
  return `${digits.slice(0, 4)}-•••-${digits.slice(-4)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WalletPaymentScreen() {
  const { colors, isDark } = useTheme();

  const user           = useStore((s) => s.user);
  const paymentMethods = useStore((s) => s.paymentMethods);
  const walletInfo     = useStore((s) => s.walletInfo);
  const loadWallet     = useStore((s) => s.loadWallet);
  const addMethod      = useStore((s) => s.addWalletPaymentMethod);
  const removeMethod   = useStore((s) => s.removeWalletPaymentMethod);
  const setDefault     = useStore((s) => s.setDefaultWalletPaymentMethod);
  const topUpWallet    = useStore((s) => s.topUpWallet);

  const [refreshing,    setRefreshing]    = useState(false);
  const [dialog,        setDialog]        = useState<DialogConfig | null>(null);
  const [showAdd,       setShowAdd]       = useState(false);
  const [showTopUp,     setShowTopUp]     = useState(false);
  const [showBanks,     setShowBanks]     = useState(false);

  // Add method form state
  const [selType,       setSelType]       = useState<MethodType>('easypaisa');
  const [accountTitle,  setAccountTitle]  = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName,      setBankName]      = useState('');
  const [showBankList,  setShowBankList]  = useState(false);
  const [saving,        setSaving]        = useState(false);

  // Top-up form state
  const [topUpAmt,      setTopUpAmt]      = useState('');
  const [cardNumber,    setCardNumber]    = useState('');
  const [cardExpiry,    setCardExpiry]    = useState('');
  const [cardCvv,       setCardCvv]       = useState('');
  const [topping,       setTopping]       = useState(false);

  useEffect(() => { loadWallet(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallet();
    setRefreshing(false);
  };

  const resetTopUp = () => {
    setTopUpAmt('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
  };

  const formatCardNumber = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 16);
    return d.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    if (d.length >= 3) return `${d.slice(0, 2)}/${d.slice(2)}`;
    return d;
  };

  const handleTopUp = async () => {
    const amount = parseInt(topUpAmt.replace(/,/g, ''), 10);
    if (!amount || amount < 100) {
      return setDialog({ title: 'Invalid Amount', message: 'Minimum top-up amount is Rs 100.', icon: 'alert-circle-outline', iconVariant: 'warning', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
    }
    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length < 16) {
      return setDialog({ title: 'Invalid Card', message: 'Please enter a valid 16-digit card number.', icon: 'card-outline', iconVariant: 'warning', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
    }
    if (cardExpiry.length < 5) {
      return setDialog({ title: 'Invalid Expiry', message: 'Please enter card expiry in MM/YY format.', icon: 'calendar-outline', iconVariant: 'warning', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
    }
    if (cardCvv.length < 3) {
      return setDialog({ title: 'Invalid CVV', message: 'Please enter the 3-digit CVV on the back of your card.', icon: 'lock-closed-outline', iconVariant: 'warning', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
    }

    setTopping(true);
    // Simulate a 1-second payment processing delay
    await new Promise(res => setTimeout(res, 1200));
    const defaultMethod = paymentMethods.find(m => m.isDefault) ?? paymentMethods[0];
    const result = await topUpWallet(amount, defaultMethod?.id);
    setTopping(false);

    if (!result.success) {
      return setDialog({ title: 'Top-Up Failed', message: result.error ?? 'Could not add funds. Please try again.', icon: 'alert-circle-outline', iconVariant: 'destructive', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
    }
    setShowTopUp(false);
    resetTopUp();
    setDialog({ title: 'Funds Added!', message: `Rs ${amount.toLocaleString('en-PK')} has been added to your wallet.\n\nNew balance: Rs ${result.newBalance?.toLocaleString('en-PK') ?? '—'}`, icon: 'checkmark-circle-outline', iconVariant: 'success', actions: [{ label: 'Great!', onPress: () => setDialog(null) }] });
  };

  const resetForm = () => {
    setSelType('easypaisa');
    setAccountTitle('');
    setAccountNumber('');
    setBankName('');
    setShowBankList(false);
  };

  const handleAdd = async () => {
    if (!accountTitle.trim()) {
      return setDialog({ title: 'Missing Name', message: 'Please enter your account title / full name.', icon: 'person-outline', iconVariant: 'warning', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
    }
    if (!accountNumber.trim()) {
      return setDialog({ title: 'Missing Number', message: 'Please enter your account / mobile number.', icon: 'call-outline', iconVariant: 'warning', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
    }
    if (selType === 'bank' && !bankName.trim()) {
      return setDialog({ title: 'Select Bank', message: 'Please select your bank from the list.', icon: 'business-outline', iconVariant: 'warning', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
    }

    setSaving(true);
    const result = await addMethod({
      type: selType, accountTitle: accountTitle.trim(),
      accountNumber: accountNumber.trim(),
      bankName: selType === 'bank' ? bankName.trim() : undefined,
    });
    setSaving(false);

    if (!result.success) {
      return setDialog({ title: 'Error', message: result.error ?? 'Failed to save payment method.', icon: 'alert-circle-outline', iconVariant: 'destructive', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
    }
    setShowAdd(false);
    resetForm();
    setDialog({ title: 'Method Saved!', message: `Your ${METHOD_META[selType].label} account has been saved.`, icon: 'checkmark-circle-outline', iconVariant: 'success', actions: [{ label: 'Great!', onPress: () => setDialog(null) }] });
  };

  const handleDelete = (method: SavedPaymentMethod) => {
    setDialog({
      title: 'Remove Method',
      message: `Remove ${METHOD_META[method.type].label} ending in •${method.accountNumber.slice(-4)}?`,
      icon: 'trash-outline', iconVariant: 'destructive',
      actions: [
        { label: 'Cancel', variant: 'secondary', onPress: () => setDialog(null) },
        {
          label: 'Remove', variant: 'destructive',
          onPress: async () => {
            setDialog(null);
            const res = await removeMethod(method.id);
            if (!res.success) setDialog({ title: 'Error', message: res.error ?? 'Could not remove.', icon: 'alert-circle-outline', iconVariant: 'destructive', actions: [{ label: 'OK', onPress: () => setDialog(null) }] });
          },
        },
      ],
    });
  };

  // ── Theme
  const BG       = colors.background;
  const FG       = colors.foreground;
  const BRAND    = colors.brand;
  const BRAND_FG = colors.brandForeground;
  const CTA      = colors.primary;
  const CTA_FG   = colors.primaryForeground;
  const MUTED    = colors.mutedForeground;
  const BORDER   = colors.border;
  const CARD     = colors.card;
  const SEC      = colors.secondary;

  const walletBalance    = user?.walletBalance ?? null;
  const isWalletActive   = paymentMethods.length > 0;
  const advancePct       = Math.round(COMMITMENT_RATE * 100);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <SafeAreaView edges={['top']} style={{ backgroundColor: BG }}>
        <View style={[styles.header, { borderBottomColor: BORDER }]}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: CARD, borderColor: BORDER }]} onPress={() => router.back()} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={20} color={FG} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.headerSup, { color: MUTED }]}>ACCOUNT</Text>
            <Text style={[styles.headerTitle, { color: FG }]}>WALLET & PAYMENTS</Text>
          </View>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: CARD, borderColor: BORDER }]} onPress={onRefresh} activeOpacity={0.75} disabled={refreshing}>
            {refreshing ? <ActivityIndicator size="small" color={FG} /> : <Ionicons name="refresh-outline" size={18} color={FG} />}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Wallet Card ─────────────────────────────────────────────────── */}
        <View style={[styles.walletCard, { backgroundColor: BRAND }]}>
          {/* Top row */}
          <View style={styles.wcTop}>
            <View style={styles.wcBrandRow}>
              <View style={[styles.wcLogoBox, { backgroundColor: BRAND_FG + '22' }]}>
                <Ionicons name="wallet" size={16} color={BRAND_FG} />
              </View>
              <Text style={[styles.wcBrand, { color: BRAND_FG }]}>BusinessHub Pro</Text>
            </View>
            <View style={[styles.wcTypePill, { backgroundColor: BRAND_FG + '22' }]}>
              <Text style={[styles.wcTypeText, { color: BRAND_FG + 'CC' }]}>DIGITAL WALLET</Text>
            </View>
          </View>

          {/* Balance */}
          <View style={styles.wcBal}>
            <Text style={[styles.wcBalLabel, { color: BRAND_FG + '88' }]}>AVAILABLE BALANCE</Text>
            {!isWalletActive ? (
              /* Locked — no payment method added yet */
              <View style={styles.wcLocked}>
                <View style={[styles.wcLockedIconBox, { backgroundColor: BRAND_FG + '22' }]}>
                  <Ionicons name="lock-closed" size={20} color={BRAND_FG + 'AA'} />
                </View>
                <View>
                  <Text style={[styles.wcLockedTitle, { color: BRAND_FG }]}>Wallet Locked</Text>
                  <Text style={[styles.wcLockedSub, { color: BRAND_FG + '88' }]}>
                    Add a payment method to activate
                  </Text>
                </View>
              </View>
            ) : walletBalance === null ? (
              <ActivityIndicator color={BRAND_FG} style={{ marginTop: 8 }} />
            ) : (
              <>
                <Text style={[styles.wcBalAmt, { color: BRAND_FG }]}>
                  Rs {walletBalance.toLocaleString('en-PK')}
                </Text>
                <View style={[styles.wcCapRow, { backgroundColor: BRAND_FG + '18' }]}>
                  <Ionicons name="information-circle-outline" size={12} color={BRAND_FG + 'BB'} />
                  <Text style={[styles.wcCapText, { color: BRAND_FG + 'BB' }]}>
                    {advancePct}% advance deducted on priced services
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Divider */}
          <View style={[styles.wcDivider, { backgroundColor: BRAND_FG + '22' }]} />

          {/* Bottom row */}
          <View style={styles.wcBottom}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.wcHolderLabel, { color: BRAND_FG + '66' }]}>ACCOUNT HOLDER</Text>
              <Text style={[styles.wcHolder, { color: BRAND_FG }]} numberOfLines={1}>{user?.name ?? '—'}</Text>
            </View>
            {isWalletActive ? (
              <TouchableOpacity
                style={[styles.wcAddFundsBtn, { backgroundColor: BRAND_FG + '22', borderColor: BRAND_FG + '40' }]}
                onPress={() => setShowTopUp(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={14} color={BRAND_FG} />
                <Text style={[styles.wcAddFundsText, { color: BRAND_FG }]}>Add Funds</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.wcCurrencyBox, { borderColor: BRAND_FG + '44' }]}>
                <Text style={[styles.wcCurrency, { color: BRAND_FG }]}>PKR</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Wallet Stats ───────────────────────────────────────────────────── */}
        {isWalletActive && walletInfo && (
          <View style={[styles.statsRow, { backgroundColor: CARD, borderColor: BORDER }]}>
            <View style={styles.statCell}>
              <Text style={[styles.statLabel, { color: MUTED }]}>TOTAL ADDED</Text>
              <Text style={[styles.statValue, { color: '#22c55e' }]}>
                + Rs {walletInfo.totalCredited.toLocaleString('en-PK')}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: BORDER }]} />
            <View style={styles.statCell}>
              <Text style={[styles.statLabel, { color: MUTED }]}>TOTAL SPENT</Text>
              <Text style={[styles.statValue, { color: colors.destructive }]}>
                − Rs {walletInfo.totalDebited.toLocaleString('en-PK')}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: BORDER }]} />
            <View style={styles.statCell}>
              <Text style={[styles.statLabel, { color: MUTED }]}>CURRENCY</Text>
              <Text style={[styles.statValue, { color: FG }]}>{walletInfo.currency}</Text>
            </View>
          </View>
        )}

        {/* ── Fee Info Strip ─────────────────────────────────────────────────── */}
        <View style={[styles.feeStrip, { backgroundColor: CARD, borderColor: BORDER }]}>
          <View style={[styles.feeStripIcon, { backgroundColor: SEC }]}>
            <Ionicons name="shield-checkmark" size={18} color={FG} />
          </View>
          <View style={styles.feeStripBody}>
            <Text style={[styles.feeStripTitle, { color: FG }]}>
              {advancePct}% advance on service total
            </Text>
            <Text style={[styles.feeStripSub, { color: MUTED }]}>
              Deducted from wallet as booking advance — refunded on arrival
            </Text>
          </View>
          <View style={[styles.feeStripBadge, { backgroundColor: SEC, borderColor: BORDER }]}>
            <Text style={[styles.feeStripPct, { color: FG }]}>{advancePct}%</Text>
          </View>
        </View>

        {/* ── Payment Methods ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: MUTED }]}>SAVED PAYMENT METHODS</Text>
            <View style={[styles.countPill, { backgroundColor: SEC }]}>
              <Text style={[styles.countPillText, { color: FG }]}>{paymentMethods.length}</Text>
            </View>
          </View>

          {paymentMethods.length === 0 ? (
            /* Empty state */
            <View style={[styles.emptyCard, { backgroundColor: CARD, borderColor: BORDER }]}>
              <View style={[styles.emptyIconBox, { backgroundColor: SEC, borderColor: BORDER }]}>
                <Ionicons name="card-outline" size={28} color={MUTED} />
              </View>
              <Text style={[styles.emptyTitle, { color: FG }]}>No payment methods yet</Text>
              <Text style={[styles.emptySub, { color: MUTED }]}>
                Add EasyPaisa, JazzCash, or a bank account to start joining queues.
              </Text>
            </View>
          ) : (
            <View style={styles.methodsList}>
              {paymentMethods.map((m) => {
                const meta = METHOD_META[m.type];
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.methodCard,
                      { backgroundColor: CARD, borderColor: m.isDefault ? meta.color + '80' : BORDER },
                    ]}
                  >
                    {/* Colored left accent */}
                    <View style={[styles.methodAccent, { backgroundColor: meta.color }]} />

                    {/* Icon */}
                    <View style={[styles.methodIcon, { backgroundColor: meta.bgAlpha, borderColor: meta.color + '40' }]}>
                      <Ionicons name={meta.icon as any} size={24} color={meta.color} />
                    </View>

                    {/* Info */}
                    <View style={styles.methodInfo}>
                      {/* Type + default badge */}
                      <View style={styles.methodTopRow}>
                        <Text style={[styles.methodType, { color: FG }]}>{meta.label}</Text>
                        {m.isDefault && (
                          <View style={[styles.defaultPill, { backgroundColor: meta.color + '22', borderColor: meta.color + '60' }]}>
                            <Ionicons name="star" size={9} color={meta.color} />
                            <Text style={[styles.defaultPillText, { color: meta.color }]}>DEFAULT</Text>
                          </View>
                        )}
                      </View>

                      {/* Account holder */}
                      <Text style={[styles.methodHolder, { color: FG }]} numberOfLines={1}>
                        {m.accountTitle}
                      </Text>

                      {/* Account number pill */}
                      <View style={[styles.numberPill, { backgroundColor: SEC, borderColor: BORDER }]}>
                        <Ionicons
                          name={m.type === 'bank' ? 'card-outline' : 'call-outline'}
                          size={10}
                          color={MUTED}
                        />
                        <Text style={[styles.numberPillText, { color: FG }]}>
                          {maskNumber(m.accountNumber, m.type)}
                        </Text>
                      </View>

                      {/* Bank name (bank type) */}
                      {m.bankName ? (
                        <View style={styles.bankRow}>
                          <Ionicons name="business-outline" size={11} color={MUTED} />
                          <Text style={[styles.bankRowText, { color: MUTED }]}>
                            {m.bankName}
                          </Text>
                          <View style={[styles.ibanBadge, { backgroundColor: '#2563EB18', borderColor: '#2563EB44' }]}>
                            <Text style={[styles.ibanBadgeText, { color: '#2563EB' }]}>IBAN</Text>
                          </View>
                        </View>
                      ) : (
                        <Text style={[styles.methodSublabel, { color: MUTED }]}>{meta.sublabel}</Text>
                      )}
                    </View>

                    {/* Actions */}
                    <View style={styles.methodActions}>
                      {!m.isDefault && (
                        <TouchableOpacity
                          style={[styles.methodActionBtn, { borderColor: BORDER }]}
                          onPress={() => setDefault(m.id)}
                          activeOpacity={0.75}
                        >
                          <Ionicons name="star-outline" size={14} color={FG} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.methodActionBtn, { borderColor: BORDER }]}
                        onPress={() => handleDelete(m)}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="trash-outline" size={14} color={colors.destructive} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Add button */}
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: CTA }]}
            onPress={() => { resetForm(); setShowAdd(true); }}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={20} color={BRAND_FG} />
            <Text style={[styles.addBtnText, { color: CTA_FG }]}>Add Payment Method</Text>
          </TouchableOpacity>
        </View>

        {/* ── We Accept ──────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.acceptedCompact, { backgroundColor: CARD, borderColor: showBanks ? '#2563EB60' : BORDER }]}
          onPress={() => setShowBanks(!showBanks)}
          activeOpacity={0.8}
        >
          <View style={[styles.acceptedCompactIcon, { backgroundColor: '#2563EB18' }]}>
            <Ionicons name="business-outline" size={18} color="#2563EB" />
          </View>
          <View style={styles.acceptedCompactBody}>
            <Text style={[styles.acceptedCompactTitle, { color: FG }]}>We Accept</Text>
            <Text style={[styles.acceptedCompactSub, { color: MUTED }]}>
              Easypaisa · JazzCash · {PAKISTAN_BANKS.length} Pakistan Banks
            </Text>
          </View>
          <View style={[styles.bankExpandBtn, { backgroundColor: showBanks ? '#2563EB18' : SEC, borderColor: showBanks ? '#2563EB44' : BORDER }]}>
            <Ionicons name={showBanks ? 'chevron-up' : 'chevron-down'} size={15} color={showBanks ? '#2563EB' : MUTED} />
          </View>
        </TouchableOpacity>

        {showBanks && (
          <View style={[styles.bankExpandedList, { borderColor: BORDER, marginBottom: 16 }]}>
            {PAKISTAN_BANKS.map((bank, idx) => (
              <View
                key={bank.id}
                style={[
                  styles.bankListRow,
                  { borderBottomColor: BORDER },
                  idx === PAKISTAN_BANKS.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={[styles.bankListNum, { backgroundColor: SEC }]}>
                  <Text style={[styles.bankListNumText, { color: MUTED }]}>{idx + 1}</Text>
                </View>
                <View style={[styles.bankListShortBox, { backgroundColor: '#2563EB12', borderColor: '#2563EB30' }]}>
                  <Text style={[styles.bankListShort, { color: '#2563EB' }]}>{bank.shortName}</Text>
                </View>
                <Text style={[styles.bankListName, { color: FG }]}>{bank.name}</Text>
                <View style={[styles.bankListIban, { backgroundColor: SEC, borderColor: BORDER }]}>
                  <Text style={[styles.bankListIbanText, { color: MUTED }]}>IBFT</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Elixa Branding ───────────────────────────────────────────────────── */}
        <View style={styles.brandingRow}>
          <View style={[styles.brandingDivider, { backgroundColor: BORDER }]} />
          <View style={styles.brandingCenter}>
            <Text style={[styles.brandingPowered, { color: MUTED }]}>POWERED BY</Text>
            <Text style={[styles.brandingName, { color: FG }]}>Elixa Software</Text>
            <Text style={[styles.brandingPvt, { color: MUTED }]}>Private Limited</Text>
          </View>
          <View style={[styles.brandingDivider, { backgroundColor: BORDER }]} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Top Up Bottom Sheet ──────────────────────────────────────────────── */}
      <Modal visible={showTopUp} animationType="slide" transparent onRequestClose={() => setShowTopUp(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => { if (!topping) setShowTopUp(false); }} />

          <View style={[styles.sheet, { backgroundColor: BG, borderColor: BORDER }]}>
            <View style={[styles.sheetHandle, { backgroundColor: BORDER }]} />

            <View style={[styles.sheetHeaderRow, { borderBottomColor: BORDER }]}>
              <View>
                <Text style={[styles.sheetTitle, { color: FG }]}>Add Funds</Text>
                <Text style={[styles.sheetSub, { color: MUTED }]}>Charge your debit / credit card</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTopUp(false)} hitSlop={12} style={[styles.closeBtn, { backgroundColor: SEC, borderColor: BORDER }]}>
                <Ionicons name="close" size={18} color={FG} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              {/* Quick amounts */}
              <Text style={[styles.fieldLabel, { color: MUTED }]}>SELECT AMOUNT</Text>
              <View style={styles.quickAmtRow}>
                {['500', '1000', '2000', '5000'].map((a) => {
                  const active = topUpAmt === a;
                  return (
                    <TouchableOpacity
                      key={a}
                      style={[styles.quickAmtChip, { backgroundColor: active ? FG : CARD, borderColor: active ? FG : BORDER }]}
                      onPress={() => setTopUpAmt(a)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.quickAmtText, { color: active ? BG : FG }]}>Rs {parseInt(a).toLocaleString('en-PK')}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom amount */}
              <Text style={[styles.fieldLabel, { color: MUTED }]}>OR ENTER CUSTOM AMOUNT</Text>
              <View style={[styles.inputRow, { backgroundColor: CARD, borderColor: BORDER }]}>
                <Text style={[styles.inputText, { color: MUTED, flex: 0 }]}>Rs</Text>
                <TextInput
                  style={[styles.inputText, { color: FG }]}
                  placeholder="e.g. 3000"
                  placeholderTextColor={MUTED}
                  value={topUpAmt}
                  onChangeText={(v) => setTopUpAmt(v.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  returnKeyType="next"
                />
              </View>

              {/* Divider */}
              <View style={[styles.topUpDivider, { backgroundColor: BORDER }]} />
              <Text style={[styles.fieldLabel, { color: MUTED }]}>CARD DETAILS</Text>

              {/* Card number */}
              <View style={[styles.inputRow, { backgroundColor: CARD, borderColor: BORDER, marginBottom: 10 }]}>
                <Ionicons name="card-outline" size={16} color={MUTED} />
                <TextInput
                  style={[styles.inputText, { color: FG }]}
                  placeholder="Card Number"
                  placeholderTextColor={MUTED}
                  value={cardNumber}
                  onChangeText={(v) => setCardNumber(formatCardNumber(v))}
                  keyboardType="number-pad"
                  maxLength={19}
                  returnKeyType="next"
                />
                {/* Card type hint */}
                {cardNumber.replace(/\s/g, '').length >= 1 && (
                  <Text style={[styles.cardTypeBadge, { color: MUTED }]}>
                    {cardNumber.startsWith('4') ? 'VISA' : cardNumber.startsWith('5') ? 'MC' : 'CARD'}
                  </Text>
                )}
              </View>

              {/* Expiry + CVV row */}
              <View style={styles.cardRow}>
                <View style={[styles.inputRow, { backgroundColor: CARD, borderColor: BORDER, flex: 1 }]}>
                  <Ionicons name="calendar-outline" size={16} color={MUTED} />
                  <TextInput
                    style={[styles.inputText, { color: FG }]}
                    placeholder="MM/YY"
                    placeholderTextColor={MUTED}
                    value={cardExpiry}
                    onChangeText={(v) => setCardExpiry(formatExpiry(v))}
                    keyboardType="number-pad"
                    maxLength={5}
                    returnKeyType="next"
                  />
                </View>
                <View style={[styles.inputRow, { backgroundColor: CARD, borderColor: BORDER, flex: 1 }]}>
                  <Ionicons name="lock-closed-outline" size={16} color={MUTED} />
                  <TextInput
                    style={[styles.inputText, { color: FG }]}
                    placeholder="CVV"
                    placeholderTextColor={MUTED}
                    value={cardCvv}
                    onChangeText={(v) => setCardCvv(v.replace(/\D/g, '').slice(0, 3))}
                    keyboardType="number-pad"
                    maxLength={3}
                    secureTextEntry
                    returnKeyType="done"
                  />
                </View>
              </View>

              <Text style={[styles.fieldHint, { color: MUTED }]}>
                Card details are not stored. This is a simulated payment for demonstration.
              </Text>

              {/* Pay button */}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: CTA, opacity: topping ? 0.7 : 1, marginTop: 22 }]}
                onPress={handleTopUp}
                activeOpacity={0.85}
                disabled={topping}
              >
                {topping ? (
                  <>
                    <ActivityIndicator color={CTA_FG} />
                    <Text style={[styles.saveBtnText, { color: CTA_FG }]}>Processing…</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={20} color={CTA_FG} />
                    <Text style={[styles.saveBtnText, { color: CTA_FG }]}>
                      {topUpAmt ? `Add Rs ${parseInt(topUpAmt || '0').toLocaleString('en-PK')} to Wallet` : 'Add Funds'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ height: 28 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Method Bottom Sheet ──────────────────────────────────────────── */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => { if (!showBankList) setShowAdd(false); }} />

          <View style={[styles.sheet, { backgroundColor: BG, borderColor: BORDER }]}>
            <View style={[styles.sheetHandle, { backgroundColor: BORDER }]} />

            {/* Sheet header */}
            <View style={[styles.sheetHeaderRow, { borderBottomColor: BORDER }]}>
              <View>
                <Text style={[styles.sheetTitle, { color: FG }]}>Add Payment Method</Text>
                <Text style={[styles.sheetSub, { color: MUTED }]}>Your details are stored securely</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAdd(false)} hitSlop={12} style={[styles.closeBtn, { backgroundColor: SEC, borderColor: BORDER }]}>
                <Ionicons name="close" size={18} color={FG} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              {/* Type selector */}
              <Text style={[styles.fieldLabel, { color: MUTED }]}>SELECT PAYMENT TYPE</Text>
              <View style={styles.typeList}>
                {(['easypaisa', 'jazzcash', 'bank'] as MethodType[]).map((t) => {
                  const meta   = METHOD_META[t];
                  const active = selType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeRow,
                        {
                          backgroundColor: active ? meta.color + '10' : CARD,
                          borderColor:     active ? meta.color : BORDER,
                          borderWidth:     active ? 1.5 : 1,
                        },
                      ]}
                      onPress={() => { setSelType(t); setAccountNumber(''); setBankName(''); }}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.typeRowIcon, { backgroundColor: active ? meta.color + '22' : SEC }]}>
                        <Ionicons name={meta.icon as any} size={22} color={active ? meta.color : MUTED} />
                      </View>
                      <View style={styles.typeRowBody}>
                        <Text style={[styles.typeRowName, { color: active ? meta.color : FG }]}>{meta.label}</Text>
                        <Text style={[styles.typeRowSub, { color: MUTED }]}>{meta.sublabel}</Text>
                      </View>
                      <View style={[
                        styles.typeRowRadio,
                        {
                          borderColor:     active ? meta.color : BORDER,
                          backgroundColor: active ? meta.color : 'transparent',
                        },
                      ]}>
                        {active && <Ionicons name="checkmark" size={11} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Account title */}
              <Text style={[styles.fieldLabel, { color: MUTED }]}>ACCOUNT TITLE / FULL NAME</Text>
              <View style={[styles.inputRow, { backgroundColor: CARD, borderColor: BORDER }]}>
                <Ionicons name="person-outline" size={16} color={MUTED} />
                <TextInput
                  style={[styles.inputText, { color: FG }]}
                  placeholder="e.g. Muhammad Ali Khan"
                  placeholderTextColor={MUTED}
                  value={accountTitle}
                  onChangeText={setAccountTitle}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              {/* Number */}
              <Text style={[styles.fieldLabel, { color: MUTED }]}>
                {selType === 'bank' ? 'IBAN / ACCOUNT NUMBER' : 'REGISTERED MOBILE NUMBER'}
              </Text>
              <View style={[styles.inputRow, { backgroundColor: CARD, borderColor: BORDER }]}>
                <Ionicons name={selType === 'bank' ? 'card-outline' : 'call-outline'} size={16} color={MUTED} />
                <TextInput
                  style={[styles.inputText, { color: FG }]}
                  placeholder={METHOD_META[selType].placeholder}
                  placeholderTextColor={MUTED}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType={selType === 'bank' ? 'default' : 'phone-pad'}
                  autoCapitalize={selType === 'bank' ? 'characters' : 'none'}
                  returnKeyType="next"
                />
              </View>
              <Text style={[styles.fieldHint, { color: MUTED }]}>{METHOD_META[selType].hint}</Text>

              {/* Bank selector */}
              {selType === 'bank' && (
                <>
                  <Text style={[styles.fieldLabel, { color: MUTED }]}>BANK NAME</Text>
                  <TouchableOpacity
                    style={[styles.inputRow, { backgroundColor: CARD, borderColor: bankName ? '#2563EB' : BORDER }]}
                    onPress={() => setShowBankList(!showBankList)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="business-outline" size={16} color={bankName ? '#2563EB' : MUTED} />
                    <Text style={[styles.inputText, { color: bankName ? FG : MUTED, flex: 1 }]}>
                      {bankName || 'Select your bank…'}
                    </Text>
                    <Ionicons name={showBankList ? 'chevron-up' : 'chevron-down'} size={16} color={MUTED} />
                  </TouchableOpacity>

                  {showBankList && (
                    <View style={[styles.bankDrop, { backgroundColor: CARD, borderColor: BORDER }]}>
                      <FlatList
                        data={PAKISTAN_BANKS}
                        keyExtractor={(b) => b.id}
                        scrollEnabled
                        nestedScrollEnabled
                        style={{ maxHeight: 260 }}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item: bank }) => {
                          const selected = bankName === bank.name;
                          return (
                            <TouchableOpacity
                              style={[
                                styles.bankDropRow,
                                { borderBottomColor: BORDER },
                                selected && { backgroundColor: SEC },
                              ]}
                              onPress={() => { setBankName(bank.name); setShowBankList(false); }}
                              activeOpacity={0.75}
                            >
                              <View style={[styles.bankDropShortBox, { backgroundColor: selected ? '#2563EB22' : BG }]}>
                                <Text style={[styles.bankDropShort, { color: selected ? '#2563EB' : MUTED }]}>
                                  {bank.shortName}
                                </Text>
                              </View>
                              <Text style={[styles.bankDropName, { color: FG }]}>{bank.name}</Text>
                              {selected && <Ionicons name="checkmark-circle" size={18} color="#2563EB" />}
                            </TouchableOpacity>
                          );
                        }}
                      />
                    </View>
                  )}
                </>
              )}

              {/* Live preview card */}
              {(accountTitle.trim().length > 0 || accountNumber.trim().length > 0) && (
                <View style={{ marginTop: 22 }}>
                  <Text style={[styles.fieldLabel, { color: MUTED }]}>PREVIEW</Text>
                  <View style={[styles.previewCard, { backgroundColor: BRAND }]}>
                    <View style={styles.previewTopRow}>
                      <View style={[styles.previewIconBox, { backgroundColor: BRAND_FG + '22' }]}>
                        <Ionicons name={METHOD_META[selType].icon as any} size={15} color={BRAND_FG} />
                      </View>
                      <Text style={[styles.previewTypeLabel, { color: BRAND_FG + 'AA' }]}>
                        {METHOD_META[selType].sublabel.toUpperCase()}
                      </Text>
                    </View>

                    <Text style={[styles.previewNum, { color: BRAND_FG }]}>
                      {accountNumber.trim()
                        ? maskNumber(accountNumber.trim(), selType)
                        : selType === 'bank' ? 'PK·· ···· ···· ···· ···· ··' : '03··  ···  ····'}
                    </Text>

                    <View style={[styles.previewDivider, { backgroundColor: BRAND_FG + '22' }]} />

                    <View style={styles.previewBottomRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.previewHolderLabel, { color: BRAND_FG + '66' }]}>ACCOUNT HOLDER</Text>
                        <Text style={[styles.previewHolder, { color: BRAND_FG }]} numberOfLines={1}>
                          {accountTitle.trim() || 'Your Full Name'}
                        </Text>
                        {selType === 'bank' && bankName ? (
                          <Text style={[styles.previewBank, { color: BRAND_FG + '88' }]} numberOfLines={1}>{bankName}</Text>
                        ) : null}
                      </View>
                      <View style={[styles.previewBadge, { backgroundColor: BRAND_FG + '22', borderColor: BRAND_FG + '33' }]}>
                        <Text style={[styles.previewBadgeText, { color: BRAND_FG }]}>
                          {METHOD_META[selType].label.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Save */}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: CTA, opacity: saving ? 0.6 : 1 }]}
                onPress={handleAdd}
                activeOpacity={0.85}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={CTA_FG} />
                  : <>
                      <Ionicons name="checkmark-circle-outline" size={20} color={CTA_FG} />
                      <Text style={[styles.saveBtnText, { color: CTA_FG }]}>Save Payment Method</Text>
                    </>
                }
              </TouchableOpacity>

              <View style={{ height: 28 }} />
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
  root:  { flex: 1 },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  headerText:  { flex: 1 },
  headerSup:   { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.8 },

  scroll: { paddingHorizontal: 20, paddingTop: 20 },

  /* ── Wallet card */
  walletCard: {
    borderRadius: 22, padding: 22, marginBottom: 14, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 16, elevation: 8,
  },
  wcTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wcBrandRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wcLogoBox:   { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  wcBrand:     { fontSize: 15, fontWeight: '900', letterSpacing: -0.4 },
  wcTypePill:  { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  wcTypeText:  { fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },

  wcBal:      {},
  wcBalLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  wcBalAmt:   { fontSize: 42, fontWeight: '900', letterSpacing: -2, lineHeight: 48 },
  wcCapRow:   {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, marginTop: 10,
  },
  wcCapText:  { fontSize: 11, fontWeight: '600' },

  /* Locked state */
  wcLocked:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  wcLockedIconBox:{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  wcLockedTitle:  { fontSize: 18, fontWeight: '900', marginBottom: 3 },
  wcLockedSub:    { fontSize: 12, fontWeight: '500' },

  wcDivider:   { height: 1 },

  wcBottom:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  wcHolderLabel:   { fontSize: 8, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  wcHolder:        { fontSize: 15, fontWeight: '800', maxWidth: 170 },
  wcCurrencyBox:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5 },
  wcCurrency:      { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  wcAddFundsBtn:   {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1,
  },
  wcAddFundsText:  { fontSize: 12, fontWeight: '800' },

  /* ── Wallet Stats row */
  statsRow: {
    flexDirection: 'row', borderRadius: 14, borderWidth: 1,
    marginBottom: 14, overflow: 'hidden',
  },
  statCell:    { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4 },
  statDivider: { width: 1, marginVertical: 10 },
  statLabel:   { fontSize: 8, fontWeight: '700', letterSpacing: 1.5 },
  statValue:   { fontSize: 13, fontWeight: '900' },

  /* ── Fee strip */
  feeStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 22,
  },
  feeStripIcon:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  feeStripBody:  { flex: 1, gap: 2 },
  feeStripTitle: { fontSize: 13, fontWeight: '800' },
  feeStripSub:   { fontSize: 11, lineHeight: 16 },
  feeStripBadge: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  feeStripPct: { fontSize: 18, fontWeight: '900' },

  /* ── Section */
  section:       { marginBottom: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionLabel:  { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  countPill:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  countPillText: { fontSize: 11, fontWeight: '800' },

  /* Empty state */
  emptyCard: {
    borderRadius: 16, borderWidth: 1, paddingVertical: 36,
    alignItems: 'center', gap: 10, marginBottom: 14,
  },
  emptyIconBox: {
    width: 64, height: 64, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800' },
  emptySub:   { fontSize: 12, textAlign: 'center', paddingHorizontal: 28, lineHeight: 18 },

  /* Methods list */
  methodsList: { gap: 12, marginBottom: 14 },
  methodCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1,
    overflow: 'hidden',
  },

  methodAccent: { width: 4, alignSelf: 'stretch' },

  methodIcon: {
    width: 52, height: 52, borderRadius: 13, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    margin: 14, marginRight: 0, flexShrink: 0,
  },

  methodInfo:      { flex: 1, paddingVertical: 14, paddingHorizontal: 12, gap: 4 },
  methodTopRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  methodType:      { fontSize: 14, fontWeight: '900' },
  defaultPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1,
  },
  defaultPillText: { fontSize: 8, fontWeight: '900' },
  methodHolder:    { fontSize: 13, fontWeight: '600' },

  numberPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  numberPillText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, fontVariant: ['tabular-nums'] as any },

  bankRow:      { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  bankRowText:  { fontSize: 11, fontWeight: '500' },
  ibanBadge:    { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
  ibanBadgeText:{ fontSize: 8, fontWeight: '800' },
  methodSublabel: { fontSize: 11 },

  methodActions: { paddingRight: 12, gap: 8 },
  methodActionBtn: {
    width: 34, height: 34, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Add button */
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 16,
  },
  addBtnText: { fontSize: 15, fontWeight: '900' },

  /* ── Compact We Accept row */
  acceptedCompact: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 6,
  },
  acceptedCompactIcon:  { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  acceptedCompactBody:  { flex: 1 },
  acceptedCompactTitle: { fontSize: 14, fontWeight: '800' },
  acceptedCompactSub:   { fontSize: 11, marginTop: 2 },

  /* Bank section — tappable header */
  bankSectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  bankSectionIcon:    { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bankSectionTextCol: { flex: 1 },
  bankSectionTitle:   { fontSize: 14, fontWeight: '800' },
  bankSectionSub:     { fontSize: 11, marginTop: 1 },
  bankExpandBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Expanded bank list */
  bankExpandedList: {
    borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginTop: 4,
  },
  bankListRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bankListNum:      { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  bankListNumText:  { fontSize: 9, fontWeight: '700' },
  bankListShortBox: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, minWidth: 62, alignItems: 'center' },
  bankListShort:    { fontSize: 10, fontWeight: '900' },
  bankListName:     { flex: 1, fontSize: 13, fontWeight: '500' },
  bankListIban:     { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
  bankListIbanText: { fontSize: 8, fontWeight: '800' },

  /* ── Elixa branding */
  brandingRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, marginTop: 4 },
  brandingDivider:{ flex: 1, height: 1 },
  brandingCenter: { alignItems: 'center', gap: 1 },
  brandingPowered:{ fontSize: 8, fontWeight: '700', letterSpacing: 2 },
  brandingName:   { fontSize: 13, fontWeight: '900', letterSpacing: -0.3 },
  brandingPvt:    { fontSize: 9, fontWeight: '500' },

  /* ── Modal sheet */
  overlay:   { flex: 1, justifyContent: 'flex-end' },
  backdrop:  { flex: 1, backgroundColor: '#00000065' },
  sheet: {
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    borderWidth: 1, borderBottomWidth: 0,
    height: '88%',
    overflow: 'hidden',
  },
  sheetHandle: { width: 44, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 2 },
  sheetHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: { fontSize: 18, fontWeight: '900' },
  sheetSub:   { fontSize: 11, marginTop: 2 },
  closeBtn:   { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sheetBody:  { padding: 20 },

  /* Type list (vertical) */
  typeList: { gap: 10, marginBottom: 4 },
  typeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 14,
  },
  typeRowIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  typeRowBody: { flex: 1, gap: 2 },
  typeRowName: { fontSize: 15, fontWeight: '800' },
  typeRowSub:  { fontSize: 12 },
  typeRowRadio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  /* Preview card */
  previewCard: {
    borderRadius: 20, padding: 20, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 6,
  },
  previewTopRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewIconBox:   { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  previewTypeLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  previewNum:       { fontSize: 18, fontWeight: '800', letterSpacing: 1.5, fontVariant: ['tabular-nums'] as any },
  previewDivider:   { height: 1 },
  previewBottomRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  previewHolderLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1.5, marginBottom: 3 },
  previewHolder:    { fontSize: 14, fontWeight: '800' },
  previewBank:      { fontSize: 11, fontWeight: '500', marginTop: 3 },
  previewBadge:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, flexShrink: 0 },
  previewBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  /* Form fields */
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, marginTop: 18 },
  fieldHint:  { fontSize: 11, marginTop: 6, lineHeight: 16 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  inputText: { flex: 1, fontSize: 14, padding: 0 },

  /* Bank dropdown */
  bankDrop: {
    borderRadius: 12, borderWidth: 1, marginTop: 4,
    overflow: 'hidden', maxHeight: 260,
  },
  bankDropRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bankDropShortBox: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, minWidth: 58, alignItems: 'center' },
  bankDropShort:    { fontSize: 11, fontWeight: '800' },
  bankDropName:     { flex: 1, fontSize: 13 },

  /* Save button */
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 16, marginTop: 22,
  },
  saveBtnText: { fontSize: 15, fontWeight: '900' },

  /* ── Top-up modal extras */
  quickAmtRow:   { flexDirection: 'row', gap: 8, marginBottom: 4 },
  quickAmtChip:  {
    flex: 1, borderRadius: 12, borderWidth: 1,
    paddingVertical: 12, alignItems: 'center',
  },
  quickAmtText:  { fontSize: 12, fontWeight: '800' },
  topUpDivider:  { height: 1, marginVertical: 18 },
  cardRow:       { flexDirection: 'row', gap: 10, marginBottom: 4 },
  cardTypeBadge: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
});
