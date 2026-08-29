import { http } from '@/src/api/http';
import type { OverviewResult, SpendTrendResult } from '@/src/types';

export async function fetchOverview(): Promise<OverviewResult> {
  const { data } = await http.get<OverviewResult>('/analytics/overview');
  return data;
}

export async function fetchSpendTrend(months: number, currency?: string): Promise<SpendTrendResult> {
  const { data } = await http.get<SpendTrendResult>('/analytics/spend-trend', {
    params: { months, ...(currency ? { currency } : {}) },
  });
  return data;
}
