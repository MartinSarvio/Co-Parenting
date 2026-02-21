/**
 * Push Notifications — native iOS push via Capacitor.
 *
 * Initialiseres efter login. Sender device-token til backend
 * så serveren kan sende push notifications via APNs.
 */

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { api } from './api';
import { toast } from 'sonner';

let initialized = false;

export async function initPushNotifications(): Promise<void> {
  // Only run on native platforms (not web/PWA)
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  // Prevent double initialization
  if (initialized) return;
  initialized = true;

  try {
    // Request permission
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      console.warn('Push notification permission not granted');
      return;
    }

    // Register with APNs
    await PushNotifications.register();

    // Successful registration — send device token to backend
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push token:', token.value);
      try {
        await api.post('/api/users/device-token', {
          token: token.value,
          platform: 'ios',
        });
      } catch (err) {
        console.error('Failed to register device token:', err);
      }
    });

    // Registration error
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    // Notification received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      // Show as in-app toast
      toast.info(notification.title || 'Ny besked', {
        description: notification.body,
      });
    });

    // Notification tapped (from background/lock screen)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push action performed:', action.notification.data);
      // Navigation could be handled here based on notification data
    });
  } catch (err) {
    console.error('Push notification init error:', err);
  }
}

export async function removePushListeners(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await PushNotifications.removeAllListeners();
  initialized = false;
}
