import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  PanResponder,
  Animated,
  ActivityIndicator,
  GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing } from '@/constants/theme';

interface ImageViewerProps {
  image: string;
  title?: string;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function ImageViewer({ image, title = 'Photo', onClose }: ImageViewerProps) {
  const { colors } = useTheme();
  const [scale, setScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => scale > 1,
      onMoveShouldSetPanResponder: () => scale > 1,
      onPanResponderMove: (evt, gestureState) => {
        if (scale > 1) {
          panX.setValue(gestureState.dx);
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: () => {
        Animated.parallel([
          Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: false,
          }),
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: false,
          }),
        ]).start();
      },
    })
  ).current;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.5, 1));
  };

  const handleReset = () => {
    setScale(1);
  };

  const handleBackdropPress = () => {
    if (scale === 1) {
      onClose();
    }
  };

  const imageSource = typeof image === 'string' ? { uri: image } : image;

  return (
    <Modal
      visible={true}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: colors.muted }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Image Container - Full Screen */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleBackdropPress}
          style={[styles.imageContainer]}
          {...panResponder.panHandlers}
        >
          {isLoading && (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={StyleSheet.absoluteFill}
            />
          )}
          <Animated.Image
            source={imageSource}
            style={[
              styles.image,
              {
                transform: [
                  { scale },
                  { translateX: panX },
                  { translateY: panY },
                ],
              },
            ]}
            resizeMode="contain"
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          />
        </TouchableOpacity>

        {/* Controls Footer */}
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={handleZoomOut}
            style={[styles.controlButton, { backgroundColor: colors.secondary }]}
            disabled={scale === 1}
          >
            <Ionicons
              name="remove"
              size={26}
              color={scale === 1 ? colors.mutedForeground : colors.foreground}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleReset}
            style={[styles.controlButton, { backgroundColor: colors.secondary }]}
            disabled={scale === 1}
          >
            <Text style={[styles.scaleText, { color: colors.foreground }]}>
              {Math.round(scale * 100)}%
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleZoomIn}
            style={[styles.controlButton, { backgroundColor: colors.secondary }]}
            disabled={scale === 3}
          >
            <Ionicons
              name="add"
              size={26}
              color={scale === 3 ? colors.mutedForeground : colors.foreground}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: Spacing[2],
    marginLeft: -Spacing[2],
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    flex: 1,
    textAlign: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth,
    height: screenHeight - 120,
  },
  image: {
    width: screenWidth,
    height: screenHeight - 120,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[3],
    borderTopWidth: 1,
    gap: Spacing[3],
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
});
