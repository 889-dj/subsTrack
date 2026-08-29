import type { Subscription } from '@/src/types';

export function monthlyCost(sub: Pick<Subscription, 'cost' | 'billingCycle'>): number {
  return sub.billingCycle === 'yearly' ? sub.cost / 12 : sub.cost;
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

/**
 * Discloses whatever the headline total doesn't show in its own currency:
 * either that it's been converted in (with the live rate date, clearly
 * labelled approximate), or — if conversion wasn't possible — that it's
 * excluded, with its own exact amount rather than just a currency name.
 */
export function formatExcludedCurrenciesNote(
  excluded: { currency: string; monthlyCommitment: string; activeCount: number }[],
  combined?: { approximate: boolean; ratesAsOf: string | null } | null,
): string | undefined {
  if (excluded.length === 0) return undefined;
  const parts = excluded.map(
    (c) =>
      `${formatCompactMoney(Number(c.monthlyCommitment), c.currency)}/mo in ${c.currency} (${c.activeCount} subscription${c.activeCount === 1 ? '' : 's'})`,
  );
  if (combined?.approximate) {
    return `Includes ${parts.join(', ')} — converted at rates as of ${combined.ratesAsOf}, approx.`;
  }
  return `+ ${parts.join(', ')} shown separately`;
}
