import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, Badge, Avatar, Separator } from '@/components/ui';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  businessId: string;
  businessName: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
  paymentMethod: string;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending':
      return { variant: 'secondary' as const };
    case 'in_progress':
      return { variant: 'info' as const };
    case 'ready':
      return { variant: 'success' as const };
    case 'completed':
      return { variant: 'secondary' as const };
    case 'cancelled':
      return { variant: 'destructive' as const };
    default:
      return { variant: 'secondary' as const };
  }
};

const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const statusConfig = getStatusConfig(order.status);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/business/${order.businessId}`);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <CardContent style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Avatar name={order.businessName} size="md" />
            <View style={styles.info}>
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
          <View style={styles.footer}>
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

          {/* Ready banner */}
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
}

const styles = StyleSheet.create({
  card: { marginBottom: 0 },
  content: { padding: Spacing[4] },
  header: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginLeft: Spacing[3] },
  businessName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, marginBottom: Spacing[0.5] },
  orderNumber: { fontSize: Typography.fontSize.sm },
  itemsList: { gap: Spacing[2] },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  itemQuantity: { fontSize: Typography.fontSize.sm, minWidth: 24 },
  itemName: { fontSize: Typography.fontSize.sm },
  itemPrice: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  footerLeft: { gap: Spacing[1] },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1] },
  footerText: { fontSize: Typography.fontSize.xs },
  totalContainer: { alignItems: 'flex-end' },
  totalLabel: { fontSize: Typography.fontSize.xs },
  totalValue: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold },
  readyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginTop: Spacing[4],
    padding: Spacing[3],
    borderRadius: BorderRadius.DEFAULT,
  },
  readyText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium },
});
