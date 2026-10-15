import type { BestWindow } from '@/lib/window';

export type ReminderResult = { ok: true; at: Date } | { ok: false; reason: 'denied' | 'too-soon' | 'failed' };

export interface Reminders {
  /** "notification" on a phone, "calendar" on the web (a closed tab cannot fire a scheduled notification). */
  kind: 'notification' | 'calendar';
  set(window: BestWindow, now: Date, region: string): Promise<ReminderResult>;
  cancel(): Promise<void>;
}
