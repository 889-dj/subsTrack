import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/api/insights';

const insightsKey = ['insights'] as const;

/**
 * Cheap on the client: the backend caches per-user for hours, so this is a
 * lightweight query on top of that, not a fresh model call every mount.
 */
export function useInsights() {
  return useQuery({
    queryKey: insightsKey,
    queryFn: () => api.fetchInsights(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRefreshInsights() {
  const queryClient = useQueryClient();
  return async () => {
    const result = await api.fetchInsights(true);
    queryClient.setQueryData(insightsKey, result);
    return result;
  };
}
