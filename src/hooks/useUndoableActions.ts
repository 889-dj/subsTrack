import { useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/api/subscriptions';
import { useToast } from '@/src/hooks/useToast';
import { usePauseSubscription, useResumeSubscription } from '@/src/hooks/useSubscriptions';
import type { Subscription } from '@/src/types';

const subscriptionsKey = ['subscriptions'] as const;

/**
 * Remove and pause/resume with an Undo snackbar instead of a confirm dialog
 * (NN/g: undo beats confirmation for recoverable changes). Removal is
 * optimistic — the row leaves every list at once — and the real DELETE only
 * fires when the toast expires, so Undo is a cache refetch, not a re-create.
 */
export function useUndoableActions() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const pauseMutation = usePauseSubscription();
  const resumeMutation = useResumeSubscription();

  function remove(sub: Subscription) {
    queryClient.setQueryData<Subscription[]>(subscriptionsKey, (old) =>
      old?.filter((item) => item.id !== sub.id),
    );
    toast.show({
      message: `${sub.name} removed from SubsTrack`,
      actionLabel: 'Undo',
      onAction: () => queryClient.invalidateQueries({ queryKey: subscriptionsKey }),
      // Direct API call: the screen that started this (e.g. Detail) may be gone by
      // the time the toast expires, so don't hang the DELETE on a mounted hook.
      onExpire: () => {
        api
          .deleteSubscription(sub.id)
          .catch(() => undefined)
          .finally(() => {
            queryClient.invalidateQueries({ queryKey: subscriptionsKey });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
            queryClient.invalidateQueries({ queryKey: ['insights'] });
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
          });
      },
    });
  }

  function setPaused(sub: Subscription, paused: boolean) {
    const forward = paused ? pauseMutation : resumeMutation;
    const backward = paused ? resumeMutation : pauseMutation;
    forward.mutate(sub.id, {
      onSuccess: () =>
        toast.show({
          message: paused ? `${sub.name} paused — out of your totals` : `${sub.name} resumed`,
          actionLabel: 'Undo',
          onAction: () => backward.mutate(sub.id),
        }),
      onError: () => toast.show({ message: `Couldn't update ${sub.name}. Try again.` }),
    });
  }

  return { remove, setPaused };
}
