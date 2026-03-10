import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '@/hooks/useTheme';
import { fetchBusinesses, BusinessRecord, subscribeToBusinesses, createBusiness } from '@/lib/business';
import { MapControls } from '@/components/map';
import { useStore } from '@/store/useStore';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const { colors, isDark } = useTheme();
  const { locationEnabled, toggleLocation } = useStore();
  const [region, setRegion] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [businesses, setBusinesses] = useState<Array<BusinessRecord & { distanceKm: number }>>([]);
  const [radiusKm, setRadiusKm] = useState(5);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Food & Beverage');
  const [newIsOpen, setNewIsOpen] = useState(true);

  useEffect(() => {
    if (!locationEnabled) {
      setRegion(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLocationError(null);
    let unsubscribe: (() => Promise<void>) | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('permission');
          setLoading(false);
          return;
        }

        // Try balanced accuracy first, fall back to last known position
        let pos: Location.LocationObject | null = null;
        try {
          pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        } catch {
          pos = await Location.getLastKnownPositionAsync();
        }

        if (!pos) {
          // No GPS fix — show map at a world-level default so map still renders.
          // A small banner below will tell the user GPS is off.
          setLocationError('unavailable');
          setRegion({ latitude: 30.3753, longitude: 69.3451, latitudeDelta: 40, longitudeDelta: 40 });
          setLoading(false);
          return;
        }

        const { latitude, longitude } = pos.coords;
        setRegion({ latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 });
        const bs = await fetchBusinesses({ latitude, longitude, radiusKm });
        setBusinesses(bs);

        unsubscribe = subscribeToBusinesses(async () => {
          const fresh = await fetchBusinesses({ latitude, longitude, radiusKm });
          setBusinesses(fresh);
        });
      } catch (err) {
        console.warn('Map load error', err);
        setLocationError('unavailable');
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [radiusKm, locationEnabled, retryKey]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setLocationError(null);
    setRegion(null);
    setRetryKey(k => k + 1);
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

  if (!locationEnabled) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <View style={[styles.disabledIconBg, { backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6' }]}>
          <Ionicons name="location-outline" size={48} color={colors.mutedForeground} />
        </View>
        <Text style={[styles.disabledTitle, { color: colors.foreground }]}>Location Services Off</Text>
        <Text style={[styles.disabledDesc, { color: colors.mutedForeground }]}>
          Enable location services to see businesses near you on the map.
        </Text>
        <TouchableOpacity
          style={[styles.enableBtn, { backgroundColor: colors.primary }]}
          onPress={() => toggleLocation()}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate-outline" size={18} color="#fff" />
          <Text style={styles.enableBtnText}>Enable Location</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>Loading map...</Text>
      </View>
    );
  }

  if (!region) {
    // Still loading or permission denied — show spinner or permission message
    if (locationError === 'permission') {
      return (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <View style={[styles.disabledIconBg, { backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6' }]}>
            <Ionicons name="location-outline" size={48} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.disabledTitle, { color: colors.foreground }]}>Location Access Required</Text>
          <Text style={[styles.disabledDesc, { color: colors.mutedForeground }]}>
            Please allow location permission in your device settings, then tap Retry.
          </Text>
          <TouchableOpacity
            style={[styles.enableBtn, { backgroundColor: colors.primary }]}
            onPress={() => { setLocationError(null); setLoading(true); setRegion(null); setRetryKey(k => k + 1); }}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={18} color="#fff" />
            <Text style={styles.enableBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    // Fallthrough — still waiting
    return null;
  }

  // Show map. If GPS was unavailable, show a dismissible banner at the top.
  const showGpsBanner = locationError === 'unavailable';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showGpsBanner && (
        <View style={[styles.gpsBanner, { backgroundColor: isDark ? '#2C1810' : '#FEF3C7' }]}>
          <Ionicons name="navigate-circle-outline" size={16} color={isDark ? '#FCD34D' : '#D97706'} />
          <Text style={[styles.gpsBannerText, { color: isDark ? '#FCD34D' : '#92400E' }]}>
            GPS unavailable — enable Location Services for your position
          </Text>
          <TouchableOpacity onPress={() => { setLocationError(null); setRetryKey(k => k + 1); }}>
            <Ionicons name="refresh-outline" size={16} color={isDark ? '#FCD34D' : '#D97706'} />
          </TouchableOpacity>
        </View>
      )}
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
            >
              <View style={[styles.markerContainer, { backgroundColor: colors.primary }]}>
                <Ionicons name="location" size={20} color={colors.primaryForeground} />
              </View>
            </Marker>
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
  gpsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    zIndex: 10,
  },
  gpsBannerText: { flex: 1, fontSize: 12, fontWeight: '500' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  disabledIconBg: {
    width: 96, height: 96, borderRadius: 48,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  disabledTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  disabledDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  enableBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12,
  },
  enableBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  markerContainer: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
