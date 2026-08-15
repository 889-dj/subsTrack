import MockAdapter from 'axios-mock-adapter';
import { http } from '@/src/api/http';
import type { AuthResponse, Subscription, SubscriptionInput, User } from '@/src/types';

// Mirrors the REST contract the real backend will expose. Swapping to production
// is just `EXPO_PUBLIC_USE_MOCK_API=false` + `EXPO_PUBLIC_API_URL=<real url>` —
// no changes needed in auth.ts, subscriptions.ts, or any hook/screen.
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false';

interface StoredUser extends User {
  password: string;
}

const users: StoredUser[] = [];

/** ISO date `daysFromNow` days from "today", at a fixed time so renders are stable. */
function inDays(daysFromNow: number): string {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

function daysAgo(n: number): string {
  return inDays(-n);
}

/**
 * Seeded so the app looks populated the moment a user logs in — a spread of
 * categories, currencies, and a shared renewal date (Netflix + Spotify both
 * land on day 4) to exercise the multi-renewal UI without any user input.
 */
let subscriptions: Subscription[] = [
  {
    id: '1',
    name: 'Netflix',
    cost: 649,
    currency: 'INR',
    billingCycle: 'monthly',
    nextRenewalDate: inDays(4),
    category: 'Entertainment',
    source: 'Card',
    plan: 'Premium',
    createdAt: daysAgo(280),
    updatedAt: daysAgo(30),
  },
  {
    id: '2',
    name: 'Spotify',
    cost: 119,
    currency: 'INR',
    billingCycle: 'monthly',
    nextRenewalDate: inDays(4),
    category: 'Music',
    source: 'Google Pay',
    plan: 'Individual',
    createdAt: daysAgo(400),
    updatedAt: daysAgo(60),
  },
  {
    id: '3',
    name: 'Figma',
    cost: 12,
    currency: 'USD',
    billingCycle: 'monthly',
    nextRenewalDate: inDays(9),
    category: 'Software',
    source: 'Card',
    plan: 'Professional',
    createdAt: daysAgo(200),
    updatedAt: daysAgo(20),
  },
  {
    id: '4',
    name: 'YouTube Premium',
    cost: 149,
    currency: 'INR',
    billingCycle: 'monthly',
    nextRenewalDate: inDays(2),
    category: 'Entertainment',
    source: 'Google Pay',
    plan: 'Individual',
    createdAt: daysAgo(150),
    updatedAt: daysAgo(15),
  },
  {
    id: '5',
    name: 'Notion',
    cost: 8,
    currency: 'USD',
    billingCycle: 'monthly',
    nextRenewalDate: inDays(14),
    category: 'Software',
    source: 'Card',
    plan: 'Plus',
    createdAt: daysAgo(100),
    updatedAt: daysAgo(10),
  },
  {
    id: '6',
    name: 'Adobe Creative Cloud',
    cost: 52.99,
    currency: 'USD',
    billingCycle: 'monthly',
    nextRenewalDate: inDays(21),
    category: 'Software',
    source: 'Card',
    plan: 'All Apps',
    createdAt: daysAgo(500),
    updatedAt: daysAgo(45),
  },
  {
    id: '7',
    name: 'Dropbox',
    cost: 1499,
    currency: 'INR',
    billingCycle: 'yearly',
    nextRenewalDate: inDays(45),
    category: 'Cloud & Storage',
    source: 'Net Banking',
    plan: 'Plus',
    createdAt: daysAgo(320),
    updatedAt: daysAgo(90),
  },
  {
    id: '8',
    name: 'ChatGPT',
    cost: 20,
    currency: 'USD',
    billingCycle: 'monthly',
    nextRenewalDate: inDays(7),
    category: 'Software',
    source: 'Card',
    plan: 'Plus',
    createdAt: daysAgo(60),
    updatedAt: daysAgo(5),
  },
];
let nextSubId = subscriptions.length + 1;
let nextUserId = 1;

function tokenFor(user: User): string {
  return `mock-token.${user.id}.${Date.now()}`;
}

function userIdFromToken(token: string | undefined): string | null {
  if (!token) return null;
  const match = token.match(/^Bearer mock-token\.([^.]+)\./);
  return match ? match[1] : null;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function setupMockApi(): void {
  if (!USE_MOCK) return;

  const mock = new MockAdapter(http, { delayResponse: 500 });

  mock.onPost('/auth/register').reply((config) => {
    const { email, password } = JSON.parse(config.data);
    if (!email || !password) return [400, { message: 'Email and password are required.' }];
    if (users.some((u) => u.email === email)) {
      return [409, { message: 'An account with this email already exists.' }];
    }
    const user: StoredUser = { id: String(nextUserId++), email, password };
    users.push(user);
    const response: AuthResponse = { token: tokenFor(user), user: { id: user.id, email: user.email } };
    return [201, response];
  });

  mock.onPost('/auth/login').reply((config) => {
    const { email, password } = JSON.parse(config.data);
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) return [401, { message: 'Invalid email or password.' }];
    const response: AuthResponse = { token: tokenFor(user), user: { id: user.id, email: user.email } };
    return [200, response];
  });

  mock.onGet('/subscriptions').reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    if (!userId) return [401, { message: 'Not authenticated.' }];
    return [200, subscriptions];
  });

  mock.onPost('/subscriptions').reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    if (!userId) return [401, { message: 'Not authenticated.' }];
    const input: SubscriptionInput = JSON.parse(config.data);
    const sub: Subscription = {
      ...input,
      id: String(nextSubId++),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    subscriptions = [...subscriptions, sub];
    return [201, sub];
  });

  mock.onGet(/\/subscriptions\/.+/).reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    if (!userId) return [401, { message: 'Not authenticated.' }];
    const id = config.url!.split('/').pop();
    const sub = subscriptions.find((s) => s.id === id);
    return sub ? [200, sub] : [404, { message: 'Subscription not found.' }];
  });

  mock.onPatch(/\/subscriptions\/.+/).reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    if (!userId) return [401, { message: 'Not authenticated.' }];
    const id = config.url!.split('/').pop();
    const existing = subscriptions.find((s) => s.id === id);
    if (!existing) return [404, { message: 'Subscription not found.' }];
    const updates: Partial<SubscriptionInput> = JSON.parse(config.data);
    const updated: Subscription = { ...existing, ...updates, updatedAt: nowIso() };
    subscriptions = subscriptions.map((s) => (s.id === id ? updated : s));
    return [200, updated];
  });

  mock.onDelete(/\/subscriptions\/.+/).reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    if (!userId) return [401, { message: 'Not authenticated.' }];
    const id = config.url!.split('/').pop();
    const exists = subscriptions.some((s) => s.id === id);
    if (!exists) return [404, { message: 'Subscription not found.' }];
    subscriptions = subscriptions.filter((s) => s.id !== id);
    return [204];
  });

}
