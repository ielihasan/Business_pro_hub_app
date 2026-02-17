import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, Badge, Separator } from '@/components/ui';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

type MenuItem = {
  id: string;
  icon: string;
  label: string;
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
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
      <Card>
        <CardContent style={styles.menuContent}>
          {items.map((item, index) => (
            <View key={item.id}>
              {index > 0 && <Separator style={{ marginVertical: 0 }} />}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => item.type === 'link' && onMenuPress(item.id)}
                disabled={item.type === 'toggle'}
              >
                <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
                  <Ionicons name={item.icon as any} size={20} color={colors.foreground} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                {item.type === 'toggle' ? (
                  <Switch
                    value={toggleStates[item.id] ?? (typeof item.value === 'boolean' ? item.value : false)}
                    onValueChange={(value) => onToggle(item.id, value)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.primaryForeground}
                  />
                ) : (
                  <MenuItemRight item={item} />
                )}
              </TouchableOpacity>
            </View>
          ))}
        </CardContent>
      </Card>
    </View>
  );
}

function MenuItemRight({ item }: { item: MenuItem }) {
  const { colors } = useTheme();

  return (
    <View style={styles.menuRight}>
      {item.badge && (
        <Badge variant="secondary" style={styles.menuBadge}>{item.badge}</Badge>
      )}
      {!item.badge && typeof item.value === 'string' && (
        <Text style={[styles.menuValue, { color: colors.mutedForeground }]}>{item.value}</Text>
      )}
      <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: Spacing[6], marginBottom: Spacing[6] },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing[3],
  },
  menuContent: { padding: 0 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing[3], paddingHorizontal: Spacing[4] },
  menuIcon: { width: 36, height: 36, borderRadius: BorderRadius.DEFAULT, justifyContent: 'center', alignItems: 'center', marginRight: Spacing[3] },
  menuLabel: { flex: 1, fontSize: Typography.fontSize.base },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  menuBadge: { marginRight: Spacing[1] },
  menuValue: { fontSize: Typography.fontSize.sm },
});
