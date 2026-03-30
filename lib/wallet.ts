import { supabase } from './supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Rs 50 deducted from wallet when a user joins a queue (commitment fee). */
export const COMMITMENT_FEE = 50;

// ─── Pakistan Banks ───────────────────────────────────────────────────────────

export interface PakistanBank {
  id: string;
  name: string;
  shortName: string;
}

export const PAKISTAN_BANKS: PakistanBank[] = [
  { id: 'hbl',        name: 'Habib Bank Limited',          shortName: 'HBL' },
  { id: 'ubl',        name: 'United Bank Limited',          shortName: 'UBL' },
  { id: 'mcb',        name: 'Muslim Commercial Bank',       shortName: 'MCB' },
  { id: 'meezan',     name: 'Meezan Bank',                  shortName: 'Meezan' },
  { id: 'alfalah',    name: 'Bank Alfalah',                 shortName: 'Alfalah' },
  { id: 'allied',     name: 'Allied Bank Limited',          shortName: 'Allied' },
  { id: 'bop',        name: 'Bank of Punjab',               shortName: 'BOP' },
  { id: 'nbp',        name: 'National Bank of Pakistan',    shortName: 'NBP' },
  { id: 'faysal',     name: 'Faysal Bank',                  shortName: 'Faysal' },
  { id: 'askari',     name: 'Askari Bank',                  shortName: 'Askari' },
  { id: 'jsbank',     name: 'JS Bank',                      shortName: 'JS Bank' },
  { id: 'bankislami', name: 'Bank Islami Pakistan',         shortName: 'Bank Islami' },
  { id: 'habibmet',   name: 'Habib Metropolitan Bank',      shortName: 'HabibMetro' },
  { id: 'silkbank',   name: 'Silk Bank',                    shortName: 'Silk Bank' },
  { id: 'soneri',     name: 'Soneri Bank',                  shortName: 'Soneri' },
  { id: 'scb',        name: 'Standard Chartered Pakistan',  shortName: 'SCB' },
  { id: 'summit',     name: 'Summit Bank',                  shortName: 'Summit' },
  { id: 'samba',      name: 'Samba Bank',                   shortName: 'Samba' },
  { id: 'citi',       name: 'Citibank Pakistan',            shortName: 'Citi' },
  { id: 'kbl',        name: 'Khushhali Microfinance Bank',  shortName: 'KBL' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export type WalletPaymentType = 'easypaisa' | 'jazzcash' | 'bank';

export interface SavedPaymentMethod {
  id: string;
  userId: string;
  type: WalletPaymentType;
  accountTitle: string;
  accountNumber: string;
  bankName?: string;
  isDefault: boolean;
  createdAt: string;
}

// ─── Wallet Initialization ────────────────────────────────────────────────────

/**
 * Initializes wallet balance for a new user with a random amount Rs 500–2000
 * (in Rs 50 increments). No-op if wallet_balance is already set.
 * Returns the final balance.
 */
export async function initializeWallet(userId: string): Promise<number> {
  const { data: existing } = await supabase
    .from('users')
    .select('wallet_balance')
    .eq('id', userId)
    .single();

  if (existing?.wallet_balance != null) {
    return Number(existing.wallet_balance);
  }

  // Random Rs 500–2000 in Rs 50 increments → 31 possible values
  const steps   = Math.floor(Math.random() * 31); // 0..30
  const balance = 500 + steps * 50;               // Rs 500 → Rs 2000

  await supabase
    .from('users')
    .update({ wallet_balance: balance })
    .eq('id', userId);

  return balance;
}

// ─── Wallet Balance ───────────────────────────────────────────────────────────

/** Fetch current wallet balance from DB. Returns null if not yet initialized. */
export async function getWalletBalance(userId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('users')
    .select('wallet_balance')
    .eq('id', userId)
    .single();

  if (error || data?.wallet_balance == null) return null;
  return Number(data.wallet_balance);
}

/**
 * Deduct `amount` from the user's wallet balance.
 * Returns the new balance, or an error string if balance is insufficient.
 */
export async function deductWalletBalance(
  userId: string,
  amount: number,
): Promise<{ newBalance: number | null; error?: string }> {
  const current = await getWalletBalance(userId);

  if (current === null) {
    return { newBalance: null, error: 'Wallet not initialized' };
  }
  if (current < amount) {
    return {
      newBalance: null,
      error: `Insufficient balance (Rs ${current} available, Rs ${amount} required)`,
    };
  }

  const newBalance = current - amount;
  const { error } = await supabase
    .from('users')
    .update({ wallet_balance: newBalance })
    .eq('id', userId);

  if (error) return { newBalance: null, error: error.message };
  return { newBalance };
}

// ─── Payment Methods ──────────────────────────────────────────────────────────

/** Fetch all saved payment methods for the user, newest first. */
export async function getSavedPaymentMethods(
  userId: string,
): Promise<SavedPaymentMethod[]> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id:            row.id,
    userId:        row.user_id,
    type:          row.type as WalletPaymentType,
    accountTitle:  row.account_title,
    accountNumber: row.account_number,
    bankName:      row.bank_name ?? undefined,
    isDefault:     row.is_default,
    createdAt:     row.created_at,
  }));
}

/** Add a new payment method. Auto-defaults if it is the first one. */
export async function addPaymentMethod(params: {
  userId: string;
  type: WalletPaymentType;
  accountTitle: string;
  accountNumber: string;
  bankName?: string;
  makeDefault?: boolean;
}): Promise<{ id?: string; error?: string }> {
  // Determine whether to make it the default
  const existing  = await getSavedPaymentMethods(params.userId);
  const isDefault = params.makeDefault || existing.length === 0;

  if (isDefault) {
    // Clear any current default
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', params.userId);
  }

  const { data, error } = await supabase
    .from('payment_methods')
    .insert({
      user_id:        params.userId,
      type:           params.type,
      account_title:  params.accountTitle,
      account_number: params.accountNumber,
      bank_name:      params.bankName ?? null,
      is_default:     isDefault,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { id: data?.id };
}

/** Remove a saved payment method by id. */
export async function deletePaymentMethod(
  id: string,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('payment_methods')
    .delete()
    .eq('id', id);
  return { error: error?.message };
}

/** Set a specific method as default, clearing all others. */
export async function setDefaultPaymentMethod(
  id: string,
  userId: string,
): Promise<{ error?: string }> {
  await supabase
    .from('payment_methods')
    .update({ is_default: false })
    .eq('user_id', userId);

  const { error } = await supabase
    .from('payment_methods')
    .update({ is_default: true })
    .eq('id', id);

  return { error: error?.message };
}
