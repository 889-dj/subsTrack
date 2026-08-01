import MockAdapter from 'axios-mock-adapter';
import { http } from '@/src/api/http';
import type {
  AuthResponse,
  Category,
  ConfirmDetectionsResponse,
  DetectedSubscription,
  ReviewedDetection,
  Statement,
  Subscription,
  SubscriptionInput,
  User,
} from '@/src/types';

// Mirrors the REST contract the real backend will expose. Swapping to production
// is just `EXPO_PUBLIC_USE_MOCK_API=false` + `EXPO_PUBLIC_API_URL=<real url>` —
// no changes needed in auth.ts, subscriptions.ts, statements.ts, or any hook/screen.
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false';

interface StoredUser extends User {
  password: string;
}

const users: StoredUser[] = [];
let subscriptions: Subscription[] = [];
let nextSubId = 1;
let nextUserId = 1;

const statements = new Map<string, Statement>();
const detectionsByStatement = new Map<string, DetectedSubscription[]>();
let nextStatementId = 1;

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

/**
 * Pulls the uploaded file's name out of the request body. React Native's
 * FormData keeps parts on a private `_parts` array; the web one implements the
 * real `get()` API and yields a File.
 */
function fileNameFromForm(data: unknown): string {
  const fallback = 'statement.pdf';
  if (!data) return fallback;

  const rnParts = (data as { _parts?: [string, { name?: string }][] })._parts;
  if (Array.isArray(rnParts)) {
    return rnParts.find(([key]) => key === 'file')?.[1]?.name ?? fallback;
  }

  if (typeof (data as FormData).get === 'function') {
    const part = (data as FormData).get('file');
    if (part && typeof part === 'object' && 'name' in part) {
      return (part as File).name || fallback;
    }
  }

  return fallback;
}

// --- Fake statement analysis -------------------------------------------------

/**
 * Stands in for what the AI will return: a merchant descriptor as it appears on
 * an Indian bank statement, plus the cleaned name, category, and confidence the
 * model would assign it.
 */
interface MerchantFixture {
  name: string;
  rawDescriptor: string;
  cost: number;
  billingCycle: 'monthly' | 'yearly';
  category: Category;
  confidence: number;
}

const MERCHANT_FIXTURES: MerchantFixture[] = [
  {
    name: 'Netflix',
    rawDescriptor: 'UPI/NETFLIX ENTERTAINMENT/PAYTM',
    cost: 649,
    billingCycle: 'monthly',
    category: 'Entertainment',
    confidence: 0.98,
  },
  {
    name: 'Spotify',
    rawDescriptor: 'UPI/SPOTIFY INDIA/HDFCBANK',
    cost: 119,
    billingCycle: 'monthly',
    category: 'Music',
    confidence: 0.96,
  },
  {
    name: 'Amazon Prime',
    rawDescriptor: 'AMZN PRIME IN*4T21Q',
    cost: 1499,
    billingCycle: 'yearly',
    category: 'Entertainment',
    confidence: 0.94,
  },
  {
    name: 'Google One',
    rawDescriptor: 'GOOGLE*ONE 200GB g.co/helppay',
    cost: 130,
    billingCycle: 'monthly',
    category: 'Cloud & Storage',
    confidence: 0.91,
  },
  {
    name: 'Adobe Creative Cloud',
    rawDescriptor: 'ADOBE SYSTEMS SOFTWARE IE',
    cost: 4230,
    billingCycle: 'monthly',
    category: 'Software',
    confidence: 0.89,
  },
  {
    name: 'Cult.fit',
    rawDescriptor: 'UPI/CUREFIT HEALTHCARE/ICICI',
    cost: 1250,
    billingCycle: 'monthly',
    category: 'Fitness',
    confidence: 0.82,
  },
  {
    name: 'Swiggy One',
    rawDescriptor: 'UPI/SWIGGY ONE MEMBERSHIP',
    cost: 199,
    billingCycle: 'monthly',
    category: 'Food & Delivery',
    confidence: 0.76,
  },
  {
    name: 'The Ken',
    rawDescriptor: 'RAZ*THE KEN SUBSCRIPTION',
    cost: 2750,
    billingCycle: 'yearly',
    category: 'News & Reading',
    confidence: 0.68,
  },
];

/** Monthly charges land on the same day each month; yearly ones a year apart. */
function occurrencesFor(cycle: 'monthly' | 'yearly', anchorDay: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  const count = cycle === 'monthly' ? 3 : 2;
  for (let i = count; i >= 1; i--) {
    const d = new Date(today);
    if (cycle === 'monthly') {
      d.setMonth(d.getMonth() - i);
    } else {
      d.setFullYear(d.getFullYear() - i);
    }
    d.setDate(anchorDay);
    dates.push(d.toISOString());
  }
  return dates;
}

function nextRenewalFrom(occurrences: string[], cycle: 'monthly' | 'yearly'): string {
  const last = new Date(occurrences[occurrences.length - 1]);
  const next = new Date(last);
  if (cycle === 'monthly') {
    // Advance month-by-month until it lands in the future.
    while (next.getTime() <= Date.now()) {
      next.setMonth(next.getMonth() + 1);
    }
  } else {
    while (next.getTime() <= Date.now()) {
      next.setFullYear(next.getFullYear() + 1);
    }
  }
  return next.toISOString();
}

/**
 * Picks a stable-but-varied subset of the fixtures so two uploads don't look
 * identical, and marks anything already in the user's list as tracked.
 */
function analyzeStatement(statementId: string): DetectedSubscription[] {
  const seed = Number(statementId);
  const count = 5 + (seed % 3); // 5-7 detections
  const picked = MERCHANT_FIXTURES.slice(0, count);

  return picked.map((fixture, index) => {
    const anchorDay = 3 + ((seed + index * 5) % 25);
    const occurrences = occurrencesFor(fixture.billingCycle, anchorDay);
    return {
      id: `${statementId}-${index + 1}`,
      statementId,
      name: fixture.name,
      rawDescriptor: fixture.rawDescriptor,
      cost: fixture.cost,
      currency: 'INR',
      billingCycle: fixture.billingCycle,
      nextRenewalDate: nextRenewalFrom(occurrences, fixture.billingCycle),
      category: fixture.category,
      confidence: fixture.confidence,
      occurrences,
      alreadyTracked: subscriptions.some(
        (s) => s.name.toLowerCase() === fixture.name.toLowerCase()
      ),
    };
  });
}

/**
 * Walks a statement through parsing -> analyzing -> ready on a timer, so the
 * upload screen has real progress to render while the backend is being built.
 */
function runAnalysisPipeline(statementId: string): void {
  const steps: { at: number; apply: (s: Statement) => void }[] = [
    { at: 400, apply: (s) => Object.assign(s, { status: 'parsing', progress: 0.15 }) },
    {
      at: 1400,
      apply: (s) => Object.assign(s, { progress: 0.45, transactionCount: 128 + (Number(s.id) % 40) }),
    },
    { at: 2200, apply: (s) => Object.assign(s, { status: 'analyzing', progress: 0.7 }) },
    {
      at: 3400,
      apply: (s) => {
        const detections = analyzeStatement(s.id);
        detectionsByStatement.set(s.id, detections);
        Object.assign(s, {
          status: 'ready',
          progress: 1,
          detectedCount: detections.length,
        });
      },
    },
  ];

  for (const step of steps) {
    setTimeout(() => {
      const statement = statements.get(statementId);
      if (statement && statement.status !== 'failed') step.apply(statement);
    }, step.at);
  }
}

// -----------------------------------------------------------------------------

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
      source: input.source ?? 'manual',
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

  // --- Statements ------------------------------------------------------------

  mock.onPost('/statements').reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    if (!userId) return [401, { message: 'Not authenticated.' }];

    const id = String(nextStatementId++);
    const statement: Statement = {
      id,
      fileName: fileNameFromForm(config.data),
      fileSize: 0,
      status: 'parsing',
      progress: 0.05,
      transactionCount: 0,
      detectedCount: 0,
      uploadedAt: nowIso(),
    };
    statements.set(id, statement);
    runAnalysisPipeline(id);
    return [201, statement];
  });

  mock.onGet(/\/statements\/[^/]+$/).reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    if (!userId) return [401, { message: 'Not authenticated.' }];
    const id = config.url!.split('/').pop()!;
    const statement = statements.get(id);
    return statement ? [200, statement] : [404, { message: 'Statement not found.' }];
  });

  mock.onGet(/\/statements\/[^/]+\/detections$/).reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    if (!userId) return [401, { message: 'Not authenticated.' }];
    const id = config.url!.split('/')[2];
    const statement = statements.get(id);
    if (!statement) return [404, { message: 'Statement not found.' }];
    if (statement.status !== 'ready') {
      return [409, { message: 'Statement is still being analyzed.' }];
    }
    return [200, detectionsByStatement.get(id) ?? []];
  });

  mock.onPost(/\/statements\/[^/]+\/confirm$/).reply((config) => {
    const userId = userIdFromToken(config.headers?.Authorization);
    if (!userId) return [401, { message: 'Not authenticated.' }];
    const id = config.url!.split('/')[2];
    const statement = statements.get(id);
    if (!statement) return [404, { message: 'Statement not found.' }];

    const { detections } = JSON.parse(config.data) as { detections: ReviewedDetection[] };
    const detected = detectionsByStatement.get(id) ?? [];

    const created: Subscription[] = [];
    let skipped = 0;

    for (const reviewed of detections) {
      const original = detected.find((d) => d.id === reviewed.id);
      // Unknown ids, and charges the user already tracks, never create a record —
      // the review screen promises as much on the row itself.
      const isDuplicate = subscriptions.some(
        (s) => s.name.toLowerCase() === reviewed.name.trim().toLowerCase()
      );
      if (!original || isDuplicate) {
        skipped++;
        continue;
      }
      const sub: Subscription = {
        id: String(nextSubId++),
        name: reviewed.name,
        cost: reviewed.cost,
        currency: original.currency,
        billingCycle: reviewed.billingCycle,
        nextRenewalDate: original.nextRenewalDate,
        category: reviewed.category,
        note: `Detected from ${statement.fileName}`,
        source: 'statement',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      subscriptions = [...subscriptions, sub];
      created.push(sub);
    }

    const response: ConfirmDetectionsResponse = { created, skipped };
    return [201, response];
  });
}
