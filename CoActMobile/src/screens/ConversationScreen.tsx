/**
 * ConversationScreen — WhatsApp-style voice call UI.
 * Full-screen dark call interface with caller info, animated avatar,
 * and bottom action bar (mute, speaker, end call).
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useTTSPlayer } from '../hooks/useTTSPlayer';
import { useSessionStore } from '../stores/useSessionStore';
import { api } from '../lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ConversationScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { sessionId, aiIntro } = route.params;

  const {
    sessionConfig,
    transcript,
    addMessage,
    turnCount,
    incrementTurn,
    elapsedSeconds,
    setElapsed,
    authSession,
    clearSession,
  } = useSessionStore();

  const { isRecording, startRecording, stopRecording, stopAndTranscribe } = useAudioRecorder();
  const { isPlaying, playAISpeech, stopPlayback } = useTTSPlayer();

  const [isProcessing, setIsProcessing] = useState(false);
  const [timerInterval, setTimerInterval] = useState<any>(null);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // VAD and Live Mode states
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const isLiveModeRef = useRef(isLiveMode);
  const isPlayingRef = useRef(isPlaying);
  const hasSpoken = useRef(false);
  const silenceTimerRef = useRef<any>(null);

  // Animations
  const avatarScale = useSharedValue(1);
  const avatarGlow = useSharedValue(0);
  const ringScale1 = useSharedValue(1);
  const ringScale2 = useSharedValue(1);
  const ringScale3 = useSharedValue(1);
  const ringOpacity1 = useSharedValue(0.15);
  const ringOpacity2 = useSharedValue(0.1);
  const ringOpacity3 = useSharedValue(0.05);

  // Keep refs in sync
  useEffect(() => {
    isLiveModeRef.current = isLiveMode;
  }, [isLiveMode]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Animate avatar based on state
  useEffect(() => {
    if (isPlaying) {
      // AI speaking — pulsing rings like a call
      avatarScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
      avatarGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0, { duration: 600 })
        ),
        -1
      );
      ringScale1.value = withRepeat(
        withSequence(
          withTiming(1.6, { duration: 1200 }),
          withTiming(1, { duration: 0 })
        ),
        -1
      );
      ringOpacity1.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1200 }),
          withTiming(0.25, { duration: 0 })
        ),
        -1
      );
      ringScale2.value = withRepeat(
        withSequence(
          withTiming(1.6, { duration: 1200 }),
          withTiming(1, { duration: 0 })
        ),
        -1
      );
      ringOpacity2.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1200 }),
          withTiming(0.18, { duration: 0 })
        ),
        -1
      );
    } else if (isUserSpeaking) {
      avatarScale.value = withTiming(1);
      avatarGlow.value = withTiming(0);
      ringScale1.value = withTiming(1);
      ringOpacity1.value = withTiming(0.05);
    } else if (isProcessing) {
      avatarScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1000 }),
          withTiming(0.98, { duration: 1000 })
        ),
        -1
      );
      avatarGlow.value = withTiming(0.5);
    } else {
      // Idle gentle breathing
      avatarScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
      avatarGlow.value = withTiming(0);
      ringScale1.value = withTiming(1);
      ringOpacity1.value = withTiming(0.08);
      ringScale2.value = withTiming(1);
      ringOpacity2.value = withTiming(0.04);
    }
  }, [isPlaying, isUserSpeaking, isProcessing]);

  const avatarAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale1.value }],
    opacity: ringOpacity1.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale2.value }],
    opacity: ringOpacity2.value,
  }));

  // Start timer on mount
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(elapsedSeconds + 1);
    }, 1000);
    setTimerInterval(interval);

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [elapsedSeconds, setElapsed]);

  // Handle 7-minute limit
  useEffect(() => {
    if (elapsedSeconds === 300) {
      Alert.alert('2 Minutes Remaining', 'This conversation is limited to 7 minutes. Please wrap up your thoughts.');
    } else if (elapsedSeconds >= 420) {
      Alert.alert('Time Limit Reached', 'The 7-minute conversation limit has been reached.', [
        { text: 'OK', onPress: handleEndSession },
      ]);
    }
  }, [elapsedSeconds]);

  // Play intro and auto-start live mode
  useEffect(() => {
    if (aiIntro && transcript.length === 0) {
      addMessage('assistant', aiIntro);
      playAISpeech(aiIntro, sessionConfig?.ai_character);
    }
    // Auto-enable live mode after a short delay
    const timer = setTimeout(() => {
      setIsLiveMode(true);
      isLiveModeRef.current = true;
      startLiveListening();
    }, 1500);
    return () => clearTimeout(timer);
  }, [aiIntro]);

  const startLiveListening = async () => {
    if (!isLiveModeRef.current) return;
    try {
      hasSpoken.current = false;
      setIsUserSpeaking(false);

      await startRecording((metering) => {
        if (!isLiveModeRef.current) return;

        const threshold = isPlayingRef.current ? -20 : -35;

        if (metering > threshold) {
          if (!hasSpoken.current) {
            hasSpoken.current = true;
            setIsUserSpeaking(true);
            if (isPlayingRef.current) {
              stopPlayback();
            }
          }
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else {
          if (hasSpoken.current && !silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              silenceTimerRef.current = null;
              processVADTurn();
            }, 1500);
          }
        }
      });
    } catch (e) {
      console.error('Failed to start Live Listening:', e);
      setIsLiveMode(false);
    }
  };

  const processVADTurn = async () => {
    if (!isLiveModeRef.current) return;
    setIsProcessing(true);
    setIsUserSpeaking(false);
    hasSpoken.current = false;

    const text = await stopAndTranscribe(sessionId);
    const isValidText = text && text.replace(/[.\-?!, ]/g, "").length > 0;

    if (isValidText) {
      await processUserMessage(text);
    } else {
      setIsProcessing(false);
    }

    if (isLiveModeRef.current) {
      startLiveListening();
    }
  };

  const handleMicToggle = async () => {
    if (isLiveMode) {
      setIsLiveMode(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      setIsUserSpeaking(false);
      hasSpoken.current = false;
      await stopRecording();
    } else {
      setIsLiveMode(true);
      isLiveModeRef.current = true;
      if (isPlaying) {
        await stopPlayback();
      }
      await startLiveListening();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsLiveMode(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopRecording();
      stopPlayback();
    };
  }, []);

  const processUserMessage = async (message: string) => {
    try {
      addMessage('user', message);
      setIsProcessing(true);

      const token = authSession?.access_token || null;
      const result = await api.chatSession(sessionId, message, null, token);

      addMessage('assistant', result.follow_up);
      incrementTurn();
      setIsProcessing(false);

      await playAISpeech(result.follow_up, sessionConfig?.ai_character);
    } catch (error) {
      console.error('Chat error:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const handleEndSession = async () => {
    Alert.alert(
      'End Call',
      'End this simulation call?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: async () => {
            if (timerInterval) clearInterval(timerInterval);
            setIsLiveMode(false);
            await stopRecording();
            await stopPlayback();

            try {
              const token = authSession?.access_token || null;
              await api.completeSession(sessionId, token);
              navigation.replace('Report', { sessionId });
            } catch (error) {
              console.error('Failed to complete session:', error);
              navigation.replace('Report', { sessionId });
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getStatusText = () => {
    if (!isLiveMode) return 'Muted';
    if (isProcessing) return 'Thinking...';
    if (isUserSpeaking) return 'Listening...';
    if (isPlaying) return 'Speaking...';
    return 'Connected';
  };

  const getAvatarInitials = () => {
    const name = sessionConfig?.ai_role || sessionConfig?.ai_character || 'AI';
    return name.charAt(0).toUpperCase();
  };

  const getCallerName = () => {
    return sessionConfig?.ai_role || sessionConfig?.ai_character || 'AI Coach';
  };

  const lastMessage = transcript.length > 0
    ? transcript[transcript.length - 1]
    : null;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Dark gradient background */}
      <View style={styles.bgGradientTop} />
      <View style={styles.bgGradientBottom} />

      {/* ─── TOP SECTION: Back + Encryption badge ─── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ─── CALLER INFO ─── */}
      <View style={styles.callerSection}>
        {/* Animated rings behind avatar */}
        <View style={styles.avatarWrapper}>
          <Animated.View style={[styles.ring, styles.ring1, ring1Style]} />
          <Animated.View style={[styles.ring, styles.ring2, ring2Style]} />

          <Animated.View style={[styles.avatar, avatarAnimStyle]}>
            <Text style={styles.avatarText}>{getAvatarInitials()}</Text>
          </Animated.View>
        </View>

        <Text style={styles.callerName}>{getCallerName()}</Text>
        <Text style={styles.callerScenario}>
          {sessionConfig?.scenario || 'Voice Simulation'}
        </Text>

        {/* Call duration / status */}
        <View style={styles.statusRow}>
          <View style={[
            styles.statusDot,
            {
              backgroundColor: !isLiveMode
                ? '#6b7280'
                : isPlaying
                  ? '#4edea3'
                  : isUserSpeaking
                    ? '#ef4444'
                    : isProcessing
                      ? '#f59e0b'
                      : '#4edea3',
            },
          ]} />
          <Text style={styles.statusText}>
            {getStatusText()} • {formatTime(elapsedSeconds)}
          </Text>
        </View>
      </View>

      {/* ─── LIVE CAPTION AREA ─── */}
      <View style={styles.captionArea}>
        {isProcessing ? (
          <View style={styles.captionBubble}>
            <Text style={styles.captionDots}>•••</Text>
          </View>
        ) : lastMessage ? (
          <View style={[
            styles.captionBubble,
            lastMessage.role === 'user' && styles.captionBubbleUser,
          ]}>
            {lastMessage.role === 'assistant' && (
              <Text style={styles.captionSender}>{getCallerName()}</Text>
            )}
            <Text
              style={[
                styles.captionText,
                lastMessage.role === 'user' && styles.captionTextUser,
              ]}
              numberOfLines={4}
            >
              {lastMessage.content}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ─── BOTTOM ACTION BAR (WhatsApp style) ─── */}
      <View style={styles.actionBar}>
        {/* Row of action buttons */}
        <View style={styles.actionRow}>
          {/* Speaker */}
          <TouchableOpacity
            style={[styles.actionBtn, isSpeakerOn && styles.actionBtnActive]}
            onPress={() => setIsSpeakerOn(!isSpeakerOn)}
          >
            <Ionicons
              name={isSpeakerOn ? 'volume-high' : 'volume-mute'}
              size={24}
              color={isSpeakerOn ? '#000' : '#fff'}
            />
            <Text style={[styles.actionLabel, isSpeakerOn && styles.actionLabelActive]}>
              Speaker
            </Text>
          </TouchableOpacity>

          {/* Mute */}
          <TouchableOpacity
            style={[styles.actionBtn, !isLiveMode && styles.actionBtnActive]}
            onPress={handleMicToggle}
          >
            <Ionicons
              name={isLiveMode ? 'mic' : 'mic-off'}
              size={24}
              color={!isLiveMode ? '#000' : '#fff'}
            />
            <Text style={[styles.actionLabel, !isLiveMode && styles.actionLabelActive]}>
              {isLiveMode ? 'Mute' : 'Unmute'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* End Call Button */}
        <TouchableOpacity
          style={styles.endCallBtn}
          onPress={handleEndSession}
          activeOpacity={0.7}
        >
          <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>

        {/* Swipe hint */}
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0f1a',
  },

  // ─── Background ────
  bgGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#0d1520',
  },
  bgGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#080c14',
  },

  // ─── Top Bar ────
  topBar: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Caller Section ────
  callerSection: {
    alignItems: 'center',
    paddingTop: 30,
    zIndex: 10,
  },
  avatarWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
  },
  ring1: {
    width: 140,
    height: 140,
    borderColor: 'rgba(77, 142, 255, 0.35)',
  },
  ring2: {
    width: 170,
    height: 170,
    borderColor: 'rgba(77, 142, 255, 0.15)',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle gradient-like effect with shadow
    shadowColor: '#4d8eff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#a8ccff',
    letterSpacing: 1,
  },
  callerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  callerScenario: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '400',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // ─── Caption Area ────
  captionArea: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
  },
  captionBubble: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  captionBubbleUser: {
    backgroundColor: 'rgba(77, 142, 255, 0.12)',
    borderColor: 'rgba(77, 142, 255, 0.15)',
  },
  captionSender: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4d8eff',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  captionText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '400',
  },
  captionTextUser: {
    color: 'rgba(173, 198, 255, 0.9)',
  },
  captionDots: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    letterSpacing: 4,
  },

  // ─── Action Bar ────
  actionBar: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 10,
    zIndex: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 24,
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnActive: {
    backgroundColor: '#ffffff',
  },
  actionLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
    position: 'absolute',
    bottom: -20,
    textAlign: 'center',
  },
  actionLabelActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  endCallBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    // Red glow
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: 20,
  },
});
