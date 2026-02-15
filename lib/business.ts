import { supabase } from './supabase';
import { haversineDistance, getBoundingBox } from './geoutils';

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
  latitude: number;
  longitude: number;
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
    limit = 100
  } = opts;

  // Get bounding box
  const bbox = getBoundingBox(latitude, longitude, radiusKm);

  // Supabase query builder
  const dbQuery = supabase
    .from('Business')
    .select('id, name, category, latitude, longitude, queue_length, wait_time, rating, is_open')
    .gte('latitude', bbox.minLat)
    .lte('latitude', bbox.maxLat)
    .gte('longitude', bbox.minLon)
    .lte('longitude', bbox.maxLon)
    .limit(limit);

  const { data, error } = await dbQuery;

  if (error) throw error;

  const items = (data ?? []).map((b) => {
    const lat = b.latitude ?? 0;
    const lon = b.longitude ?? 0;

    const distanceKm = haversineDistance(
      latitude,
      longitude,
      lat,
      lon
    );

    return { ...b, distanceKm };
  });

  let filtered = items;

  if (category && category !== 'all') {
    filtered = filtered.filter((b) =>
      (b.category || '')
        .toLowerCase()
        .includes(category.toLowerCase())
    );
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((b) =>
      (b.name || '').toLowerCase().includes(q) ||
      (b.category || '').toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => a.distanceKm - b.distanceKm);

  return filtered;
}

export function subscribeToBusinesses(
  onChange: (payload: any) => void
) {
  try {
    const channel = supabase
      .channel('public:Business')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Business' },
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
    .from('Business')
    .insert(record)
    .select()
    .limit(1);

  if (error) throw error;

  return data?.[0] ?? null;
}
