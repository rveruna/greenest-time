import { loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { buildIcs, reminderAt } from './reminder';
import { runRules } from './rules';
import { describeStart, untilLabel } from './window';

const NOW = new Date('2026-10-15T10:00:00Z');
const minutesFromNow = (m: number) => new Date(NOW.getTime() + m * 60_000);

/** Reads a field such as DTSTART:20261015T113000Z back into a Date. */
function icsDate(ics: string, field: string): Date {
  const [, y, mo, d, h, mi, s] = ics.match(
    new RegExp(`^${field}:(\\d{4})(\\d\\d)(\\d\\d)T(\\d\\d)(\\d\\d)(\\d\\d)Z`, 'm'),
  )!;
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
}

interface World {
  from: Date;
  to: Date;
  reminder: Date | null;
  ics: string;
}

runRules<World>(
  await loadFeature('./start-and-reminder.feature'),
  () => ({ from: NOW, to: NOW, reminder: null, ics: '' }),
  [
    [
      /the cleanest window opens in (\d+) minutes(?: and lasts (\d+) hours)?/,
      (w, minutes, hours = '1') => {
        w.from = minutesFromNow(Number(minutes));
        w.to = minutesFromNow(Number(minutes) + Number(hours) * 60);
      },
    ],
    [/the app says "([^"]*)"/, (w, advice) => expect(describeStart(w.from, NOW)).toBe(advice)],
    [/the app says to start later, not now/, (w) => expect(describeStart(w.from, NOW)).toMatch(/^Start at /)],
    [/the countdown reads "([^"]*)"/, (w, label) => expect(untilLabel(w.from, NOW)).toBe(label)],
    [/I ask to be reminded/, (w) => (w.reminder = reminderAt({ from: w.from }, NOW))],
    [
      /the reminder goes off in (\d+) minutes/,
      (w, m) => expect(w.reminder).toEqual(minutesFromNow(Number(m))),
    ],
    [/there is no reminder, because the answer is to start now/, (w) => expect(w.reminder).toBeNull()],
    [/I add it to my calendar/, (w) => (w.ics = buildIcs({ from: w.from, to: w.to, average: 80 }, NOW))],
    [
      /the event runs for the whole window/,
      (w) => {
        expect(icsDate(w.ics, 'DTSTART')).toEqual(w.from);
        expect(icsDate(w.ics, 'DTEND')).toEqual(w.to);
      },
    ],
    [
      /the event alerts me (\d+) minutes before it starts/,
      (w, m) => expect(w.ics).toContain(`TRIGGER:-PT${m}M`),
    ],
  ],
);
