import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { fetchBusinesses, subscribeToBusinesses, BusinessRecord } from '@/lib/business';
import { useStore } from '@/store/useStore';

type BusinessWithDistance = BusinessRecord & { distanceKm: number };

interface UseNearbyBusinessesOptions {
  radiusKm: number;
  category: string;
  query: string;
}

export function useNearbyBusinesses({ radiusKm, category, query }: UseNearbyBusinessesOptions) {
  const locationEnabled = useStore((s) => s.locationEnabled);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [businesses, setBusinesses] = useState<BusinessWithDistance[]>([]);
  const locationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  // Always fetch businesses — with location if available, without if not
  const loadBusinesses = async (loc: { latitude: number; longitude: number } | null) => {
    try {
      const opts = loc
        ? { latitude: loc.latitude, longitude: loc.longitude, radiusKm, category, query }
        : { category, query };
      console.log('[useNearbyBusinesses] fetching with opts:', JSON.stringify(opts));
      const bs = await fetchBusinesses(opts);
      console.log('[useNearbyBusinesses] received:', bs.length, 'businesses');
      setBusinesses(bs);
    } catch (err) {
      console.warn('[useNearbyBusinesses] fetch error:', err);
    }
  };

  // Initial load: try to get location, then fetch
  useEffect(() => {
    let unsub: (() => Promise<void>) | null = null;

    (async () => {
      let loc: { latitude: number; longitude: number } | null = null;

      if (locationEnabled) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            setUserLocation(loc);
            locationRef.current = loc;
          }
        } catch {
          // location failed — still continue with locationless fetch
        }
      }

      // Always load businesses regardless of location result
      await loadBusinesses(loc);

      // Set up realtime subscription
      unsub = subscribeToBusinesses(() => {
        loadBusinesses(locationRef.current);
      });
    })();

    return () => {
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationEnabled]);

  // Refetch when filters change
  useEffect(() => {
    loadBusinesses(locationRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, query, radiusKm]);

  return { userLocation, businesses };
}
