import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as api from '@/src/api/analytics';
import type { CurrencyOverview, OverviewResult } from '@/src/types';
import { formatExcludedCurrenciesNote } from '@/src/utils/money';

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
  /** Full per-currency totals for everything not shown as the headline number. */
  excluded: CurrencyOverview[];
} {
  if (currencies.length === 0) {
    return { primary: undefined, excludedCount: 0, excludedCurrencies: [], excluded: [] };
  }
  const primary = [...currencies].sort((a, b) => b.activeCount - a.activeCount)[0];
  const excluded = currencies.filter((c) => c.currency !== primary.currency);
  return {
    primary,
    excludedCount: excluded.reduce((sum, c) => sum + c.activeCount, 0),
    excludedCurrencies: excluded.map((c) => c.currency),
    excluded,
  };
}

/**
 * The one headline monthly/yearly figure a totals card shows, sourced from
 * the backend's `combined` field (all currencies converted into one, via
 * live FX) when available. Falls back to the dominant currency's exact,
 * unconverted total if `combined` is null — e.g. the FX service was down —
 * so the card always shows *something* real rather than a blank state.
 */
export function useSpendHeadline(overview: OverviewResult | undefined) {
  return useMemo(() => {
    const currencies = overview?.currencies ?? [];
    const { primary, excluded } = pickPrimaryCurrency(currencies);
    const combined = overview?.combined ?? null;

    const currency = combined?.currency ?? primary?.currency ?? 'INR';
    const monthly = combined
      ? Number(combined.monthlyCommitment)
      : primary
        ? Number(primary.monthlyCommitment)
        : 0;
    const yearly = combined
      ? Number(combined.annualRunRate)
      : primary
        ? Number(primary.annualRunRate)
        : 0;
    const totalActiveCount = currencies.reduce((sum, c) => sum + c.activeCount, 0);

    return {
      primary,
      excluded,
      combined,
      currency,
      monthly,
      yearly,
      totalActiveCount,
      note: formatExcludedCurrenciesNote(excluded, combined),
    };
  }, [overview]);
}
