import { supabase } from './supabase';

// ── Points constants ──────────────────────────────────────────────────────────
export const POINTS_QUEUE_JOIN     = 10;   // flat on every join
export const POINTS_PER_100_SPENT  = 5;    // per Rs 100 of total_price
export const POINTS_QUEUE_COMPLETE = 15;   // bonus when status → completed
export const POINTS_FEEDBACK       = 50;   // on feedback submit

// ── Tier thresholds ───────────────────────────────────────────────────────────
export const TIERS = [
  { key: 'bronze',   label: 'Bronze',   min: 0,    max: 499,  icon: '🥉', color: '#CD7F32' },
  { key: 'silver',   label: 'Silver',   min: 500,  max: 1999, icon: '🥈', color: '#A8A9AD' },
  { key: 'gold',     label: 'Gold',     min: 2000, max: 4999, icon: '🥇', color: '#FFD700' },
  { key: 'platinum', label: 'Platinum', min: 5000, max: Infinity, icon: '💎', color: '#52B788' },
] as const;

export type TierKey = typeof TIERS[number]['key'];

export function getTier(points: number) {
  return TIERS.find(t => points >= t.min && points <= t.max) ?? TIERS[0];
}

export function getNextTier(points: number) {
  const idx = TIERS.findIndex(t => points >= t.min && points <= t.max);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

export function getTierProgress(points: number): number {
  const tier = getTier(points);
  if (tier.max === Infinity) return 100;
  const range = tier.max - tier.min + 1;
  return Math.min(100, Math.round(((points - tier.min) / range) * 100));
}

/** Points earned from a queue join (join bonus + spending multiplier). */
export function calcQueueJoinPoints(totalPrice: number): number {
  const spendBonus = Math.floor(totalPrice / 100) * POINTS_PER_100_SPENT;
  return POINTS_QUEUE_JOIN + spendBonus;
}

// ── DB helpers ────────────────────────────────────────────────────────────────

export async function awardPoints(
  userId: string,
  points: number,
  reason: string,
  description: string,
  referenceId?: string,
  businessId?: string,
  amountSpent = 0,
): Promise<{ newPoints: number | null; error: string | null }> {
  const { data, error } = await supabase.rpc('award_loyalty_points', {
    p_user_id:     userId,
    p_points:      points,
    p_reason:      reason,
    p_description: description,
    p_reference_id: referenceId ?? null,
    p_business_id:  businessId ?? null,
    p_amount_spent: amountSpent,
  });
  if (error) return { newPoints: null, error: error.message };
  return { newPoints: data as number, error: null };
}

export async function fetchLoyaltyTransactions(
  userId: string,
  limit = 50,
): Promise<{ data: LoyaltyTransaction[]; error: string | null }> {
  const { data, error } = await supabase
    .from('loyalty_transactions')
    .select('id, points, reason, description, amount_spent, balance_after, created_at, business_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as LoyaltyTransaction[], error: null };
}

export interface LoyaltyTransaction {
  id: string;
  points: number;
  reason: string;
  description?: string;
  amount_spent?: number;
  balance_after: number;
  created_at: string;
  business_id?: string;
}
