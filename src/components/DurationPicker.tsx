import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';

export const DURATIONS = [1, 2, 3, 4] as const;
export type Duration = (typeof DURATIONS)[number];

interface Props {
  value: Duration;
  onChange: (d: Duration) => void;
}

export function DurationPicker({ value, onChange }: Props) {
  const t = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="How long does it run for?" style={styles.row}>
      {DURATIONS.map((d) => {
        const selected = d === value;
        return (
          <Pressable
            key={d}
            accessibilityRole="radio"
            aria-checked={selected}
            accessibilityLabel={`${d} ${d === 1 ? 'hour' : 'hours'}`}
            onPress={() => onChange(d)}
            style={({ pressed }) => [
              styles.pill,
              { borderColor: t.accent, backgroundColor: selected ? t.accent : 'transparent' },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.label, { color: selected ? t.onAccent : t.accent }]}>{d} h</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // Wraps instead of clipping on very narrow screens.
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  // 44pt is the minimum comfortable touch target on iOS and Android.
  pill: {
    minHeight: 44,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 22,
  },
  label: { fontSize: 16, fontWeight: '700' },
});
