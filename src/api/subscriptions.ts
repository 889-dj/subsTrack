import { http } from '@/src/api/http';
import type {
  ForecastOccurrence,
  Subscription,
  SubscriptionInput,
  SubscriptionListResponse,
} from '@/src/types';

export async function fetchSubscriptions(): Promise<Subscription[]> {
  const { data } = await http.get<SubscriptionListResponse>('/subscriptions');
  return data.items;
}

export async function fetchSubscription(id: string): Promise<Subscription> {
  const { data } = await http.get<Subscription>(`/subscriptions/${id}`);
  return data;
}

export async function createSubscription(input: SubscriptionInput): Promise<Subscription> {
  const { data } = await http.post<Subscription>('/subscriptions', input);
  return data;
}

export async function updateSubscription(
  id: string,
  input: Partial<SubscriptionInput>
): Promise<Subscription> {
  const { data } = await http.patch<Subscription>(`/subscriptions/${id}`, input);
  return data;
}

export async function deleteSubscription(id: string): Promise<void> {
  await http.delete(`/subscriptions/${id}`);
}

export async function pauseSubscription(id: string): Promise<Subscription> {
  const { data } = await http.post<Subscription>(`/subscriptions/${id}/pause`);
  return data;
}

export async function resumeSubscription(id: string): Promise<Subscription> {
  const { data } = await http.post<Subscription>(`/subscriptions/${id}/resume`, {});
  return data;
}

export async function fetchForecastOccurrences(
  id: string,
  months = 6,
): Promise<ForecastOccurrence[]> {
  const { data } = await http.get<{ items: ForecastOccurrence[] }>(
    `/subscriptions/${id}/forecast-occurrences`,
    { params: { months } },
  );
  return data.items;
}
