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
  status: 'waiting' | 'called' | 'in_progress' | 'completed' | 'cancelled';
  businessCategory?: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: string }> = {
  waiting:     { label: 'WAITING',      icon: 'time-outline'             },
  called:      { label: 'CALLED',       icon: 'notifications-outline'    },
  in_progress: { label: 'BEING SERVED', icon: 'checkmark-circle-outline' },
  completed:   { label: 'COMPLETED',    icon: 'checkmark-done-outline'   },
  cancelled:   { label: 'CANCELLED',    icon: 'close-circle-outline'     },
};

export function ActiveQueueCard({ queue }: { queue: ActiveQueue }) {
  const { colors } = useTheme();
  const { t }      = useTranslation();
  const pulseAnim  = useRef(new Animated.Value(1)).current;

  const BRAND    = colors.brand;
  const BRAND_FG = colors.brandForeground;
  const MUTED    = colors.mutedForeground;
  const CARD     = colors.card;
  const BORDER   = colors.border;
  const SEC      = colors.secondary;
  const FG       = colors.foreground;

  const isServing   = queue.status === 'called' || queue.status === 'in_progress';
  const statusCfg   = STATUS_CONFIG[queue.status] ?? STATUS_CONFIG.waiting;
  const statusColor = isServing ? colors.success : BRAND;

  useEffect(() => {
    if (isServing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [queue.status]);

  return (
    <TouchableOpacity
      style={styles.wrapper}
      activeOpacity={0.88}
      onPress={() => router.push(`/queue/${queue.id}`)}
    >
      <View style={[styles.card, { backgroundColor: CARD, borderColor: BORDER }]}>

        {/* ── Header row ── */}
        <View style={[styles.header, { backgroundColor: BRAND }]}>
          <View style={styles.headerLeft}>
            <Animated.View style={[styles.liveDot, { backgroundColor: BRAND_FG, transform: [{ scale: pulseAnim }] }]} />
            <Text style={[styles.liveLabel, { color: BRAND_FG + 'CC' }]}>
              {t('home.active_queue.title').toUpperCase()}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: BRAND_FG + '22', borderColor: BRAND_FG + '33' }]}>
            <Ionicons name={statusCfg.icon as any} size={11} color={BRAND_FG} />
            <Text style={[styles.statusText, { color: BRAND_FG }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>
          {/* Business name */}
          <Text style={[styles.businessName, { color: FG }]} numberOfLines={1}>
            {queue.businessName}
          </Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: SEC, borderColor: BORDER }]}>
              <Text style={[styles.statNum, { color: BRAND }]}>#{queue.position}</Text>
              <Text style={[styles.statLbl, { color: MUTED }]}>
                {t('home.active_queue.position').toUpperCase()}
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: BORDER }]} />

            <View style={[styles.statBox, { backgroundColor: SEC, borderColor: BORDER }]}>
              <Text style={[styles.statNum, { color: BRAND }]}>{queue.estimatedWait}</Text>
              <Text style={[styles.statLbl, { color: MUTED }]}>
                {t('home.active_queue.est_wait').toUpperCase()}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.detailsBtn, { backgroundColor: BRAND }]}
              onPress={() => router.push(`/queue/${queue.id}`)}
              activeOpacity={0.8}
            >
              <Text style={[styles.detailsBtnText, { color: BRAND_FG }]}>Details</Text>
              <Ionicons name="arrow-forward" size={13} color={BRAND_FG} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 24, marginBottom: 20 },

  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot:    { width: 7, height: 7, borderRadius: 4 },
  liveLabel:  { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },

  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  body: { padding: 16, gap: 14 },

  businessName: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },

  statsRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statBox:     { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  statNum:     { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  statLbl:     { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },
  statDivider: { width: 1, height: 40 },

  detailsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12,
  },
  detailsBtnText: { fontSize: 12, fontWeight: '800' },
});
