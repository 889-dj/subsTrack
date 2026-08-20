import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/src/components/Button';
import { Icon, type IconName } from '@/src/components/Icon';
import { usePurchases } from '@/src/hooks/usePurchases';
import { useSubscriptions } from '@/src/hooks/useSubscriptions';
import { useTheme } from '@/src/hooks/useTheme';
import type { Plan } from '@/src/lib/purchases';
import type { Subscription } from '@/src/types';
import {
  font,
  gutter,
  lightColors,
  radius,
  space,
  type Palette,
  type TextStyles,
} from '@/src/theme';

const PRO_BENEFITS: { icon: IconName; label: string; detail: string }[] = [
  {
    icon: 'notifications-outline',
    label: 'Renewal alerts',
    detail: 'Get a heads-up before money leaves your account.',
  },
  {
    icon: 'trending-up',
    label: 'Price-change history',
    detail: 'See when a subscription quietly gets more expensive.',
  },
  {
    icon: 'reader-outline',
    label: 'Export your ledger',
    detail: 'Take your complete subscription history with you.',
  },
];

const TERMS_URL = 'https://substrack.app/terms';
const PRIVACY_URL = 'https://substrack.app/privacy';

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    status,
    isPro,
    plans,
    isLoadingPlans,
    plansError,
    reloadPlans,
    purchase,
    restore,
    managementUrl,
  } = usePurchases();
  const { data: subscriptions = [] } = useSubscriptions();
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);

  const [selected, setSelected] = useState<Plan['period']>('annual');
  const [busy, setBusy] = useState<'purchase' | 'restore' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const dismissPaywall = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  useEffect(() => {
    reloadPlans();
  }, [reloadPlans]);

  useEffect(() => {
    if (plans.length && !plans.some((plan) => plan.period === selected)) {
      setSelected(plans[0].period);
    }
  }, [plans, selected]);

  const upcoming = useMemo(
    () =>
      [...subscriptions]
        .sort(
          (left, right) =>
            new Date(left.nextRenewalDate).getTime() - new Date(right.nextRenewalDate).getTime(),
        )
        .slice(0, 3),
    [subscriptions],
  );

  async function handlePurchase() {
    const plan = plans.find((candidate) => candidate.period === selected);
    if (!plan) return;

    setMessage(null);
    setBusy('purchase');
    const outcome = await purchase(plan);
    setBusy(null);

    if (outcome.status === 'purchased') {
      dismissPaywall();
    } else if (outcome.status === 'error') {
      setMessage(outcome.message);
    }
  }

  async function handleRestore() {
    setMessage(null);
    setBusy('restore');
    const outcome = await restore();
    setBusy(null);

    if (outcome.status === 'error') {
      setMessage(outcome.message);
    } else if (outcome.isPro) {
      dismissPaywall();
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

  const activePlan = plans.find((plan) => plan.period === selected);
  const displayPlans = [...plans].sort((left, right) =>
    left.period === 'annual' ? -1 : right.period === 'annual' ? 1 : 0,
  );
  const canBuy = plans.length > 0 && busy === null;
  const ctaLabel = activePlan
    ? `Continue with ${activePlan.period === 'annual' ? 'annual' : 'monthly'}`
    : isLoadingPlans
      ? 'Loading plans…'
      : 'Continue';
  const renewalCopy = activePlan
    ? `${activePlan.priceString}/${activePlan.period === 'annual' ? 'year' : 'month'}, auto-renewing until canceled.`
    : 'Secure payment through your store account.';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + space.sm,
            paddingBottom: insets.bottom + 140,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={dismissPaywall}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close Pro plans"
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
          >
            <Icon name="close" size={21} color={colors.ink} />
          </Pressable>

          <View style={styles.proMark}>
            <Icon name="flash" size={13} color={colors.indigo} />
            <Text style={styles.proMarkText}>SUBSTRACK PRO</Text>
          </View>
          <View style={styles.topBarSpacer} />
        </View>

        <LinearGradient
          colors={
            colors.isDark
              ? [colors.heroSurface, colors.paper2]
              : [colors.heroSurface, colors.indigo]
          }
          start={{ x: 0.05, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <Text style={styles.heroEyebrow}>YOUR MONEY, ON YOUR TERMS</Text>
          <Text style={styles.heroTitle}>Catch charges before they catch you.</Text>
          <Text style={styles.heroSubtitle}>
            Pro keeps upcoming renewals visible and warns you before the next charge.
          </Text>

          <View style={styles.receiptStack}>
            {upcoming.length > 0 ? (
              upcoming.map((subscription, index) => (
                <RenewalReceipt
                  key={subscription.id}
                  subscription={subscription}
                  muted={index > 0}
                />
              ))
            ) : (
              <View style={styles.emptyReceipt}>
                <Icon name="notifications-outline" size={19} color={colors.indigo} />
                <Text style={styles.emptyReceiptText}>Your next renewal alert will appear here</Text>
              </View>
            )}
          </View>

          <View style={styles.watchRow}>
            <View style={styles.liveDot} />
            <Text style={styles.watchText}>
              {subscriptions.length > 0
                ? `${subscriptions.length} renewal${subscriptions.length === 1 ? '' : 's'} under watch`
                : 'Ready to watch your renewals'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.planHeader}>
          <View>
            <Text style={styles.planTitle}>Choose Pro</Text>
            <Text style={styles.planSubtitle}>All features. Cancel anytime.</Text>
          </View>
          <Text style={styles.secureLabel}>STORE SECURE</Text>
        </View>

        {isLoadingPlans && plans.length === 0 ? (
          <View style={styles.plansLoading}>
            <ActivityIndicator color={colors.indigo} />
          </View>
        ) : null}

        {plansError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{plansError}</Text>
            <Pressable onPress={reloadPlans} hitSlop={8} accessibilityRole="button">
              <Text style={styles.retry}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoadingPlans && !plansError && plans.length === 0 ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              No plans are available right now. Check that the current RevenueCat offering has a
              monthly and annual package.
            </Text>
          </View>
        ) : null}

        <View style={styles.planGrid} accessibilityRole="radiogroup">
          {displayPlans.map((plan) => (
            <PlanCard
              key={plan.period}
              plan={plan}
              selected={selected === plan.period}
              onSelect={() => setSelected(plan.period)}
            />
          ))}
        </View>

        <View style={styles.benefits}>
          {PRO_BENEFITS.map((benefit) => (
            <View key={benefit.label} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Icon name={benefit.icon} size={17} color={colors.indigo} />
              </View>
              <View style={styles.benefitCopy}>
                <Text style={styles.benefitLabel}>{benefit.label}</Text>
                <Text style={styles.benefitDetail}>{benefit.detail}</Text>
              </View>
              <Icon name="checkmark" size={16} color={colors.saved} />
            </View>
          ))}
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Pressable
          onPress={handleRestore}
          disabled={busy !== null}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Restore a previous Pro purchase"
        >
          <Text style={styles.restore}>
            {busy === 'restore' ? 'Restoring purchase…' : 'Restore purchase'}
          </Text>
        </Pressable>

        <View style={styles.legalRow}>
          <Pressable
            onPress={() => Linking.openURL(TERMS_URL)}
            hitSlop={8}
            accessibilityRole="link"
            accessibilityLabel="Open terms of use"
          >
            <Text style={styles.legalLink}>Terms</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable
            onPress={() => Linking.openURL(PRIVACY_URL)}
            hitSlop={8}
            accessibilityRole="link"
            accessibilityLabel="Open privacy policy"
          >
            <Text style={styles.legalLink}>Privacy</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.purchaseDock, { paddingBottom: Math.max(space.md, insets.bottom) }]}>
        <Button
          label={ctaLabel}
          onPress={handlePurchase}
          loading={busy === 'purchase'}
          disabled={!canBuy}
        />
        <Text style={styles.renewalCopy}>{renewalCopy}</Text>
      </View>
    </View>
  );
}

function RenewalReceipt({
  subscription,
  muted,
}: {
  subscription: Subscription;
  muted: boolean;
}) {
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);

  return (
    <View style={[styles.receipt, muted && styles.receiptMuted]}>
      <View style={styles.receiptLogo}>
        <Text style={styles.receiptInitial}>{subscription.name.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.receiptCopy}>
        <Text style={styles.receiptName} numberOfLines={1}>
          {subscription.name}
        </Text>
        <Text style={styles.receiptDue}>{relativeRenewal(subscription.nextRenewalDate)}</Text>
      </View>
      <Text style={styles.receiptAmount}>{compactMoney(subscription.cost, subscription.currency)}</Text>
    </View>
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
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const isAnnual = plan.period === 'annual';
  const displayPrice = isAnnual ? (plan.pricePerMonthString ?? plan.priceString) : plan.priceString;

  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityLabel={`${isAnnual ? 'Annual' : 'Monthly'} Pro, ${plan.priceString}`}
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.planCard,
        selected && styles.planCardSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.planTopRow}>
        <Text style={styles.planName}>{isAnnual ? 'Annual' : 'Monthly'}</Text>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
      </View>

      {isAnnual ? (
        <View style={styles.valueBadge}>
          <Text style={styles.valueBadgeText}>
            {plan.savingsPercent ? `SAVE ${plan.savingsPercent}%` : 'BEST VALUE'}
          </Text>
        </View>
      ) : (
        <View style={styles.valueBadgeSpacer} />
      )}

      <View style={styles.planPriceRow}>
        <Text style={styles.planPrice}>{displayPrice}</Text>
        <Text style={styles.planPeriod}>/mo</Text>
      </View>
      <Text style={styles.planDetail}>
        {isAnnual ? `${plan.priceString} billed yearly` : 'Billed monthly'}
      </Text>
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
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const dismissPaywall = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  return (
    <View style={styles.notice}>
      <Icon name="information-circle-outline" size={28} color={colors.indigo} />
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeBody}>{body}</Text>
      {action ? (
        <Button
          label={action.label}
          variant="secondary"
          onPress={action.onPress}
          style={styles.noticeButton}
        />
      ) : null}
      <Button
        label="Close"
        variant="ghost"
        onPress={dismissPaywall}
        style={styles.noticeButton}
      />
    </View>
  );
}

function relativeRenewal(dateString: string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const renewalDate = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? new Date(`${dateString}T00:00:00`)
    : new Date(dateString);
  const renewal = renewalDate.getTime();

  if (Number.isNaN(renewal)) return 'Upcoming renewal';

  const days = Math.ceil((renewal - today) / 86_400_000);

  if (days === 0) return 'Renews today';
  if (days === 1) return 'Renews tomorrow';
  if (days > 1 && days <= 30) return `Renews in ${days} days`;

  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(
    new Date(renewal),
  );
}

function compactMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.paper,
    },
    content: {
      paddingHorizontal: gutter,
    },
    topBar: {
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: space.md,
    },
    close: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -space.sm,
    },
    proMark: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: space.md,
      paddingVertical: 7,
      borderRadius: radius.chip,
      backgroundColor: colors.indigoBg,
    },
    proMarkText: {
      fontFamily: font.monoMed,
      fontSize: 10,
      lineHeight: 13,
      letterSpacing: 1,
      color: colors.indigo,
    },
    topBarSpacer: {
      width: 44,
    },
    hero: {
      minHeight: 365,
      overflow: 'hidden',
      borderRadius: 28,
      padding: space.xl,
    },
    heroGlowOne: {
      position: 'absolute',
      width: 210,
      height: 210,
      top: -100,
      right: -70,
      borderRadius: 105,
      backgroundColor: colors.white,
      opacity: 0.1,
    },
    heroGlowTwo: {
      position: 'absolute',
      width: 160,
      height: 160,
      bottom: -105,
      left: -75,
      borderRadius: 80,
      backgroundColor: colors.white,
      opacity: 0.07,
    },
    heroEyebrow: {
      fontFamily: font.monoMed,
      fontSize: 10,
      lineHeight: 13,
      letterSpacing: 1.1,
      color: colors.heroMuted,
    },
    heroTitle: {
      maxWidth: 310,
      marginTop: space.sm,
      fontFamily: font.sansSemi,
      fontSize: 29,
      lineHeight: 33,
      letterSpacing: -0.8,
      color: colors.heroInk,
    },
    heroSubtitle: {
      maxWidth: 310,
      marginTop: space.sm,
      fontFamily: font.sans,
      fontSize: 14,
      lineHeight: 20,
      color: colors.heroMuted,
    },
    receiptStack: {
      marginTop: space.lg,
      gap: 7,
    },
    receipt: {
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: space.md,
      borderRadius: radius.cardSm,
      backgroundColor: colors.white,
    },
    receiptMuted: {
      opacity: 0.82,
      transform: [{ scale: 0.975 }],
    },
    receiptLogo: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: colors.indigoBg,
    },
    receiptInitial: {
      fontFamily: font.sansSemi,
      fontSize: 14,
      color: colors.indigo,
    },
    receiptCopy: {
      flex: 1,
      minWidth: 0,
      marginLeft: space.md,
    },
    receiptName: {
      fontFamily: font.sansMed,
      fontSize: 13,
      lineHeight: 17,
      color: lightColors.ink,
    },
    receiptDue: {
      fontFamily: font.sans,
      fontSize: 11,
      lineHeight: 14,
      color: lightColors.muted,
    },
    receiptAmount: {
      marginLeft: space.sm,
      fontFamily: font.monoMed,
      fontSize: 13,
      lineHeight: 18,
      color: lightColors.ink,
    },
    emptyReceipt: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.sm,
      borderRadius: radius.cardSm,
      backgroundColor: colors.white,
    },
    emptyReceiptText: {
      fontFamily: font.sansMed,
      fontSize: 13,
      color: lightColors.ink,
    },
    watchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      marginTop: space.md,
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.saved,
    },
    watchText: {
      fontFamily: font.monoMed,
      fontSize: 10,
      lineHeight: 14,
      letterSpacing: 0.4,
      color: colors.heroInk,
    },
    planHeader: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginTop: space.xl,
      marginBottom: space.md,
    },
    planTitle: {
      ...t.title,
    },
    planSubtitle: {
      ...t.caption,
      marginTop: 2,
    },
    secureLabel: {
      fontFamily: font.monoMed,
      fontSize: 9,
      lineHeight: 12,
      letterSpacing: 0.7,
      color: colors.faint,
    },
    plansLoading: {
      paddingVertical: space.xl,
    },
    planGrid: {
      flexDirection: 'row',
      gap: space.sm,
    },
    planCard: {
      flex: 1,
      minHeight: 142,
      padding: space.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.card,
      backgroundColor: colors.surface,
    },
    planCardSelected: {
      borderWidth: 1.5,
      borderColor: colors.indigo,
      backgroundColor: colors.indigoBg,
    },
    planTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    planName: {
      fontFamily: font.sansSemi,
      fontSize: 15,
      lineHeight: 20,
      color: colors.ink,
    },
    radio: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.hairline,
      borderRadius: 10,
    },
    radioSelected: {
      borderColor: colors.indigo,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.indigo,
    },
    valueBadge: {
      alignSelf: 'flex-start',
      marginTop: space.md,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: radius.chip,
      backgroundColor: colors.savedBg,
    },
    valueBadgeSpacer: {
      height: 31,
    },
    valueBadgeText: {
      fontFamily: font.monoMed,
      fontSize: 8,
      lineHeight: 11,
      letterSpacing: 0.5,
      color: colors.saved,
    },
    planPriceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginTop: space.sm,
    },
    planPrice: {
      fontFamily: font.monoMed,
      fontSize: 21,
      lineHeight: 26,
      letterSpacing: -0.4,
      color: colors.ink,
    },
    planPeriod: {
      marginLeft: 2,
      fontFamily: font.sans,
      fontSize: 11,
      lineHeight: 14,
      color: colors.muted,
    },
    planDetail: {
      marginTop: 2,
      fontFamily: font.sans,
      fontSize: 10,
      lineHeight: 14,
      color: colors.muted,
    },
    benefits: {
      marginTop: space.xl,
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
    },
    benefitRow: {
      minHeight: 68,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    benefitIcon: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 11,
      backgroundColor: colors.indigoBg,
    },
    benefitCopy: {
      flex: 1,
    },
    benefitLabel: {
      fontFamily: font.sansMed,
      fontSize: 14,
      lineHeight: 18,
      color: colors.ink,
    },
    benefitDetail: {
      marginTop: 2,
      fontFamily: font.sans,
      fontSize: 12,
      lineHeight: 16,
      color: colors.muted,
    },
    pressed: {
      opacity: 0.72,
    },
    restore: {
      paddingVertical: space.lg,
      fontFamily: font.sansMed,
      fontSize: 13,
      lineHeight: 18,
      color: colors.indigo,
      textAlign: 'center',
    },
    message: {
      ...t.caption,
      marginTop: space.md,
      color: colors.debit,
      textAlign: 'center',
    },
    errorBox: {
      gap: space.sm,
      marginBottom: space.md,
      padding: space.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.card,
    },
    errorText: {
      ...t.caption,
      color: colors.debit,
    },
    retry: {
      fontFamily: font.sansMed,
      fontSize: 13,
      color: colors.debit,
    },
    legalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.sm,
    },
    legalLink: {
      ...t.caption,
      color: colors.muted,
      textDecorationLine: 'underline',
    },
    legalDot: {
      ...t.caption,
    },
    purchaseDock: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      left: 0,
      paddingTop: space.md,
      paddingHorizontal: gutter,
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
      backgroundColor: colors.elevated,
      shadowColor: colors.shadow,
      shadowOpacity: colors.isDark ? 0.28 : 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: -5 },
      elevation: 12,
    },
    renewalCopy: {
      ...t.caption,
      marginTop: space.sm,
      fontSize: 11,
      lineHeight: 15,
      textAlign: 'center',
    },
    notice: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.sm,
      paddingHorizontal: gutter,
      backgroundColor: colors.paper,
    },
    noticeTitle: {
      ...t.title,
      marginTop: space.sm,
      textAlign: 'center',
    },
    noticeBody: {
      ...t.body,
      marginBottom: space.sm,
      color: colors.muted,
      textAlign: 'center',
    },
    noticeButton: {
      alignSelf: 'stretch',
    },
  });
