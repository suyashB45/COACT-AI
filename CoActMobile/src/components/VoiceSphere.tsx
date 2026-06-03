/**
 * VoiceSphere — Central animated AI sphere
 * Changes appearance based on state: idle, recording, AI speaking, processing.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors } from '../theme/colors';

interface VoiceSphereProps {
  isRecording: boolean;
  isAiSpeaking: boolean;
  isProcessing: boolean;
  size?: number;
}

export const VoiceSphere: React.FC<VoiceSphereProps> = ({
  isRecording,
  isAiSpeaking,
  isProcessing,
  size = 180,
}) => {
  const sphereScale = useSharedValue(1);
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.08);
  const ringRotation = useSharedValue(0);

  useEffect(() => {
    if (isAiSpeaking) {
      sphereScale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 1500 }),
          withTiming(0.15, { duration: 1500 })
        ),
        -1
      );
    } else if (isRecording) {
      sphereScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1
      );
      glowOpacity.value = withTiming(0.2);
      glowScale.value = withTiming(1.1);
    } else if (isProcessing) {
      sphereScale.value = withTiming(1);
      ringRotation.value = withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }),
        -1
      );
      glowOpacity.value = withTiming(0.12);
    } else {
      sphereScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 3000 }),
          withTiming(1, { duration: 3000 })
        ),
        -1
      );
      glowOpacity.value = withTiming(0.08);
      glowScale.value = withTiming(1);
    }
  }, [isRecording, isAiSpeaking, isProcessing]);

  const sphereAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sphereScale.value }],
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const getSphereColor = () => {
    if (isRecording) return Colors.recordingRed;
    if (isAiSpeaking) return Colors.primaryContainer;
    if (isProcessing) return 'rgba(77, 142, 255, 0.8)';
    return Colors.surfaceContainerHigh;
  };

  const getGlowColor = () => {
    if (isRecording) return 'rgba(239, 68, 68, 0.4)';
    if (isAiSpeaking) return 'rgba(77, 142, 255, 0.35)';
    return 'rgba(99, 102, 241, 0.1)';
  };

  const getIconName = (): any => {
    if (isRecording) return 'mic';
    if (isAiSpeaking) return 'volume-high';
    if (isProcessing) return 'sparkles';
    return 'chatbubble-ellipses';
  };

  const getIconColor = () => {
    if (isRecording || isAiSpeaking) return Colors.white;
    if (isProcessing) return Colors.primary;
    return Colors.textMuted;
  };

  return (
    <View style={[styles.container, { width: size + 60, height: size + 60 }]}>
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size + 48,
            height: size + 48,
            borderRadius: (size + 48) / 2,
            backgroundColor: getGlowColor(),
          },
          glowAnimStyle,
        ]}
      />

      {/* Ring */}
      <View
        style={[
          styles.ring,
          {
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            borderColor: isRecording
              ? 'rgba(239, 68, 68, 0.3)'
              : isProcessing
                ? 'rgba(77, 142, 255, 0.4)'
                : Colors.outlineVariant,
            borderStyle: isProcessing ? 'dashed' : 'solid',
          },
        ]}
      />

      {/* Core sphere */}
      <Animated.View
        style={[
          styles.sphere,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: getSphereColor(),
          },
          sphereAnimStyle,
        ]}
      >
        {/* Top-right highlight */}
        <View style={styles.highlight} />

        {/* Icon */}
        <Ionicons name={getIconName()} size={size * 0.3} color={getIconColor()} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
  },
  sphere: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    borderRadius: 999,
    opacity: 0.15,
  },
});
