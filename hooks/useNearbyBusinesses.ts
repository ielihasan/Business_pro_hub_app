import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { fetchBusinesses, subscribeToBusinesses, BusinessRecord } from '@/lib/business';

type BusinessWithDistance = BusinessRecord & { distanceKm: number };

interface UseNearbyBusinessesOptions {
  radiusKm: number;
  category: string;
  query: string;
}

export function useNearbyBusinesses({ radiusKm, category, query }: UseNearbyBusinessesOptions) {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [businesses, setBusinesses] = useState<BusinessWithDistance[]>([]);

  // Initial load + realtime subscription
  useEffect(() => {
    let unsub: (() => Promise<void>) | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude } = pos.coords;
        setUserLocation({ latitude, longitude });

        const bs = await fetchBusinesses({ latitude, longitude, radiusKm, category, query });
        setBusinesses(bs);

        unsub = subscribeToBusinesses(() => {
          (async () => {
            const fresh = await fetchBusinesses({ latitude, longitude, radiusKm, category, query });
            setBusinesses(fresh);
          })();
        });
      } catch (err) {
        console.warn('Location / fetch error', err);
      }
    })();

    return () => {
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (!userLocation) return;

    (async () => {
      try {
        const bs = await fetchBusinesses({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radiusKm,
          category,
          query,
        });
        setBusinesses(bs);
      } catch (err) {
        console.warn('Refetch failed', err);
      }
    })();
  }, [category, query, userLocation, radiusKm]);

  return { userLocation, businesses };
}
