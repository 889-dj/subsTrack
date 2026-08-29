import MockAdapter from 'axios-mock-adapter';
import { http } from '@/src/api/http';
import type { AuthResponse, Subscription, SubscriptionInput, User } from '@/src/types';

// Mirrors the REST contract the real backend will expose. Swapping to production
// is just `EXPO_PUBLIC_USE_MOCK_API=false` + `EXPO_PUBLIC_API_URL=<real url>` —
// no changes needed in auth.ts, subscriptions.ts, or any hook/screen.
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false';

interface StoredUser extends User {
  password: string;
  avatarUrl?: string | null;
}

let users: StoredUser[] = [];

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
    status: 'active',
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
    status: 'active',
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
    status: 'active',
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
    status: 'active',
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
    status: 'active',
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
    status: 'active',
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
    status: 'active',
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
    status: 'active',
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

  mock.onDelete('/account').reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    if (!userId) return [401, { message: 'Not authenticated.' }];
    const exists = users.some((user) => user.id === userId);
    if (!exists) return [404, { message: 'Account not found.' }];
    users = users.filter((user) => user.id !== userId);
    return [204];
  });

  mock.onGet('/me').reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    const user = users.find((u) => u.id === userId);
    if (!userId || !user) return [401, { message: 'Not authenticated.' }];
    return [
      200,
      {
        id: user.id,
        email: user.email,
        avatarUrl: user.avatarUrl ?? null,
        isPro: false,
        proUntil: null,
        createdAt: nowIso(),
      },
    ];
  });

  // No real storage in mock mode — echoes back a stable placeholder so the UI
  // has something to render without needing network access to a real host.
  mock.onPost('/me/avatar').reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    const user = users.find((u) => u.id === userId);
    if (!userId || !user) return [401, { message: 'Not authenticated.' }];
    const avatarUrl = `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(user.email)}`;
    user.avatarUrl = avatarUrl;
    return [200, { avatarUrl }];
  });

  mock.onDelete('/me/avatar').reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    const user = users.find((u) => u.id === userId);
    if (!userId || !user) return [401, { message: 'Not authenticated.' }];
    user.avatarUrl = null;
    return [200, { avatarUrl: null }];
  });

  // The real backend calls an external model; mock mode has no such thing to
  // call, so it returns a fixed, clearly-labelled example instead.
  mock.onGet('/insights').reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    if (!userId) return [401, { message: 'Not authenticated.' }];
    if (subscriptions.length === 0) return [200, { insights: [], generatedAt: null }];
    return [
      200,
      {
        insights: ['(Mock data) Entertainment is your largest category this month.'],
        generatedAt: nowIso(),
      },
    ];
  });

  mock.onGet('/subscriptions').reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    if (!userId) return [401, { message: 'Not authenticated.' }];
    return [200, { items: subscriptions, nextCursor: null }];
  });

  mock.onPost('/subscriptions').reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    if (!userId) return [401, { message: 'Not authenticated.' }];
    const input: SubscriptionInput = JSON.parse(config.data);
    const sub: Subscription = {
      ...input,
      id: String(nextSubId++),
      status: 'active',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    subscriptions = [...subscriptions, sub];
    return [201, sub];
  });

  mock.onPost(/\/subscriptions\/[^/]+\/pause$/).reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    if (!userId) return [401, { message: 'Not authenticated.' }];
    const id = config.url!.split('/').at(-2);
    const existing = subscriptions.find((subscription) => subscription.id === id);
    if (!existing) return [404, { message: 'Subscription not found.' }];
    const updated: Subscription = { ...existing, status: 'paused', updatedAt: nowIso() };
    subscriptions = subscriptions.map((subscription) =>
      subscription.id === id ? updated : subscription,
    );
    return [200, updated];
  });

  mock.onPost(/\/subscriptions\/[^/]+\/resume$/).reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    if (!userId) return [401, { message: 'Not authenticated.' }];
    const id = config.url!.split('/').at(-2);
    const existing = subscriptions.find((subscription) => subscription.id === id);
    if (!existing) return [404, { message: 'Subscription not found.' }];
    const updated: Subscription = { ...existing, status: 'active', updatedAt: nowIso() };
    subscriptions = subscriptions.map((subscription) =>
      subscription.id === id ? updated : subscription,
    );
    return [200, updated];
  });

  // Faking the real backend's numbers, not a second source of truth for the
  // app: this math exists only so mock mode (offline dev) has something to
  // return — screens never compute totals themselves in either mode.
  mock.onGet('/analytics/overview').reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    if (!userId) return [401, { message: 'Not authenticated.' }];
    const active = subscriptions.filter((s) => s.status === 'active');
    const grouped = new Map<string, Subscription[]>();
    for (const sub of active) {
      const list = grouped.get(sub.currency) ?? [];
      list.push(sub);
      grouped.set(sub.currency, list);
    }
    const monthlyCostOf = (s: Subscription) => (s.billingCycle === 'yearly' ? s.cost / 12 : s.cost);
    const currencies = [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([currency, items]) => {
        const monthly = items.reduce((sum, s) => sum + monthlyCostOf(s), 0);
        const categoryTotals = new Map<string, number>();
        for (const s of items) {
          const category = s.category || 'Other';
          categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + monthlyCostOf(s));
        }
        return {
          currency,
          monthlyCommitment: monthly.toFixed(2),
          annualRunRate: (monthly * 12).toFixed(2),
          activeCount: items.length,
          currentMonthScheduled: monthly.toFixed(2),
          previousMonthScheduled: monthly.toFixed(2),
          changePercent: '0.00',
          byCategory: [...categoryTotals.entries()]
            .map(([category, amount]) => ({
              category,
              monthlyCommitment: amount.toFixed(2),
              percentage: monthly === 0 ? '0.00' : ((amount / monthly) * 100).toFixed(2),
            }))
            .sort((a, b) => Number(b.monthlyCommitment) - Number(a.monthlyCommitment)),
        };
      });
    return [200, { asOf: nowIso(), currencies }];
  });

  mock.onGet('/analytics/spend-trend').reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    if (!userId) return [401, { message: 'Not authenticated.' }];
    const months = Number(config.params?.months ?? 6);
    const currencyFilter = config.params?.currency as string | undefined;
    const active = subscriptions.filter((s) => s.status === 'active');
    const byCurrency = new Map<string, Subscription[]>();
    for (const s of active) {
      const list = byCurrency.get(s.currency) ?? [];
      list.push(s);
      byCurrency.set(s.currency, list);
    }
    const series = [...byCurrency.entries()]
      .filter(([currency]) => !currencyFilter || currency === currencyFilter)
      .map(([currency, items]) => ({
        currency,
        points: Array.from({ length: months }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() + i);
          const amount = items.reduce((sum, s) => {
            if (s.billingCycle === 'monthly') return sum + s.cost;
            return sum + (i % 12 === 0 ? s.cost : 0);
          }, 0);
          return {
            month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            scheduledAmount: amount.toFixed(2),
            renewalCount: items.length,
          };
        }),
      }));
    return [200, { series }];
  });

  mock.onGet(/\/subscriptions\/[^/]+\/forecast-occurrences$/).reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    if (!userId) return [401, { message: 'Not authenticated.' }];
    const id = config.url!.split('/').at(-2);
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return [404, { message: 'Subscription not found.' }];
    const months = Number(config.params?.months ?? 6);
    const cadenceMonths = sub.billingCycle === 'yearly' ? 12 : 1;
    const end = new Date();
    end.setMonth(end.getMonth() + months);
    const items: { date: string; amount: string; currency: string; estimated: true }[] = [];
    let date = new Date(sub.nextRenewalDate);
    let guard = 0;
    while (date < end && guard < 120) {
      items.push({ date: date.toISOString(), amount: sub.cost.toFixed(2), currency: sub.currency, estimated: true });
      date = new Date(date);
      date.setMonth(date.getMonth() + cadenceMonths);
      guard += 1;
    }
    return [200, { items }];
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
