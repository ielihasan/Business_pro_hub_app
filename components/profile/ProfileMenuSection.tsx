import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing } from '@/constants/theme';

// Per-item icon color config — keyed by item id
const ICON_COLORS: Record<string, { icon: string; bg: string }> = {
  'edit-profile': { icon: '#3B82F6', bg: '#EFF6FF' },
  'loyalty':      { icon: '#D97706', bg: '#FEF3C7' },
  'payment':      { icon: '#16A34A', bg: '#F0FDF4' },
  'settings':     { icon: '#6366F1', bg: '#EEF2FF' },
  'help':         { icon: '#0EA5E9', bg: '#F0F9FF' },
  'feedback':     { icon: '#A855F7', bg: '#FAF5FF' },
};

const ICON_COLORS_DARK: Record<string, { icon: string; bg: string }> = {
  'edit-profile': { icon: '#60A5FA', bg: '#1E3A5F' },
  'loyalty':      { icon: '#FBBF24', bg: '#3D2100' },
  'payment':      { icon: '#4ADE80', bg: '#052E16' },
  'settings':     { icon: '#818CF8', bg: '#1E1B4B' },
  'help':         { icon: '#38BDF8', bg: '#082F49' },
  'feedback':     { icon: '#C084FC', bg: '#2E1065' },
};

type MenuItem = {
  id: string;
  icon: string;
  label: string;
  subtitle?: string;
  type: 'link' | 'toggle';
  badge?: string;
  value?: boolean | string;
};

interface ProfileMenuSectionProps {
  title: string;
  items: MenuItem[];
  toggleStates: Record<string, boolean>;
  onToggle: (id: string, value: boolean) => void;
  onMenuPress: (id: string) => void;
}

export function ProfileMenuSection({ title, items, toggleStates, onToggle, onMenuPress }: ProfileMenuSectionProps) {
  const { colors, isDark } = useTheme();
  const colorMap = isDark ? ICON_COLORS_DARK : ICON_COLORS;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {items.map((item, index) => {
          const ic = colorMap[item.id] ?? { icon: colors.mutedForeground, bg: colors.secondary };
          return (
            <View key={item.id}>
              {index > 0 && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
              <TouchableOpacity
                style={styles.row}
                onPress={() => item.type === 'link' && onMenuPress(item.id)}
                disabled={item.type === 'toggle'}
                activeOpacity={0.65}
              >
                {/* Icon */}
                <View style={[styles.iconWrap, { backgroundColor: ic.bg }]}>
                  <Ionicons name={item.icon as any} size={19} color={ic.icon} />
                </View>

                {/* Label block */}
                <View style={styles.labelBlock}>
                  <Text style={[styles.label, { color: colors.foreground }]}>{item.label}</Text>
                  {!!item.subtitle && (
                    <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{item.subtitle}</Text>
                  )}
                </View>

                {/* Right side */}
                {item.type === 'toggle' ? (
                  <Switch
                    value={toggleStates[item.id] ?? (typeof item.value === 'boolean' ? item.value : false)}
                    onValueChange={(v) => onToggle(item.id, v)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.primaryForeground}
                  />
                ) : (
                  <View style={styles.rightRow}>
                    {!!item.badge && (
                      <View style={[styles.badgePill, { backgroundColor: ic.bg }]}>
                        <Text style={[styles.badgeText, { color: ic.icon }]}>{item.badge}</Text>
                      </View>
                    )}
                    {!item.badge && typeof item.value === 'string' && (
                      <Text style={[styles.valueText, { color: colors.mutedForeground }]}>{item.value}</Text>
                    )}
                    <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: Spacing[4], marginBottom: Spacing[4] },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing[2],
    paddingLeft: Spacing[1],
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: Spacing[4],
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  labelBlock: { flex: 1 },
  label:    { fontSize: Typography.fontSize.base, fontWeight: '500' },
  subtitle: { fontSize: 12, marginTop: 1 },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  badgePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  valueText: { fontSize: Typography.fontSize.sm },
});
