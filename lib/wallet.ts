import { supabase } from './supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

/** 20% of the service total is deducted as an advance when joining a queue. */
export const COMMITMENT_RATE = 0.20;

/**
 * Returns the advance fee for a given service total (20%).
 * Returns 0 when no total is provided (walk-in / unpriced queue).
 */
export function calculateCommitmentFee(totalAmount?: number): number {
  if (!totalAmount || totalAmount <= 0) return 0;
  return Math.ceil(totalAmount * COMMITMENT_RATE);
}

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

/** Full wallet record as stored in the `wallets` table. */
export interface WalletInfo {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  isActive: boolean;
  totalCredited: number;
  totalDebited: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Wallet Initialization ────────────────────────────────────────────────────

/**
 * Ensures a wallet row exists for this user in the `wallets` table.
 * - If the row already exists → returns the current balance (no-op).
 * - Otherwise creates a new row with a random Rs 500–2000 starting balance
 *   and mirrors it back to `users.wallet_balance` for backward compat.
 */
export async function initializeWallet(userId: string): Promise<number> {
  // 1. Check wallets table first (new source of truth)
  const { data: existing } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing != null) return Number(existing.balance);

  // 2. Check if there's already a balance on users (migration path)
  const { data: userRow } = await supabase
    .from('users')
    .select('wallet_balance')
    .eq('id', userId)
    .single();

  const balance = userRow?.wallet_balance != null
    ? Number(userRow.wallet_balance)
    : 500 + Math.floor(Math.random() * 31) * 50; // Rs 500–2000

  // 3. Create the wallet row — ignoreDuplicates prevents a concurrent init
  //    call from overwriting an already-inserted row with a different balance.
  await supabase.from('wallets').upsert(
    { user_id: userId, balance, currency: 'PKR', is_active: false },
    { onConflict: 'user_id', ignoreDuplicates: true },
  );

  // 4. Keep users.wallet_balance in sync (backward compat)
  await supabase.from('users').update({ wallet_balance: balance }).eq('id', userId);

  return balance;
}

// ─── Wallet Read ──────────────────────────────────────────────────────────────

/** Fetch current balance from `wallets` table. Returns null if wallet not found. */
export async function getWalletBalance(userId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || data == null) return null;
  return Number(data.balance);
}

/** Fetch the full wallet record (balance + stats + metadata). */
export async function getWalletInfo(userId: string): Promise<WalletInfo | null> {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id:            data.id,
    userId:        data.user_id,
    balance:       Number(data.balance),
    currency:      data.currency,
    isActive:      data.is_active,
    totalCredited: Number(data.total_credited),
    totalDebited:  Number(data.total_debited),
    createdAt:     data.created_at,
    updatedAt:     data.updated_at,
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Sync wallets.is_active based on whether the user has any saved payment methods. */
async function _syncWalletActive(userId: string): Promise<void> {
  const { count } = await supabase
    .from('payment_methods')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  await supabase
    .from('wallets')
    .update({ is_active: (count ?? 0) > 0 })
    .eq('user_id', userId);
}

// ─── Wallet Write ─────────────────────────────────────────────────────────────

/**
 * Deduct `amount` from the user's wallet.
 * Updates `wallets.balance`, `wallets.total_debited`, and `users.wallet_balance`.
 */
export async function deductWalletBalance(
  userId: string,
  amount: number,
): Promise<{ newBalance: number | null; balanceBefore: number | null; error?: string }> {
  const { data: wallet, error: fetchErr } = await supabase
    .from('wallets')
    .select('balance, total_debited')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchErr || !wallet) {
    return { newBalance: null, balanceBefore: null, error: 'Wallet not found' };
  }

  const current = Number(wallet.balance);
  if (current < amount) {
    return {
      newBalance: null,
      balanceBefore: current,
      error: `Insufficient balance (Rs ${current} available, Rs ${amount} required)`,
    };
  }

  const newBalance      = current - amount;
  const newTotalDebited = Number(wallet.total_debited) + amount;

  const { error } = await supabase
    .from('wallets')
    .update({ balance: newBalance, total_debited: newTotalDebited })
    .eq('user_id', userId);

  if (error) return { newBalance: null, balanceBefore: current, error: error.message };

  // Keep users.wallet_balance in sync
  await supabase.from('users').update({ wallet_balance: newBalance }).eq('id', userId);

  return { newBalance, balanceBefore: current };
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
  const existing  = await getSavedPaymentMethods(params.userId);
  const isDefault = params.makeDefault || existing.length === 0;

  if (isDefault) {
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

  // Activate the wallet now that a method exists
  await _syncWalletActive(params.userId);

  return { id: data?.id };
}

/** Remove a saved payment method by id. Pass userId to deactivate wallet if last method removed. */
export async function deletePaymentMethod(
  id: string,
  userId?: string,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('payment_methods')
    .delete()
    .eq('id', id);

  if (userId) await _syncWalletActive(userId);

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

// ─── Wallet Top-Up ───────────────────────────────────────────────────────────

/**
 * Add `amount` to the user's wallet.
 * Updates `wallets.balance`, `wallets.total_credited`, and `users.wallet_balance`.
 */
export async function topUpWalletBalance(
  userId: string,
  amount: number,
): Promise<{ newBalance: number | null; balanceBefore: number | null; error?: string }> {
  const { data: wallet, error: fetchErr } = await supabase
    .from('wallets')
    .select('balance, total_credited')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchErr || !wallet) {
    return { newBalance: null, balanceBefore: null, error: 'Wallet not found' };
  }

  const current          = Number(wallet.balance);
  const newBalance        = current + amount;
  const newTotalCredited  = Number(wallet.total_credited) + amount;

  const { error } = await supabase
    .from('wallets')
    .update({ balance: newBalance, total_credited: newTotalCredited })
    .eq('user_id', userId);

  if (error) return { newBalance: null, balanceBefore: current, error: error.message };

  // Keep users.wallet_balance in sync
  await supabase.from('users').update({ wallet_balance: newBalance }).eq('id', userId);

  return { newBalance, balanceBefore: current };
}

// ─── Wallet Transactions ──────────────────────────────────────────────────────

export interface WalletTransaction {
  id: string;
  userId: string;
  queueEntryId?: string;
  businessId?: string;
  paymentMethodId?: string;
  amount: number;
  type: 'debit' | 'credit';
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

/** Record a wallet debit/credit in the ledger. */
export async function recordWalletTransaction(params: {
  userId: string;
  queueEntryId?: string;
  businessId?: string;
  paymentMethodId?: string;
  amount: number;
  type: 'debit' | 'credit';
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
}): Promise<{ id?: string; error?: string }> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .insert({
      user_id:           params.userId,
      queue_entry_id:    params.queueEntryId    ?? null,
      business_id:       params.businessId      ?? null,
      payment_method_id: params.paymentMethodId ?? null,
      amount:            params.amount,
      type:              params.type,
      reason:            params.reason,
      balance_before:    params.balanceBefore,
      balance_after:     params.balanceAfter,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { id: data?.id };
}

/** Fetch the 50 most recent transactions for a user. */
export async function getWalletTransactions(
  userId: string,
): Promise<WalletTransaction[]> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((row) => ({
    id:              row.id,
    userId:          row.user_id,
    queueEntryId:    row.queue_entry_id    ?? undefined,
    businessId:      row.business_id       ?? undefined,
    paymentMethodId: row.payment_method_id ?? undefined,
    amount:          Number(row.amount),
    type:            row.type as 'debit' | 'credit',
    reason:          row.reason,
    balanceBefore:   Number(row.balance_before),
    balanceAfter:    Number(row.balance_after),
    createdAt:       row.created_at,
  }));
}
