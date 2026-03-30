import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { useFocusEffect } from 'expo-router';

/**
 * Plays a fade + slide-up entrance animation every time the screen gains focus.
 * Mirrors the welcome-screen hero animation pattern.
 *
 * Usage:
 *   const { entranceStyle } = useScreenEntrance();
 *   <Animated.View style={[{ flex: 1 }, entranceStyle]}> ... </Animated.View>
 */
export function useScreenEntrance(translateY = 18, duration = 380) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(translateY)).current;

  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      slideAnim.setValue(translateY);

      const animation = Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue:         1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue:         0,
          duration,
          useNativeDriver: true,
        }),
      ]);
      animation.start();

      return () => animation.stop();
    }, [translateY, duration]),
  );

  return {
    entranceStyle: {
      opacity:   fadeAnim,
      transform: [{ translateY: slideAnim }],
    },
  };
}
