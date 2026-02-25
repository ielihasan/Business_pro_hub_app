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

/**
 * Unified business info resolved from either the `Business` table
 * or the `admins` table (business_owner rows).
 */
export interface ResolvedBusiness {
  id: string;
  name: string;
  category: string;
  address?: string;
  phone?: string;
  description?: string;
  is_open: boolean;
  /** Source table so caller knows origin */
  source: 'Business' | 'admins';
}

/**
 * Service row from the `services` table.
 */
export interface ServiceRecord {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  price?: number | null;
  estimated_duration?: number | null;
  is_active: boolean;
}

// ─── Business ─────────────────────────────────────────────────────────────────

/**
 * Resolve a business by ID — checks `Business` first, then `admins`.
 * Returns a unified `ResolvedBusiness` regardless of which table it came from.
 */
export async function resolveBusinessById(
  businessId: string
): Promise<{ data: ResolvedBusiness | null; error: string | null }> {
  // 1. Try the Business table
  const { data: biz } = await supabase
    .from('Business')
    .select('id, name, category, latitude, longitude, queue_length, wait_time, rating, is_open')
    .eq('id', businessId)
    .maybeSingle();

  if (biz) {
    return {
      data: {
        id: biz.id,
        name: biz.name,
        category: biz.category ?? '',
        is_open: biz.is_open ?? true,
        source: 'Business',
      },
      error: null,
    };
  }

  // 2. Fall back to admins table (business_owner rows)
  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('id, business_name, business_type, business_address, business_phone, business_description, is_approved')
    .eq('id', businessId)
    .eq('role', 'business_owner')
    .maybeSingle();

  if (adminError || !admin) {
    return { data: null, error: adminError?.message ?? 'Business not found' };
  }

  return {
    data: {
      id: admin.id,
      name: admin.business_name ?? 'Unknown Business',
      category: admin.business_type ?? '',
      address: admin.business_address ?? '',
      phone: admin.business_phone ?? '',
      description: admin.business_description ?? '',
      is_open: admin.is_approved ?? true,
      source: 'admins',
    },
    error: null,
  };
}

/**
 * Fetch a single business by its ID from the Business table only.
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

/**
 * Fetch a service/queue-type by its ID from the `services` table.
 */
export async function fetchServiceById(
  serviceId: string
): Promise<{ data: ServiceRecord | null; error: string | null }> {
  const { data, error } = await supabase
    .from('services')
    .select('id, business_id, name, description, price, estimated_duration, is_active')
    .eq('id', serviceId)
    .maybeSingle();

  if (error || !data) return { data: null, error: error?.message ?? 'Service not found' };
  return { data: data as ServiceRecord, error: null };
}

// ─── Queue ────────────────────────────────────────────────────────────────────

/**
 * Join the queue for a business.
 * Works with both the `Business` table and `admins`-based businesses.
 * Position is computed from active queue count — no reliance on queue_length.
 */
export async function joinBusinessQueue(
  businessId: string,
  userId: string,
  opts?: { customerName?: string; customerPhone?: string; customerEmail?: string; serviceType?: string }
): Promise<{ data: QueueEntryRecord | null; error: string | null }> {
  // 1. Prevent duplicate active entry for same user + business
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

  // 2. Count active entries to determine next position
  const { count: activeCount } = await supabase
    .from('queues')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .in('status', ['waiting', 'in_progress']);

  const newPosition = (activeCount ?? 0) + 1;

  // 3. Resolve wait time from service estimated_duration if provided
  let waitMinutes = newPosition * 5; // fallback default
  if (opts?.serviceType) {
    const { data: svc } = await supabase
      .from('services')
      .select('estimated_duration')
      .eq('id', opts.serviceType)
      .maybeSingle();
    if (svc?.estimated_duration) {
      waitMinutes = svc.estimated_duration * newPosition;
    }
  } else {
    // Try Business table for wait_time string
    const { data: biz } = await supabase
      .from('Business')
      .select('wait_time')
      .eq('id', businessId)
      .maybeSingle();
    if (biz?.wait_time) {
      waitMinutes = parseInt(biz.wait_time.replace(/\D/g, '')) || waitMinutes;
    }
  }

  // 4. Insert into `queues`
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

  // 5. Resolve business name for the embedded stub
  const { data: resolvedBiz } = await resolveBusinessById(businessId);

  return {
    data: {
      ...(entry as QueueEntryRecord),
      business: resolvedBiz ? {
        id: resolvedBiz.id,
        name: resolvedBiz.name,
        category: resolvedBiz.category,
        address: resolvedBiz.address,
        queue_length: newPosition,
        wait_time: formatWait(waitMinutes),
        rating: 0,
        is_open: resolvedBiz.is_open,
      } : undefined,
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
