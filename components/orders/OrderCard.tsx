import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { OrderHistoryEntry, ticketLabel } from '@/lib/queue';

function statusColor(status: string, colors: any) {
  if (status === 'waiting')     return { fg: colors.statusWaiting  ?? '#F59E0B', bg: (colors.statusWaiting  ?? '#F59E0B') + '18' };
  if (status === 'in_progress') return { fg: colors.statusInProgress ?? '#3B82F6', bg: (colors.statusInProgress ?? '#3B82F6') + '18' };
  if (status === 'completed')   return { fg: colors.success,     bg: colors.success     + '18' };
  if (status === 'cancelled')   return { fg: colors.destructive,  bg: colors.destructive + '18' };
  return { fg: colors.mutedForeground, bg: colors.card };
}

function statusLabel(status: string) {
  if (status === 'in_progress') return 'IN PROGRESS';
  return status.toUpperCase();
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

interface OrderCardProps {
  order: OrderHistoryEntry;
}

export function OrderCard({ order }: OrderCardProps) {
  const { colors } = useTheme();

  const FG     = colors.foreground;
  const MUTED  = colors.mutedForeground;
  const BORDER = colors.border;
  const CARD   = colors.card;

  const sc       = statusColor(order.status, colors);
  const initials = (order.businessName ?? 'B').slice(0, 2).toUpperCase();

  const qty        = order.quantity ?? 1;
  const unitPrice  = order.unit_price ?? 0;
  const total      = order.total_price ?? order.total_amount ?? (unitPrice * qty);
  const hasAmount  = total > 0;
  const dateStr    = formatDate(order.joined_at);
  const timeStr    = formatTime(order.joined_at);
  const ticket     = ticketLabel(order.position);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(`/queue/${order.id}`)}
      style={[styles.card, { backgroundColor: CARD, borderColor: BORDER }]}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.secondary, borderColor: BORDER }]}>
          <Text style={[styles.avatarText, { color: FG }]}>{initials}</Text>
        </View>

        <View style={styles.headerMid}>
          <Text style={[styles.bizName, { color: FG }]} numberOfLines={1}>
            {order.businessName}
          </Text>
          {order.businessCategory ? (
            <Text style={[styles.bizCat, { color: MUTED }]} numberOfLines={1}>
              {order.businessCategory}
            </Text>
          ) : null}
        </View>

        <View style={[styles.statusPill, { backgroundColor: sc.bg, borderColor: sc.fg + '40' }]}>
          <Text style={[styles.statusText, { color: sc.fg }]}>{statusLabel(order.status)}</Text>
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={[styles.divider, { backgroundColor: BORDER }]} />

      {/* ── Item row ── */}
      <View style={styles.itemRow}>
        {/* Ticket + service */}
        <View style={styles.itemLeft}>
          <Text style={[styles.ticket, { color: MUTED }]}>{ticket}</Text>
          <Text style={[styles.serviceName, { color: FG }]} numberOfLines={2}>
            {order.serviceName ?? 'Queue Entry'}
          </Text>
          {unitPrice > 0 && (
            <Text style={[styles.unitMeta, { color: MUTED }]}>
              ×{qty} · Rs {unitPrice.toLocaleString()} each
            </Text>
          )}
        </View>

        {/* Total */}
        {hasAmount && (
          <View style={styles.totalBox}>
            <Text style={[styles.totalLabel, { color: MUTED }]}>TOTAL</Text>
            <Text style={[styles.totalValue, { color: FG }]}>
              Rs {total.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* ── Divider ── */}
      <View style={[styles.divider, { backgroundColor: BORDER }]} />

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="calendar-outline" size={12} color={MUTED} />
          <Text style={[styles.footerText, { color: MUTED }]}>{dateStr}</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={12} color={MUTED} />
          <Text style={[styles.footerText, { color: MUTED }]}>{timeStr}</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={MUTED} style={{ marginLeft: 'auto' }} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16, borderWidth: 1,
    overflow: 'hidden',
  },

  /* Header */
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  avatar: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  avatarText:  { fontSize: 15, fontWeight: '900' },
  headerMid:   { flex: 1 },
  bizName:     { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  bizCat:      { fontSize: 11, fontWeight: '500' },
  statusPill:  { borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  statusText:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },

  divider: { height: 1, marginHorizontal: 16 },

  /* Item */
  itemRow:    { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
  itemLeft:   { flex: 1 },
  ticket:     { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  serviceName: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  unitMeta:   { fontSize: 11, fontWeight: '500' },
  totalBox:   { alignItems: 'flex-end' },
  totalLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  totalValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },

  /* Footer */
  footer:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, fontWeight: '500' },
});
