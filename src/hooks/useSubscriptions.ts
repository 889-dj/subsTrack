import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/api/subscriptions';
import type { Subscription, SubscriptionInput } from '@/src/types';

const subscriptionsKey = ['subscriptions'] as const;
const subscriptionKey = (id: string) => ['subscriptions', id] as const;

/**
 * Every mutation below changes numbers the backend computes separately —
 * /v1/analytics/overview, /v1/analytics/spend-trend, /v1/insights all read
 * the subscriptions table themselves, so they go stale right alongside the
 * subscriptions list and need invalidating together, not just the list.
 */
function invalidateSpendQueries(queryClient: ReturnType<typeof useQueryClient>): void {
  queryClient.invalidateQueries({ queryKey: subscriptionsKey });
  queryClient.invalidateQueries({ queryKey: ['analytics'] });
  queryClient.invalidateQueries({ queryKey: ['insights'] });
  queryClient.invalidateQueries({ queryKey: ['calendar'] });
}

export function useSubscriptions() {
  return useQuery({
    queryKey: subscriptionsKey,
    queryFn: api.fetchSubscriptions,
  });
}

export function useSubscription(id: string | undefined) {
  return useQuery({
    queryKey: subscriptionKey(id ?? ''),
    queryFn: () => api.fetchSubscription(id!),
    enabled: !!id,
  });
}

export function useForecastOccurrences(id: string | undefined, months = 6) {
  return useQuery({
    queryKey: [...subscriptionKey(id ?? ''), 'forecast-occurrences', months] as const,
    queryFn: () => api.fetchForecastOccurrences(id!, months),
    enabled: !!id,
  });
}

/** @param month "YYYY-MM" — every renewal occurrence in that calendar month, across all subscriptions. */
export function useCalendarOccurrences(month: string) {
  return useQuery({
    queryKey: ['calendar', month] as const,
    queryFn: () => api.fetchCalendarOccurrences(month),
  });
}

export function useAddSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubscriptionInput) => api.createSubscription(input),
    onSuccess: () => {
      invalidateSpendQueries(queryClient);
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SubscriptionInput> }) =>
      api.updateSubscription(id, input),
    onSuccess: (updated: Subscription) => {
      invalidateSpendQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: subscriptionKey(updated.id) });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteSubscription(id),
    onSuccess: () => {
      invalidateSpendQueries(queryClient);
    },
  });
}

function useStatusMutation(action: 'pause' | 'resume') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      action === 'pause' ? api.pauseSubscription(id) : api.resumeSubscription(id),
    onSuccess: (updated: Subscription) => {
      invalidateSpendQueries(queryClient);
      queryClient.setQueryData(subscriptionKey(updated.id), updated);
    },
  });
}

export function usePauseSubscription() {
  return useStatusMutation('pause');
}

export function useResumeSubscription() {
  return useStatusMutation('resume');
}
