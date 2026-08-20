import type { Subscription } from '@/src/types';
import { monthlyCost, monthlyTotal } from '@/src/utils/money';

const DAY = 24 * 60 * 60 * 1000;

/** Midnight-normalised timestamp for a subscription's next renewal. */
function renewalTime(sub: Subscription): number {
  return new Date(sub.nextRenewalDate).getTime();
}

/** Annual spend grouped by category, biggest first. */
export function spendByCategory(subs: Subscription[]): { category: string; amount: number }[] {
  const totals = new Map<string, number>();
  for (const sub of subs) {
    const key = sub.category ?? 'Other';
    totals.set(key, (totals.get(key) ?? 0) + monthlyCost(sub) * 12);
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export interface RenewalGroup {
  dateKey: string; // yyyy-mm-dd
  date: Date;
  subs: Subscription[];
  total: number;
}

export interface RenewalForecastPoint {
  monthKey: string;
  label: string;
  amount: number;
  count: number;
}

function addRenewalCycle(date: Date, cycle: Subscription['billingCycle']): Date {
  const targetMonth = date.getMonth() + (cycle === 'monthly' ? 1 : 12);
  const lastDay = new Date(date.getFullYear(), targetMonth + 1, 0).getDate();
  return new Date(
    date.getFullYear(),
    targetMonth,
    Math.min(date.getDate(), lastDay),
    12,
  );
}

/**
 * Actual charges expected in each future calendar month, derived from the
 * stored renewal date and billing cadence. This is a forecast, not invented
 * transaction history.
 */
export function renewalForecast(
  subs: Subscription[],
  months: number,
  from = new Date(),
): RenewalForecastPoint[] {
  const start = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(start.getFullYear(), start.getMonth() + months, 1);
  const points = Array.from({ length: months }, (_, index) => {
    const month = new Date(start.getFullYear(), start.getMonth() + index, 1);
    return {
      monthKey: `${month.getFullYear()}-${month.getMonth()}`,
      label: month.toLocaleDateString('en-IN', { month: 'short' }),
      amount: 0,
      count: 0,
    };
  });

  for (const sub of subs) {
    let renewal = new Date(sub.nextRenewalDate);
    if (Number.isNaN(renewal.getTime())) continue;

    // Old renewal dates can remain in local/mock data. Roll them forward to
    // the visible window without ever fabricating a charge in the past.
    let guard = 0;
    while (renewal < start && guard < 240) {
      renewal = addRenewalCycle(renewal, sub.billingCycle);
      guard += 1;
    }

    while (renewal < end && guard < 300) {
      const index =
        (renewal.getFullYear() - start.getFullYear()) * 12 +
        renewal.getMonth() -
        start.getMonth();
      const point = points[index];
      if (point) {
        point.amount += sub.cost;
        point.count += 1;
      }
      renewal = addRenewalCycle(renewal, sub.billingCycle);
      guard += 1;
    }
  }

  return points;
}

/**
 * Subscriptions grouped by calendar day of next renewal, sorted by date. This
 * is the source of truth for both the multi-renewal badge on Overview/
 * Calendar and the bottom sheet that lists everything due that day.
 */
export function groupByRenewalDate(subs: Subscription[]): RenewalGroup[] {
  const groups = new Map<string, Subscription[]>();
  for (const sub of subs) {
    const d = new Date(sub.nextRenewalDate);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const list = groups.get(key) ?? [];
    list.push(sub);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .map(([dateKey, list]) => ({
      dateKey,
      date: new Date(list[0].nextRenewalDate),
      subs: list.sort((a, b) => renewalTime(a) - renewalTime(b)),
      total: list.reduce((sum, s) => sum + s.cost, 0),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Subscriptions renewing within the next `days` days, soonest first. */
export function upcoming(subs: Subscription[], days = 30): Subscription[] {
  const now = Date.now();
  const cutoff = now + days * DAY;
  return [...subs]
    .filter((s) => renewalTime(s) <= cutoff)
    .sort((a, b) => renewalTime(a) - renewalTime(b));
}

/** "Today" / "Tomorrow" / "Aug 18" style relative label. */
export function relativeDateLabel(iso: string): string {
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / DAY);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < 0) return `${Math.abs(diffDays)}d ago`;
  if (diffDays < 7) return `In ${diffDays}d`;
  return target.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Synthesized past charges for the detail screen — cadence derived from billing cycle. */
export function synthesizePaymentHistory(
  sub: Subscription,
  count = 3
): { date: string; amount: number }[] {
  const intervalDays = sub.billingCycle === 'yearly' ? 365 : 30;
  const next = new Date(sub.nextRenewalDate).getTime();
  const history: { date: string; amount: number }[] = [];
  for (let i = 1; i <= count; i++) {
    const t = next - intervalDays * i * DAY;
    if (t > Date.now()) continue; // don't show "past" payments still in the future
    history.push({ date: new Date(t).toISOString(), amount: sub.cost });
  }
  return history;
}

export { monthlyCost, monthlyTotal };
