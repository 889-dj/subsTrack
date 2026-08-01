import { http } from '@/src/api/http';
import type { Subscription, SubscriptionInput } from '@/src/types';

export async function fetchSubscriptions(): Promise<Subscription[]> {
  const { data } = await http.get<Subscription[]>('/subscriptions');
  return data;
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
