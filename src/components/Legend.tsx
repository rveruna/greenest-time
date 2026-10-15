import { StyleSheet, Text, View } from 'react-native';
import type { Index } from '@/lib/carbon';
import { indexColor, useTheme } from '@/theme';

const ORDER: Index[] = ['very low', 'low', 'moderate', 'high', 'very high'];

/** The chart's colours, named. Colour alone must not carry the meaning. */
export function Legend() {
  const t = useTheme();
  return (
    <View style={styles.row}>
      {ORDER.map((i) => (
        <View key={i} style={styles.item}>
          <View style={[styles.swatch, { backgroundColor: indexColor[i] }]} />
          <Text style={[styles.text, { color: t.muted }]}>{i}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  text: { fontSize: 13 },
});
