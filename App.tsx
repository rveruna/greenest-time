import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BestWindowCard } from '@/components/BestWindowCard';
import { DurationPicker, type Duration } from '@/components/DurationPicker';
import { ForecastChart } from '@/components/ForecastChart';
import { Legend } from '@/components/Legend';
import { useForecast } from '@/hooks/useForecast';
import { findBestWindow } from '@/lib/window';
import { useTheme } from '@/theme';

export default function App() {
  const t = useTheme();
  const { state, retry } = useForecast();
  const [hours, setHours] = useState<Duration>(2);
  const [now, setNow] = useState(() => new Date());

  // Keeps the "in 40 min" countdown honest without refetching.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const best = useMemo(
    () => (state.status === 'ready' ? findBestWindow(state.slots, hours) : null),
    [state, hours],
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: t.bg }]}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text accessibilityRole="header" style={[styles.title, { color: t.text }]}>
            Greenest Time
          </Text>
          <Text style={[styles.sub, { color: t.muted }]}>
            When is Britain&apos;s electricity cleanest? Pick a time for the washing machine, dishwasher or EV
            charger.
          </Text>
        </View>

        <Text style={[styles.label, { color: t.text }]}>How long does it run for?</Text>
        <DurationPicker value={hours} onChange={setHours} />

        {state.status === 'loading' && (
          <View style={styles.center} accessibilityLiveRegion="polite">
            <ActivityIndicator color={t.accent} size="large" />
            <Text style={{ color: t.muted }}>Loading the 48-hour forecast…</Text>
          </View>
        )}

        {state.status === 'error' && (
          <View
            style={[styles.error, { borderColor: t.border, backgroundColor: t.surface }]}
            accessibilityRole="alert"
          >
            <Text style={[styles.errorTitle, { color: t.text }]}>Couldn&apos;t load the forecast</Text>
            <Text style={{ color: t.muted }}>{state.message}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={retry}
              style={[styles.button, { backgroundColor: t.accent }]}
            >
              <Text style={[styles.buttonText, { color: t.onAccent }]}>Try again</Text>
            </Pressable>
          </View>
        )}

        {state.status === 'ready' && (
          <>
            {best ? (
              <BestWindowCard window={best} now={now} />
            ) : (
              <Text style={{ color: t.muted }}>The forecast is too short for that duration.</Text>
            )}
            <ForecastChart slots={state.slots} best={best} />
            <Legend />
          </>
        )}

        <Text style={[styles.credit, { color: t.muted }]}>
          Data: National Energy System Operator Carbon Intensity API (national forecast, gCO₂ per kWh).
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // On web the page scrolls inside this container, not the document. `100%` heights follow the *large*
  // viewport on mobile Chrome, so the bottom can sit under the browser toolbar. `dvh` tracks the visible
  // area instead, and the extra bottom padding keeps the last content scrollable clear of any browser UI.
  screen: {
    flex: 1,
    ...Platform.select({ web: { height: '100dvh' as unknown as number } }),
  },
  content: {
    padding: 20,
    gap: 16,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: Platform.select({
      web: 'calc(88px + env(safe-area-inset-bottom))' as unknown as number,
      default: 88,
    }),
  },
  title: { fontSize: 34, fontWeight: '800' },
  sub: { fontSize: 16, marginTop: 4, lineHeight: 22 },
  label: { fontSize: 16, fontWeight: '700' },
  center: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  error: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 8 },
  errorTitle: { fontSize: 18, fontWeight: '700' },
  button: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 22,
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  credit: { fontSize: 12, marginTop: 8 },
});
