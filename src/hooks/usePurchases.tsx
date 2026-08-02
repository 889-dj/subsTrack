import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CustomerInfo } from 'react-native-purchases';
import * as purchases from '@/src/lib/purchases';
import type { Plan, PurchaseOutcome, PurchasesStatus, RestoreOutcome } from '@/src/lib/purchases';
import { useAuth } from '@/src/hooks/useAuth';

interface PurchasesContextValue {
  /** Why the store is or isn't usable; screens explain 'unavailable'/'unconfigured'. */
  status: PurchasesStatus;
  /** True once the entitlement has been read at least once. */
  isReady: boolean;
  isPro: boolean;
  plans: Plan[];
  isLoadingPlans: boolean;
  /** Set when the offering could not be read, e.g. no network. */
  plansError: string | null;
  reloadPlans: () => Promise<void>;
  purchase: (plan: Plan) => Promise<PurchaseOutcome>;
  restore: () => Promise<RestoreOutcome>;
  /** Store page for cancelling, once there is something to cancel. */
  managementUrl: string | null;
}

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [status] = useState<PurchasesStatus>(() => purchases.configurePurchases());
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isReady, setIsReady] = useState(status !== 'ready');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);

  // A session restored from a stored token carries a placeholder id, which must
  // not be used as a RevenueCat app user id — every restored session would share
  // one entitlement. Those sessions stay on the SDK's anonymous id instead.
  const appUserId = user && user.id !== 'restored' ? user.id : null;

  useEffect(() => {
    if (status !== 'ready') return;

    let cancelled = false;

    (async () => {
      const info = appUserId
        ? ((await purchases.identify(appUserId)) ?? (await purchases.fetchCustomerInfo()))
        : await purchases.fetchCustomerInfo();
      if (cancelled) return;
      setCustomerInfo(info);
      setIsReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [status, appUserId]);

  // Sign-out has to reach the SDK too, or the next account inherits this one's
  // entitlement for as long as the process lives.
  useEffect(() => {
    if (status !== 'ready' || user) return;
    (async () => {
      await purchases.forgetUser();
      setCustomerInfo(await purchases.fetchCustomerInfo());
    })();
  }, [status, user]);

  // Renewals, refunds and purchases made outside the app all arrive here.
  useEffect(() => {
    if (status !== 'ready') return;
    return purchases.onCustomerInfoChange(setCustomerInfo);
  }, [status]);

  const reloadPlans = useCallback(async () => {
    if (status !== 'ready') return;
    setIsLoadingPlans(true);
    setPlansError(null);
    try {
      setPlans(await purchases.fetchPlans());
    } catch {
      setPlansError('We could not load the plans. Check your connection and try again.');
    } finally {
      setIsLoadingPlans(false);
    }
  }, [status]);

  const purchase = useCallback(async (plan: Plan): Promise<PurchaseOutcome> => {
    const outcome = await purchases.purchasePlan(plan);
    if (outcome.status === 'purchased') {
      setCustomerInfo(await purchases.fetchCustomerInfo());
    }
    return outcome;
  }, []);

  const restore = useCallback(async (): Promise<RestoreOutcome> => {
    const outcome = await purchases.restorePurchases();
    if (outcome.status === 'restored') {
      setCustomerInfo(await purchases.fetchCustomerInfo());
    }
    return outcome;
  }, []);

  const value = useMemo<PurchasesContextValue>(
    () => ({
      status,
      isReady,
      isPro: purchases.isPro(customerInfo),
      plans,
      isLoadingPlans,
      plansError,
      reloadPlans,
      purchase,
      restore,
      managementUrl: purchases.managementUrl(customerInfo),
    }),
    [status, isReady, customerInfo, plans, isLoadingPlans, plansError, reloadPlans, purchase, restore],
  );

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchases(): PurchasesContextValue {
  const ctx = useContext(PurchasesContext);
  if (!ctx) throw new Error('usePurchases must be used within a PurchasesProvider');
  return ctx;
}
