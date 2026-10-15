import type { Slot } from './carbon';

export interface BestWindow {
  /** Index of the first slot in the window. */
  start: number;
  /** Number of half-hour slots. */
  length: number;
  from: Date;
  to: Date;
  /** Average gCO2/kWh over the window. */
  average: number;
  /** Average if you started right now. */
  averageNow: number;
  /** Percent cleaner than starting now. Never negative: if now is best, this is 0. */
  savingPercent: number;
  /** The whole forecast stays within FLAT_SPREAD, so there is no cleaner time worth waiting for. */
  flat: boolean;
  /** Every slot in the forecast is rated "very low". */
  cleanThroughout: boolean;
}

/**
 * gCO2/kWh. A forecast whose highest and lowest slots are this close has no cleaner time worth waiting for:
 * the forecast itself is less precise than that. South Scotland on a windy day is 0 for all 48 hours.
 */
export const FLAT_SPREAD = 10;

const average = (slots: Slot[]) => slots.reduce((sum, s) => sum + s.intensity, 0) / slots.length;

/**
 * The cleanest run of `hours` consecutive hours in the forecast. Ties go to the earliest start,
 * because waiting for no benefit is worse than going now.
 * Returns null if the forecast is shorter than the requested duration.
 */
export function findBestWindow(slots: Slot[], hours: number): BestWindow | null {
  const length = Math.round(hours * 2);
  if (length < 1 || slots.length < length) return null;

  let bestStart = 0;
  let bestSum = Infinity;
  let sum = 0;
  for (let i = 0; i < slots.length; i++) {
    sum += slots[i].intensity;
    if (i >= length) sum -= slots[i - length].intensity;
    if (i >= length - 1) {
      const start = i - length + 1;
      if (sum < bestSum) {
        bestSum = sum;
        bestStart = start;
      }
    }
  }

  const window = slots.slice(bestStart, bestStart + length);
  const avg = average(window);
  const avgNow = average(slots.slice(0, length));
  return {
    start: bestStart,
    length,
    from: window[0].from,
    to: window[window.length - 1].to,
    average: Math.round(avg),
    averageNow: Math.round(avgNow),
    savingPercent: avgNow === 0 ? 0 : Math.max(0, Math.round(((avgNow - avg) / avgNow) * 100)),
    flat: spread(slots) <= FLAT_SPREAD,
    cleanThroughout: slots.every((s) => s.index === 'very low'),
  };
}

const spread = (slots: Slot[]) => {
  const values = slots.map((s) => s.intensity);
  return Math.max(...values) - Math.min(...values);
};

/** What the result card says first: when to start, or that any time will do. */
export function summarise(w: BestWindow, now: Date, locale?: string): { kicker: string; headline: string } {
  if (w.flat) {
    return {
      kicker: 'Any time',
      headline: w.cleanThroughout ? 'Any time is clean' : 'No cleaner time to wait for',
    };
  }
  return {
    kicker: w.start === 0 ? 'Go now' : untilLabel(w.from, now),
    headline: describeStart(w.from, now, locale),
  };
}

export function describeStart(from: Date, now: Date, locale?: string): string {
  const minutes = Math.round((from.getTime() - now.getTime()) / 60000);
  const clock = from.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  if (minutes <= 15) return 'Now is the best time';
  const sameDay = from.toDateString() === now.toDateString();
  const day = sameDay
    ? 'today'
    : from.toDateString() === new Date(now.getTime() + 864e5).toDateString()
      ? 'tomorrow'
      : from.toLocaleDateString(locale, { weekday: 'long' });
  return `Start at ${clock} ${day}`;
}

export function untilLabel(from: Date, now: Date): string {
  const minutes = Math.max(0, Math.round((from.getTime() - now.getTime()) / 60000));
  if (minutes < 60) return `in ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `in ${h} h` : `in ${h} h ${m} min`;
}
