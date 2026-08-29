import { useQuery } from '@tanstack/react-query';
import * as api from '@/src/api/analytics';
import type { CurrencyOverview } from '@/src/types';

export function useOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'] as const,
    queryFn: api.fetchOverview,
  });
}

export function useSpendTrend(months: number, currency?: string) {
  return useQuery({
    queryKey: ['analytics', 'spend-trend', months, currency ?? null] as const,
    queryFn: () => api.fetchSpendTrend(months, currency),
    enabled: !!currency,
  });
}

/**
 * The currency the app leads with when a user holds subscriptions in more
 * than one: whichever has the most active subscriptions, matching the old
 * client-side scoping heuristic — but selecting between numbers the backend
 * already computed, not re-deriving them.
 */
export function pickPrimaryCurrency(currencies: CurrencyOverview[]): {
  primary: CurrencyOverview | undefined;
  excludedCount: number;
  excludedCurrencies: string[];
} {
  if (currencies.length === 0) {
    return { primary: undefined, excludedCount: 0, excludedCurrencies: [] };
  }
  const primary = [...currencies].sort((a, b) => b.activeCount - a.activeCount)[0];
  const excluded = currencies.filter((c) => c.currency !== primary.currency);
  return {
    primary,
    excludedCount: excluded.reduce((sum, c) => sum + c.activeCount, 0),
    excludedCurrencies: excluded.map((c) => c.currency),
  };
}
