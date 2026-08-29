import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { TAB_BAR_CLEARANCE } from '@/src/components/BottomNav';
import { CategoryBreakdown } from '@/src/components/CategoryBreakdown';
import { EmptyState } from '@/src/components/EmptyState';
import type { IconName } from '@/src/components/Icon';
import { InsightCard } from '@/src/components/InsightCard';
import { Money } from '@/src/components/Money';
import { SectionHeader } from '@/src/components/SectionHeader';
import { SkeletonList } from '@/src/components/SkeletonRow';
import { useOverview, useSpendHeadline } from '@/src/hooks/useAnalytics';
import { useInsights, useRefreshInsights } from '@/src/hooks/useInsights';
import { useSubscriptions } from '@/src/hooks/useSubscriptions';
import { useTabBarScroll } from '@/src/hooks/useTabBarScroll';
import { useTheme } from '@/src/hooks/useTheme';
import { gutter, radius, space, type Palette, type TextStyles } from '@/src/theme';
import { formatCompactMoney, monthlyCost } from '@/src/utils/money';
import { upcoming } from '@/src/utils/subscriptions';

type Accent = 'indigo' | 'cyan' | 'pink' | 'warning' | 'saved';

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const { data, isLoading } = useSubscriptions();
  const { data: overview, isLoading: isLoadingOverview } = useOverview();
  const { data: aiInsights, isLoading: isLoadingAiInsights, isError: isAiInsightsError } = useInsights();
  const refreshAiInsights = useRefreshInsights();
  const [isRefreshingAiInsights, setIsRefreshingAiInsights] = useState(false);
  const { onScroll } = useTabBarScroll();

  const subs = useMemo(() => data ?? [], [data]);
  const activeSubs = useMemo(
    () => subs.filter((subscription) => subscription.status === 'active'),
    [subs],
  );

  const { primary, currency, monthly, yearly, note: otherCurrenciesNote } = useSpendHeadline(overview);
  const byCategory = useMemo(
    () =>
      (primary?.byCategory ?? []).map((c) => ({
        category: c.category,
        amount: Number(c.monthlyCommitment),
      })),
    [primary],
  );
  const scopedSubs = useMemo(
    () => activeSubs.filter((s) => s.currency === currency),
    [activeSubs, currency],
  );

  const insights = useMemo(() => {
    if (activeSubs.length === 0) return [];
    const list: { icon: IconName; title: string; body: string; accent: Accent }[] = [];

    const soon = upcoming(activeSubs, 5);
    if (soon.length >= 2) {
      list.push({
        icon: 'flash',
        title: 'Renewal cluster ahead',
        accent: 'warning',
        body: `${soon.length} subscriptions renew within the next 5 days — ${soon
          .map((s) => s.name)
          .join(', ')}.`,
      });
    }

    const biggest = [...scopedSubs].sort((a, b) => monthlyCost(b) - monthlyCost(a))[0];
    if (biggest && monthly > 0) {
      const share = Math.round((monthlyCost(biggest) / monthly) * 100);
      list.push({
        icon: 'trophy',
        title: 'Biggest subscription',
        accent: 'indigo',
        body: `${biggest.name} represents ${share}% of your monthly spend.`,
      });
    }

    if (byCategory.length > 0) {
      list.push({
        icon: 'pie-chart',
        title: 'Top category',
        accent: 'cyan',
        body: `${byCategory[0].category} is your largest category at ${formatCompactMoney(
          byCategory[0].amount,
          currency,
        )} a month.`,
      });
    }

    const yearlyBilled = scopedSubs.filter((s) => s.billingCycle === 'yearly');
    if (yearlyBilled.length > 0) {
      list.push({
        icon: 'calendar-outline',
        title: 'Billed yearly',
        accent: 'saved',
        body: `${yearlyBilled.length} subscription${
          yearlyBilled.length === 1 ? '' : 's'
        } renew${yearlyBilled.length === 1 ? 's' : ''} once a year — easy to forget about.`,
      });
    }

    return list;
  }, [activeSubs, scopedSubs, monthly, byCategory, currency]);

  async function handleRefreshAiInsights() {
    setIsRefreshingAiInsights(true);
    try {
      await refreshAiInsights();
    } finally {
      setIsRefreshingAiInsights(false);
    }
  }

  return (
    <Animated.ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.md, paddingBottom: TAB_BAR_CLEARANCE + space.xxl },
      ]}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <Text style={styles.eyebrow}>SPEND SIGNALS</Text>
      <Text style={t.heading}>Insights</Text>
      <Text style={styles.subtitle}>Understand your recurring spending</Text>

      {isLoading || isLoadingOverview ? (
        <SkeletonList count={5} />
      ) : activeSubs.length === 0 ? (
        <EmptyState
          title="Nothing to analyse yet."
          subtitle="Add a few subscriptions and insights will show up here."
          icon="stats-chart-outline"
        />
      ) : (
        <>
          <View style={styles.heroCard}>
            <Text style={styles.heroKicker}>ANNUAL RUN RATE</Text>
            <View style={styles.heroAmountRow}>
              <Money value={yearly} currency={currency} size="total" />
              <Text style={styles.heroPeriod}>/year</Text>
            </View>
            <Text style={styles.heroSub}>
              {formatCompactMoney(monthly, currency)} each month across {scopedSubs.length}{' '}
              {currency} subscription{scopedSubs.length === 1 ? '' : 's'}.
            </Text>
            {otherCurrenciesNote ? (
              <Text style={styles.heroScope}>{otherCurrenciesNote}.</Text>
            ) : null}
          </View>

          <SectionHeader label="By category" />
          <CategoryBreakdown entries={byCategory} currency={currency} periodLabel="MONTHLY TOTAL" />

          <SectionHeader
            label="AI insights"
            trailing={
              <Pressable onPress={handleRefreshAiInsights} disabled={isRefreshingAiInsights} hitSlop={8}>
                {isRefreshingAiInsights ? (
                  <ActivityIndicator size="small" color={colors.indigo} />
                ) : (
                  <Text style={styles.aiRefresh}>Refresh</Text>
                )}
              </Pressable>
            }
          />
          {isLoadingAiInsights ? (
            <SkeletonList count={2} />
          ) : isAiInsightsError ? (
            <Text style={t.caption}>Couldn't load AI insights — tap Refresh to retry.</Text>
          ) : aiInsights && aiInsights.insights.length === 0 ? (
            <Text style={t.caption}>No AI insights yet — add a few subscriptions first.</Text>
          ) : (
            aiInsights?.insights.map((body, index) => (
              <InsightCard key={index} icon="chart" title="AI insight" body={body} accent="cyan" />
            ))
          )}

          {insights.length > 0 ? (
            <>
              <SectionHeader label="Smart insights" />
              {insights.map((insight) => (
                <InsightCard key={insight.title} {...insight} />
              ))}
            </>
          ) : null}
        </>
      )}
    </Animated.ScrollView>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.paper,
    },
    content: {
      paddingHorizontal: gutter,
      flexGrow: 1,
    },
    subtitle: {
      ...t.caption,
      marginTop: 4,
      marginBottom: space.lg,
    },
    eyebrow: { ...t.label, color: colors.indigo, marginBottom: 5 },
    heroCard: {
      backgroundColor: colors.elevated,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: space.lg,
    },
    heroKicker: {
      ...t.label,
      color: colors.indigo,
    },
    heroAmountRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginTop: space.sm,
    },
    heroPeriod: {
      ...t.caption,
      marginLeft: space.xs,
    },
    heroSub: {
      ...t.caption,
      marginTop: space.sm,
    },
    heroScope: {
      ...t.caption,
      marginTop: space.sm,
      paddingTop: space.sm,
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
      fontSize: 12,
    },
    aiRefresh: {
      ...t.caption,
      color: colors.indigo,
    },
  });
