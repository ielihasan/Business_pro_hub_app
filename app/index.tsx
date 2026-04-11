import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/store/useStore';
import { oauthState } from '@/lib/oauthState';

export default function SplashIndex() {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading } = useStore();

  // Animations
  const fadeIn  = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.82)).current;
  const pulse   = useRef(new Animated.Value(1)).current;
  const dot1    = useRef(new Animated.Value(0.3)).current;
  const dot2    = useRef(new Animated.Value(0.3)).current;
  const dot3    = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale,  { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }),
    ]).start();

    // Logo pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.07, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Bouncing dots
    const animateDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1,   duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay(Math.max(0, 600 - delay)),
        ])
      ).start();

    animateDot(dot1, 0);
    animateDot(dot2, 200);
    animateDot(dot3, 400);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (oauthState.oauthCallbackInProgress) return;
        router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/welcome');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Animated.View style={{ opacity: fadeIn, transform: [{ scale }], alignItems: 'center', gap: 12 }}>
        <Animated.View style={[styles.logoBox, { backgroundColor: colors.brand, transform: [{ scale: pulse }] }]}>
          <Text style={[styles.logoText, { color: colors.brandForeground }]}>BH</Text>
        </Animated.View>
        <Text style={[styles.title, { color: colors.foreground }]}>BusinessHub Pro</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>Smart Queue Management</Text>
      </Animated.View>

      <Animated.View style={[styles.dots, { opacity: fadeIn }]}>
        {[dot1, dot2, dot3].map((d, i) => (
          <Animated.View key={i} style={[styles.dot, { backgroundColor: colors.brand, opacity: d }]} />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoBox: { width: 96, height: 96, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  logoText:{ fontSize: 38, fontWeight: '900', letterSpacing: -1 },
  title:   { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  sub:     { fontSize: 13, fontWeight: '500', marginTop: -4 },
  dots:    { flexDirection: 'row', gap: 8, position: 'absolute', bottom: 80 },
  dot:     { width: 8, height: 8, borderRadius: 4 },
});
