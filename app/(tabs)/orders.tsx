import { useState, useMemo } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';
import { OrderCard, EmptyOrdersState, OrderFilterTabs } from '@/components/orders';

// Mock data for orders
const orders = [
  {
    id: 'o1',
    businessId: '1',
    businessName: 'Campus Coffee Shop',
    orderNumber: 'ORD-2024-001',
    status: 'ready',
    items: [
      { name: 'Cappuccino', quantity: 1, price: 450 },
      { name: 'Croissant', quantity: 2, price: 300 },
    ],
    total: 1050,
    createdAt: 'Today, 10:45 AM',
    paymentMethod: 'JazzCash',
  },
  {
    id: 'o2',
    businessId: '2',
    businessName: 'UniPrint Station',
    orderNumber: 'ORD-2024-002',
    status: 'in_progress',
    items: [
      { name: 'Color Prints (A4)', quantity: 25, price: 625 },
      { name: 'Binding', quantity: 1, price: 150 },
    ],
    total: 775,
    createdAt: 'Today, 9:30 AM',
    paymentMethod: 'Cash',
  },
  {
    id: 'o3',
    businessId: '1',
    businessName: 'Campus Coffee Shop',
    orderNumber: 'ORD-2024-003',
    status: 'completed',
    items: [
      { name: 'Latte', quantity: 2, price: 800 },
      { name: 'Sandwich', quantity: 1, price: 350 },
    ],
    total: 1150,
    createdAt: 'Yesterday, 3:15 PM',
    paymentMethod: 'Card',
  },
  {
    id: 'o4',
    businessId: '3',
    businessName: 'Quick Fix Mobile',
    orderNumber: 'ORD-2024-004',
    status: 'completed',
    items: [
      { name: 'Screen Protector', quantity: 1, price: 500 },
      { name: 'Phone Case', quantity: 1, price: 800 },
    ],
    total: 1300,
    createdAt: '2 days ago',
    paymentMethod: 'EasyPaisa',
  },
];

export default function OrdersScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filter === 'active') return ['pending', 'in_progress', 'ready'].includes(order.status);
      if (filter === 'completed') return ['completed', 'cancelled'].includes(order.status);
      return true;
    });
  }, [filter]);

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
