import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import type { BestWindow } from '@/lib/window';
import { summarise } from '@/lib/window';
import { useTheme } from '@/theme';

interface Props {
  window: BestWindow;
  now: Date;
}

const clock = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

export function BestWindowCard({ window: w, now }: Props) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const { kicker, headline } = summarise(w, now);

  // Keyed by the window so changing the duration replays the entrance.
  return (
    <Animated.View
      key={`${w.start}-${w.length}`}
      entering={reduced ? undefined : FadeInDown.springify().damping(16)}
      style={[styles.card, { backgroundColor: t.accent }]}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={
        w.flat
          ? `${headline}. About ${w.average} grams of CO2 per kilowatt hour for the whole forecast, so there is no cleaner time to wait for.`
          : `${headline}. Runs until ${clock(w.to)}. Average ${w.average} grams of CO2 per kilowatt hour. ${
              w.savingPercent > 0 ? `${w.savingPercent} percent cleaner than starting now.` : ''
            }`
      }
    >
      <Text style={[styles.kicker, { color: t.onAccent }]}>{kicker}</Text>
      <Text style={[styles.headline, { color: t.onAccent }]}>{headline}</Text>
      <Text style={[styles.detail, { color: t.onAccent }]}>
        {w.flat
          ? `About ${w.average} gCO₂/kWh for the whole forecast`
          : `${clock(w.from)} to ${clock(w.to)} · ${w.average} gCO₂/kWh`}
      </Text>
      {w.savingPercent > 0 && (
        <View style={[styles.badge, { backgroundColor: t.onAccent }]}>
          <Text style={[styles.badgeText, { color: t.accent }]}>{w.savingPercent}% cleaner than now</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, borderRadius: 20, gap: 4 },
  kicker: { fontSize: 14, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', opacity: 0.9 },
  headline: { fontSize: 28, fontWeight: '800' },
  detail: { fontSize: 16 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { fontSize: 14, fontWeight: '700' },
});
