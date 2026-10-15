import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import type { Slot } from '@/lib/carbon';
import type { BestWindow } from '@/lib/window';
import { indexColor, useTheme } from '@/theme';

const HEIGHT = 140;
/**
 * gCO2/kWh at the top of the chart, at least. Scaling to the forecast's own highest value made a 2-to-5 forecast
 * look like a big swing, and an all-zero forecast draw nothing at all.
 */
const MIN_SCALE = 100;
const GAP = 1;

interface Props {
  slots: Slot[];
  best: BestWindow | null;
}

export function ForecastChart({ slots, best }: Props) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const grow = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    grow.value = reduced ? 1 : withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [grow, reduced]);

  // Bars grow from the baseline. Animating a transform keeps it off the layout path.
  const barsStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: grow.value }] }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const max = Math.max(...slots.map((s) => s.intensity));
  const scale = Math.max(max, MIN_SCALE);
  const barWidth = width > 0 ? width / slots.length : 0;

  const first = slots[0];
  const last = slots[slots.length - 1];
  const fmt = (d: Date) =>
    d.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Bar chart of forecast carbon intensity for the next 48 hours. Lowest ${Math.min(
        ...slots.map((s) => s.intensity),
      )}, highest ${max} grams per kilowatt hour.${best ? ` The best window is highlighted.` : ''}`}
    >
      <View onLayout={onLayout} style={[styles.chart, { backgroundColor: t.surface, borderColor: t.border }]}>
        {/* The scale, so an empty-looking chart reads as "zero", not "no data". The chart's label already says it. */}
        <Text aria-hidden style={[styles.scale, styles.scaleTop, { color: t.muted }]}>
          {scale} g
        </Text>
        <Text aria-hidden style={[styles.scale, styles.scaleBottom, { color: t.muted }]}>
          0 g
        </Text>
        {width > 0 && (
          <Animated.View style={[{ transformOrigin: 'bottom' }, barsStyle]}>
            <Svg width={width} height={HEIGHT}>
              {slots.map((s, i) => {
                const h = Math.max(2, (s.intensity / scale) * HEIGHT);
                const inBest = best !== null && i >= best.start && i < best.start + best.length;
                return (
                  <Rect
                    key={s.from.toISOString()}
                    x={i * barWidth}
                    y={HEIGHT - h}
                    width={Math.max(1, barWidth - GAP)}
                    height={h}
                    fill={indexColor[s.index]}
                    opacity={best && !inBest ? 0.35 : 1}
                  />
                );
              })}
              {best && (
                <Rect
                  x={best.start * barWidth - 1}
                  y={1}
                  width={best.length * barWidth + 1}
                  height={HEIGHT - 2}
                  fill="none"
                  stroke={t.text}
                  strokeWidth={2}
                  rx={4}
                />
              )}
            </Svg>
          </Animated.View>
        )}
      </View>
      <View style={styles.axis}>
        <Text style={[styles.axisText, { color: t.muted }]}>{fmt(first.from)}</Text>
        <Text style={[styles.axisText, { color: t.muted }]}>{fmt(last.to)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    height: HEIGHT + 2,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  scale: { position: 'absolute', left: 8, fontSize: 12, zIndex: 1 },
  scaleTop: { top: 6 },
  scaleBottom: { bottom: 8 },
  axisText: { fontSize: 13 },
});
