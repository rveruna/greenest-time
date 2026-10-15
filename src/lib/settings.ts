import { DURATIONS, type Duration } from './durations';
import { outwardCode } from './postcode';

export interface Settings {
  hours: Duration;
  /** Outward postcode for a regional forecast, or null for the national one. */
  outcode: string | null;
}

export const DEFAULT_SETTINGS: Settings = { hours: 2, outcode: null };

/**
 * Reads saved settings defensively. Storage can hold anything (an older version's shape, a hand edit, a
 * half-written value), so each field is validated on its own and falls back to the default if it is bad.
 */
export function parseSettings(raw: string | null): Settings {
  if (!raw) return DEFAULT_SETTINGS;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
  const v = (value ?? {}) as Partial<Record<keyof Settings, unknown>>;
  const hours = DURATIONS.includes(v.hours as Duration) ? (v.hours as Duration) : DEFAULT_SETTINGS.hours;
  const outcode = typeof v.outcode === 'string' ? outwardCode(v.outcode) : null;
  return { hours, outcode };
}

export const serializeSettings = (s: Settings) => JSON.stringify(s);
