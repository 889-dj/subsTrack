/**
 * Local-only "Dev login" on the login screen. Visible in dev builds only
 * (`__DEV__` is false in every release build, so this can never ship).
 *
 * Tapping it installs the in-memory mock API at runtime and signs in a
 * throwaway user, regardless of how the app was started. No env flag needed.
 */
export const DEV_LOGIN_ENABLED = __DEV__;

/** Mock API is on from boot when EXPO_PUBLIC_USE_MOCK_API is not "false". */
export const USE_MOCK_API = process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false';

/** Throwaway credentials for the in-memory mock only. */
export const DEV_USER = { email: 'dev@substrack.test', password: 'dev-only-mock' };
