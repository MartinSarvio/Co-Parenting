import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from './supabase';

let listenersRegistered = false;

export async function initPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications: skipped (not native platform)');
    return;
  }

  try {
    // Check current permission status
    const permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      const result = await PushNotifications.requestPermissions();
      if (result.receive !== 'granted') {
        console.log('Push notifications: permission denied');
        return;
      }
    } else if (permStatus.receive !== 'granted') {
      console.log('Push notifications: permission not granted');
      return;
    }

    // Register with APNs
    await PushNotifications.register();

    // Set up listeners (only once)
    if (!listenersRegistered) {
      listenersRegistered = true;

      await PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration token:', token.value);
        // Send token to Supabase
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('device_tokens').upsert({
              user_id: user.id,
              token: token.value,
              platform: Capacitor.getPlatform(),
            }, { onConflict: 'token' });
          }
        } catch (err) {
          console.warn('Failed to register push token:', err);
        }
      });

      await PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error.error);
      });

      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
        // iOS native banner handles foreground display via AppDelegate
        // (.banner, .badge, .sound) — no need for web toast
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed:', notification);
      });
    }

    console.log('Push notifications: initialized successfully');
  } catch (err) {
    console.warn('Push notifications: initialization failed', err);
  }
}

export async function removePushListeners(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await PushNotifications.removeAllListeners();
    listenersRegistered = false;
  } catch (err) {
    console.warn('Push notifications: failed to remove listeners', err);
  }
}
