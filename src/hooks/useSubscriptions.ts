import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/api/subscriptions';
import type { Subscription, SubscriptionInput } from '@/src/types';

const subscriptionsKey = ['subscriptions'] as const;
const subscriptionKey = (id: string) => ['subscriptions', id] as const;

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

export function useAddSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubscriptionInput) => api.createSubscription(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionsKey });
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SubscriptionInput> }) =>
      api.updateSubscription(id, input),
    onSuccess: (updated: Subscription) => {
      queryClient.invalidateQueries({ queryKey: subscriptionsKey });
      queryClient.invalidateQueries({ queryKey: subscriptionKey(updated.id) });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionsKey });
    },
  });
}
