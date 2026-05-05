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
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  advance_paid?: number;
  payment_left?: number;
  ticket_no?: string;
  position: number;
  status: 'waiting' | 'called' | 'in_progress' | 'completed' | 'cancelled';
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

/**
 * Generates a rich ticket ID from position + optional join timestamp.
 * With timestamp: BHP-DDMM-HHMM-NNN  e.g. BHP-1104-1456-001
 * Without:        BHP-0000-0000-NNN   (fallback)
 */
export function ticketLabel(position: number, joinedAt?: string): string {
  const pos = String(position).padStart(3, '0');
  if (!joinedAt) return `BHP-0000-0000-${pos}`;
  const d = new Date(joinedAt);
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const hh   = String(d.getHours()).padStart(2, '0');
  const min  = String(d.getMinutes()).padStart(2, '0');
  return `BHP-${dd}${mm}-${hh}${min}-${pos}`;
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
  // Fetch live queue count in parallel with business lookup
  const [liveQueue, bizResult, adminResult] = await Promise.all([
    supabase
      .from('queues')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .in('status', ['waiting', 'in_progress']),
    supabase.from('businesses').select('*').eq('id', businessId).maybeSingle(),
    supabase
      .from('admins')
      .select('id, business_name, business_type, business_address, business_phone, business_description, is_approved')
      .eq('id', businessId)
      .eq('role', 'business_owner')
      .maybeSingle(),
  ]);

  const liveCount = liveQueue.count ?? 0;
  const waitStr = liveCount > 0 ? `~${liveCount * 5} min` : 'No wait';

  // 1. Try the businesses table first
  const biz = bizResult.data;
  if (biz) {
    return {
      data: {
        id: biz.id,
        name: biz.name ?? biz.business_name ?? biz.business_title ?? 'Unknown',
        category: biz.category ?? biz.business_type ?? biz.type ?? '',
        address: biz.address ?? biz.business_address ?? '',
        phone: biz.phone ?? biz.business_phone ?? '',
        description: biz.description ?? biz.business_description ?? '',
        latitude: biz.latitude ?? null,
        longitude: biz.longitude ?? null,
        avatar_url: biz.avatar_url ?? null,
        is_open: biz.is_open ?? biz.isOpen ?? biz.open ?? true,
        queue_length: liveCount,
        wait_time: biz.wait_time ?? biz.waitTime ?? waitStr,
        rating: biz.rating ?? null,
        source: 'Business',
      } as any,
      error: null,
    };
  }

  // 2. Fall back to admins table (business_owner rows)
  const admin = adminResult.data;
  if (!admin) {
    return { data: null, error: adminResult.error?.message ?? 'Business not found' };
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
      queue_length: liveCount,
      wait_time: waitStr,
      rating: null,
      source: 'admins',
    } as any,
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
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  if (error) return { data: null, error: error.message };

  // Normalise column names
  const normalised: BusinessDetail = {
    ...(data as any),
    name:         data.name          ?? data.business_name  ?? data.business_title ?? 'Unknown',
    category:     data.category      ?? data.business_type  ?? data.type           ?? '',
    is_open:      data.is_open       ?? data.isOpen         ?? true,
    latitude:     data.latitude      ?? data.lat            ?? null,
    longitude:    data.longitude     ?? data.lng            ?? data.lon            ?? null,
    queue_length: data.queue_length  ?? data.queueLength    ?? null,
    wait_time:    data.wait_time     ?? data.waitTime       ?? null,
    rating:       data.rating        ?? null,
  };
  return { data: normalised, error: null };
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

/**
 * Fetch all active services for a business from the `services` table.
 */
export async function fetchServicesByBusiness(
  businessId: string
): Promise<{ data: ServiceRecord[]; error: string | null }> {
  const { data, error } = await supabase
    .from('services')
    .select('id, business_id, name, description, price, estimated_duration, is_active')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as ServiceRecord[], error: null };
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
  opts?: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    serviceType?: string;
    quantity?: number;
    unitPrice?: number;
    totalAmount?: number;
  }
): Promise<{ data: QueueEntryRecord | null; error: string | null }> {
  // 1+2. Run duplicate check and wait-time lookup in parallel
  // Position is now assigned by DB trigger (assign_queue_position) — no JS race condition
  const [existingRes, waitRes] = await Promise.all([
    supabase
      .from('queues')
      .select('id')
      .eq('business_id', businessId)
      .eq('customer_id', userId)
      .in('status', ['waiting', 'called', 'in_progress'])
      .maybeSingle(),
    opts?.serviceType
      ? supabase.from('services').select('estimated_duration').eq('id', opts.serviceType).maybeSingle()
      : supabase.from('businesses').select('wait_time, waitTime').eq('id', businessId).maybeSingle(),
  ]);

  if (existingRes.data) {
    return fetchQueueEntry(existingRes.data.id);
  }

  // Estimate wait time (position will be assigned by DB trigger)
  let waitMinutes = 5; // fallback per person
  if (opts?.serviceType) {
    const svc = waitRes.data as any;
    if (svc?.estimated_duration) waitMinutes = svc.estimated_duration;
  } else {
    const biz = waitRes.data as any;
    const rawWait = biz?.wait_time ?? biz?.waitTime ?? null;
    if (rawWait) waitMinutes = parseInt(String(rawWait).replace(/\D/g, '')) || waitMinutes;
  }

  // 3. Insert — position is set atomically by trg_assign_queue_position trigger
  const { data: entry, error: insertError } = await supabase
    .from('queues')
    .insert({
      business_id: businessId,
      customer_id: userId,
      customer_name: opts?.customerName,
      customer_phone: opts?.customerPhone,
      customer_email: opts?.customerEmail,
      service_type: opts?.serviceType,
      position: 0,               // placeholder — trigger overwrites this immediately
      status: 'waiting',
      estimated_wait_time: waitMinutes,
      joined_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) return { data: null, error: insertError.message };

  // 4b. Best-effort pricing persistence into queues table.
  // If these columns are not present in some environments, we gracefully
  // fallback to storing pricing metadata in `notes`.
  const quantity = opts?.quantity ?? 1;
  const unitPrice = opts?.unitPrice ?? 0;
  const totalAmount = opts?.totalAmount ?? unitPrice * quantity;

  const pricingUpdate: Record<string, any> = {};
  if (Number.isFinite(quantity)) pricingUpdate.quantity = quantity;
  if (Number.isFinite(unitPrice)) pricingUpdate.unit_price = unitPrice;
  if (Number.isFinite(totalAmount)) pricingUpdate.total_price = totalAmount;

  // 5. Pricing update + business name resolve in parallel
  const pricingPromise = Object.keys(pricingUpdate).length > 0
    ? supabase.from('queues').update(pricingUpdate).eq('id', entry.id).then(({ error: pricingError }) => {
        if (pricingError) {
          console.warn('Queues pricing columns update failed, falling back to notes:', pricingError.message);
          const pricingMeta = JSON.stringify({ quantity, unit_price: unitPrice, total_price: totalAmount });
          const fallbackNotes = entry.notes
            ? `${entry.notes}\npricing_meta:${pricingMeta}`
            : `pricing_meta:${pricingMeta}`;
          return supabase.from('queues').update({ notes: fallbackNotes }).eq('id', entry.id);
        }
        (entry as any).quantity = quantity;
        (entry as any).unit_price = unitPrice;
        (entry as any).total_price = totalAmount;
      })
    : Promise.resolve();

  const [, { data: resolvedBiz }] = await Promise.all([pricingPromise, resolveBusinessById(businessId)]);

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
 * Fetch a single queue entry by its ID, then resolve the business separately.
 */
export async function fetchQueueEntry(
  entryId: string
): Promise<{ data: QueueEntryRecord | null; error: string | null }> {
  const { data, error } = await supabase
    .from('queues')
    .select(
      `id, business_id, customer_id, customer_name, customer_phone, customer_email,
       service_type, quantity, unit_price, total_price, advance_paid, payment_left, ticket_no,
       position, status, priority, notes,
       estimated_wait_time, joined_at, called_at, started_at, completed_at, cancelled_at,
       created_at, updated_at`
    )
    .eq('id', entryId)
    .single();

  if (error) return { data: null, error: error.message };

  const entry = data as QueueEntryRecord;

  // Resolve business info separately to avoid FK-join requirement
  let businessData: BusinessDetail | undefined;
  if (entry.business_id) {
    const { data: biz } = await supabase
      .from('Business')
      .select('id, name, category, latitude, longitude, queue_length, wait_time, rating, is_open')
      .eq('id', entry.business_id)
      .maybeSingle();
    if (biz) {
      businessData = biz as BusinessDetail;
    } else {
      // Fallback: try admins table
      const { data: admin } = await supabase
        .from('admins')
        .select('id, business_name, business_type, business_address')
        .eq('id', entry.business_id)
        .eq('role', 'business_owner')
        .maybeSingle();
      if (admin) {
        businessData = {
          id: admin.id,
          name: admin.business_name ?? 'Business',
          category: admin.business_type ?? '',
          queue_length: entry.position,
          wait_time: formatWait(entry.estimated_wait_time),
          rating: 0,
          is_open: true,
        };
      }
    }
  }

  return { data: { ...entry, business: businessData }, error: null };
}

/**
 * Fetch all active queue entries for a user (separate business lookup to avoid FK-join).
 */
export async function fetchUserActiveQueues(
  userId: string
): Promise<{ data: QueueEntryRecord[]; error: string | null }> {
  const { data, error } = await supabase
    .from('queues')
    .select(
      `id, business_id, customer_id, customer_name, position, status,
       service_type, quantity, unit_price, total_price, advance_paid, payment_left, ticket_no,
       estimated_wait_time, joined_at`
    )
    .eq('customer_id', userId)
    .in('status', ['waiting', 'called', 'in_progress'])
    .order('joined_at', { ascending: false });

  if (error) return { data: [], error: error.message };

  const entries = (data ?? []) as QueueEntryRecord[];

  // Collect unique business IDs and resolve them
  const bizIds = [...new Set(entries.map((e) => e.business_id).filter(Boolean))];
  const bizMap: Record<string, BusinessDetail> = {};
  if (bizIds.length > 0) {
    const { data: bizRows } = await supabase
      .from('Business')
      .select('id, name, category, queue_length, wait_time, rating, is_open')
      .in('id', bizIds);
    for (const b of bizRows ?? []) {
      bizMap[b.id] = b as BusinessDetail;
    }
    // Fallback to admins for any not found
    const missing = bizIds.filter((id) => !bizMap[id]);
    if (missing.length > 0) {
      const { data: adminRows } = await supabase
        .from('admins')
        .select('id, business_name, business_type')
        .in('id', missing)
        .eq('role', 'business_owner');
      for (const a of adminRows ?? []) {
        bizMap[a.id] = {
          id: a.id,
          name: a.business_name ?? 'Business',
          category: a.business_type ?? '',
          queue_length: 0,
          wait_time: '',
          rating: 0,
          is_open: true,
        };
      }
    }
  }

  // Fetch live active queue counts per business (real-time total, not static queue_length)
  const liveCountMap: Record<string, number> = {};
  if (bizIds.length > 0) {
    const { data: liveRows } = await supabase
      .from('queues')
      .select('business_id')
      .in('business_id', bizIds)
      .in('status', ['waiting', 'called', 'in_progress']);
    for (const row of liveRows ?? []) {
      liveCountMap[row.business_id] = (liveCountMap[row.business_id] ?? 0) + 1;
    }
  }

  const normalized = entries.map((e) => ({
    ...e,
    business: bizMap[e.business_id]
      ? { ...bizMap[e.business_id], queue_length: liveCountMap[e.business_id] ?? e.position }
      : undefined,
  }));
  return { data: normalized, error: null };
}

/** Returns true if the string is a UUID */
export function isUuidFormat(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export interface OrderHistoryEntry extends QueueEntryRecord {
  /** Human-readable service/item name resolved from the services table */
  serviceName?: string;
  businessName: string;
  businessCategory: string;
}

/**
 * Fetch all queue entries for a user across all statuses.
 * Batch-resolves business names (businesses → admins → business_applications)
 * and service names from the services table.
 */
export async function fetchUserQueueHistory(
  userId: string
): Promise<{ data: OrderHistoryEntry[]; error: string | null }> {
  // 1. Fetch all queue entries for this user (all statuses)
  const { data, error } = await supabase
    .from('queues')
    .select(
      `id, business_id, customer_id, customer_name, customer_phone, customer_email,
       service_type, quantity, unit_price, total_price, advance_paid, payment_left, ticket_no,
       position, status, notes, estimated_wait_time,
       joined_at, called_at, started_at, completed_at, cancelled_at, created_at`
    )
    .eq('customer_id', userId)
    .order('joined_at', { ascending: false })
    .limit(100);

  if (error) return { data: [], error: error.message };
  const entries = (data ?? []) as QueueEntryRecord[];
  if (!entries.length) return { data: [], error: null };

  // 2. Collect unique IDs to batch-resolve
  const bizIds = [...new Set(entries.map((e) => e.business_id).filter(Boolean))];
  const svcIds = [...new Set(
    entries.map((e) => e.service_type).filter((s): s is string => !!s && isUuidFormat(s))
  )];

  // 3. Batch fetch from all business sources + services table in parallel
  const [bizResult, adminResult, appResult, svcResult] = await Promise.all([
    bizIds.length
      ? supabase.from('businesses').select('id, name, category').in('id', bizIds)
      : Promise.resolve({ data: [] as any[] }),
    bizIds.length
      ? supabase.from('admins').select('id, business_name, business_type').eq('role', 'business_owner').in('id', bizIds)
      : Promise.resolve({ data: [] as any[] }),
    bizIds.length
      ? supabase.from('business_applications').select('id, business_name, business_type').in('id', bizIds)
      : Promise.resolve({ data: [] as any[] }),
    svcIds.length
      ? supabase.from('services').select('id, name').in('id', svcIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  // 4. Build lookup maps (businesses > admins > business_applications)
  const bizMap = new Map<string, { name: string; category: string }>();
  for (const b of bizResult.data ?? []) bizMap.set(b.id, { name: b.name ?? '', category: b.category ?? '' });
  for (const a of adminResult.data ?? []) { if (!bizMap.has(a.id)) bizMap.set(a.id, { name: a.business_name ?? '', category: a.business_type ?? '' }); }
  for (const a of appResult.data ?? [])   { if (!bizMap.has(a.id)) bizMap.set(a.id, { name: a.business_name ?? '', category: a.business_type ?? '' }); }

  const svcMap = new Map<string, string>();
  for (const s of svcResult.data ?? []) svcMap.set(s.id, s.name ?? '');

  // 5. Enrich entries
  const enriched: OrderHistoryEntry[] = entries.map((e) => {
    const biz = bizMap.get(e.business_id);
    const rawSvc = e.service_type ?? '';
    const serviceName = rawSvc
      ? (isUuidFormat(rawSvc) ? svcMap.get(rawSvc) : rawSvc) ?? undefined
      : undefined;
    return {
      ...e,
      businessName:     biz?.name     ?? 'Unknown Business',
      businessCategory: biz?.category ?? '',
      serviceName,
    };
  });

  return { data: enriched, error: null };
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
