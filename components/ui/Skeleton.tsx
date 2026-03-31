import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

// ── Base shimmer box ──────────────────────────────────────────────────────────
interface SkeletonBoxProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width, height = 14, borderRadius = 7, style }: SkeletonBoxProps) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.85, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: colors.muted, opacity: anim },
        style,
      ]}
    />
  );
}

// ── BusinessCard skeleton ─────────────────────────────────────────────────────
export function SkeletonBusinessCard() {
  const { colors } = useTheme();
  return (
    <View style={[sk.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={sk.body}>
        {/* Avatar col */}
        <View style={sk.avatarCol}>
          <SkeletonBox width={56} height={56} borderRadius={14} />
          <SkeletonBox width={48} height={8} borderRadius={4} />
        </View>
        {/* Info */}
        <View style={sk.info}>
          <View style={sk.nameRow}>
            <SkeletonBox width="55%" height={14} borderRadius={7} style={{ flex: 1 }} />
            <SkeletonBox width={64} height={22} borderRadius={11} />
          </View>
          <View style={sk.metaRow}>
            <SkeletonBox width="42%" height={10} borderRadius={5} />
            <SkeletonBox width={44} height={10} borderRadius={5} />
          </View>
          <View style={[sk.divider, { backgroundColor: colors.border }]} />
          <View style={sk.statsRow}>
            <View style={sk.statItem}>
              <SkeletonBox width={32} height={15} borderRadius={7} />
              <SkeletonBox width={40} height={9} borderRadius={4} />
            </View>
            <View style={[sk.statSep, { backgroundColor: colors.border }]} />
            <View style={sk.statItem}>
              <SkeletonBox width={44} height={15} borderRadius={7} />
              <SkeletonBox width={40} height={9} borderRadius={4} />
            </View>
            <View style={[sk.joinBtn, { backgroundColor: colors.muted, marginLeft: 'auto' }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ── OrderCard skeleton ────────────────────────────────────────────────────────
export function SkeletonOrderCard() {
  const { colors } = useTheme();
  return (
    <View style={[sk.oCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={sk.oHeader}>
        <SkeletonBox width={44} height={44} borderRadius={12} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBox width="60%" height={13} borderRadius={6} />
          <SkeletonBox width="38%" height={10} borderRadius={5} />
        </View>
        <SkeletonBox width={64} height={24} borderRadius={12} />
      </View>
      <View style={[sk.divider, { backgroundColor: colors.border, marginHorizontal: 16 }]} />
      {/* Item row */}
      <View style={sk.oItemRow}>
        <View style={{ flex: 1, gap: 7 }}>
          <SkeletonBox width={44} height={9} borderRadius={4} />
          <SkeletonBox width="68%" height={18} borderRadius={9} />
          <SkeletonBox width="42%" height={10} borderRadius={5} />
        </View>
        <View style={{ alignItems: 'flex-end', gap: 7 }}>
          <SkeletonBox width={40} height={9} borderRadius={4} />
          <SkeletonBox width={64} height={18} borderRadius={9} />
        </View>
      </View>
      <View style={[sk.divider, { backgroundColor: colors.border, marginHorizontal: 16 }]} />
      {/* Footer */}
      <View style={sk.oFooter}>
        <SkeletonBox width={88} height={11} borderRadius={5} />
        <SkeletonBox width={64} height={11} borderRadius={5} />
      </View>
    </View>
  );
}

// ── ActiveQueueItem skeleton ──────────────────────────────────────────────────
export function SkeletonQueueItem() {
  const { colors } = useTheme();
  return (
    <View style={[sk.qiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header row */}
      <View style={sk.qiHeader}>
        <SkeletonBox width={44} height={44} borderRadius={12} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBox width="55%" height={14} borderRadius={7} />
          <SkeletonBox width="38%" height={10} borderRadius={5} />
          <SkeletonBox width={80} height={10} borderRadius={5} />
        </View>
        <SkeletonBox width={72} height={26} borderRadius={13} />
      </View>
      <View style={[sk.divider, { backgroundColor: colors.border }]} />
      {/* Stats */}
      <View style={sk.qiStats}>
        <View style={sk.qiStat}>
          <SkeletonBox width={36} height={10} borderRadius={5} />
          <SkeletonBox width={44} height={24} borderRadius={12} />
          <SkeletonBox width={56} height={10} borderRadius={5} />
        </View>
        <View style={[sk.qiStatDiv, { backgroundColor: colors.border }]} />
        <View style={sk.qiStat}>
          <SkeletonBox width={52} height={10} borderRadius={5} />
          <SkeletonBox width={44} height={24} borderRadius={12} />
          <SkeletonBox width={72} height={10} borderRadius={5} />
        </View>
      </View>
      {/* Progress */}
      <View style={sk.qiProgress}>
        <View style={sk.qiProgressHeader}>
          <SkeletonBox width={80} height={10} borderRadius={5} />
          <SkeletonBox width={32} height={10} borderRadius={5} />
        </View>
        <SkeletonBox width="100%" height={6} borderRadius={3} style={{ marginTop: 8 }} />
      </View>
      {/* Actions */}
      <View style={sk.qiActions}>
        <SkeletonBox width="46%" height={36} borderRadius={10} />
        <SkeletonBox width="46%" height={36} borderRadius={10} />
      </View>
    </View>
  );
}

// ── BusinessDetail skeleton (full page) ───────────────────────────────────────
export function SkeletonBusinessDetail() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Nav bar */}
      <View style={[sk.navBar, { borderBottomColor: colors.border }]}>
        <SkeletonBox width={36} height={36} borderRadius={18} />
        <SkeletonBox width={120} height={13} borderRadius={6} />
        <SkeletonBox width={36} height={36} borderRadius={18} />
      </View>
      {/* Hero */}
      <View style={[sk.bdHero, { borderBottomColor: colors.border }]}>
        <SkeletonBox width={80} height={80} borderRadius={20} style={{ marginBottom: 16 }} />
        <SkeletonBox width="55%" height={22} borderRadius={11} style={{ marginBottom: 10 }} />
        <SkeletonBox width="38%" height={13} borderRadius={6} style={{ marginBottom: 8 }} />
        <SkeletonBox width={120} height={28} borderRadius={14} />
      </View>
      {/* Stats strip */}
      <View style={[sk.bdStats, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        {[0, 1, 2].map((i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={[sk.statSep, { backgroundColor: colors.border, height: 32, width: 1 }]} />}
            <View style={sk.bdStatItem}>
              <SkeletonBox width={32} height={18} borderRadius={9} style={{ marginBottom: 6 }} />
              <SkeletonBox width={52} height={9} borderRadius={4} />
            </View>
          </React.Fragment>
        ))}
      </View>
      {/* Info section */}
      <View style={{ paddingHorizontal: 24, paddingTop: 20, gap: 14 }}>
        <SkeletonBox width="70%" height={14} borderRadius={7} />
        <SkeletonBox width="50%" height={12} borderRadius={6} />
        <SkeletonBox width="60%" height={12} borderRadius={6} />
        <SkeletonBox width="100%" height={48} borderRadius={12} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

// ── QueueDetail skeleton (full page) ─────────────────────────────────────────
export function SkeletonQueueDetail() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Nav */}
      <View style={[sk.navBar, { borderBottomColor: colors.border }]}>
        <SkeletonBox width={36} height={36} borderRadius={18} />
        <SkeletonBox width={100} height={13} borderRadius={6} />
        <View style={{ width: 36 }} />
      </View>
      {/* Hero: ticket number */}
      <View style={[sk.qdHero, { borderBottomColor: colors.border }]}>
        <SkeletonBox width={120} height={28} borderRadius={14} style={{ marginBottom: 24 }} />
        <SkeletonBox width="42%" height={72} borderRadius={8} style={{ marginBottom: 8 }} />
        <SkeletonBox width={140} height={11} borderRadius={5} />
      </View>
      {/* Stats row */}
      <View style={[sk.qdStatsRow, { borderBottomColor: colors.border }]}>
        <View style={sk.qdStatBox}>
          <SkeletonBox width={72} height={10} borderRadius={5} style={{ marginBottom: 10 }} />
          <SkeletonBox width={60} height={36} borderRadius={8} style={{ marginBottom: 6 }} />
          <SkeletonBox width={88} height={11} borderRadius={5} />
        </View>
        <View style={[sk.statSep, { backgroundColor: colors.border, height: 80, width: 1 }]} />
        <View style={sk.qdStatBox}>
          <SkeletonBox width={72} height={10} borderRadius={5} style={{ marginBottom: 10 }} />
          <SkeletonBox width={80} height={36} borderRadius={8} style={{ marginBottom: 6 }} />
          <SkeletonBox width={80} height={11} borderRadius={5} />
        </View>
      </View>
      {/* Progress */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <SkeletonBox width={100} height={10} borderRadius={5} />
          <SkeletonBox width={32} height={10} borderRadius={5} />
        </View>
        <SkeletonBox width="100%" height={4} borderRadius={2} />
      </View>
      {/* Business row */}
      <View style={{ paddingHorizontal: 24, gap: 12 }}>
        <SkeletonBox width={64} height={10} borderRadius={5} />
        <View style={[sk.qdBizRow, { borderColor: colors.border }]}>
          <SkeletonBox width={46} height={46} borderRadius={12} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox width="55%" height={14} borderRadius={7} />
            <SkeletonBox width="40%" height={11} borderRadius={5} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const sk = StyleSheet.create({
  // BusinessCard
  card:     { borderRadius: 16, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  body:     { flexDirection: 'row', padding: 16, gap: 14 },
  avatarCol:{ alignItems: 'center', gap: 8 },
  info:     { flex: 1, gap: 8 },
  nameRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaRow:  { flexDirection: 'row', gap: 14 },
  divider:  { height: 1 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statItem: { alignItems: 'center', gap: 4 },
  statSep:  { width: 1, height: 24, marginHorizontal: 2 },
  joinBtn:  { width: 32, height: 32, borderRadius: 10 },

  // OrderCard
  oCard:    { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  oHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  oItemRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
  oFooter:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },

  // ActiveQueueItem
  qiCard:         { borderRadius: 16, borderWidth: 1, overflow: 'hidden', padding: 16 },
  qiHeader:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  qiStats:        { flexDirection: 'row', marginBottom: 16 },
  qiStat:         { flex: 1, alignItems: 'center', gap: 6 },
  qiStatDiv:      { width: 1, marginHorizontal: 12 },
  qiProgress:     { marginBottom: 16 },
  qiProgressHeader:{ flexDirection: 'row', justifyContent: 'space-between' },
  qiActions:      { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },

  // BusinessDetail
  navBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: 1 },
  bdHero:     { alignItems: 'center', paddingTop: 32, paddingBottom: 28, paddingHorizontal: 24, borderBottomWidth: 1 },
  bdStats:    { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  bdStatItem: { flex: 1, alignItems: 'center', paddingVertical: 18 },

  // QueueDetail
  qdHero:     { alignItems: 'center', paddingTop: 32, paddingBottom: 28, paddingHorizontal: 24, borderBottomWidth: 1 },
  qdStatsRow: { flexDirection: 'row', borderBottomWidth: 1 },
  qdStatBox:  { flex: 1, alignItems: 'center', paddingVertical: 24, paddingHorizontal: 12 },
  qdBizRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 14, padding: 14 },
});
