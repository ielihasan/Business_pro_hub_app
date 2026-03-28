import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  TouchableWithoutFeedback, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export type DialogAction = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
};

export type DialogConfig = {
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconVariant?: 'default' | 'destructive' | 'warning' | 'success';
  actions: DialogAction[];
};

type Props = DialogConfig & {
  visible: boolean;
  onDismiss?: () => void;
};

export default function Dialog({ visible, title, message, icon, iconVariant = 'default', actions, onDismiss }: Props) {
  const { colors } = useTheme();

  const iconBg = {
    default:     colors.secondary,
    destructive: colors.destructive + '20',
    warning:     colors.warning    + '20',
    success:     colors.success    + '20',
  }[iconVariant];

  const iconColor = {
    default:     colors.foreground,
    destructive: colors.destructive,
    warning:     colors.warning,
    success:     colors.success,
  }[iconVariant];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.centerer} pointerEvents="box-none">
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

          {/* Icon */}
          {icon && (
            <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
              <Ionicons name={icon} size={28} color={iconColor} />
            </View>
          )}

          {/* Text */}
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Actions */}
          {actions.map((action, i) => {
            const isDestructive = action.variant === 'destructive';
            const isPrimary     = action.variant === 'primary' || (!action.variant && i === actions.length - 1 && actions.length > 1);
            const isLast        = i === actions.length - 1;

            const btnBg     = isPrimary ? colors.foreground : 'transparent';
            const btnText   = isDestructive ? colors.destructive
                            : isPrimary     ? colors.background
                            : colors.foreground;
            const fontW     = isPrimary || isDestructive ? '800' : '600';

            return (
              <React.Fragment key={i}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: btnBg }]}
                  onPress={action.onPress}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.actionText, { color: btnText, fontWeight: fontW }]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
                {!isLast && <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  centerer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 0,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: { elevation: 16 },
    }),
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18, fontWeight: '900', letterSpacing: -0.4,
    textAlign: 'center', marginBottom: 8,
  },
  message: {
    fontSize: 14, lineHeight: 21, textAlign: 'center',
    marginBottom: 24,
  },
  divider:       { height: 1, width: '200%', marginHorizontal: -24 },
  actionDivider: { height: 1, width: '200%', marginHorizontal: -24 },
  actionBtn: {
    width: '200%', marginHorizontal: -24,
    paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  actionText: { fontSize: 15, letterSpacing: -0.2 },
});
