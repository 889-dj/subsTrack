import { useEffect, useRef } from 'react';
import { useRootNavigationState, useRouter } from 'expo-router';
import * as api from '@/src/api/me';
import { useAuth } from '@/src/hooks/useAuth';
import {
  configureForegroundNotifications,
  registerForPushNotifications,
  subscribeToNotificationTaps,
} from '@/src/lib/notifications';

/**
 * Fire-and-forget: registers this device's Expo push token with the backend
 * once per signed-in session, shows reminders that arrive while the app is
 * open, and opens the subscription a tapped reminder is about. Silent on a
 * simulator, denied permission, or a dev-client binary built before
 * expo-notifications was added — none of those are errors worth surfacing to
 * the user for a background reminder feature, so this never throws or blocks
 * rendering.
 */
export function usePushNotifications(): void {
  const { isAuthenticated } = useAuth();
  const attempted = useRef(false);
  const router = useRouter();
  const navigationReady = Boolean(useRootNavigationState()?.key);

  useEffect(() => {
    configureForegroundNotifications();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || attempted.current) return;
    attempted.current = true;

    registerForPushNotifications()
      .then((outcome) => {
        if (outcome.status !== 'registered') return;
        api.registerPushToken(outcome.token).catch(() => {
          // Retried next app session — losing one reminder cycle isn't worth
          // a retry loop for a background, non-critical feature.
        });
      })
      .catch(() => {
        // Belt-and-braces: registerForPushNotifications() already catches
        // everything internally, but an unhandled rejection here would
        // otherwise surface as a fatal error in the root layout.
      });
  }, [isAuthenticated]);

  // Taps are only acted on once signed in and the router has mounted: a
  // cold-start tap would otherwise navigate before there is a navigator (or
  // before the auth redirect), and the push would be lost.
  useEffect(() => {
    if (!isAuthenticated || !navigationReady) return;
    return subscribeToNotificationTaps((data) => {
      const id = data.subscriptionId;
      if (typeof id === 'string' && id.length > 0) router.push(`/${id}`);
    });
  }, [isAuthenticated, navigationReady, router]);
}
