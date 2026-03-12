import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { RoutineNotificationConfig } from '@/types';

const ROUTINE_NOTIFICATION_BASE_ID = 90000; // Avoid collision with other notification IDs

/**
 * Schedule daily local notifications for routine reminders.
 * Cancels all existing routine notifications before scheduling new ones.
 */
export async function scheduleRoutineReminders(
  configs: RoutineNotificationConfig[],
  childNames: Record<string, string>,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('Routine notifications: skipped (not native platform)');
    return;
  }

  try {
    // Request permissions if needed
    const permStatus = await LocalNotifications.checkPermissions();
    if (permStatus.display === 'prompt') {
      const result = await LocalNotifications.requestPermissions();
      if (result.display !== 'granted') {
        console.log('Routine notifications: permission denied');
        return;
      }
    } else if (permStatus.display !== 'granted') {
      console.log('Routine notifications: permission not granted');
      return;
    }

    // Cancel existing routine notifications
    await cancelRoutineReminders();

    // Schedule new notifications
    const notifications: Parameters<typeof LocalNotifications.schedule>[0]['notifications'] = [];
    let idCounter = ROUTINE_NOTIFICATION_BASE_ID;

    for (const config of configs) {
      if (!config.enabled) continue;
      const childName = childNames[config.childId] || 'dit barn';

      const slots: { time?: string; label: string }[] = [
        { time: config.morgenTime, label: 'morgenrutinen' },
        { time: config.dagTime, label: 'dagsrutinen' },
        { time: config.aftenTime, label: 'aftenrutinen' },
      ];

      for (const slot of slots) {
        if (!slot.time) continue;
        const [hours, minutes] = slot.time.split(':').map(Number);

        notifications.push({
          id: idCounter++,
          title: 'Rutine-påmindelse',
          body: `Husk at notere ${slot.label} for ${childName}`,
          schedule: {
            on: { hour: hours, minute: minutes },
            repeats: true,
          },
          sound: 'default',
        });
      }
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
      console.log(`Routine notifications: scheduled ${notifications.length} reminders`);
    }
  } catch (err) {
    console.error('Failed to schedule routine notifications:', err);
  }
}

/**
 * Cancel all routine reminder notifications.
 */
export async function cancelRoutineReminders(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const pending = await LocalNotifications.getPending();
    const routineIds = pending.notifications
      .filter(n => n.id >= ROUTINE_NOTIFICATION_BASE_ID && n.id < ROUTINE_NOTIFICATION_BASE_ID + 1000)
      .map(n => ({ id: n.id }));

    if (routineIds.length > 0) {
      await LocalNotifications.cancel({ notifications: routineIds });
    }
  } catch (err) {
    console.error('Failed to cancel routine notifications:', err);
  }
}
