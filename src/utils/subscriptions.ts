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

/**
 * A plausible cumulative-spend trend ending at the current monthly total —
 * there's no real spend history in the mock backend, so this synthesizes a
 * gently rising curve seeded from the subscription count so it varies
 * per-account without being random on every render.
 */
export function synthesizeSpendTrend(subs: Subscription[], points = 12): number[] {
  const total = monthlyTotal(subs);
  if (total <= 0 || subs.length === 0) return Array(points).fill(0);

  let seed = subs.reduce((acc, s) => acc + s.name.length + s.cost, 7);
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const values: number[] = [];
  for (let i = 0; i < points; i++) {
    const progress = (i + 1) / points;
    // Rising curve with a touch of noise, always ending exactly at `total`.
    const base = total * (0.35 + 0.65 * progress);
    const noise = (rand() - 0.5) * total * 0.08;
    values.push(Math.max(total * 0.15, base + noise));
  }
  values[values.length - 1] = total;
  return values;
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
