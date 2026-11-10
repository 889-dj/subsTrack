/**
 * Local-only "Dev login" on the login screen. Visible in dev builds only
 * (`__DEV__` is false in every release build, so this can never ship).
 *
 * Tapping it installs the in-memory mock API at runtime and signs in a
 * throwaway user, regardless of how the app was started. No env flag needed.
 */
export const DEV_LOGIN_ENABLED = __DEV__;

/**
 * Mock API is opt-in and dev-only: it needs a dev build (`__DEV__`) AND
 * EXPO_PUBLIC_USE_MOCK_API="true". Release builds can never run the mock, even
 * if the variable is missing or set to "true" by mistake.
 */
export const USE_MOCK_API = __DEV__ && process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';

/** Throwaway credentials for the in-memory mock only. */
export const DEV_USER = { email: 'dev@substrack.test', password: 'dev-only-mock' };
