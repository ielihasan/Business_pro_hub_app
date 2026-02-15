import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '@/hooks/useTheme';
import { fetchBusinesses, BusinessRecord, subscribeToBusinesses, createBusiness } from '@/lib/business';
import { Button } from '@/components/ui';
import { TextInput, Switch } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const { colors } = useTheme();
  const [region, setRegion] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Array<BusinessRecord & { distanceKm: number }>>([]);
  const [radiusKm, setRadiusKm] = useState<number>(5);
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

        // subscribe to realtime changes and refetch on changes
        const unsub = await subscribeToBusinesses(async () => {
          const fresh = await fetchBusinesses({ latitude, longitude, radiusKm });
          setBusinesses(fresh);
        });
        return () => { if (unsub) unsub(); };
      } catch (err) {
        console.warn('Map load error', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [radiusKm]);

  // allow subscription updates when radius changes
  useEffect(() => {
    // noop - triggers reload via dependency
  }, [radiusKm]);

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
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation
      >
        <Circle
          center={{ latitude: region.latitude, longitude: region.longitude }}
          radius={radiusKm * 1000}
          fillColor={colors.primary + '20'}
          strokeColor={colors.primary + '60'}
        />

        {businesses.map((b) => (
          b.latitude && b.longitude ? (
            <Marker
              key={b.id}
              coordinate={{ latitude: b.latitude as number, longitude: b.longitude as number }}
              title={b.name}
              description={b.category}
            />
          ) : null
        ))}
      </MapView>

      <View style={styles.controls}>
        <View style={styles.radiusRow}>
          {[1, 3, 5, 10].map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRadiusKm(r)}
              style={[styles.radiusChip, { backgroundColor: radiusKm === r ? colors.primary : colors.secondary }]}
            >
              <Text style={{ color: radiusKm === r ? colors.primaryForeground : colors.foreground }}>{r} km</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Button onPress={() => { /* refresh */ setLoading(true); setTimeout(() => setLoading(false), 500); }} style={styles.refreshButton}>Refresh</Button>
        <Button onPress={() => setAdding((s) => !s)} style={[styles.refreshButton, { marginTop: 8 }]}>{adding ? 'Cancel' : 'Add Business'}</Button>
        {adding && (
          <View style={[styles.addForm, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <TextInput placeholder="Name" value={newName} onChangeText={setNewName} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
            <TextInput placeholder="Category" value={newCategory} onChangeText={setNewCategory} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
            <View style={styles.rowSpace}>
              <Text style={{ color: colors.foreground }}>Open</Text>
              <Switch value={newIsOpen} onValueChange={setNewIsOpen} />
            </View>
            <Button onPress={async () => {
              try {
                setLoading(true);
                const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                const inserted = await createBusiness({ name: newName, category: newCategory, latitude: pos.coords.latitude, longitude: pos.coords.longitude, is_open: newIsOpen });
                setNewName(''); setNewCategory(''); setNewIsOpen(true); setAdding(false);
                const bs = await fetchBusinesses({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, radiusKm });
                setBusinesses(bs);
              } catch (err) {
                console.warn('Create business failed', err);
              } finally { setLoading(false); }
            }} style={{ marginTop: 8 }}>Save</Button>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  controls: { position: 'absolute', top: 40, left: 16, right: 16, alignItems: 'center' },
  radiusRow: { flexDirection: 'row', marginBottom: 8 },
  radiusChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, marginRight: 8 },
  refreshButton: { width: 120 },
  addForm: { width: '100%', padding: 12, borderRadius: 8, borderWidth: 1, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 6, padding: 8, marginTop: 8 },
  rowSpace: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
});
