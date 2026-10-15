import type { BestWindow } from './window';

/** How long before the window starts the reminder fires. */
export const LEAD_MINUTES = 5;

/**
 * When to remind: a few minutes before the window opens. Null when that moment has already passed,
 * because then the answer is simply "start now" and a reminder would fire immediately or never.
 */
export function reminderAt(
  window: Pick<BestWindow, 'from'>,
  now: Date,
  leadMinutes = LEAD_MINUTES,
): Date | null {
  const at = new Date(window.from.getTime() - leadMinutes * 60_000);
  return at.getTime() > now.getTime() ? at : null;
}

/** iCalendar UTC timestamp: 20261015T113000Z. */
const icsTime = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

/** Commas, semicolons and backslashes are special in iCalendar text values. */
const icsText = (s: string) =>
  s
    .replace(/\\/g, '\\\\')
    .replace(/([,;])/g, '\\$1')
    .replace(/\n/g, '\\n');

/**
 * A one-event calendar file for the window, with an alert a few minutes before. This is the reminder on web,
 * where a closed tab cannot fire a scheduled notification, and it works in any calendar app on any device.
 */
export function buildIcs(
  window: Pick<BestWindow, 'from' | 'to' | 'average'>,
  now: Date,
  place = 'Great Britain',
  leadMinutes = LEAD_MINUTES,
): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Greenest Time//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${icsTime(window.from)}-greenest-time@rveruna.github.io`,
    `DTSTAMP:${icsTime(now)}`,
    `DTSTART:${icsTime(window.from)}`,
    `DTEND:${icsTime(window.to)}`,
    `SUMMARY:${icsText('Greenest time to run appliances')}`,
    `DESCRIPTION:${icsText(`Cleanest electricity window for ${place}, averaging ${window.average} gCO2/kWh. From Greenest Time.`)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText('The greenest time starts soon')}`,
    `TRIGGER:-PT${leadMinutes}M`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  // The spec requires CRLF line endings; some calendar apps reject a file without them.
  return lines.join('\r\n') + '\r\n';
}
