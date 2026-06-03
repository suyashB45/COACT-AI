/**
 * CoAct.AI Mobile Design System — Typography Tokens
 * Based on the DESIGN.md blueprint (Inter typeface hierarchy).
 * On mobile, Inter maps to the system sans-serif (San Francisco on iOS, Roboto on Android).
 */
import { TextStyle } from 'react-native';

export const Typography: Record<string, TextStyle> = {
  h1: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.5,
    color: '#ffffff',
  },
  h2: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: -0.2,
    color: '#adc6ff',
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#e2e8f0',
  },
  bodySm: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: '#94a3b8',
  },
  labelCaps: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 12,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: '#94a3b8',
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    color: '#ffffff',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: '#94a3b8',
  },
} as const;
