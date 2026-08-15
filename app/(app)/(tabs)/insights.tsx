import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { useSubscriptions } from '@/src/hooks/useSubscriptions';
import { useTabBarScroll } from '@/src/hooks/useTabBarScroll';
import { useTheme } from '@/src/hooks/useTheme';
import { gutter, radius, space, type Palette, type TextStyles } from '@/src/theme';
import { monthlyCost, monthlyTotal } from '@/src/utils/money';
import { spendByCategory, upcoming } from '@/src/utils/subscriptions';

type Accent = 'indigo' | 'cyan' | 'pink' | 'warning' | 'saved';

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const { data, isLoading } = useSubscriptions();
  const { onScroll } = useTabBarScroll();

  const subs = useMemo(() => data ?? [], [data]);
  const monthly = useMemo(() => monthlyTotal(subs), [subs]);
  const yearly = monthly * 12;
  const currency = subs[0]?.currency ?? 'INR';
  const byCategory = useMemo(() => spendByCategory(subs), [subs]);

  const insights = useMemo(() => {
    if (subs.length === 0) return [];
    const list: { icon: IconName; title: string; body: string; accent: Accent }[] = [];

    const soon = upcoming(subs, 5);
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

    const biggest = [...subs].sort((a, b) => monthlyCost(b) - monthlyCost(a))[0];
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
        body: `${byCategory[0].category} is your largest category at ${currency} ${Math.round(
          byCategory[0].amount
        ).toLocaleString('en-IN')} a year.`,
      });
    }

    const yearlyBilled = subs.filter((s) => s.billingCycle === 'yearly');
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
  }, [subs, monthly, byCategory, currency]);

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
      <Text style={t.heading}>Insights</Text>
      <Text style={styles.subtitle}>Understand your recurring spending</Text>

      {isLoading ? (
        <SkeletonList count={5} />
      ) : subs.length === 0 ? (
        <EmptyState
          title="Nothing to analyse yet."
          subtitle="Add a few subscriptions and insights will show up here."
          icon="stats-chart-outline"
        />
      ) : (
        <>
          <View style={styles.heroCard}>
            <Text style={styles.heroLine}>
              You spend <Money value={yearly} currency={currency} size="total" style={styles.heroInline} />{' '}
              per year on subscriptions
            </Text>
            <Text style={styles.heroSub}>
              That's {currency} {Math.round(monthly).toLocaleString('en-IN')} every month
            </Text>
          </View>

          <SectionHeader label="By category" />
          <CategoryBreakdown entries={byCategory} currency={currency} />

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
    heroCard: {
      backgroundColor: colors.elevated,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: space.xl,
    },
    heroLine: {
      ...t.title,
      fontSize: 21,
      lineHeight: 30,
    },
    heroInline: {
      fontSize: 21,
      lineHeight: 30,
    },
    heroSub: {
      ...t.caption,
      marginTop: space.sm,
    },
  });
