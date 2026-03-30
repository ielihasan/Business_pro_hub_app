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
import { useStore, SavedPaymentMethod, WalletPaymentType } from '@/store/useStore';
import { COMMITMENT_FEE, PAKISTAN_BANKS } from '@/lib/wallet';
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
  const loadWallet     = useStore((s) => s.loadWallet);
  const addMethod      = useStore((s) => s.addWalletPaymentMethod);
  const removeMethod   = useStore((s) => s.removeWalletPaymentMethod);
  const setDefault     = useStore((s) => s.setDefaultWalletPaymentMethod);

  const [refreshing,    setRefreshing]    = useState(false);
  const [dialog,        setDialog]        = useState<DialogConfig | null>(null);
  const [showAdd,       setShowAdd]       = useState(false);

  // Form state
  const [selType,       setSelType]       = useState<MethodType>('easypaisa');
  const [accountTitle,  setAccountTitle]  = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName,      setBankName]      = useState('');
  const [showBankList,  setShowBankList]  = useState(false);
  const [saving,        setSaving]        = useState(false);

  useEffect(() => { loadWallet(); }, []);

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
  const BG     = colors.background;
  const FG     = colors.foreground;
  const MUTED  = colors.mutedForeground;
  const BORDER = colors.border;
  const CARD   = colors.card;
  const SEC    = colors.secondary;

  const walletBalance = user?.walletBalance ?? null;
  const queueCapacity = walletBalance !== null ? Math.floor(walletBalance / COMMITMENT_FEE) : null;

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
        <View style={[styles.walletCard, { backgroundColor: FG }]}>
          {/* Top row */}
          <View style={styles.wcTop}>
            <View style={styles.wcBrandRow}>
              <View style={[styles.wcLogoBox, { backgroundColor: BG + '22' }]}>
                <Ionicons name="wallet" size={16} color={BG} />
              </View>
              <Text style={[styles.wcBrand, { color: BG }]}>BusinessHub Pro</Text>
            </View>
            <View style={[styles.wcTypePill, { backgroundColor: BG + '22' }]}>
              <Text style={[styles.wcTypeText, { color: BG + 'CC' }]}>DIGITAL WALLET</Text>
            </View>
          </View>

          {/* Balance */}
          <View style={styles.wcBal}>
            <Text style={[styles.wcBalLabel, { color: BG + '88' }]}>AVAILABLE BALANCE</Text>
            {walletBalance === null
              ? <ActivityIndicator color={BG} style={{ marginTop: 8 }} />
              : <Text style={[styles.wcBalAmt, { color: BG }]}>
                  Rs {walletBalance.toLocaleString('en-PK')}
                </Text>
            }
            {queueCapacity !== null && (
              <View style={[styles.wcCapRow, { backgroundColor: BG + '18' }]}>
                <Ionicons name="people-outline" size={12} color={BG + 'BB'} />
                <Text style={[styles.wcCapText, { color: BG + 'BB' }]}>
                  {queueCapacity > 0
                    ? `Enough to join ${queueCapacity} more queue${queueCapacity === 1 ? '' : 's'}`
                    : 'Insufficient balance to join queues'}
                </Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={[styles.wcDivider, { backgroundColor: BG + '22' }]} />

          {/* Bottom row */}
          <View style={styles.wcBottom}>
            <View>
              <Text style={[styles.wcHolderLabel, { color: BG + '66' }]}>ACCOUNT HOLDER</Text>
              <Text style={[styles.wcHolder, { color: BG }]} numberOfLines={1}>{user?.name ?? '—'}</Text>
            </View>
            <View style={[styles.wcCurrencyBox, { borderColor: BG + '44' }]}>
              <Text style={[styles.wcCurrency, { color: BG }]}>PKR</Text>
            </View>
          </View>
        </View>

        {/* ── Fee Info Strip ─────────────────────────────────────────────────── */}
        <View style={[styles.feeStrip, { backgroundColor: CARD, borderColor: BORDER }]}>
          <View style={[styles.feeStripIcon, { backgroundColor: SEC }]}>
            <Ionicons name="shield-checkmark" size={18} color={FG} />
          </View>
          <View style={styles.feeStripBody}>
            <Text style={[styles.feeStripTitle, { color: FG }]}>
              Rs {COMMITMENT_FEE} queue commitment fee
            </Text>
            <Text style={[styles.feeStripSub, { color: MUTED }]}>
              Deducted each time you join a queue — ensures you show up
            </Text>
          </View>
          <Text style={[styles.feeStripAmt, { color: FG }]}>−Rs {COMMITMENT_FEE}</Text>
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
            style={[styles.addBtn, { backgroundColor: FG }]}
            onPress={() => { resetForm(); setShowAdd(true); }}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={20} color={BG} />
            <Text style={[styles.addBtnText, { color: BG }]}>Add Payment Method</Text>
          </TouchableOpacity>
        </View>

        {/* ── Accepted Methods ────────────────────────────────────────────────── */}
        <View style={[styles.acceptedCard, { backgroundColor: CARD, borderColor: BORDER }]}>
          <Text style={[styles.acceptedHeading, { color: FG }]}>We Accept</Text>
          <Text style={[styles.acceptedSub, { color: MUTED }]}>
            All major Pakistani mobile wallets & bank accounts
          </Text>

          {/* Mobile wallets */}
          <Text style={[styles.acceptedGroupLabel, { color: MUTED }]}>MOBILE WALLETS</Text>
          <View style={styles.walletRow}>
            {/* Easypaisa tile */}
            <View style={[styles.walletTile, { backgroundColor: '#37B34A10', borderColor: '#37B34A40' }]}>
              <View style={[styles.walletTileIconBox, { backgroundColor: '#37B34A20' }]}>
                <Ionicons name="phone-portrait-outline" size={22} color="#37B34A" />
              </View>
              <Text style={[styles.walletTileName, { color: FG }]}>Easypaisa</Text>
              <Text style={[styles.walletTileType, { color: '#37B34A' }]}>Mobile Wallet</Text>
              <View style={[styles.walletTilePill, { backgroundColor: '#37B34A22' }]}>
                <Text style={[styles.walletTilePillText, { color: '#37B34A' }]}>Telenor</Text>
              </View>
            </View>

            {/* JazzCash tile */}
            <View style={[styles.walletTile, { backgroundColor: '#BF202F10', borderColor: '#BF202F40' }]}>
              <View style={[styles.walletTileIconBox, { backgroundColor: '#BF202F20' }]}>
                <Ionicons name="phone-portrait-outline" size={22} color="#BF202F" />
              </View>
              <Text style={[styles.walletTileName, { color: FG }]}>JazzCash</Text>
              <Text style={[styles.walletTileType, { color: '#BF202F' }]}>Mobile Wallet</Text>
              <View style={[styles.walletTilePill, { backgroundColor: '#BF202F22' }]}>
                <Text style={[styles.walletTilePillText, { color: '#BF202F' }]}>Jazz / Warid</Text>
              </View>
            </View>
          </View>

          {/* Bank accounts */}
          <Text style={[styles.acceptedGroupLabel, { color: MUTED }]}>BANK ACCOUNTS (IBFT)</Text>
          <View style={[styles.bankSection, { backgroundColor: BG, borderColor: BORDER }]}>
            <View style={styles.bankIconRow}>
              <View style={[styles.bankSectionIcon, { backgroundColor: '#2563EB18' }]}>
                <Ionicons name="business-outline" size={18} color="#2563EB" />
              </View>
              <View>
                <Text style={[styles.bankSectionTitle, { color: FG }]}>All Pakistan Banks</Text>
                <Text style={[styles.bankSectionSub, { color: MUTED }]}>via IBFT / IBAN transfer</Text>
              </View>
            </View>

            {/* Bank grid */}
            <View style={styles.bankGrid}>
              {PAKISTAN_BANKS.map((bank) => (
                <View key={bank.id} style={[styles.bankGridItem, { backgroundColor: SEC, borderColor: BORDER }]}>
                  <Text style={[styles.bankGridShort, { color: FG }]}>{bank.shortName}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={{ height: 52 }} />
      </ScrollView>

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
              <Text style={[styles.fieldLabel, { color: MUTED }]}>SELECT TYPE</Text>
              <View style={styles.typeGrid}>
                {(['easypaisa', 'jazzcash', 'bank'] as MethodType[]).map((t) => {
                  const meta   = METHOD_META[t];
                  const active = selType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeCard,
                        {
                          backgroundColor: active ? meta.color + '18' : CARD,
                          borderColor:     active ? meta.color : BORDER,
                          borderWidth:     active ? 2 : 1,
                        },
                      ]}
                      onPress={() => { setSelType(t); setAccountNumber(''); setBankName(''); }}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.typeCardIcon, { backgroundColor: active ? meta.color + '22' : SEC }]}>
                        <Ionicons name={meta.icon as any} size={20} color={active ? meta.color : MUTED} />
                      </View>
                      <Text style={[styles.typeCardName, { color: active ? meta.color : FG }]}>{meta.label}</Text>
                      <Text style={[styles.typeCardSub, { color: MUTED }]}>{meta.sublabel}</Text>
                      {active && (
                        <View style={[styles.typeCardCheck, { backgroundColor: meta.color }]}>
                          <Ionicons name="checkmark" size={10} color="#fff" />
                        </View>
                      )}
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

              {/* Save */}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: FG, opacity: saving ? 0.6 : 1 }]}
                onPress={handleAdd}
                activeOpacity={0.85}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={BG} />
                  : <>
                      <Ionicons name="checkmark-circle-outline" size={20} color={BG} />
                      <Text style={[styles.saveBtnText, { color: BG }]}>Save Payment Method</Text>
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

  wcBal:       {},
  wcBalLabel:  { fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  wcBalAmt:    { fontSize: 42, fontWeight: '900', letterSpacing: -2, lineHeight: 48 },
  wcCapRow:    {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, marginTop: 10,
  },
  wcCapText:   { fontSize: 11, fontWeight: '600' },

  wcDivider:   { height: 1 },

  wcBottom:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  wcHolderLabel:   { fontSize: 8, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  wcHolder:        { fontSize: 15, fontWeight: '800', maxWidth: 210 },
  wcCurrencyBox:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5 },
  wcCurrency:      { fontSize: 13, fontWeight: '900', letterSpacing: 1 },

  /* ── Fee strip */
  feeStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 22,
  },
  feeStripIcon:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  feeStripBody:  { flex: 1, gap: 2 },
  feeStripTitle: { fontSize: 13, fontWeight: '800' },
  feeStripSub:   { fontSize: 11, lineHeight: 16 },
  feeStripAmt:   { fontSize: 16, fontWeight: '900' },

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

  /* ── Accepted Methods card */
  acceptedCard: {
    borderRadius: 18, borderWidth: 1, padding: 18,
    marginBottom: 16, gap: 14,
  },
  acceptedHeading: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  acceptedSub:     { fontSize: 12, lineHeight: 18, marginTop: -8 },
  acceptedGroupLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, marginTop: 2 },

  /* Mobile wallet tiles */
  walletRow: { flexDirection: 'row', gap: 12 },
  walletTile: {
    flex: 1, borderRadius: 14, borderWidth: 1.5,
    padding: 14, gap: 6, alignItems: 'flex-start',
  },
  walletTileIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  walletTileName:    { fontSize: 15, fontWeight: '900' },
  walletTileType:    { fontSize: 11, fontWeight: '700' },
  walletTilePill:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginTop: 2 },
  walletTilePillText:{ fontSize: 9, fontWeight: '700' },

  /* Bank section */
  bankSection: {
    borderRadius: 12, borderWidth: 1, padding: 14, gap: 12,
  },
  bankIconRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bankSectionIcon:   { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bankSectionTitle:  { fontSize: 14, fontWeight: '800' },
  bankSectionSub:    { fontSize: 11 },

  bankGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  bankGridItem: {
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1,
  },
  bankGridShort: { fontSize: 11, fontWeight: '700' },

  /* ── Modal sheet */
  overlay:   { flex: 1, justifyContent: 'flex-end' },
  backdrop:  { flex: 1, backgroundColor: '#00000065' },
  sheet: {
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    borderWidth: 1, borderBottomWidth: 0,
    maxHeight: '92%',
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

  /* Type grid */
  typeGrid: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  typeCard: {
    flex: 1, borderRadius: 14, padding: 12,
    alignItems: 'center', gap: 6, position: 'relative',
  },
  typeCardIcon:   { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  typeCardName:   { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  typeCardSub:    { fontSize: 9, textAlign: 'center' },
  typeCardCheck:  {
    position: 'absolute', top: 8, right: 8,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },

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
});
