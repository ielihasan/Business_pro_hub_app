import { useState } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useNearbyBusinesses } from '@/hooks/useNearbyBusinesses';
import { Spacing } from '@/constants/theme';
import {
  SearchBar,
  ActiveQueueCard,
  CategoryFilter,
  RadiusFilter,
  NearbyBusinesses,
} from '@/components/home';

// Mock active queue
const activeQueue = {
  id: 'q1',
  businessName: 'Campus Coffee Shop',
  position: 3,
  estimatedWait: '8 min',
  status: 'waiting' as const,
};

export default function HomeScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);

  const { businesses } = useNearbyBusinesses({
    radiusKm,
    category: selectedCategory,
    query: searchQuery,
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

        {activeQueue && <ActiveQueueCard queue={activeQueue} />}

        <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

        <RadiusFilter selected={radiusKm} onSelect={setRadiusKm} />

        <NearbyBusinesses businesses={businesses} />

        <View style={{ height: Spacing[6] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
