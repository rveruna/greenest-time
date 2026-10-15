import { useCallback, useEffect, useState } from 'react';
import { fetchForecast, type Slot } from '@/lib/carbon';

export type ForecastState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; slots: Slot[]; fetchedAt: Date };

export function useForecast() {
  const [state, setState] = useState<ForecastState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const now = new Date();
    fetchForecast(now, controller.signal)
      .then((slots) => setState({ status: 'ready', slots, fetchedAt: now }))
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', message: e instanceof Error ? e.message : 'Something went wrong' });
      });
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
}
