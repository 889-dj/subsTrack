export type BillingCycle = 'monthly' | 'yearly';

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

/** Where the mandate itself was set up — the app the debit actually runs through. */
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
 * Single source of truth for supported currencies — the add-mandate dropdown
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
  category?: string;
  /** The app or method the mandate runs through, e.g. "Google Pay". */
  source?: string;
  note?: string;
  /** Plan/tier label shown on the detail screen, e.g. "Premium", "Pro". Optional, synthetic. */
  plan?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionInput = Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>;

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
