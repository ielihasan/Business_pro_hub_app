import { haversineDistance, getBoundingBox } from '@/lib/geoutils';

describe('haversineDistance', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineDistance(51.5, -0.12, 51.5, -0.12)).toBe(0);
  });

  it('calculates NYC → London (~5570 km) within 1%', () => {
    const dist = haversineDistance(40.7128, -74.006, 51.5074, -0.1278);
    expect(dist).toBeGreaterThan(5500);
    expect(dist).toBeLessThan(5650);
  });

  it('calculates Karachi → Lahore (~1050 km) within 5%', () => {
    const dist = haversineDistance(24.8607, 67.0011, 31.5497, 74.3436);
    expect(dist).toBeGreaterThan(980);
    expect(dist).toBeLessThan(1100);
  });

  it('is symmetric — A→B equals B→A', () => {
    const d1 = haversineDistance(10, 20, 30, 40);
    const d2 = haversineDistance(30, 40, 10, 20);
    expect(d1).toBeCloseTo(d2, 5);
  });

  it('is always non-negative', () => {
    expect(haversineDistance(-33.87, 151.21, 48.85, 2.35)).toBeGreaterThan(0);
  });

  it('handles equator coordinates', () => {
    // ~111 km per degree of longitude at equator
    const dist = haversineDistance(0, 0, 0, 1);
    expect(dist).toBeCloseTo(111.19, 0);
  });

  it('handles antimeridian crossing', () => {
    const dist = haversineDistance(0, 179, 0, -179);
    expect(dist).toBeCloseTo(222.38, 0);
  });
});

describe('getBoundingBox', () => {
  it('returns an object with minLat, maxLat, minLon, maxLon', () => {
    const box = getBoundingBox(0, 0, 10);
    expect(box).toHaveProperty('minLat');
    expect(box).toHaveProperty('maxLat');
    expect(box).toHaveProperty('minLon');
    expect(box).toHaveProperty('minLon');
  });

  it('minLat < lat < maxLat', () => {
    const { minLat, maxLat } = getBoundingBox(30, 60, 50);
    expect(minLat).toBeLessThan(30);
    expect(maxLat).toBeGreaterThan(30);
  });

  it('minLon < lon < maxLon', () => {
    const { minLon, maxLon } = getBoundingBox(30, 60, 50);
    expect(minLon).toBeLessThan(60);
    expect(maxLon).toBeGreaterThan(60);
  });

  it('larger radius produces wider box', () => {
    const small = getBoundingBox(0, 0, 10);
    const large = getBoundingBox(0, 0, 100);
    expect(large.maxLat - large.minLat).toBeGreaterThan(small.maxLat - small.minLat);
    expect(large.maxLon - large.minLon).toBeGreaterThan(small.maxLon - small.minLon);
  });

  it('radius 0 returns a degenerate box (min === max)', () => {
    const box = getBoundingBox(20, 40, 0);
    expect(box.minLat).toBeCloseTo(box.maxLat, 10);
    expect(box.minLon).toBeCloseTo(box.maxLon, 10);
  });

  it('box is symmetric around the origin', () => {
    const box = getBoundingBox(0, 0, 50);
    expect(Math.abs(box.maxLat)).toBeCloseTo(Math.abs(box.minLat), 10);
  });
});
