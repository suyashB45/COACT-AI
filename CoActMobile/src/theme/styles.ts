/**
 * CoAct.AI Mobile Design System — Shared Styles
 * Common StyleSheet patterns: glassmorphic cards, buttons, input fields, spacing.
 */
import { StyleSheet } from 'react-native';
import { Colors } from './colors';

export const Spacing = {
  base: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  containerMargin: 20,
  gutter: 12,
} as const;

export const Radii = {
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const SharedStyles = StyleSheet.create({
  // ─── Screen Container ────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenPadded: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.containerMargin,
  },

  // ─── Glassmorphic Card ───────────────────────────
  glassCard: {
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
  glassCardDark: {
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

  // ─── Primary Button ──────────────────────────────
  buttonPrimary: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    shadowColor: Colors.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  buttonPrimaryText: {
    color: Colors.onPrimaryContainer,
    fontSize: 18,
    fontWeight: '600' as const,
  },

  // ─── Ghost Button ────────────────────────────────
  buttonGhost: {
    backgroundColor: Colors.transparent,
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  buttonGhostText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600' as const,
  },

  // ─── Text Input ──────────────────────────────────
  textInput: {
    backgroundColor: 'rgba(25, 27, 35, 0.8)',
    borderRadius: Radii.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    color: Colors.onSurface,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  textInputFocused: {
    borderColor: Colors.primary,
  },

  // ─── Row / Flex Helpers ──────────────────────────
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  rowBetween: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  center: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // ─── Divider ─────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
    opacity: 0.3,
  },
});
