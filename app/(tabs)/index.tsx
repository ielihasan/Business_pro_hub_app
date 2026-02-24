import { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
  Animated,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useNearbyBusinesses } from '@/hooks/useNearbyBusinesses';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
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

const FAB_ACTIONS = [
  {
    key: 'scan',
    label: 'Scan QR Code',
    icon: 'qr-code-outline' as const,
    onPress: () => router.push('/(tabs)/scan'),
  },
  {
    key: 'map',
    label: 'Find Businesses',
    icon: 'map-outline' as const,
    onPress: () => router.push('/(tabs)/map'),
  },
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);
  const [fabOpen, setFabOpen] = useState(false);

  // Animation values
  const animation = useRef(new Animated.Value(0)).current;

  const toggleFab = () => {
    const toValue = fabOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();
    setFabOpen(!fabOpen);
  };

  const closeFab = () => {
    if (!fabOpen) return;
    Animated.spring(animation, { toValue: 0, useNativeDriver: true, friction: 6 }).start();
    setFabOpen(false);
  };

  // Rotate "+" to "×"
  const rotation = animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

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
      {/* Backdrop — closes FAB when tapping outside */}
      {fabOpen && (
        <TouchableWithoutFeedback onPress={closeFab}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}

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
        <View style={{ height: Spacing[24] }} />
      </ScrollView>

      {/* Speed-dial FAB */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        {/* Action items — slide up from FAB */}
        {FAB_ACTIONS.map((action, index) => {
          const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -(72 * (index + 1))],
          });
          const opacity = animation.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
          const scale = animation.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

          return (
            <Animated.View
              key={action.key}
              style={[
                styles.fabActionRow,
                { transform: [{ translateY }, { scale }], opacity },
              ]}
              pointerEvents={fabOpen ? 'auto' : 'none'}
            >
              {/* Label */}
              <View style={[styles.fabLabel, { backgroundColor: colors.foreground }]}>
                <Text style={[styles.fabLabelText, { color: colors.background }]}>
                  {action.label}
                </Text>
              </View>
              {/* Mini action button */}
              <TouchableOpacity
                style={[styles.fabMini, { backgroundColor: colors.primary }]}
                onPress={() => { closeFab(); action.onPress(); }}
                activeOpacity={0.85}
              >
                <Ionicons name={action.icon} size={20} color={colors.primaryForeground} />
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Main "+" button */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={toggleFab}
          activeOpacity={0.85}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name="add" size={26} color={colors.primaryForeground} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 10,
  },
  fabContainer: {
    position: 'absolute',
    left: 0,
    right: Spacing[5],
    bottom: Platform.OS === 'ios' ? 36 : 20,
    alignItems: 'flex-end',
    zIndex: 20,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  fabActionRow: {
    position: 'absolute',
    bottom: 0,
    left: Spacing[4],
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  fabMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  fabLabel: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  fabLabelText: {
    fontSize: 12,
    fontWeight: Typography.fontWeight.medium,
  },
});
