import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/src/components/Button';
import { usePurchases } from '@/src/hooks/usePurchases';
import type { Plan } from '@/src/lib/purchases';
import { colors, radius, spacing, typography } from '@/src/theme';

const PRO_FEATURES = [
  'Unlimited statement uploads',
  'Renewal reminders before you get charged',
  'Price-hike alerts on the subscriptions you keep',
  'Export everything to CSV',
];

const TERMS_URL = 'https://substrack.app/terms';
const PRIVACY_URL = 'https://substrack.app/privacy';

export default function PaywallScreen() {
  const router = useRouter();
  const { status, isPro, plans, isLoadingPlans, plansError, reloadPlans, purchase, restore, managementUrl } =
    usePurchases();

  const [selected, setSelected] = useState<Plan['period']>('annual');
  const [busy, setBusy] = useState<'purchase' | 'restore' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    reloadPlans();
  }, [reloadPlans]);

  // Fall back to whichever term the dashboard actually offers.
  useEffect(() => {
    if (plans.length && !plans.some((p) => p.period === selected)) {
      setSelected(plans[0].period);
    }
  }, [plans, selected]);

  async function handlePurchase() {
    const plan = plans.find((p) => p.period === selected);
    if (!plan) return;

    setMessage(null);
    setBusy('purchase');
    const outcome = await purchase(plan);
    setBusy(null);

    if (outcome.status === 'purchased') {
      router.back();
    } else if (outcome.status === 'error') {
      setMessage(outcome.message);
    }
    // A cancelled purchase is a deliberate choice, so it says nothing.
  }

  async function handleRestore() {
    setMessage(null);
    setBusy('restore');
    const outcome = await restore();
    setBusy(null);

    if (outcome.status === 'error') {
      setMessage(outcome.message);
    } else if (outcome.isPro) {
      router.back();
    } else {
      setMessage('No previous purchase was found on this store account.');
    }
  }

  if (status !== 'ready') {
    return (
      <Notice
        title={status === 'unavailable' ? 'Not available in this build' : 'Purchases not configured'}
        body={
          status === 'unavailable'
            ? 'In-app purchases need a development build that includes RevenueCat. Run an EAS development build and reopen the app.'
            : 'Add your RevenueCat API keys to the app environment, then restart the bundler.'
        }
      />
    );
  }

  if (isPro) {
    return (
      <Notice
        title="You're on SubsTrack Pro"
        body="Thanks for subscribing. Manage or cancel your plan any time from the store."
        action={
          managementUrl
            ? { label: 'Manage subscription', onPress: () => Linking.openURL(managementUrl) }
            : undefined
        }
      />
    );
  }

  const canBuy = plans.length > 0 && busy === null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.badge}>
        <Ionicons name="sparkles" size={16} color={colors.accent} />
        <Text style={styles.badgeText}>SubsTrack Pro</Text>
      </View>

      <Text style={styles.title}>Stop paying for what you forgot</Text>
      <Text style={styles.subtitle}>
        Pro keeps reading your statements, tells you before a renewal lands, and flags the prices
        that quietly went up.
      </Text>

      <View style={styles.features}>
        {PRO_FEATURES.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {isLoadingPlans && plans.length === 0 ? (
        <View style={styles.plansLoading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : null}

      {plansError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{plansError}</Text>
          <Pressable onPress={reloadPlans} hitSlop={8}>
            <Text style={styles.link}>Try again</Text>
          </Pressable>
        </View>
      ) : null}

      {!isLoadingPlans && !plansError && plans.length === 0 ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            No plans are available right now. Check that the current offering in RevenueCat has a
            monthly and an annual package.
          </Text>
        </View>
      ) : null}

      {plans.map((plan) => (
        <PlanCard
          key={plan.period}
          plan={plan}
          selected={selected === plan.period}
          onSelect={() => setSelected(plan.period)}
        />
      ))}

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Button
        label="Continue"
        onPress={handlePurchase}
        loading={busy === 'purchase'}
        disabled={!canBuy}
        style={styles.cta}
      />

      <Pressable onPress={handleRestore} disabled={busy !== null} hitSlop={8}>
        <Text style={styles.restore}>
          {busy === 'restore' ? 'Restoring…' : 'Restore purchases'}
        </Text>
      </Pressable>

      <Text style={styles.fineprint}>
        Payment is charged to your store account. The subscription renews automatically unless you
        cancel at least 24 hours before the period ends. Manage or cancel it in your store settings.
      </Text>

      <View style={styles.legalRow}>
        <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}>
          <Text style={styles.legalLink}>Terms</Text>
        </Pressable>
        <Text style={styles.legalDot}>·</Text>
        <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}>
          <Text style={styles.legalLink}>Privacy</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}) {
  const isAnnual = plan.period === 'annual';

  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.planCard, selected && styles.planCardSelected]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>

      <View style={styles.planText}>
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{isAnnual ? 'Annual' : 'Monthly'}</Text>
          {plan.savingsPercent ? (
            <View style={styles.savings}>
              <Text style={styles.savingsText}>Save {plan.savingsPercent}%</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.planMeta}>
          {isAnnual && plan.pricePerMonthString
            ? `${plan.pricePerMonthString} per month, billed yearly`
            : 'Billed monthly'}
        </Text>
      </View>

      <Text style={styles.planPrice}>{plan.priceString}</Text>
    </Pressable>
  );
}

function Notice({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
}) {
  const router = useRouter();
  return (
    <View style={styles.notice}>
      <Ionicons name="information-circle-outline" size={32} color={colors.accent} />
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeBody}>{body}</Text>
      {action ? (
        <Button label={action.label} variant="secondary" onPress={action.onPress} style={styles.noticeButton} />
      ) : null}
      <Button label="Close" variant="ghost" onPress={() => router.back()} style={styles.noticeButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.accentMuted,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  badgeText: {
    ...typography.label,
    color: colors.accent,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMuted,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  features: {
    gap: spacing.sm + 2,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    ...typography.body,
    flex: 1,
  },
  plansLoading: {
    paddingVertical: spacing.xl,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  planCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  planText: {
    flex: 1,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  planName: {
    ...typography.subheading,
  },
  savings: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  planMeta: {
    ...typography.bodyMuted,
  },
  planPrice: {
    ...typography.subheading,
  },
  cta: {
    marginTop: spacing.md,
  },
  restore: {
    ...typography.label,
    color: colors.accent,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  message: {
    ...typography.bodyMuted,
    color: colors.danger,
    marginTop: spacing.sm,
  },
  errorBox: {
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodyMuted,
    color: colors.danger,
  },
  link: {
    ...typography.label,
    color: colors.danger,
  },
  fineprint: {
    ...typography.caption,
    lineHeight: 17,
    textAlign: 'center',
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  legalLink: {
    ...typography.caption,
    color: colors.accent,
  },
  legalDot: {
    ...typography.caption,
  },
  notice: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  noticeTitle: {
    ...typography.heading,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  noticeBody: {
    ...typography.bodyMuted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing.sm,
  },
  noticeButton: {
    alignSelf: 'stretch',
  },
});
