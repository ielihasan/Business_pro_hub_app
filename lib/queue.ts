import { supabase } from './supabase';

// ─── Types matching actual Supabase schema ────────────────────────────────────

/**
 * Business table: id, name, category, latitude, longitude,
 * queue_length, wait_time, rating, is_open, created_at, updated_at
 */
export interface BusinessDetail {
  id: string;
  name: string;
  category: string;
  latitude?: number | null;
  longitude?: number | null;
  queue_length: number;
  wait_time: string;
  rating: number;
  is_open: boolean;
  // Not in DB — kept optional so UI can gracefully degrade
  description?: string;
  address?: string;
  phone?: string;
  review_count?: number;
  image_url?: string | null;
}

/**
 * queues table: id, business_id, customer_id, customer_name, customer_phone,
 * customer_email, service_type, position, status, priority, notes,
 * estimated_wait_time (integer minutes),
 * joined_at, called_at, started_at, completed_at, cancelled_at,
 * created_at, updated_at
 */
export interface QueueEntryRecord {
  id: string;
  business_id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  service_type?: string;
  position: number;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  priority?: string;
  notes?: string;
  /** Wait time in integer minutes */
  estimated_wait_time: number;
  joined_at: string;
  called_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined relation
  business?: BusinessDetail;
}

/** Generates a ticket-style label from position, e.g. Q-003 */
export function ticketLabel(position: number): string {
  return `Q-${String(position).padStart(3, '0')}`;
}

/** Formats integer minutes as a human string, e.g. "~10 min" */
export function formatWait(minutes: number): string {
  if (!minutes) return 'N/A';
  return `~${minutes} min`;
}

// ─── Business ─────────────────────────────────────────────────────────────────

/**
 * Fetch a single business by its ID.
 * Only queries columns that actually exist in the Business table.
 */
export async function fetchBusinessById(
  businessId: string
): Promise<{ data: BusinessDetail | null; error: string | null }> {
  const { data, error } = await supabase
    .from('Business')
    .select('id, name, category, latitude, longitude, queue_length, wait_time, rating, is_open')
    .eq('id', businessId)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as BusinessDetail, error: null };
}

// ─── Queue ────────────────────────────────────────────────────────────────────

/**
 * Join the queue for a business.
 * Inserts a row in `queues`, increments `Business.queue_length`.
 */
export async function joinBusinessQueue(
  businessId: string,
  userId: string,
  opts?: { customerName?: string; customerPhone?: string; customerEmail?: string; serviceType?: string }
): Promise<{ data: QueueEntryRecord | null; error: string | null }> {
  // 1. Check if user already has an active entry for this business
  const { data: existing } = await supabase
    .from('queues')
    .select('id')
    .eq('business_id', businessId)
    .eq('customer_id', userId)
    .in('status', ['waiting', 'in_progress'])
    .maybeSingle();

  if (existing) {
    return fetchQueueEntry(existing.id);
  }

  // 2. Get current queue length to determine position
  const { data: biz, error: bizError } = await supabase
    .from('Business')
    .select('queue_length, wait_time, name, category')
    .eq('id', businessId)
    .single();

  if (bizError) return { data: null, error: bizError.message };

  const newPosition = (biz.queue_length ?? 0) + 1;
  // wait_time stored as "~10 min" — extract numeric part, fallback to position*5
  const waitMinutes = parseInt((biz.wait_time ?? '').replace(/\D/g, '')) || newPosition * 5;

  // 3. Insert into `queues`
  const { data: entry, error: insertError } = await supabase
    .from('queues')
    .insert({
      business_id: businessId,
      customer_id: userId,
      customer_name: opts?.customerName,
      customer_phone: opts?.customerPhone,
      customer_email: opts?.customerEmail,
      service_type: opts?.serviceType,
      position: newPosition,
      status: 'waiting',
      estimated_wait_time: waitMinutes,
      joined_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) return { data: null, error: insertError.message };

  // 4. Increment Business.queue_length
  await supabase
    .from('Business')
    .update({ queue_length: newPosition })
    .eq('id', businessId);

  // 5. Return with embedded business stub
  return {
    data: {
      ...(entry as QueueEntryRecord),
      business: {
        id: businessId,
        name: biz.name,
        category: biz.category ?? '',
        queue_length: newPosition,
        wait_time: biz.wait_time ?? '',
        rating: 0,
        is_open: true,
      },
    },
    error: null,
  };
}

/**
 * Fetch a single queue entry by its ID, joined with the business.
 */
export async function fetchQueueEntry(
  entryId: string
): Promise<{ data: QueueEntryRecord | null; error: string | null }> {
  const { data, error } = await supabase
    .from('queues')
    .select(
      `id, business_id, customer_id, customer_name, customer_phone, customer_email,
       service_type, position, status, priority, notes,
       estimated_wait_time, joined_at, called_at, started_at, completed_at, cancelled_at,
       created_at, updated_at,
       business:Business(id, name, category, latitude, longitude, queue_length, wait_time, rating, is_open)`
    )
    .eq('id', entryId)
    .single();

  if (error) return { data: null, error: error.message };

  const raw = data as any;
  const normalized: QueueEntryRecord = {
    ...raw,
    business: Array.isArray(raw.business) ? raw.business[0] ?? undefined : raw.business,
  };

  return { data: normalized, error: null };
}

/**
 * Fetch all active queue entries for a user.
 */
export async function fetchUserActiveQueues(
  userId: string
): Promise<{ data: QueueEntryRecord[]; error: string | null }> {
  const { data, error } = await supabase
    .from('queues')
    .select(
      `id, business_id, customer_id, customer_name, position, status,
       estimated_wait_time, joined_at,
       business:Business(id, name, category, queue_length, wait_time, rating, is_open)`
    )
    .eq('customer_id', userId)
    .in('status', ['waiting', 'in_progress'])
    .order('joined_at', { ascending: false });

  if (error) return { data: [], error: error.message };

  const normalized = (data ?? []).map((raw: any) => ({
    ...raw,
    business: Array.isArray(raw.business) ? raw.business[0] ?? undefined : raw.business,
  })) as QueueEntryRecord[];

  return { data: normalized, error: null };
}

/**
 * Fetch past (completed / cancelled) queue entries for a user.
 */
export async function fetchUserQueueHistory(
  userId: string
): Promise<{ data: QueueEntryRecord[]; error: string | null }> {
  const { data, error } = await supabase
    .from('queues')
    .select(
      `id, business_id, customer_id, customer_name, position, status,
       estimated_wait_time, joined_at, completed_at, cancelled_at,
       business:Business(id, name, category, queue_length, wait_time, rating, is_open)`
    )
    .eq('customer_id', userId)
    .in('status', ['completed', 'cancelled'])
    .order('joined_at', { ascending: false })
    .limit(50);

  if (error) return { data: [], error: error.message };

  const normalized = (data ?? []).map((raw: any) => ({
    ...raw,
    business: Array.isArray(raw.business) ? raw.business[0] ?? undefined : raw.business,
  })) as QueueEntryRecord[];

  return { data: normalized, error: null };
}

/**
 * Leave (cancel) a queue entry.
 */
export async function leaveQueueEntry(
  entryId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('queues')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', entryId);

  return { error: error ? error.message : null };
}

/**
 * Subscribe to real-time changes for a specific queue entry.
 */
export function subscribeToQueueEntry(
  entryId: string,
  onUpdate: (entry: Partial<QueueEntryRecord>) => void
) {
  const channel = supabase
    .channel(`queue:${entryId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'queues',
        filter: `id=eq.${entryId}`,
      },
      (payload) => {
        onUpdate(payload.new as Partial<QueueEntryRecord>);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
