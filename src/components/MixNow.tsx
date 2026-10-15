import { StyleSheet, Text, View } from 'react-native';
import type { FuelShare } from '@/lib/carbon';
import { describeMix, summariseMix } from '@/lib/mix';
import { indexColor, useTheme } from '@/theme';

interface Props {
  mix: FuelShare[] | null;
  region: string;
}

/**
 * What is generating the electricity right now. It explains the forecast: a South Scotland reading of 0 is
 * believable once it says "71% wind". Shows nothing when the API gave no mix.
 */
export function MixNow({ mix, region }: Props) {
  const t = useTheme();
  const summary = summariseMix(mix);
  if (!summary) return null;
  const sources = describeMix(summary);

  return (
    <View
      accessible
      accessibilityLabel={`Powering ${region} now: ${sources}. ${summary.zeroCarbonPercent} percent from wind, solar, nuclear and hydro.`}
      style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}
    >
      <Text style={[styles.title, { color: t.text }]}>Powering {region} now</Text>
      <Text style={[styles.sources, { color: t.text }]}>{sources}</Text>
      {/* The share from wind, solar, nuclear and hydro, as a bar. The sentence below says the same. */}
      <View style={[styles.track, { backgroundColor: t.border }]}>
        <View
          style={[
            styles.fill,
            { width: `${summary.zeroCarbonPercent}%`, backgroundColor: indexColor['very low'] },
          ]}
        />
      </View>
      <Text style={[styles.note, { color: t.muted }]}>
        {summary.zeroCarbonPercent}% from wind, solar, nuclear and hydro
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 6 },
  title: { fontSize: 14, fontWeight: '700' },
  sources: { fontSize: 18, fontWeight: '600' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 4 },
  fill: { height: '100%' },
  note: { fontSize: 13 },
});
