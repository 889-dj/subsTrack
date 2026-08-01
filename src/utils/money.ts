import type { Subscription } from '@/src/types';

export function monthlyCost(sub: Pick<Subscription, 'cost' | 'billingCycle'>): number {
  return sub.billingCycle === 'yearly' ? sub.cost / 12 : sub.cost;
}

export function monthlyTotal(subs: Subscription[]): number {
  return subs.reduce((sum, sub) => sum + monthlyCost(sub), 0);
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export function formatMoney(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  return `${symbol}${amount.toFixed(2)}`;
}
