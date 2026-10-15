import { loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { Slot } from './carbon';
import { runRules } from './rules';
import { findBestWindow, type BestWindow } from './window';

const HALF_HOUR = 30 * 60_000;

/** "08:00" on the day the example forecast starts, in UTC. */
const utc = (clock: string) => new Date(`2026-10-15T${clock}:00Z`);

interface World {
  slots: Slot[];
  window: BestWindow | null;
}

runRules<World>(await loadFeature('./cleanest-window.feature'), () => ({ slots: [], window: null }), [
  [
    /the forecast from (\d\d:\d\d) UTC is "([^"]*)"/,
    (w, start, values) => {
      const intensities = values.split(',').filter((v) => v.trim() !== '');
      w.slots = intensities.map((v, i) => ({
        from: new Date(utc(start).getTime() + i * HALF_HOUR),
        to: new Date(utc(start).getTime() + (i + 1) * HALF_HOUR),
        intensity: Number(v),
        index: 'moderate',
      }));
    },
  ],
  [
    /I look for the cleanest (\d+)-hour window/,
    (w, hours) => (w.window = findBestWindow(w.slots, Number(hours))),
  ],
  [
    /the window runs from (\d\d:\d\d) to (\d\d:\d\d) UTC/,
    (w, from, to) => {
      expect(w.window?.from).toEqual(utc(from));
      expect(w.window?.to).toEqual(utc(to));
    },
  ],
  [/there is no window/, (w) => expect(w.window).toBeNull()],
  [/it averages (\d+) gCO2\/kWh/, (w, avg) => expect(w.window?.average).toBe(Number(avg))],
  [/starting now averages (\d+) gCO2\/kWh/, (w, avg) => expect(w.window?.averageNow).toBe(Number(avg))],
  [
    /the window is (\d+)% cleaner than starting now/,
    (w, saving) => expect(w.window?.savingPercent).toBe(Number(saving)),
  ],
]);
