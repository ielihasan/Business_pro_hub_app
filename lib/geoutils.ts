export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getBoundingBox(lat: number, lon: number, radiusKm: number) {
  const latR = radiusKm / 111.32; // approx degrees per km
  const lonR = Math.abs(radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180)));
  return {
    minLat: lat - latR,
    maxLat: lat + latR,
    minLon: lon - lonR,
    maxLon: lon + lonR,
  };
}
