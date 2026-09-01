// @ts-ignore
import '../../global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1A1A',
    background: '#F5F4F0', // OCBC BG cream
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EDE8DF',
    textSecondary: '#767676',
    primary: '#D81E05', // OCBC Red
    border: '#E8E8E8',
  },
  dark: {
    text: '#FFFFFF',
    background: '#111111',
    backgroundElement: '#1A1A1A',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    primary: '#D81E05',
    border: '#2E3135',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;