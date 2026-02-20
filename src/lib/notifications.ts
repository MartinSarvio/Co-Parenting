/**
 * Utilities for local browser notifications.
 * NOTE: These are client-side only. They require an open browser tab to fire.
 * Full background push notifications require a backend and service worker push API.
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Schedules a local notification for an upcoming handover.
 * Returns the timeout ID so it can be cancelled if needed.
 */
export function scheduleHandoverReminder(
  handoverDate: Date,
  childName: string,
  minutesBefore: number = 60
): ReturnType<typeof setTimeout> | null {
  if (Notification.permission !== 'granted') return null;

  const reminderTime = new Date(
    handoverDate.getTime() - minutesBefore * 60 * 1000
  );
  const delay = reminderTime.getTime() - Date.now();

  if (delay <= 0) return null;

  return setTimeout(() => {
    if (Notification.permission !== 'granted') return;
    new Notification(
      minutesBefore >= 60
        ? `Aflevering om ${minutesBefore / 60} time${minutesBefore / 60 > 1 ? 'r' : ''}`
        : `Aflevering om ${minutesBefore} minutter`,
      {
        body: `${childName} skal afleveres snart.`,
        icon: '/icon-192.png',
        tag: `handover-${handoverDate.toISOString()}`,
      }
    );
  }, delay);
}

/**
 * Fires all pending handover reminders from a list of handover dates.
 * Returns a cleanup function that cancels all scheduled timers.
 */
export function scheduleAllHandoverReminders(
  handovers: Array<{ scheduledDate?: string; startDate?: string; childName?: string; title?: string }>,
  minutesBefore: number = 60
): () => void {
  const timers: Array<ReturnType<typeof setTimeout>> = [];

  for (const h of handovers) {
    const dateStr = h.scheduledDate ?? h.startDate;
    if (!dateStr) continue;
    const date = new Date(dateStr);
    const name = h.childName ?? h.title ?? 'barnet';
    const timer = scheduleHandoverReminder(date, name, minutesBefore);
    if (timer !== null) {
      timers.push(timer);
    }
  }

  return () => {
    for (const t of timers) {
      clearTimeout(t);
    }
  };
}
