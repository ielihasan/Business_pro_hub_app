import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

interface ActiveQueue {
  id: string;
  businessName: string;
  position: number;
  estimatedWait: string;
  status: 'waiting' | 'serving' | 'completed' | 'cancelled';
  businessCategory?: string;
}

interface ActiveQueueCardProps {
  queue: ActiveQueue;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  waiting:   { bg: '#FEF3C7', text: '#D97706', label: 'Waiting' },
  serving:   { bg: '#D1FAE5', text: '#059669', label: 'Being Served' },
  completed: { bg: '#DBEAFE', text: '#2563EB', label: 'Completed' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626', label: 'Cancelled' },
};

export function ActiveQueueCard({ queue }: ActiveQueueCardProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (queue.status === 'serving') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.18, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [queue.status]);

  const statusInfo = STATUS_COLORS[queue.status] ?? STATUS_COLORS.waiting;
  const accentColor = queue.status === 'serving' ? '#10B981' : '#6366F1';

  return (
    <TouchableOpacity
      style={styles.wrapper}
      activeOpacity={0.93}
      onPress={() => router.push(`/queue/${queue.id}`)}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF',
            shadowColor: accentColor,
            borderColor: isDark ? '#2E2E50' : '#E8EAFF',
          },
        ]}
      >
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

        <View style={styles.inner}>
          {/* Top row */}
          <View style={styles.topRow}>
            <View style={styles.titleBlock}>
              <View style={styles.liveDot}>
                <Animated.View
                  style={[
                    styles.dot,
                    { backgroundColor: accentColor, transform: [{ scale: pulseAnim }] },
                  ]}
                />
                <Text style={[styles.liveLabel, { color: accentColor }]}>
                  {t('home.active_queue.title')}
                </Text>
              </View>
              <Text style={[styles.businessName, { color: colors.foreground }]} numberOfLines={1}>
                {queue.businessName}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
              <Text style={[styles.statusText, { color: statusInfo.text }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: isDark ? '#252540' : '#F0F1FF' }]}>
              <Text style={[styles.statVal, { color: '#6366F1' }]}>#{queue.position}</Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>
                {t('home.active_queue.position')}
              </Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: isDark ? '#1E2E25' : '#F0FDF4' }]}>
              <Text style={[styles.statVal, { color: '#10B981' }]}>{queue.estimatedWait}</Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>
                {t('home.active_queue.est_wait')}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Ionicons name="information-circle-outline" size={14} color={colors.mutedForeground} />
            <Text style={[styles.footerTip, { color: colors.mutedForeground }]}>
              Tap for details & updates
            </Text>
            <Ionicons name="chevron-forward" size={14} color={accentColor} style={styles.chevron} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: Spacing[6], marginBottom: Spacing[5] },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
  accentBar: { width: 5, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
  inner: { flex: 1, padding: Spacing[4], gap: Spacing[3] },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleBlock: { flex: 1, gap: Spacing[1.5] },
  liveDot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  liveLabel: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, letterSpacing: 0.5 },
  businessName: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: Spacing[3] },
  statBox: {
    flex: 1,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    borderRadius: 14,
    alignItems: 'center',
    gap: 2,
  },
  statVal: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold },
  statLbl: { fontSize: Typography.fontSize.xs },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerTip: { fontSize: Typography.fontSize.xs, flex: 1 },
  chevron: { marginLeft: 'auto' },
});

