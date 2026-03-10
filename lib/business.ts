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
};

export async function fetchBusinesses(opts: {
  latitude?: number | null;
  longitude?: number | null;
  radiusKm?: number;
  category?: string;
  query?: string;
  limit?: number;
}): Promise<Array<BusinessRecord & { distanceKm: number }>> {

  const {
    latitude,
    longitude,
    radiusKm = 5,
    category,
    query: searchQuery,
    limit = 200
  } = opts;

  const hasLocation = typeof latitude === 'number' && typeof longitude === 'number';

  // ── Fetch from both tables in parallel ──────────────────────────────────────
  const [bizResult, adminsResult] = await Promise.all([
    supabase.from('businesses').select('*').limit(limit),
    supabase
      .from('admins')
      .select('id, business_name, business_type, business_address, business_phone, business_description, is_approved, latitude, longitude')
      .eq('role', 'business_owner')
      .limit(limit),
  ]);

  if (bizResult.error) {
    console.error('[fetchBusinesses] businesses error:', JSON.stringify(bizResult.error));
  }

  // Normalise businesses table rows
  const fromBusinesses: Array<BusinessRecord & { distanceKm: number | null }> = (bizResult.data ?? []).map((b: any) => {
    const name: string          = b.name         ?? b.business_name  ?? b.business_title ?? '';
    const category: string      = b.category     ?? b.business_type  ?? b.type          ?? '';
    const isOpen: boolean       = b.is_open      ?? b.isOpen         ?? true;
    const lat: number | null    = b.latitude     ?? b.lat            ?? null;
    const lon: number | null    = b.longitude    ?? b.lng            ?? b.lon           ?? null;
    return {
      ...b,
      id: b.id,
      name, category,
      is_open: isOpen,
      latitude: lat, longitude: lon,
      queue_length: b.queue_length ?? b.queueLength ?? null,
      wait_time:    b.wait_time   ?? b.waitTime     ?? null,
      rating:       b.rating      ?? null,
      distanceKm: (hasLocation && lat !== null && lon !== null)
        ? haversineDistance(latitude as number, longitude as number, lat, lon)
        : null,
    };
  });

  // Normalise admins table rows (business_owner registrations)
  const fromAdmins: Array<BusinessRecord & { distanceKm: number | null }> = (adminsResult.data ?? []).map((a: any) => {
    const lat: number | null = a.latitude  ?? null;
    const lon: number | null = a.longitude ?? null;
    return {
      id:           a.id,
      name:         a.business_name        ?? 'Unnamed Business',
      category:     a.business_type        ?? '',
      is_open:      a.is_approved          ?? true,
      latitude:     lat,
      longitude:    lon,
      queue_length: null,
      wait_time:    null,
      rating:       null,
      // Extra fields surfaced for the detail page
      address:      a.business_address     ?? null,
      phone:        a.business_phone       ?? null,
      description:  a.business_description ?? null,
      distanceKm: (hasLocation && lat !== null && lon !== null)
        ? haversineDistance(latitude as number, longitude as number, lat, lon)
        : null,
    };
  });

  // Merge — deduplicate by id
  const seen = new Set<string>();
  const allItems: Array<BusinessRecord & { distanceKm: number | null }> = [];
  for (const b of [...fromBusinesses, ...fromAdmins]) {
    if (!seen.has(b.id)) { seen.add(b.id); allItems.push(b); }
  }

  // JS-side radius filter — businesses with no coordinates are always included
  let filtered = hasLocation
    ? allItems.filter((b) => b.distanceKm === null || b.distanceKm <= radiusKm)
    : allItems;

  // DB-side bounding box removed — JS-side radius applied above
  // Category filter

  // DB-side bounding box removed — JS-side radius applied above
  // Category filter
  if (category && category !== 'all') {
    filtered = filtered.filter((b) =>
      b.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  // Text search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((b) =>
      b.name.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  }

  if (hasLocation) {
    filtered.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  return filtered;
}

export function subscribeToBusinesses(
  onChange: (payload: any) => void
) {
  try {
    const channel = supabase
      .channel('public:businesses')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'businesses' },
        (payload) => {
          onChange(payload);
        }
      )
      .subscribe();

    return async () => {
      try {
        await supabase.removeChannel(channel);
      } catch {
        // ignore
      }
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
