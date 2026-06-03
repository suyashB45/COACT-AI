/**
 * CoAct.AI Mobile Design System — Color Tokens
 * Derived from the DESIGN.md blueprint.
 * Palette optimized for OLED screens (deep blacks, vibrant accents).
 */

export const Colors = {
  // ─── Surfaces ──────────────────────────────────────────
  background: '#10131a',
  surface: '#10131a',
  surfaceDim: '#10131a',
  surfaceBright: '#363941',
  surfaceContainerLowest: '#0b0e15',
  surfaceContainerLow: '#191b23',
  surfaceContainer: '#1d2027',
  surfaceContainerHigh: '#272a31',
  surfaceContainerHighest: '#32353c',
  surfaceVariant: '#32353c',

  // ─── On-Surface (Text) ────────────────────────────────
  onSurface: '#e1e2ec',
  onSurfaceVariant: '#c2c6d6',
  inverseSurface: '#e1e2ec',
  inverseOnSurface: '#2e3038',

  // ─── Primary ──────────────────────────────────────────
  primary: '#adc6ff',
  onPrimary: '#002e6a',
  primaryContainer: '#4d8eff',
  onPrimaryContainer: '#00285d',
  inversePrimary: '#005ac2',
  surfaceTint: '#adc6ff',

  // ─── Secondary (Success / Emerald) ────────────────────
  secondary: '#4edea3',
  onSecondary: '#003824',
  secondaryContainer: '#00a572',
  onSecondaryContainer: '#00311f',

  // ─── Tertiary (Warning / Orange) ──────────────────────
  tertiary: '#ffb786',
  onTertiary: '#502400',
  tertiaryContainer: '#df7412',
  onTertiaryContainer: '#461f00',

  // ─── Error ────────────────────────────────────────────
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',

  // ─── Outline / Border ─────────────────────────────────
  outline: '#8c909f',
  outlineVariant: '#424754',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderLight: 'rgba(255, 255, 255, 0.12)',

  // ─── Semantic Aliases (convenience) ───────────────────
  textPrimary: '#ffffff',
  textSecondary: '#e2e8f0',
  textMuted: '#94a3b8',
  recordingRed: '#ef4444',
  recordingRedTranslucent: 'rgba(239, 68, 68, 0.2)',

  // ─── Glass Card Background ────────────────────────────
  glassBackground: 'rgba(50, 53, 60, 0.4)',
  glassBackgroundDark: 'rgba(30, 41, 59, 0.55)',

  // ─── Fixed Colors ─────────────────────────────────────
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
