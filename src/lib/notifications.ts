/**
 * expo-notifications ships native code, so requiring it throws on a
 * dev-client binary built before the package was added — same situation as
 * expo-image-picker (see src/lib/imagePicker.ts) and react-native-purchases
 * (see src/lib/purchases.ts). The usual fix (try/catch around require()) is
 * NOT enough here: expo-notifications' own sub-modules call the *throwing*
 * expo-modules-core `requireNativeModule('ExpoPushTokenManager')` at their
 * top level, and on this binary that throw happens in a way a plain JS
 * try/catch around `require('expo-notifications')` does not catch (it still
 * crashes the app under React Native's New Architecture). The real fix:
 * probe with expo-modules-core's own *non-throwing* `requireOptionalNativeModule`
 * for that exact native module first, and never call require('expo-notifications')
 * at all — not even inside a try/catch — unless that probe succeeds.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';

type NotificationsNamespace = typeof import('expo-notifications');

let cached: NotificationsNamespace | null | undefined;

function load(): NotificationsNamespace | null {
  if (cached !== undefined) return cached;
  try {
    // Non-throwing: returns null if the native side isn't linked into this
    // binary, without ever triggering expo-notifications' own throwing path.
    if (!requireOptionalNativeModule('ExpoPushTokenManager')) {
      cached = null;
      return cached;
    }
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
  /**
   * The device is real and permission was granted, but Expo could not issue a
   * token — typically missing APNs/FCM credentials, a build without the push
   * entitlement, or no network. `message` is Expo's own error text.
   */
  | { status: 'token-error'; message: string }
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
      // Throws on a simulator/emulator (expected) and on a real device when the
      // push credentials or entitlement are missing (actionable).
      const { data: token } = await mod.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      return { status: 'registered', token };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Only an actual simulator/emulator is "unsupported"; everything else is a
      // real failure the user (or we) can act on, so don't hide it behind that label.
      if (/simulator|emulator/i.test(message)) return { status: 'unsupported-device' };
      console.warn('[push] getExpoPushTokenAsync failed:', message);
      return { status: 'token-error', message };
    }
  } catch {
    // Expo's newer native modules throw lazily, on the first actual native
    // call, not on require() — so `load()` alone can't catch a binary that
    // has the JS package but not the compiled native module linked in yet.
    return { status: 'unavailable' };
  }
}
