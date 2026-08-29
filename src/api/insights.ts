import { http } from '@/src/api/http';
import type { InsightsResult } from '@/src/types';

export async function fetchInsights(refresh = false): Promise<InsightsResult> {
  const { data } = await http.get<InsightsResult>('/insights', { params: refresh ? { refresh: true } : undefined });
  return data;
}
