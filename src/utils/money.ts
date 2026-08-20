import type { Subscription } from '@/src/types';

export function monthlyCost(sub: Pick<Subscription, 'cost' | 'billingCycle'>): number {
  return sub.billingCycle === 'yearly' ? sub.cost / 12 : sub.cost;
}

export function monthlyTotal(subs: Subscription[]): number {
  return subs.reduce((sum, sub) => sum + monthlyCost(sub), 0);
}

/**
 * Financial totals are only meaningful inside one currency. Until the app has
 * an exchange-rate service and a user-selected base currency, scope summary
 * cards and charts to the most common currency and disclose what was omitted.
 */
export function scopeSubscriptionsByCurrency(subs: Subscription[]) {
  if (subs.length === 0) {
    return {
      currency: 'INR',
      included: [] as Subscription[],
      excludedCount: 0,
      excludedCurrencies: [] as string[],
    };
  }

  const counts = new Map<string, number>();
  for (const sub of subs) counts.set(sub.currency, (counts.get(sub.currency) ?? 0) + 1);

  const currency = [...counts.entries()].sort((left, right) => right[1] - left[1])[0][0];
  const included = subs.filter((sub) => sub.currency === currency);
  const excluded = subs.filter((sub) => sub.currency !== currency);

  return {
    currency,
    included,
    excludedCount: excluded.length,
    excludedCurrencies: [...new Set(excluded.map((sub) => sub.currency))],
  };
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

export function formatCompactMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
    return `${symbol}${Math.round(amount).toLocaleString('en-IN')}`;
  }
}
