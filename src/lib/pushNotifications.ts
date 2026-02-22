/**
 * Push Notifications — temporarily disabled.
 *
 * @capacitor/push-notifications was removed due to version
 * incompatibility with Capacitor 8.1.0. These are no-op stubs
 * so the rest of the app compiles without changes.
 */

export async function initPushNotifications(): Promise<void> {
  // No-op — push notifications disabled
  console.log('Push notifications: disabled (plugin not installed)');
}

export async function removePushListeners(): Promise<void> {
  // No-op
}
