import { loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { outwardCode } from './postcode';
import { runRules } from './rules';
import { parseSettings, type Settings } from './settings';

interface World {
  outward: string | null;
  saved: string | null;
  settings: Settings | null;
}

runRules<World>(
  await loadFeature('./postcode-and-settings.feature'),
  () => ({ outward: null, saved: null, settings: null }),
  [
    [/I enter the postcode "([^"]*)"/, (w, typed) => (w.outward = outwardCode(typed))],
    [/the app uses "([^"]*)" for the forecast/, (w, outward) => expect(w.outward).toBe(outward)],
    [/the app does not use it/, (w) => expect(w.outward).toBeNull()],
    // Empty means nothing was ever saved, which storage reports as null.
    [/storage holds '(.*)'/, (w, saved) => (w.saved = saved === '' ? null : saved)],
    [/the app loads my settings/, (w) => (w.settings = parseSettings(w.saved))],
    [/the duration is (\d) hours/, (w, hours) => expect(w.settings?.hours).toBe(Number(hours))],
    [
      /the forecast is for "([^"]*)"/,
      (w, region) => expect(w.settings?.outcode).toBe(region === 'national' ? null : region),
    ],
  ],
);
