import { useCallback, useEffect, useState } from 'react';
import { fetchForecast, PostcodeNotFoundError, type Slot } from '@/lib/carbon';

export type ForecastState =
  | { status: 'loading' }
  | { status: 'error'; message: string; notFound?: string }
  | { status: 'ready'; slots: Slot[]; region: string; fetchedAt: Date };

/** Loads the forecast for an outward postcode, or nationally when `outcode` is null. Refetches when it changes. */
export function useForecast(outcode: string | null, enabled = true) {
  const [attempt, setAttempt] = useState(0);
  // Each result remembers which request it answers. "Loading" is derived, not stored: if the latest result
  // is for a different postcode or attempt, the current one is still in flight.
  const key = `${outcode ?? 'national'}#${attempt}`;
  const [result, setResult] = useState<{ key: string; state: ForecastState } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const now = new Date();
    fetchForecast(now, outcode, controller.signal)
      .then((f) =>
        setResult({ key, state: { status: 'ready', slots: f.slots, region: f.region, fetchedAt: now } }),
      )
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        const state: ForecastState =
          e instanceof PostcodeNotFoundError
            ? { status: 'error', message: e.message, notFound: e.outcode }
            : { status: 'error', message: e instanceof Error ? e.message : 'Something went wrong' };
        setResult({ key, state });
      });
    return () => controller.abort();
  }, [key, outcode, enabled]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const state: ForecastState = result?.key === key ? result.state : { status: 'loading' };

  return { state, retry };
}
