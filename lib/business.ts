import { supabase } from './supabase';
import { haversineDistance } from './geoutils';

export type BusinessRecord = {
  id: string;
  name: string;
  category?: string;
  latitude?: number | null;
  longitude?: number | null;
  queue_length?: number | null;
  wait_time?: string | null;
  rating?: number | null;
  is_open?: boolean | null;
  address?: string | null;
  phone?: string | null;
  description?: string | null;
};

export async function fetchBusinesses(opts: {
  latitude?: number | null;
  longitude?: number | null;
  radiusKm?: number;
  category?: string;
  query?: string;
  limit?: number;
}): Promise<Array<BusinessRecord & { distanceKm: number | null }>> {

  const {
    latitude,
    longitude,
    radiusKm = 10,
    category,
    query: searchQuery,
    limit = 200,
  } = opts;

  const hasLocation = typeof latitude === 'number' && typeof longitude === 'number';

  // ── Fetch from all three sources in parallel ─────────────────────────────────
  const [bizResult, adminsResult, appsResult] = await Promise.all([
    // 1. legacy businesses table
    supabase.from('businesses').select('*').limit(limit),

    // 2. admin-registered business owners (already approved)
    supabase
      .from('admins')
      .select('id, business_name, business_type, business_address, business_phone, business_description')
      .eq('role', 'business_owner')
      .eq('is_approved', true)
      .limit(limit),

    // 3. business_applications — the primary approved-business source
    supabase
      .from('business_applications')
      .select('id, business_name, business_type, business_address, business_phone, business_description')
      .eq('is_approved', true)
      .eq('is_rejected', false)
      .limit(limit),
  ]);

  if (bizResult.error) {
    console.warn('[fetchBusinesses] businesses table error:', bizResult.error.message);
  }
  if (adminsResult.error) {
    console.warn('[fetchBusinesses] admins table error:', adminsResult.error.message);
  }
  if (appsResult.error) {
    console.warn('[fetchBusinesses] business_applications error:', appsResult.error.message);
  }

  // ── Normalise: businesses table ───────────────────────────────────────────────
  const fromBusinesses: Array<BusinessRecord & { distanceKm: number | null }> =
    (bizResult.data ?? []).map((b: any) => {
      const lat: number | null = b.latitude ?? b.lat ?? null;
      const lon: number | null = b.longitude ?? b.lng ?? b.lon ?? null;
      return {
        ...b,
        id:           b.id,
        name:         b.name         ?? b.business_name  ?? '',
        category:     b.category     ?? b.business_type  ?? '',
        is_open:      b.is_open      ?? b.isOpen         ?? true,
        latitude:     lat,
        longitude:    lon,
        queue_length: b.queue_length ?? b.queueLength    ?? null,
        wait_time:    b.wait_time    ?? b.waitTime       ?? null,
        rating:       b.rating       ?? null,
        address:      b.address      ?? b.business_address ?? null,
        phone:        b.phone        ?? b.business_phone   ?? null,
        description:  b.description  ?? b.business_description ?? null,
        distanceKm: (hasLocation && lat !== null && lon !== null)
          ? haversineDistance(latitude!, longitude!, lat, lon)
          : null,
      };
    });

  // ── Normalise: admins table ───────────────────────────────────────────────────
  const fromAdmins: Array<BusinessRecord & { distanceKm: number | null }> =
    (adminsResult.data ?? []).map((a: any) => ({
      id:           a.id,
      name:         a.business_name        ?? 'Unnamed Business',
      category:     a.business_type        ?? '',
      is_open:      true,
      latitude:     null,
      longitude:    null,
      queue_length: null,
      wait_time:    null,
      rating:       null,
      address:      a.business_address     ?? null,
      phone:        a.business_phone       ?? null,
      description:  a.business_description ?? null,
      distanceKm:   null,
    }));

  // ── Normalise: business_applications table ────────────────────────────────────
  // No lat/lon on this table — businesses are shown regardless of radius
  // but sorted to the end when location is available.
  const fromApplications: Array<BusinessRecord & { distanceKm: number | null }> =
    (appsResult.data ?? []).map((a: any) => ({
      id:           a.id,
      name:         a.business_name        ?? 'Unnamed Business',
      category:     a.business_type        ?? '',
      is_open:      true,
      latitude:     null,
      longitude:    null,
      queue_length: null,
      wait_time:    null,
      rating:       null,
      address:      a.business_address     ?? null,
      phone:        a.business_phone       ?? null,
      description:  a.business_description ?? null,
      distanceKm:   null, // no coordinates available
    }));

  // ── Merge — deduplicate by id ─────────────────────────────────────────────────
  // Priority: businesses > admins > applications (first wins)
  const seen = new Set<string>();
  const allItems: Array<BusinessRecord & { distanceKm: number | null }> = [];
  for (const b of [...fromBusinesses, ...fromAdmins, ...fromApplications]) {
    if (!seen.has(b.id)) { seen.add(b.id); allItems.push(b); }
  }

  // ── Category filter ───────────────────────────────────────────────────────────
  let filtered = allItems;
  if (category && category !== 'all') {
    filtered = filtered.filter((b) =>
      (b.category ?? '').toLowerCase().includes(category.toLowerCase())
    );
  }

  // ── Text search ───────────────────────────────────────────────────────────────
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((b) =>
      b.name.toLowerCase().includes(q) ||
      (b.category ?? '').toLowerCase().includes(q) ||
      (b.address ?? '').toLowerCase().includes(q)
    );
  }

  // ── Sort: by distance when available, address-only businesses go last ─────────
  if (hasLocation) {
    filtered.sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
      if (a.distanceKm !== null) return -1;
      if (b.distanceKm !== null) return 1;
      return 0;
    });
  }

  return filtered;
}

export function subscribeToBusinesses(onChange: (payload: any) => void) {
  try {
    const channel = supabase
      .channel('public:businesses-and-applications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, onChange)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'business_applications' }, onChange)
      .subscribe();

    return async () => {
      try { await supabase.removeChannel(channel); } catch { /* ignore */ }
    };
  } catch (err) {
    console.warn('Realtime subscribe failed', err);
    return async () => {};
  }
}

export async function createBusiness(record: {
  name: string;
  category?: string;
  latitude?: number | null;
  longitude?: number | null;
  queue_length?: number | null;
  wait_time?: string | null;
  rating?: number | null;
  is_open?: boolean | null;
}) {
  const { data, error } = await supabase
    .from('businesses')
    .insert(record)
    .select()
    .limit(1);

  if (error) throw error;
  return data?.[0] ?? null;
}
