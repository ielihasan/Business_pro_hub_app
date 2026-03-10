import { useState, useMemo } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';
import { OrderCard, EmptyOrdersState, OrderFilterTabs } from '@/components/orders';
import { useStore } from '@/store/useStore';

export default function OrdersScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const orders = useStore((s) => s.orders);
  const syncQueuesFromSupabase = useStore((s) => s.syncQueuesFromSupabase);

  const onRefresh = async () => {
    setRefreshing(true);
    await syncQueuesFromSupabase();
    setRefreshing(false);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filter === 'active') return ['pending', 'in_progress', 'ready'].includes(order.status);
      if (filter === 'completed') return ['completed', 'cancelled'].includes(order.status);
      return true;
    });
  }, [filter, orders]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <OrderFilterTabs selected={filter} onSelect={setFilter} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {filteredOrders.length > 0 ? (
          <View style={styles.ordersList}>
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </View>
        ) : (
          <EmptyOrdersState filter={filter} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing[6], paddingTop: 0, flexGrow: 1 },
  ordersList: { gap: Spacing[4] },
});
