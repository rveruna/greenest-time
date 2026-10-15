// iOS and Android: a local notification scheduled for a few minutes before the window opens.
import * as Notifications from 'expo-notifications';
import { reminderAt } from '@/lib/reminder';
import type { Reminders } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    // On Android, no sound also means no drop-down banner (see expo-notifications' types), and a reminder
    // nobody sees is no reminder.
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let scheduledId: string | null = null;

export const reminders: Reminders = {
  kind: 'notification',
  async set(window, now, region) {
    const at = reminderAt(window, now);
    if (!at) return { ok: false, reason: 'too-soon' };
    try {
      const existing = await Notifications.getPermissionsAsync();
      const granted = existing.granted || (await Notifications.requestPermissionsAsync()).granted;
      if (!granted) return { ok: false, reason: 'denied' };
      if (scheduledId) await Notifications.cancelScheduledNotificationAsync(scheduledId);
      scheduledId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'The greenest time starts soon',
          body: `Electricity in ${region} is about to be at its cleanest. Good time to start the washing machine or charger.`,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
      });
      return { ok: true, at };
    } catch {
      return { ok: false, reason: 'failed' };
    }
  },
  async cancel() {
    if (scheduledId) await Notifications.cancelScheduledNotificationAsync(scheduledId);
    scheduledId = null;
  },
};
