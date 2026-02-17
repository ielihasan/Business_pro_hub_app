import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '@/hooks/useTheme';
import { fetchBusinesses, BusinessRecord, subscribeToBusinesses, createBusiness } from '@/lib/business';
import { MapControls } from '@/components/map';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const { colors } = useTheme();
  const [region, setRegion] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Array<BusinessRecord & { distanceKm: number }>>([]);
  const [radiusKm, setRadiusKm] = useState(5);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Food & Beverage');
  const [newIsOpen, setNewIsOpen] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLoading(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude } = pos.coords;
        setRegion({ latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 });
        const bs = await fetchBusinesses({ latitude, longitude, radiusKm });
        setBusinesses(bs);

        subscribeToBusinesses(async () => {
          const fresh = await fetchBusinesses({ latitude, longitude, radiusKm });
          setBusinesses(fresh);
        });
      } catch (err) {
        console.warn('Map load error', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [radiusKm]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  }, []);

  const handleSaveBusiness = useCallback(async () => {
    try {
      setLoading(true);
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await createBusiness({
        name: newName,
        category: newCategory,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        is_open: newIsOpen,
      });
      setNewName('');
      setNewCategory('Food & Beverage');
      setNewIsOpen(true);
      setAdding(false);
      const bs = await fetchBusinesses({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        radiusKm,
      });
      setBusinesses(bs);
    } catch (err) {
      console.warn('Create business failed', err);
    } finally {
      setLoading(false);
    }
  }, [newName, newCategory, newIsOpen, radiusKm]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>Loading map...</Text>
      </View>
    );
  }

  if (!region) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Location permission required to view map.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView provider={PROVIDER_GOOGLE} style={styles.map} region={region} showsUserLocation>
        <Circle
          center={{ latitude: region.latitude, longitude: region.longitude }}
          radius={radiusKm * 1000}
          fillColor={colors.primary + '20'}
          strokeColor={colors.primary + '60'}
        />
        {businesses.map((b) =>
          b.latitude && b.longitude ? (
            <Marker
              key={b.id}
              coordinate={{ latitude: b.latitude as number, longitude: b.longitude as number }}
              title={b.name}
              description={b.category}
            />
          ) : null
        )}
      </MapView>

      <MapControls
        radiusKm={radiusKm}
        onRadiusChange={setRadiusKm}
        onRefresh={handleRefresh}
        adding={adding}
        onToggleAdding={() => setAdding((s) => !s)}
        newName={newName}
        newCategory={newCategory}
        newIsOpen={newIsOpen}
        onNameChange={setNewName}
        onCategoryChange={setNewCategory}
        onIsOpenChange={setNewIsOpen}
        onSave={handleSaveBusiness}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
