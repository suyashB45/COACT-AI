/**
 * GlassmorphicCard — Premium glass-effect card component
 * Translucent background, thin border, shadow elevation.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../theme/colors';
import { Spacing, Radii } from '../theme/styles';

interface GlassmorphicCardProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  dark?: boolean;
}

export const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({
  title,
  children,
  style,
  dark = false,
}) => {
  return (
    <View style={[dark ? styles.cardDark : styles.card, style]}>
      {title && <Text style={styles.header}>{title}</Text>}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.glassBackground,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5,
  },
  cardDark: {
    backgroundColor: Colors.glassBackgroundDark,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
});
