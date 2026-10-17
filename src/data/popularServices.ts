import type { BillingCycle, Category } from '@/src/types';

export interface PopularService {
  name: string;
  category: Category;
  billingCycle: BillingCycle;
}

/**
 * Quick-pick shortcuts on the add screen. They prefill name, category and cycle
 * only — prices vary by region and plan, so the amount is always the user's.
 */
export const POPULAR_SERVICES: PopularService[] = [
  { name: 'Netflix', category: 'Entertainment', billingCycle: 'monthly' },
  { name: 'Spotify', category: 'Music', billingCycle: 'monthly' },
  { name: 'YouTube Premium', category: 'Entertainment', billingCycle: 'monthly' },
  { name: 'Amazon Prime', category: 'Entertainment', billingCycle: 'yearly' },
  { name: 'Disney+ Hotstar', category: 'Entertainment', billingCycle: 'yearly' },
  { name: 'iCloud+', category: 'Cloud & Storage', billingCycle: 'monthly' },
  { name: 'Google One', category: 'Cloud & Storage', billingCycle: 'monthly' },
  { name: 'ChatGPT Plus', category: 'Software', billingCycle: 'monthly' },
  { name: 'Notion', category: 'Software', billingCycle: 'monthly' },
  { name: 'Gym membership', category: 'Fitness', billingCycle: 'monthly' },
];
