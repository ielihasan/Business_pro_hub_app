import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/store/useStore';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import {
  getTier,
  getNextTier,
  getTierProgress,
  fetchLoyaltyTransactions,
  LoyaltyTransaction,
  TIERS,
  POINTS_QUEUE_JOIN,
  POINTS_PER_100_SPENT,
  POINTS_QUEUE_COMPLETE,
  POINTS_FEEDBACK,
} from '@/lib/loyalty';

const EARN_RULES = [
  {
    icon: 'people-outline' as const,
    label: 'Join a Queue',
    value: `+${POINTS_QUEUE_JOIN} pts`,
    note: `+${POINTS_PER_100_SPENT} pts per Rs 100 spent`,
  },
  {
    icon: 'checkmark-circle-outline' as const,
    label: 'Queue Completed',
    value: `+${POINTS_QUEUE_COMPLETE} pts`,
    note: 'Bonus when your service is done',
  },
  {
    icon: 'star-outline' as const,
    label: 'Submit Feedback',
    value: `+${POINTS_FEEDBACK} pts`,
    note: 'One-time reward per submission',
  },
];

function ReasonIcon({ reason, color }: { reason: string; color: string }) {
  const name =
    reason === 'queue_join'     ? 'people-outline'           :
    reason === 'queue_complete' ? 'checkmark-circle-outline' :
    reason === 'feedback'       ? 'star-outline'             : 'gift-outline';
  return <Ionicons name={name} size={18} color={color} />;
}

export default function LoyaltyScreen() {
  const { colors } = useTheme();
  const user = useStore((s) => s.user);

  const points = user?.loyaltyPoints ?? 0;
  const tier       = getTier(points);
  const nextTier   = getNextTier(points);
  const progress   = getTierProgress(points);
  const ptsToNext  = nextTier ? nextTier.min - points : 0;

  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    fetchLoyaltyTransactions(user.id, 30).then(({ data }) => {
      setTransactions(data);
      setLoading(false);
    });
  }, [user?.id]);

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>Loyalty Rewards</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Tier badge card ──────────────────────────────────────── */}
        <View style={[s.tierCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[s.tierIconBox, { backgroundColor: colors.secondary }]}>
            <Text style={s.tierEmoji}>{tier.icon}</Text>
          </View>
          <View style={s.tierInfo}>
            <Text style={[s.tierLabel, { color: colors.mutedForeground }]}>Current Tier</Text>
            <Text style={[s.tierName, { color: tier.color }]}>{tier.label}</Text>
            <Text style={[s.pointsValue, { color: colors.foreground }]}>
              {points.toLocaleString()} <Text style={[s.pointsUnit, { color: colors.mutedForeground }]}>pts</Text>
            </Text>
          </View>
        </View>

        {/* ── Progress to next tier ────────────────────────────────── */}
        {nextTier ? (
          <View style={[s.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.progressHeader}>
              <Text style={[s.progressLabel, { color: colors.foreground }]}>
                Progress to <Text style={{ color: nextTier.color }}>{nextTier.label}</Text>
              </Text>
              <Text style={[s.progressNote, { color: colors.mutedForeground }]}>
                {ptsToNext.toLocaleString()} pts to go
              </Text>
            </View>
            <View style={[s.trackBg, { backgroundColor: colors.secondary }]}>
              <View style={[s.trackFill, { width: `${progress}%` as any, backgroundColor: tier.color }]} />
            </View>
            <View style={s.progressFooter}>
              <Text style={[s.tierMin, { color: colors.mutedForeground }]}>{tier.min.toLocaleString()} pts</Text>
              <Text style={[s.tierMin, { color: colors.mutedForeground }]}>{nextTier.min.toLocaleString()} pts</Text>
            </View>
          </View>
        ) : (
          <View style={[s.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.maxTierText, { color: tier.color }]}>
              {tier.icon} You've reached the highest tier!
            </Text>
          </View>
        )}

        {/* ── All tiers overview ───────────────────────────────────── */}
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>Tiers</Text>
        <View style={[s.tiersRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {TIERS.map((t, i) => {
            const active = t.key === tier.key;
            return (
              <View
                key={t.key}
                style={[
                  s.tierPill,
                  active && { backgroundColor: colors.secondary },
                  i < TIERS.length - 1 && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border },
                ]}
              >
                <Text style={s.tierPillEmoji}>{t.icon}</Text>
                <Text style={[s.tierPillLabel, { color: active ? t.color : colors.mutedForeground }]}>{t.label}</Text>
                <Text style={[s.tierPillMin, { color: colors.mutedForeground }]}>
                  {t.min === 0 ? '0' : `${t.min / 1000}k`}+
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── How to earn ──────────────────────────────────────────── */}
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>How to Earn</Text>
        <View style={[s.earnCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {EARN_RULES.map((rule, i) => (
            <View
              key={rule.label}
              style={[
                s.earnRow,
                i < EARN_RULES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
            >
              <View style={[s.earnIconBox, { backgroundColor: colors.secondary }]}>
                <Ionicons name={rule.icon} size={18} color={colors.brand} />
              </View>
              <View style={s.earnText}>
                <Text style={[s.earnLabel, { color: colors.foreground }]}>{rule.label}</Text>
                <Text style={[s.earnNote, { color: colors.mutedForeground }]}>{rule.note}</Text>
              </View>
              <Text style={[s.earnValue, { color: colors.brand }]}>{rule.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Transaction history ──────────────────────────────────── */}
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>History</Text>
        {loading ? (
          <ActivityIndicator color={colors.brand} style={{ marginVertical: Spacing[6] }} />
        ) : transactions.length === 0 ? (
          <View style={[s.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="receipt-outline" size={32} color={colors.mutedForeground} />
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No transactions yet</Text>
          </View>
        ) : (
          <View style={[s.txList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {transactions.map((tx, i) => (
              <View
                key={tx.id}
                style={[
                  s.txRow,
                  i < transactions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                ]}
              >
                <View style={[s.txIconBox, { backgroundColor: colors.secondary }]}>
                  <ReasonIcon reason={tx.reason} color={colors.brand} />
                </View>
                <View style={s.txInfo}>
                  <Text style={[s.txDesc, { color: colors.foreground }]} numberOfLines={1}>
                    {tx.description ?? tx.reason.replace(/_/g, ' ')}
                  </Text>
                  <Text style={[s.txDate, { color: colors.mutedForeground }]}>
                    {new Date(tx.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {tx.amount_spent ? `  •  Rs ${tx.amount_spent.toLocaleString()}` : ''}
                  </Text>
                </View>
                <View style={s.txRight}>
                  <Text style={[s.txPoints, { color: tx.points >= 0 ? colors.brand : '#ef4444' }]}>
                    {tx.points >= 0 ? '+' : ''}{tx.points}
                  </Text>
                  <Text style={[s.txBalance, { color: colors.mutedForeground }]}>{tx.balance_after.toLocaleString()} pts</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: Spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[4],
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700' },
    scroll: { paddingHorizontal: Spacing[4], paddingTop: Spacing[4] },

    // Tier card
    tierCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing[4],
      padding: Spacing[4],
      borderRadius: BorderRadius.DEFAULT,
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: Spacing[3],
    },
    tierIconBox: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tierEmoji: { fontSize: 32 },
    tierInfo: { flex: 1 },
    tierLabel: { fontSize: Typography.fontSize.xs, marginBottom: 2 },
    tierName: { fontSize: Typography.fontSize.xl, fontWeight: '800', marginBottom: 2 },
    pointsValue: { fontSize: Typography.fontSize['2xl'], fontWeight: '700' },
    pointsUnit: { fontSize: Typography.fontSize.base, fontWeight: '400' },

    // Progress card
    progressCard: {
      padding: Spacing[4],
      borderRadius: BorderRadius.DEFAULT,
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: Spacing[3],
    },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing[2] },
    progressLabel: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
    progressNote: { fontSize: Typography.fontSize.xs },
    trackBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
    trackFill: { height: '100%', borderRadius: 4 },
    progressFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing[1] },
    tierMin: { fontSize: Typography.fontSize.xs },
    maxTierText: { fontSize: Typography.fontSize.base, fontWeight: '700', textAlign: 'center', paddingVertical: Spacing[2] },

    // Tiers row
    sectionTitle: { fontSize: Typography.fontSize.base, fontWeight: '700', marginBottom: Spacing[2], marginTop: Spacing[2] },
    tiersRow: {
      flexDirection: 'row',
      borderRadius: BorderRadius.DEFAULT,
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: Spacing[3],
      overflow: 'hidden',
    },
    tierPill: { flex: 1, alignItems: 'center', paddingVertical: Spacing[3] },
    tierPillEmoji: { fontSize: 20, marginBottom: 2 },
    tierPillLabel: { fontSize: Typography.fontSize.xs, fontWeight: '700' },
    tierPillMin: { fontSize: 10 },

    // Earn rules
    earnCard: {
      borderRadius: BorderRadius.DEFAULT,
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: Spacing[3],
      overflow: 'hidden',
    },
    earnRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[3] },
    earnIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    earnText: { flex: 1 },
    earnLabel: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
    earnNote: { fontSize: Typography.fontSize.xs, marginTop: 1 },
    earnValue: { fontSize: Typography.fontSize.sm, fontWeight: '700' },

    // Transaction list
    txList: {
      borderRadius: BorderRadius.DEFAULT,
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: Spacing[3],
      overflow: 'hidden',
    },
    txRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[3] },
    txIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    txInfo: { flex: 1 },
    txDesc: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
    txDate: { fontSize: Typography.fontSize.xs, marginTop: 1 },
    txRight: { alignItems: 'flex-end' },
    txPoints: { fontSize: Typography.fontSize.sm, fontWeight: '700' },
    txBalance: { fontSize: Typography.fontSize.xs, marginTop: 1 },

    // Empty
    emptyBox: {
      alignItems: 'center',
      gap: Spacing[2],
      padding: Spacing[8],
      borderRadius: BorderRadius.DEFAULT,
      borderWidth: StyleSheet.hairlineWidth,
    },
    emptyText: { fontSize: Typography.fontSize.sm },
  });
}
