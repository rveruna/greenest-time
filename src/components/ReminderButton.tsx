import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { reminderAt } from '@/lib/reminder';
import type { BestWindow } from '@/lib/window';
import { reminders } from '@/reminders';
import { useTheme } from '@/theme';

interface Props {
  window: BestWindow;
  now: Date;
  region: string;
}

const clock = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

/**
 * "Remind me": a scheduled notification on a phone, a calendar file on the web. Hidden when the window starts
 * now, because then the answer is just "go". The parent keys this by window, so a new window resets it.
 */
export function ReminderButton({ window, now, region }: Props) {
  const t = useTheme();
  const [status, setStatus] = useState<string | null>(null);
  const [set, setSet] = useState(false);
  const at = reminderAt(window, now);
  if (!at) return null;

  const isPhone = reminders.kind === 'notification';

  const onPress = async () => {
    const r = await reminders.set(window, now, region);
    if (r.ok) {
      setSet(true);
      setStatus(
        isPhone
          ? `Reminder set for ${clock(r.at)}, five minutes before the window.`
          : 'Calendar event downloaded. Open it to add the window, with an alert five minutes before.',
      );
    } else if (r.reason === 'denied') {
      setStatus('Notifications are off for Greenest Time. Turn them on in Settings to get a reminder.');
    } else if (r.reason === 'too-soon') {
      setStatus('The window starts in a few minutes, so there is no need for a reminder.');
    } else {
      setStatus("Couldn't set the reminder. Please try again.");
    }
  };

  const onCancel = async () => {
    await reminders.cancel();
    setSet(false);
    setStatus('Reminder cancelled.');
  };

  return (
    <View style={styles.wrap}>
      {isPhone && set ? (
        <Pressable
          accessibilityRole="button"
          onPress={onCancel}
          style={({ pressed }) => [styles.button, { borderColor: t.accent }, pressed && { opacity: 0.7 }]}
        >
          <Text style={[styles.text, { color: t.accent }]}>Cancel reminder</Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [styles.button, { borderColor: t.accent }, pressed && { opacity: 0.7 }]}
        >
          <Text style={[styles.text, { color: t.accent }]}>
            {isPhone ? `Remind me at ${clock(at)}` : 'Add to calendar'}
          </Text>
        </Pressable>
      )}
      <Text accessibilityLiveRegion="polite" aria-live="polite" style={[styles.status, { color: t.muted }]}>
        {status ?? ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  button: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 22,
    borderWidth: 2,
  },
  text: { fontSize: 16, fontWeight: '700' },
  status: { fontSize: 14, lineHeight: 20 },
});
