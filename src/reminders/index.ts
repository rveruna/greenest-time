// Web: a calendar file with an alert. Metro picks index.native.ts on iOS and Android instead.
import { buildIcs, reminderAt } from '@/lib/reminder';
import type { Reminders } from './types';

export const reminders: Reminders = {
  kind: 'calendar',
  async set(window, now, region) {
    const at = reminderAt(window, now);
    if (!at) return { ok: false, reason: 'too-soon' };
    try {
      const blob = new Blob([buildIcs(window, now, region)], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'greenest-time.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return { ok: true, at };
    } catch {
      return { ok: false, reason: 'failed' };
    }
  },
  async cancel() {
    // A downloaded calendar event lives in the user's calendar app; there is nothing to cancel here.
  },
};
