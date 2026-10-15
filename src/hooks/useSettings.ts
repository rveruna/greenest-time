import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, parseSettings, serializeSettings, type Settings } from '@/lib/settings';

const KEY = 'greenest-time/settings/v1';

/**
 * Duration and postcode, remembered across app restarts (AsyncStorage: device storage on a phone,
 * localStorage on the web). `loaded` is false until the saved value has been read, so the first forecast
 * request uses the saved postcode instead of fetching the national one and then refetching.
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(KEY)
      .catch(() => null) // storage can be unavailable (private browsing); fall back to defaults
      .then((raw) => {
        if (cancelled) return;
        setSettings(parseSettings(raw));
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(KEY, serializeSettings(next)).catch(() => {});
      return next;
    });
  }, []);

  return { settings, update, loaded };
}
