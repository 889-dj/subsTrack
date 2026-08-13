import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/src/components/Button';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { usePurchases } from '@/src/hooks/usePurchases';
import type { Plan } from '@/src/lib/purchases';
import { color, font, gutter, radius, space, text as t } from '@/src/theme';

const PRO_FEATURES = [
  'Unlimited mandates tracked',
  'Renewal reminders before you get charged',
  'Price-hike alerts on the mandates you keep',
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
  const activePlan = plans.find((p) => p.period === selected);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader dismiss="close" />

      <Text style={t.title}>The subscription tracker that isn't a subscription.</Text>

      {activePlan ? (
        <View style={styles.priceBlock}>
          <Text style={styles.heroPrice}>{activePlan.priceString}</Text>
          <Text style={t.caption}>
            {selected === 'annual' ? 'billed yearly' : 'billed monthly'}
          </Text>
        </View>
      ) : (
        <Text style={styles.lede}>Pay once. See everything that's charging you.</Text>
      )}

      <View style={styles.features}>
        {PRO_FEATURES.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Text style={styles.featureMark}>✓</Text>
            <Text style={t.body}>{feature}</Text>
          </View>
        ))}
      </View>

      {isLoadingPlans && plans.length === 0 ? (
        <View style={styles.plansLoading}>
          <ActivityIndicator color={color.indigo} />
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

      <Button label="Unlock" onPress={handlePurchase} loading={busy === 'purchase'} disabled={!canBuy} style={styles.cta} />

      <Pressable onPress={handleRestore} disabled={busy !== null} hitSlop={8}>
        <Text style={styles.restore}>{busy === 'restore' ? 'Restoring…' : 'Restore purchase'}</Text>
      </Pressable>

      <Text style={styles.fineprint}>
        Charged to your store account. Renews automatically unless you cancel at least 24 hours
        before the period ends. Manage or cancel it in your store settings.
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

function PlanCard({ plan, selected, onSelect }: { plan: Plan; selected: boolean; onSelect: () => void }) {
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
        <Text style={t.caption}>
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
      <Ionicons name="information-circle-outline" size={28} color={color.indigo} />
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
  screen: {
    flex: 1,
    backgroundColor: color.paper,
  },
  content: {
    paddingHorizontal: gutter,
    paddingBottom: space.xxl,
  },
  priceBlock: {
    alignItems: 'flex-start',
    marginTop: space.xl,
    marginBottom: space.xl,
  },
  heroPrice: {
    fontFamily: font.monoMed,
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1.5,
    color: color.ink,
    marginBottom: space.xs,
  },
  lede: {
    ...t.body,
    color: color.muted,
    marginTop: space.md,
    marginBottom: space.xl,
  },
  features: {
    gap: space.md,
    marginBottom: space.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  featureMark: {
    fontFamily: font.monoMed,
    fontSize: 14,
    color: color.indigo,
    width: 16,
  },
  plansLoading: {
    paddingVertical: space.xl,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: color.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.hairline,
    padding: space.lg,
    marginBottom: space.sm,
  },
  planCardSelected: {
    borderColor: color.indigo,
    backgroundColor: color.indigoBg,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: color.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: color.indigo,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: color.indigo,
  },
  planText: {
    flex: 1,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: 2,
  },
  planName: {
    ...t.body,
    fontFamily: font.sansSemi,
  },
  savings: {
    backgroundColor: color.savedBg,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.chip,
  },
  savingsText: {
    fontFamily: font.monoMed,
    fontSize: 10,
    letterSpacing: 0.5,
    color: color.saved,
  },
  planPrice: {
    ...t.amount,
  },
  cta: {
    marginTop: space.md,
  },
  restore: {
    fontFamily: font.monoMed,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: color.indigo,
    textAlign: 'center',
    paddingVertical: space.md,
  },
  message: {
    ...t.caption,
    color: color.debit,
    marginTop: space.sm,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: color.hairline,
    borderRadius: radius.card,
    padding: space.md,
    gap: space.sm,
    marginBottom: space.md,
  },
  errorText: {
    ...t.caption,
    color: color.debit,
  },
  link: {
    fontFamily: font.monoMed,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: color.debit,
  },
  fineprint: {
    ...t.caption,
    textAlign: 'center',
    marginTop: space.md,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.sm,
  },
  legalLink: {
    ...t.caption,
    color: color.indigo,
  },
  legalDot: {
    ...t.caption,
  },
  notice: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: gutter,
    gap: space.sm,
  },
  noticeTitle: {
    ...t.title,
    textAlign: 'center',
    marginTop: space.sm,
  },
  noticeBody: {
    ...t.body,
    color: color.muted,
    textAlign: 'center',
    marginBottom: space.sm,
  },
  noticeButton: {
    alignSelf: 'stretch',
  },
});
