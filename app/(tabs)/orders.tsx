import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, Badge, Avatar, Separator } from '@/components/ui';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

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

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending':
      return { label: 'Pending', variant: 'secondary' as const, icon: 'time-outline' };
    case 'in_progress':
      return { label: 'Preparing', variant: 'info' as const, icon: 'refresh-outline' };
    case 'ready':
      return { label: 'Ready', variant: 'success' as const, icon: 'checkmark-circle-outline' };
    case 'completed':
      return { label: 'Completed', variant: 'secondary' as const, icon: 'checkmark-done-outline' };
    case 'cancelled':
      return { label: 'Cancelled', variant: 'destructive' as const, icon: 'close-circle-outline' };
    default:
      return { label: 'Unknown', variant: 'secondary' as const, icon: 'help-outline' };
  }
};

export default function OrdersScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['pending', 'in_progress', 'ready'].includes(order.status);
    if (filter === 'completed') return ['completed', 'cancelled'].includes(order.status);
    return true;
  });

  const formatPrice = (price: number) => {
    return `Rs. ${price.toLocaleString()}`;
  };

  const renderOrder = (order: typeof orders[0]) => {
    const statusConfig = getStatusConfig(order.status);

    return (
      <TouchableOpacity key={order.id}>
        <Card style={styles.orderCard}>
          <CardContent style={styles.orderContent}>
            {/* Header */}
            <View style={styles.orderHeader}>
              <Avatar name={order.businessName} size="md" />
              <View style={styles.orderInfo}>
                <Text style={[styles.businessName, { color: colors.foreground }]}>
                  {order.businessName}
                </Text>
                <Text style={[styles.orderNumber, { color: colors.mutedForeground }]}>
                  {order.orderNumber}
                </Text>
              </View>
              <Badge variant={statusConfig.variant}>
                {t(`orders.status.${order.status}`)}
              </Badge>
            </View>

            <Separator style={{ marginVertical: Spacing[3] }} />

            {/* Items */}
            <View style={styles.itemsList}>
              {order.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemQuantity, { color: colors.mutedForeground }]}>
                      {item.quantity}x
                    </Text>
                    <Text style={[styles.itemName, { color: colors.foreground }]}>
                      {item.name}
                    </Text>
                  </View>
                  <Text style={[styles.itemPrice, { color: colors.foreground }]}>
                    {formatPrice(item.price)}
                  </Text>
                </View>
              ))}
            </View>

            <Separator style={{ marginVertical: Spacing[3] }} />

            {/* Footer */}
            <View style={styles.orderFooter}>
              <View style={styles.footerLeft}>
                <View style={styles.footerRow}>
                  <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                    {order.createdAt}
                  </Text>
                </View>
                <View style={styles.footerRow}>
                  <Ionicons name="card-outline" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                    {order.paymentMethod}
                  </Text>
                </View>
              </View>
              <View style={styles.totalContainer}>
                <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>
                  {t('orders.card.total')}
                </Text>
                <Text style={[styles.totalValue, { color: colors.foreground }]}>
                  {formatPrice(order.total)}
                </Text>
              </View>
            </View>

            {/* Action for ready orders */}
            {order.status === 'ready' && (
              <View style={[styles.readyBanner, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.readyText, { color: colors.success }]}>
                  {t('orders.card.ready_message')}
                </Text>
              </View>
            )}
          </CardContent>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: 'orders.tabs.all' },
            { key: 'active', label: 'orders.tabs.active' },
            { key: 'completed', label: 'orders.tabs.completed' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === tab.key ? colors.primary : colors.secondary,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setFilter(tab.key as typeof filter)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: filter === tab.key ? colors.primaryForeground : colors.foreground,
                  },
                ]}
              >
                {t(tab.label)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {filteredOrders.length > 0 ? (
          <View style={styles.ordersList}>
            {filteredOrders.map(renderOrder)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="receipt-outline" size={48} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {t('orders.empty.title')}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {filter === 'active'
                ? t('orders.empty.active_desc')
                : filter === 'completed'
                ? t('orders.empty.completed_desc')
                : t('orders.empty.all_desc')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
  },
  filterChip: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing[2],
  },
  filterChipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  scrollContent: {
    padding: Spacing[6],
    paddingTop: 0,
    flexGrow: 1,
  },
  ordersList: {
    gap: Spacing[4],
  },
  orderCard: {
    marginBottom: 0,
  },
  orderContent: {
    padding: Spacing[4],
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
    marginLeft: Spacing[3],
  },
  businessName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[0.5],
  },
  orderNumber: {
    fontSize: Typography.fontSize.sm,
  },
  itemsList: {
    gap: Spacing[2],
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  itemQuantity: {
    fontSize: Typography.fontSize.sm,
    minWidth: 24,
  },
  itemName: {
    fontSize: Typography.fontSize.sm,
  },
  itemPrice: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLeft: {
    gap: Spacing[1],
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  footerText: {
    fontSize: Typography.fontSize.xs,
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: Typography.fontSize.xs,
  },
  totalValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  readyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginTop: Spacing[4],
    padding: Spacing[3],
    borderRadius: BorderRadius.DEFAULT,
  },
  readyText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing[16],
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[2],
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    maxWidth: 280,
  },
});
