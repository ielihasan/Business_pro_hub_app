import { Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

// ─── Transaction ID ───────────────────────────────────────────────────────────

/**
 * Generates a unique, fraud-resistant transaction ID.
 * Format: TXN-{USER_PREFIX}-{TIMESTAMP_BASE36}-{RANDOM4}
 * e.g. TXN-AB12CD34-LX9KM2Z-F7Q2
 */
export function generateTransactionId(userId: string): string {
  const userPrefix = userId.replace(/-/g, '').substring(0, 8).toUpperCase();
  const timestamp  = Date.now().toString(36).toUpperCase();
  const random     = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TXN-${userPrefix}-${timestamp}-${random}`;
}

// ─── Payment Method Config ────────────────────────────────────────────────────

export type PaymentMethodId = 'easypaisa' | 'jazzcash' | 'bank';

export interface PaymentMethodConfig {
  id: PaymentMethodId;
  name: string;
  color: string;
  bgColor: string;
  darkBgColor: string;
  icon: string;
  appPackage: string;   // Android package name for Intent fallback
  deepLink: (amount: string, txnId: string) => string;
  fallbackUrl: string;
  instructions: string[];
  accountDetails?: { label: string; value: string }[]; // wallet account to send money to
  bankDetails?: { label: string; value: string }[];    // bank transfer details
}

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'easypaisa',
    name: 'Easypaisa',
    color: '#37B34A',
    bgColor: '#F0FFF4',
    darkBgColor: '#14532D',
    icon: 'phone-portrait-outline',
    appPackage: 'pk.com.telenor.phoenix',
    deepLink: (amount, txnId) =>
      `easypaisa://send?amount=${amount}&ref=${txnId}`,
    fallbackUrl: 'https://easypaisa.com.pk',
    accountDetails: [
      { label: 'Easypaisa Number', value: '0300-1234567' },
      { label: 'Account Name',    value: 'BusinessHub Pro' },
    ],
    instructions: [
      '1. Tap "Open Easypaisa" below to open the app',
      '2. Go to Send Money → Mobile Account',
      '3. Enter our Easypaisa number shown above',
      '4. Enter amount: Rs. {amount}',
      '5. In remarks/description write: {txnId}',
      '6. Confirm & complete the payment',
      '7. Note the Easypaisa Transaction ID from the confirmation screen',
      '8. Come back here, enter that ID and upload your receipt',
    ],
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    color: '#BF202F',
    bgColor: '#FFF1F2',
    darkBgColor: '#4C0519',
    icon: 'phone-portrait-outline',
    appPackage: 'com.techlogix.mobilinkcustomer',
    deepLink: (amount, txnId) =>
      Platform.OS === 'android'
        // Use explicit package intent — works whether or not jazzcash:// scheme is registered
        ? `intent:#Intent;package=com.techlogix.mobilinkcustomer;end`
        : `jazzcash://pay?amount=${amount}&ref=${txnId}`,
    fallbackUrl: 'https://jazzcash.com.pk',
    accountDetails: [
      { label: 'JazzCash Number', value: '0311-1234567' },
      { label: 'Account Name',   value: 'BusinessHub Pro' },
    ],
    instructions: [
      '1. Tap "Open JazzCash" below to open the app',
      '2. Go to Send Money → Mobile Wallet',
      '3. Enter our JazzCash number shown above',
      '4. Enter amount: Rs. {amount}',
      '5. In remarks/description write: {txnId}',
      '6. Confirm & complete the payment',
      '7. Note the JazzCash Transaction ID from the confirmation screen',
      '8. Come back here, enter that ID and upload your receipt',
    ],
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    darkBgColor: '#1E3A5F',
    icon: 'business-outline',
    appPackage: '',
    deepLink: () => '',
    fallbackUrl: '',
    instructions: [
      '1. Open your bank\'s mobile app',
      '2. Go to Fund Transfer / IBFT',
      '3. Enter our account details shown below',
      '4. Enter amount: Rs. {amount}',
      '5. Enter Transaction ID in remarks: {txnId}',
      '6. Complete the transfer & save the receipt/confirmation',
      '7. Come back here and upload the receipt',
    ],
    bankDetails: [
      { label: 'Bank Name',       value: 'Meezan Bank' },
      { label: 'Account Title',   value: 'BusinessHub Pro Pvt. Ltd.' },
      { label: 'IBAN',            value: 'PK36MEZN0001234567890123' },
      { label: 'Account Number',  value: '01234567890123' },
      { label: 'Branch Code',     value: '0123 – Gulshan Branch, Karachi' },
    ],
  },
];

export function getPaymentMethod(id: PaymentMethodId): PaymentMethodConfig {
  return PAYMENT_METHODS.find(m => m.id === id)!;
}

// ─── Deep Link opener ─────────────────────────────────────────────────────────

export async function openPaymentApp(method: PaymentMethodConfig, amount: string, txnId: string): Promise<void> {
  if (method.id === 'bank') return; // no app to open for bank transfer

  const deepLink = method.deepLink(amount, txnId);

  // Build the Play Store / App Store fallback URL
  const storeUrl = Platform.OS === 'android'
    ? `https://play.google.com/store/apps/details?id=${method.appPackage}`
    : method.fallbackUrl;

  try {
    await Linking.openURL(deepLink);
  } catch {
    // Deep link failed (app not installed) — redirect to store
    try {
      await Linking.openURL(storeUrl);
    } catch {
      // Last resort: open website
      await Linking.openURL(method.fallbackUrl);
    }
  }
}

// ─── Receipt image picker ─────────────────────────────────────────────────────

export interface ReceiptPickerResult {
  uri: string;
  base64: string;
  mimeType: string;
  fileName: string;
}

export async function pickReceiptImage(): Promise<ReceiptPickerResult | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.85,
    base64: true,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    base64: asset.base64 ?? '',
    mimeType: asset.mimeType ?? 'image/jpeg',
    fileName: asset.fileName ?? `receipt_${Date.now()}.jpg`,
  };
}

export async function captureReceiptCamera(): Promise<ReceiptPickerResult | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: false,
    quality: 0.85,
    base64: true,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    base64: asset.base64 ?? '',
    mimeType: asset.mimeType ?? 'image/jpeg',
    fileName: asset.fileName ?? `receipt_${Date.now()}.jpg`,
  };
}

// ─── Supabase: save transaction & upload receipt ──────────────────────────────

export interface TransactionData {
  transaction_id: string;
  user_id: string;
  payment_method: PaymentMethodId;
  amount: number;
  status: 'pending_receipt' | 'pending_verification' | 'verified' | 'rejected';
  receipt_url?: string;
  external_txn_id?: string; // Transaction ID generated by Easypaisa/JazzCash app
}

/**
 * Create a new pending transaction record in Supabase.
 */
export async function createTransaction(data: Omit<TransactionData, 'status' | 'receipt_url'>): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('Transactions')
    .insert({
      transaction_id: data.transaction_id,
      user_id: data.user_id,
      payment_method: data.payment_method,
      amount: data.amount,
      status: 'pending_receipt',
      created_at: new Date().toISOString(),
    });
  return { error: error?.message };
}

/**
 * Upload receipt image to Supabase Storage and update transaction record.
 * @param externalTxnId - The transaction ID generated by Easypaisa/JazzCash (from user's receipt)
 */
export async function uploadReceiptAndUpdateTransaction(
  receipt: ReceiptPickerResult,
  transactionId: string,
  userId: string,
  externalTxnId?: string,
): Promise<{ receiptUrl?: string; error?: string }> {
  if (!receipt.base64) return { error: 'No image data' };

  const filePath = `${userId}/${transactionId}.jpg`;
  const arrayBuffer = decode(receipt.base64);

  // Upload to storage bucket
  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(filePath, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (uploadError) return { error: uploadError.message };

  // Get public URL
  const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(filePath);
  const receiptUrl = urlData.publicUrl;

  // Update transaction record
  const updatePayload: Record<string, unknown> = {
    status: 'pending_verification',
    receipt_url: receiptUrl,
  };
  if (externalTxnId?.trim()) updatePayload.external_txn_id = externalTxnId.trim();

  const { error: updateError } = await supabase
    .from('Transactions')
    .update(updatePayload)
    .eq('transaction_id', transactionId);

  if (updateError) return { error: updateError.message };

  return { receiptUrl };
}

/**
 * Verify that a transaction ID belongs to the given user (fraud check).
 */
export async function verifyTransactionOwnership(transactionId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('Transactions')
    .select('user_id')
    .eq('transaction_id', transactionId)
    .single();
  return data?.user_id === userId;
}
