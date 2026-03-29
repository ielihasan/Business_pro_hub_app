/**
 * Integration tests for geographic search/filtering logic.
 * Tests the haversine + bounding box pipeline used in useNearbyBusinesses.
 */
import { haversineDistance, getBoundingBox } from '@/lib/geoutils';

interface MockBusiness {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

/** Filter businesses by bounding box then sort by distance (mirrors fetchBusinesses logic). */
function filterAndSortNearby(
  businesses: MockBusiness[],
  userLat: number,
  userLon: number,
  radiusKm: number
): Array<MockBusiness & { distanceKm: number }> {
  const box = getBoundingBox(userLat, userLon, radiusKm);

  return businesses
    .filter(b => b.lat >= box.minLat && b.lat <= box.maxLat &&
                 b.lon >= box.minLon && b.lon <= box.maxLon)
    .map(b => ({ ...b, distanceKm: haversineDistance(userLat, userLon, b.lat, b.lon) }))
    .filter(b => b.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

// Mock businesses in Karachi, Pakistan area
const KARACHI_BUSINESSES: MockBusiness[] = [
  { id: '1', name: 'Clifton Coffee',      lat: 24.8138, lon: 67.0300 }, // ~3 km from centre
  { id: '2', name: 'Defence Salon',       lat: 24.8169, lon: 67.0644 }, // ~5 km
  { id: '3', name: 'Saddar Pharmacy',     lat: 24.8607, lon: 67.0104 }, // <1 km
  { id: '4', name: 'Gulshan Restaurant',  lat: 24.9261, lon: 67.1004 }, // ~12 km — outside 10km radius
  { id: '5', name: 'Airport Repairs',     lat: 24.9065, lon: 67.1631 }, // ~17 km — outside
];

const USER_LAT = 24.8607; // Saddar, Karachi
const USER_LON = 67.0104;

describe('Geographic search pipeline', () => {
  it('finds businesses within 10km radius', () => {
    const results = filterAndSortNearby(KARACHI_BUSINESSES, USER_LAT, USER_LON, 10);
    const names = results.map(b => b.name);
    expect(names).toContain('Saddar Pharmacy');
    expect(names).toContain('Clifton Coffee');
    expect(names).toContain('Defence Salon');
  });

  it('excludes businesses outside radius', () => {
    const results = filterAndSortNearby(KARACHI_BUSINESSES, USER_LAT, USER_LON, 10);
    const names = results.map(b => b.name);
    expect(names).not.toContain('Gulshan Restaurant');
    expect(names).not.toContain('Airport Repairs');
  });

  it('sorts results nearest first', () => {
    const results = filterAndSortNearby(KARACHI_BUSINESSES, USER_LAT, USER_LON, 10);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].distanceKm).toBeGreaterThanOrEqual(results[i - 1].distanceKm);
    }
  });

  it('the nearest business to Saddar is Saddar Pharmacy', () => {
    const results = filterAndSortNearby(KARACHI_BUSINESSES, USER_LAT, USER_LON, 10);
    expect(results[0].name).toBe('Saddar Pharmacy');
  });

  it('all returned businesses are within stated radius', () => {
    const results = filterAndSortNearby(KARACHI_BUSINESSES, USER_LAT, USER_LON, 10);
    results.forEach(b => {
      expect(b.distanceKm).toBeLessThanOrEqual(10);
    });
  });

  it('returns only the exact-match business with tiny radius', () => {
    // Saddar Pharmacy is at exactly the user's coords (distance = 0), so it IS within 0.001km
    const results = filterAndSortNearby(KARACHI_BUSINESSES, USER_LAT, USER_LON, 0.001);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Saddar Pharmacy');
  });

  it('returns all businesses with very large radius', () => {
    const results = filterAndSortNearby(KARACHI_BUSINESSES, USER_LAT, USER_LON, 100);
    expect(results.length).toBe(KARACHI_BUSINESSES.length);
  });

  it('attaches correct distanceKm to each result', () => {
    const results = filterAndSortNearby(KARACHI_BUSINESSES, USER_LAT, USER_LON, 10);
    results.forEach(b => {
      const expected = haversineDistance(USER_LAT, USER_LON, b.lat, b.lon);
      expect(b.distanceKm).toBeCloseTo(expected, 5);
    });
  });
});

describe('Bounding box edge cases', () => {
  it('box at north pole does not produce NaN coordinates', () => {
    const box = getBoundingBox(89, 0, 50);
    expect(isNaN(box.minLat)).toBe(false);
    expect(isNaN(box.maxLat)).toBe(false);
  });

  it('box at equator is symmetric lat/lon', () => {
    const box = getBoundingBox(0, 0, 10);
    expect(Math.abs(box.maxLat)).toBeCloseTo(Math.abs(box.minLat), 5);
  });
});
