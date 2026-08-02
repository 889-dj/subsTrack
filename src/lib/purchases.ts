/**
 * react-native-purchases ships native code, so requiring it throws on a binary
 * that was built before the package was added. It is loaded lazily for the same
 * reason as the document picker, and every entry point returns a value the
 * paywall can render rather than throwing, so a stale dev client degrades to a
 * message instead of taking the route down.
 */
import { Platform } from 'react-native';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

/** Entitlement identifier configured in the RevenueCat dashboard. */
export const ENTITLEMENT_ID = 'pro';

export type PlanPeriod = 'monthly' | 'annual';

export interface Plan {
  period: PlanPeriod;
  /** Localised price for the full billing term, e.g. "₹399" or "₹2,999". */
  priceString: string;
  /** Localised price normalised to a month, used for the annual comparison line. */
  pricePerMonthString: string | null;
  /** Whole-percent discount of the annual plan against 12x the monthly plan. */
  savingsPercent: number | null;
  package: PurchasesPackage;
}

/** Why the store is or isn't usable, so screens can explain themselves. */
export type PurchasesStatus =
  | 'ready'
  /** Native module missing from this binary (old dev client or Expo Go). */
  | 'unavailable'
  /** No RevenueCat API key for this platform. */
  | 'unconfigured';

export type PurchaseOutcome =
  | { status: 'purchased'; isPro: boolean }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export type RestoreOutcome =
  | { status: 'restored'; isPro: boolean }
  | { status: 'error'; message: string };

type PurchasesNamespace = typeof import('react-native-purchases');

let cached: PurchasesNamespace | null | undefined;

/** Returns null when the native module isn't present in the current binary. */
function load(): PurchasesNamespace | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('react-native-purchases') as PurchasesNamespace;
  } catch {
    cached = null;
  }
  return cached;
}

function apiKey(): string | undefined {
  // Referenced as literals so the Expo bundler can inline them at build time.
  const key = Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
    default: undefined,
  });
  return key?.trim() || undefined;
}

let configured = false;

/**
 * Safe to call repeatedly; the SDK is configured at most once per process.
 */
export function configurePurchases(): PurchasesStatus {
  const mod = load();
  if (!mod) return 'unavailable';

  const key = apiKey();
  if (!key) return 'unconfigured';

  if (!configured) {
    if (__DEV__) void mod.default.setLogLevel(mod.LOG_LEVEL.DEBUG);
    mod.default.configure({ apiKey: key });
    configured = true;
  }
  return 'ready';
}

export function purchasesStatus(): PurchasesStatus {
  if (!load()) return 'unavailable';
  if (!apiKey()) return 'unconfigured';
  return 'ready';
}

export function isPro(info: CustomerInfo | null): boolean {
  return !!info?.entitlements.active[ENTITLEMENT_ID];
}

/**
 * Ties purchases to the signed-in account so an entitlement follows the user
 * across devices. Anonymous ids are left alone — RevenueCat generates its own.
 */
export async function identify(appUserId: string): Promise<CustomerInfo | null> {
  const mod = load();
  if (!mod || !configured) return null;
  try {
    const { customerInfo } = await mod.default.logIn(appUserId);
    return customerInfo;
  } catch {
    return null;
  }
}

export async function forgetUser(): Promise<void> {
  const mod = load();
  if (!mod || !configured) return;
  try {
    await mod.default.logOut();
  } catch {
    // Logging out an anonymous user throws; nothing to recover from either way.
  }
}

export async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  const mod = load();
  if (!mod || !configured) return null;
  try {
    return await mod.default.getCustomerInfo();
  } catch {
    return null;
  }
}

/** Fires whenever the store or a purchase changes the entitlement state. */
export function onCustomerInfoChange(listener: (info: CustomerInfo) => void): () => void {
  const mod = load();
  if (!mod || !configured) return () => {};
  mod.default.addCustomerInfoUpdateListener(listener);
  return () => mod.default.removeCustomerInfoUpdateListener(listener);
}

/**
 * Reads the current offering and keeps only the two terms the paywall sells.
 * Returns an empty list when the offering has no monthly/annual package, which
 * is what a half-finished dashboard setup looks like.
 */
export async function fetchPlans(): Promise<Plan[]> {
  const mod = load();
  if (!mod || !configured) return [];

  const offerings = await mod.default.getOfferings();
  const offering = offerings.current;
  if (!offering) return [];

  return buildPlans(offering);
}

function buildPlans(offering: PurchasesOffering): Plan[] {
  const monthly = offering.monthly ?? findByType(offering, 'MONTHLY');
  const annual = offering.annual ?? findByType(offering, 'ANNUAL');

  const plans: Plan[] = [];

  if (monthly) {
    plans.push({
      period: 'monthly',
      priceString: monthly.product.priceString,
      pricePerMonthString: null,
      savingsPercent: null,
      package: monthly,
    });
  }

  if (annual) {
    plans.push({
      period: 'annual',
      priceString: annual.product.priceString,
      pricePerMonthString: annual.product.pricePerMonthString,
      savingsPercent: savingsPercent(monthly, annual),
      package: annual,
    });
  }

  return plans;
}

function findByType(offering: PurchasesOffering, type: 'MONTHLY' | 'ANNUAL') {
  return offering.availablePackages.find((p) => p.packageType === type) ?? null;
}

/** Null unless both terms exist and the annual one is actually cheaper. */
function savingsPercent(
  monthly: PurchasesPackage | null,
  annual: PurchasesPackage | null,
): number | null {
  if (!monthly || !annual) return null;

  const perMonth = annual.product.pricePerMonth ?? annual.product.price / 12;
  const full = monthly.product.price;
  if (!full || !perMonth || perMonth >= full) return null;

  return Math.round((1 - perMonth / full) * 100);
}

export async function purchasePlan(plan: Plan): Promise<PurchaseOutcome> {
  const mod = load();
  if (!mod || !configured) {
    return { status: 'error', message: 'In-app purchases are not available in this build.' };
  }

  try {
    const { customerInfo } = await mod.default.purchasePackage(plan.package);
    return { status: 'purchased', isPro: isPro(customerInfo) };
  } catch (e: any) {
    if (e?.userCancelled) return { status: 'cancelled' };
    return {
      status: 'error',
      message: e?.message ?? 'The purchase could not be completed. Please try again.',
    };
  }
}

export async function restorePurchases(): Promise<RestoreOutcome> {
  const mod = load();
  if (!mod || !configured) {
    return { status: 'error', message: 'In-app purchases are not available in this build.' };
  }

  try {
    const customerInfo = await mod.default.restorePurchases();
    return { status: 'restored', isPro: isPro(customerInfo) };
  } catch (e: any) {
    return {
      status: 'error',
      message: e?.message ?? 'We could not restore your purchases. Please try again.',
    };
  }
}

/** Store-hosted page where an active subscription can be cancelled. */
export function managementUrl(info: CustomerInfo | null): string | null {
  return info?.managementURL ?? null;
}
