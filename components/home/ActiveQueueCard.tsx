import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

interface ActiveQueue {
  id: string;
  businessName: string;
  position: number;
  estimatedWait: string;
  status: 'waiting' | 'in_progress' | 'serving' | 'completed' | 'cancelled';
  businessCategory?: string;
}

const STATUS_LABELS: Record<string, string> = {
  waiting:   'WAITING',
  serving:   'BEING SERVED',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
};

export function ActiveQueueCard({ queue }: { queue: ActiveQueue }) {
  const { colors } = useTheme();
  const { t }      = useTranslation();
  const pulseAnim  = useRef(new Animated.Value(1)).current;

  const FG     = colors.foreground;
  const BRAND  = colors.brand;
  const MUTED  = colors.mutedForeground;
  const CARD   = colors.card;
  const SEC    = colors.secondary;
  const BORDER = colors.border;

  useEffect(() => {
    if (queue.status === 'serving') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [queue.status]);

  const isServing = queue.status === 'serving';

  return (
    <TouchableOpacity
      style={[styles.wrapper]}
      activeOpacity={0.88}
      onPress={() => router.push(`/queue/${queue.id}`)}
    >
      <View style={[styles.card, { backgroundColor: CARD, borderColor: BORDER }]}>
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: BRAND }]} />

        <View style={styles.inner}>
          {/* Top row */}
          <View style={styles.topRow}>
            <View style={styles.titleBlock}>
              {/* Live indicator */}
              <View style={styles.liveRow}>
                <Animated.View
                  style={[styles.liveDot, { backgroundColor: isServing ? colors.success : BRAND, transform: [{ scale: pulseAnim }] }]}
                />
                <Text style={[styles.liveLabel, { color: MUTED }]}>
                  {t('home.active_queue.title')}
                </Text>
              </View>
              <Text style={[styles.businessName, { color: FG }]} numberOfLines={1}>
                {queue.businessName}
              </Text>
            </View>

            {/* Status badge */}
            <View style={[styles.statusBadge, { backgroundColor: SEC, borderColor: BORDER }]}>
              <Text style={[styles.statusText, { color: isServing ? colors.success : FG }]}>
                {STATUS_LABELS[queue.status] ?? 'WAITING'}
              </Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: SEC, borderColor: BORDER }]}>
              <Text style={[styles.statVal, { color: FG }]}>#{queue.position}</Text>
              <Text style={[styles.statLbl, { color: MUTED }]}>
                {t('home.active_queue.position')}
              </Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: SEC, borderColor: BORDER }]}>
              <Text style={[styles.statVal, { color: FG }]}>{queue.estimatedWait}</Text>
              <Text style={[styles.statLbl, { color: MUTED }]}>
                {t('home.active_queue.est_wait')}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerTip, { color: MUTED }]}>
              Tap for details & live updates
            </Text>
            <Ionicons name="arrow-forward" size={13} color={MUTED} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 24, marginBottom: 20 },
  card: {
    borderRadius: 16, borderWidth: 1,
    flexDirection: 'row', overflow: 'hidden',
  },
  accentBar: { width: 4 },
  inner:     { flex: 1, padding: 16, gap: 14 },

  topRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleBlock:  { flex: 1, gap: 6 },
  liveRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot:     { width: 7, height: 7, borderRadius: 4 },
  liveLabel:   { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  businessName:{ fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },

  statusBadge: {
    borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1, alignItems: 'center', gap: 3,
  },
  statVal: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  statLbl: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },

  footer:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerTip: { fontSize: 11, fontWeight: '500' },
});
