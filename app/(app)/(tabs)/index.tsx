import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { EmptyState } from '@/src/components/EmptyState';
import { Icon } from '@/src/components/Icon';
import { Logo } from '@/src/components/Logo';
import { MultiRenewalSheet } from '@/src/components/MultiRenewalSheet';
import { SectionHeader } from '@/src/components/SectionHeader';
import { SkeletonList } from '@/src/components/SkeletonRow';
import { SpendingHero } from '@/src/components/SpendingHero';
import {
  SpendingTrendChart,
  type ForecastRange,
} from '@/src/components/SpendingTrendChart';
import { TAB_BAR_CLEARANCE } from '@/src/components/BottomNav';
import { UpcomingPayment } from '@/src/components/UpcomingPayment';
import { useAuth } from '@/src/hooks/useAuth';
import { useMe } from '@/src/hooks/useMe';
import { pickPrimaryCurrency, useOverview, useSpendTrend } from '@/src/hooks/useAnalytics';
import { useTabBarScroll } from '@/src/hooks/useTabBarScroll';
import { useTheme } from '@/src/hooks/useTheme';
import { useSubscriptions } from '@/src/hooks/useSubscriptions';
import { font, gutter, space, type Palette, type TextStyles } from '@/src/theme';
import { groupByRenewalDate, type RenewalGroup } from '@/src/utils/subscriptions';
import type { RenewalForecastPoint } from '@/src/utils/subscriptions';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function OverviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: me } = useMe();
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const { data, isLoading, isError, refetch, isRefetching } = useSubscriptions();
  const {
    data: overview,
    isLoading: isLoadingOverview,
    isError: isOverviewError,
    refetch: refetchOverview,
  } = useOverview();
  const { onScroll } = useTabBarScroll();

  async function handleRefresh() {
    await Promise.all([refetch(), refetchOverview()]);
  }

  const [activeGroup, setActiveGroup] = useState<RenewalGroup | null>(null);
  const [forecastRange, setForecastRange] = useState<ForecastRange>(6);

  const subs = useMemo(() => data ?? [], [data]);
  const activeSubs = useMemo(
    () => subs.filter((subscription) => subscription.status === 'active'),
    [subs],
  );

  const { primary, excludedCount, excludedCurrencies } = useMemo(
    () => pickPrimaryCurrency(overview?.currencies ?? []),
    [overview],
  );
  const currency = primary?.currency ?? 'INR';
  const monthly = primary ? Number(primary.monthlyCommitment) : 0;
  const yearly = primary ? Number(primary.annualRunRate) : 0;
  const monthChange = primary?.changePercent != null ? Number(primary.changePercent) : null;

  const { data: trend } = useSpendTrend(forecastRange, primary?.currency);
  const forecastPoints = useMemo<RenewalForecastPoint[]>(() => {
    const points = trend?.series.find((s) => s.currency === currency)?.points ?? [];
    return points.map((point) => {
      const [year, month] = point.month.split('-').map(Number);
      return {
        monthKey: point.month,
        label: new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'short' }),
        amount: Number(point.scheduledAmount),
        count: point.renewalCount,
      };
    });
  }, [trend, currency]);

  const renewalGroups = useMemo(() => groupByRenewalDate(subs), [subs]);
  const upcomingGroups = useMemo(() => renewalGroups.slice(0, 5), [renewalGroups]);

  const isEmpty = !isLoading && activeSubs.length === 0;

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
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={colors.indigo} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{greeting()}</Text>
          <Text style={styles.overviewTitle}>Overview</Text>
        </View>
        <Pressable
          hitSlop={10}
          onPress={() => router.push('/account')}
          accessibilityRole="button"
          accessibilityLabel="Open settings and Pro plans"
          style={({ pressed }) => [styles.accountButton, pressed && styles.accountButtonPressed]}
        >
          <Logo name={user?.email || '?'} size={30} imageUri={me?.avatarUrl ?? undefined} />
          <Text style={styles.accountLabel}>Account</Text>
          <Icon name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
      </View>

      {isLoading || isLoadingOverview ? (
        <SkeletonList count={5} />
      ) : (
        <>
          <SpendingHero
            monthly={monthly}
            yearly={yearly}
            currency={currency}
            activeCount={primary?.activeCount ?? 0}
            deltaPercent={monthChange}
            scopeNote={
              excludedCount > 0
                ? `${currency} totals only · ${excludedCount} subscription${excludedCount === 1 ? '' : 's'} in ${excludedCurrencies.join(', ')} shown separately`
                : undefined
            }
          />

          {isError ? <Text style={styles.error}>Couldn't refresh — showing the last data.</Text> : null}
          {isOverviewError ? (
            <Text style={styles.error}>Couldn't load spend totals — pull down to retry.</Text>
          ) : null}

          <SectionHeader
            label="Coming up"
            trailing={
              <Pressable
                onPress={() => router.push('/subscriptions')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="See all subscriptions"
              >
                <Text style={styles.link}>See all</Text>
              </Pressable>
            }
          />
          {isEmpty ? (
            <EmptyState
              title="No subscriptions yet."
              subtitle="Add what's charging you and we'll keep the total honest."
              icon="reader-outline"
              action={{ label: 'Add a subscription', onPress: () => router.push('/add') }}
            />
          ) : upcomingGroups.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.upcomingRow}
            >
              {upcomingGroups.map((group) => (
                <UpcomingPayment
                  key={group.dateKey}
                  subs={group.subs}
                  onPress={() => setActiveGroup(group)}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={t.caption}>Nothing scheduled right now.</Text>
          )}

          <SectionHeader label="Renewal forecast" />
          {activeSubs.length > 0 ? (
            <SpendingTrendChart
              data={forecastPoints}
              currency={currency}
              months={forecastRange}
              onMonthsChange={setForecastRange}
            />
          ) : (
            <Text style={t.caption}>Add a subscription to see your forecast.</Text>
          )}

        </>
      )}

      <MultiRenewalSheet
        visible={!!activeGroup}
        onClose={() => setActiveGroup(null)}
        date={activeGroup?.date ?? null}
        subs={activeGroup?.subs ?? []}
      />
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.md,
      marginBottom: space.xl,
    },
    headerCopy: {
      flex: 1,
      minWidth: 0,
    },
    eyebrow: { ...t.label, color: colors.indigo, marginBottom: 3 },
    overviewTitle: {
      fontFamily: font.sansMed,
      fontSize: 26,
      lineHeight: 31,
      letterSpacing: -0.6,
      color: colors.ink,
    },
    accountButton: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingLeft: 5,
      paddingRight: space.sm,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: 22,
      backgroundColor: colors.surface,
    },
    accountButtonPressed: {
      opacity: 0.72,
    },
    accountLabel: {
      fontFamily: font.sansMed,
      fontSize: 12,
      color: colors.ink,
    },
    error: {
      ...t.caption,
      color: colors.debit,
      marginTop: space.md,
    },
    link: {
      ...t.caption,
      color: colors.indigo,
    },
    upcomingRow: {
      gap: space.sm,
      paddingRight: gutter,
    },
  });
