export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'paused';

export const CATEGORIES = [
  'Entertainment',
  'Music',
  'Software',
  'Cloud & Storage',
  'News & Reading',
  'Fitness',
  'Food & Delivery',
  'Utilities',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Where the subscription payment was set up or is billed. */
export const PAYMENT_APPS = [
  'Google Pay',
  'PhonePe',
  'Paytm',
  'Card',
  'Net Banking',
  'Other',
] as const;

export type PaymentApp = (typeof PAYMENT_APPS)[number];

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

/**
 * Single source of truth for supported currencies — the add-subscription dropdown
 * and the amount symbol lookup both read from this list, so adding a
 * currency is a one-line change here rather than a hunt across the app.
 */
export const CURRENCIES: CurrencyOption[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
];

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  currency: string;
  billingCycle: BillingCycle;
  nextRenewalDate: string; // ISO date string
  /** Best-effort merchant logo image URL, derived server-side from `name`. */
  logoUrl?: string;
  category?: string;
  /** The app or method the subscription is billed through, e.g. "Google Pay". */
  source?: string;
  note?: string;
  /** Plan/tier label shown on the detail screen, e.g. "Premium", "Pro". Optional, synthetic. */
  plan?: string;
  status: SubscriptionStatus;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionInput = Omit<Subscription, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

export interface SubscriptionListResponse {
  items: Subscription[];
  nextCursor: string | null;
}

export interface User {
  id: string;
  email: string;
}

export interface InsightsResult {
  insights: string[];
  generatedAt: string | null;
}

/**
 * Server-computed spend numbers for one currency. Money fields are decimal
 * strings (as the backend serializes them) — parse with Number() at the
 * point of use, never re-derive them from raw subscriptions client-side.
 */
export interface CurrencyOverview {
  currency: string;
  monthlyCommitment: string;
  annualRunRate: string;
  activeCount: number;
  currentMonthScheduled: string;
  previousMonthScheduled: string;
  changePercent: string | null;
  byCategory: { category: string; monthlyCommitment: string; percentage: string }[];
}

export interface CombinedTotal {
  currency: string;
  monthlyCommitment: string;
  annualRunRate: string;
  /** ECB rate date used for conversion, or null when nothing needed converting. */
  ratesAsOf: string | null;
  /** False only when every subscription already shares one currency. */
  approximate: boolean;
}

export interface OverviewResult {
  asOf: string;
  currencies: CurrencyOverview[];
  /** All currencies combined into one figure, or null if FX conversion failed. */
  combined: CombinedTotal | null;
}

export interface TrendPoint {
  month: string; // "YYYY-MM"
  scheduledAmount: string;
  renewalCount: number;
}

export interface CurrencyTrend {
  currency: string;
  points: TrendPoint[];
}

export interface SpendTrendResult {
  series: CurrencyTrend[];
}

export interface ForecastOccurrence {
  date: string;
  amount: string;
  currency: string;
  estimated: true;
}

/** One projected renewal within a calendar month — see GET /v1/subscriptions/calendar. */
export interface CalendarOccurrence {
  subscriptionId: string;
  name: string;
  cost: string;
  currency: string;
  logoUrl: string | null;
  billingCycle: BillingCycle;
  date: string;
}

export interface CalendarOccurrencesResult {
  month: string;
  items: CalendarOccurrence[];
}

export interface AuthResponse {
  token: string;
  user: User;
}
