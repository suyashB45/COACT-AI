/**
 * PulsingRecordButton — Animated recording button
 * Uses react-native-reanimated for continuous radial pulse when active.
 */
import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';

interface PulsingRecordButtonProps {
  onPress: () => void;
  isRecording: boolean;
  disabled?: boolean;
  size?: number;
}

export const PulsingRecordButton: React.FC<PulsingRecordButtonProps> = ({
  onPress,
  isRecording,
  disabled = false,
  size = 80,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    if (isRecording) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 600 }),
          withTiming(1.0, { duration: 600 })
        ),
        -1
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 600 }),
          withTiming(0.2, { duration: 600 })
        ),
        -1
      );
    } else {
      scale.value = withTiming(1);
      opacity.value = withTiming(0.2);
    }
  }, [isRecording]);

  const outerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const innerSize = size * 0.75;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.container, { width: size + 20, height: size + 20 }]}
    >
      {/* Pulsing outer ring */}
      <Animated.View
        style={[
          styles.outerRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: isRecording
              ? Colors.recordingRedTranslucent
              : 'rgba(77, 142, 255, 0.15)',
          },
          outerAnimatedStyle,
        ]}
      />

      {/* Inner solid button */}
      <View
        style={[
          styles.innerButton,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: isRecording ? 12 : innerSize / 2,
            backgroundColor: isRecording ? Colors.recordingRed : Colors.primaryContainer,
          },
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRing: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerButton: {
    shadowColor: Colors.recordingRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
});
