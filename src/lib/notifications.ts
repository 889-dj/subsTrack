/**
 * expo-notifications ships native code, so requiring it throws on a
 * dev-client binary built before the package was added — same situation as
 * expo-image-picker (see src/lib/imagePicker.ts) and react-native-purchases
 * (see src/lib/purchases.ts), same fix: load lazily behind a try/catch.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

type NotificationsNamespace = typeof import('expo-notifications');

let cached: NotificationsNamespace | null | undefined;

function load(): NotificationsNamespace | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-notifications') as NotificationsNamespace;
  } catch {
    cached = null;
  }
  return cached;
}

export type RegisterPushTokenOutcome =
  | { status: 'registered'; token: string }
  | { status: 'permission-denied' }
  | { status: 'unsupported-device' }
  /** Native module missing from this binary (old dev client or Expo Go). */
  | { status: 'unavailable' };

/**
 * Requests notification permission and returns this device's Expo push
 * token. Does not talk to the backend — callers POST the token themselves,
 * same separation as pickImage() vs the upload call in account.tsx.
 */
export async function registerForPushNotifications(): Promise<RegisterPushTokenOutcome> {
  const mod = load();
  if (!mod) return { status: 'unavailable' };

  try {
    const existing = await mod.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await mod.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return { status: 'permission-denied' };

    if (Platform.OS === 'android') {
      await mod.setNotificationChannelAsync('default', {
        name: 'default',
        importance: mod.AndroidImportance.DEFAULT,
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    try {
      // Throws on a simulator/emulator — there's no APNs/FCM device to
      // register a real push token with, so that failure is expected there.
      const { data: token } = await mod.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      return { status: 'registered', token };
    } catch {
      return { status: 'unsupported-device' };
    }
  } catch {
    // Expo's newer native modules throw lazily, on the first actual native
    // call, not on require() — so `load()` alone can't catch a binary that
    // has the JS package but not the compiled native module linked in yet.
    return { status: 'unavailable' };
  }
}
