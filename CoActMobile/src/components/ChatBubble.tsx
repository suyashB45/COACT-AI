/**
 * ChatBubble — Conversation message bubble
 * AI bubbles: translucent slate background with white text.
 * User bubbles: electric blue accent border with blue-tinted background.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Spacing, Radii } from '../theme/styles';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  characterName?: string;
  characterColor?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  role,
  content,
  characterName,
  characterColor,
}) => {
  const isUser = role === 'user';

  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperAssistant]}>
      {/* Sender label */}
      <Text style={[styles.label, isUser && styles.labelUser]}>
        {isUser ? 'YOU' : characterName || 'COACT AI'}
      </Text>

      {/* Bubble */}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
          characterColor && !isUser ? { borderLeftColor: characterColor, borderLeftWidth: 3 } : null,
        ]}
      >
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}>
          {content}
        </Text>
      </View>
    </View>
  );
};

/** Typing indicator ("● ● ●") shown when AI is processing */
export const TypingIndicator: React.FC = () => (
  <View style={[styles.wrapper, styles.wrapperAssistant]}>
    <Text style={styles.label}>COACT AI</Text>
    <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, { opacity: 0.4 + i * 0.2 }]} />
        ))}
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.containerMargin,
  },
  wrapperUser: {
    alignItems: 'flex-end',
  },
  wrapperAssistant: {
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  labelUser: {
    color: Colors.primary,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  bubbleAssistant: {
    backgroundColor: Colors.glassBackground,
    borderColor: Colors.glassBorder,
    borderTopLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: 'rgba(77, 142, 255, 0.12)',
    borderColor: 'rgba(77, 142, 255, 0.3)',
    borderTopRightRadius: 4,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  textAssistant: {
    color: Colors.onSurface,
  },
  textUser: {
    color: Colors.primary,
  },
  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
