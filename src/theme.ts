import { useColorScheme } from 'react-native';
import type { Index } from './lib/carbon';

const light = {
  bg: '#f3f8f4',
  surface: '#ffffff',
  text: '#10261a',
  muted: '#4a5f53',
  border: '#cfe0d4',
  accent: '#0b6b3a',
  onAccent: '#ffffff',
};

const dark: typeof light = {
  bg: '#0d1712',
  surface: '#16231c',
  text: '#eaf5ee',
  muted: '#a6bcad',
  border: '#27392f',
  accent: '#5fd18f',
  onAccent: '#08140d',
};

/** Green is clean, red is dirty. Colour is never the only signal: the index is also written out. */
export const indexColor: Record<Index, string> = {
  'very low': '#1b9e5a',
  low: '#6cc04a',
  moderate: '#e0b020',
  high: '#e0762a',
  'very high': '#c93a3a',
};

export function useTheme() {
  return useColorScheme() === 'dark' ? dark : light;
}
