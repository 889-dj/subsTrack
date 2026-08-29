import { useEffect, useRef } from 'react';
import * as api from '@/src/api/me';
import { useAuth } from '@/src/hooks/useAuth';
import { registerForPushNotifications } from '@/src/lib/notifications';

/**
 * Fire-and-forget: registers this device's Expo push token with the backend
 * once per signed-in session. Silent on a simulator, denied permission, or a
 * dev-client binary built before expo-notifications was added — none of
 * those are errors worth surfacing to the user for a background reminder
 * feature, so this never throws or blocks rendering.
 */
export function usePushNotifications(): void {
  const { isAuthenticated } = useAuth();
  const attempted = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || attempted.current) return;
    attempted.current = true;

    registerForPushNotifications().then((outcome) => {
      if (outcome.status !== 'registered') return;
      api.registerPushToken(outcome.token).catch(() => {
        // Retried next app session — losing one reminder cycle isn't worth
        // a retry loop for a background, non-critical feature.
      });
    });
  }, [isAuthenticated]);
}
