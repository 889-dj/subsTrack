import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { EmptyState } from '@/src/components/EmptyState';
import { Logo } from '@/src/components/Logo';
import { MultiRenewalSheet } from '@/src/components/MultiRenewalSheet';
import { SectionHeader } from '@/src/components/SectionHeader';
import { SkeletonList } from '@/src/components/SkeletonRow';
import { SpendingHero } from '@/src/components/SpendingHero';
import { SpendingTrendChart, type ChartVariant } from '@/src/components/SpendingTrendChart';
import { TAB_BAR_CLEARANCE } from '@/src/components/BottomNav';
import { UpcomingPayment } from '@/src/components/UpcomingPayment';
import { useAuth } from '@/src/hooks/useAuth';
import { useTabBarScroll } from '@/src/hooks/useTabBarScroll';
import { useTheme } from '@/src/hooks/useTheme';
import { useSubscriptions } from '@/src/hooks/useSubscriptions';
import { gutter, space, type Palette, type TextStyles } from '@/src/theme';
import { monthlyTotal } from '@/src/utils/money';
import {
  groupByRenewalDate,
  synthesizeSpendTrend,
  type RenewalGroup,
} from '@/src/utils/subscriptions';

const RANGES = ['1M', '3M', '6M', '1Y'] as const;
type Range = (typeof RANGES)[number];
const RANGE_POINTS: Record<Range, number> = { '1M': 6, '3M': 9, '6M': 12, '1Y': 12 };

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
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const { data, isLoading, isError, refetch, isRefetching } = useSubscriptions();
  const { onScroll } = useTabBarScroll();

  const [range, setRange] = useState<Range>('6M');
  const [chartVariant, setChartVariant] = useState<ChartVariant>('area');
  const [activeGroup, setActiveGroup] = useState<RenewalGroup | null>(null);

  const subs = useMemo(() => data ?? [], [data]);
  const monthly = useMemo(() => monthlyTotal(subs), [subs]);
  const yearly = monthly * 12;
  const currency = subs[0]?.currency ?? 'INR';

  const renewalGroups = useMemo(() => groupByRenewalDate(subs), [subs]);
  const upcomingGroups = useMemo(() => renewalGroups.slice(0, 5), [renewalGroups]);

  const trend = useMemo(() => synthesizeSpendTrend(subs, RANGE_POINTS[range]), [subs, range]);

  // Illustrative delta only — there's no real spend history in the mock
  // backend, so this is derived deterministically from the trend rather than
  // fabricated with a random number each render.
  const deltaPercent = useMemo(() => {
    if (trend.length < 2) return undefined;
    const prev = trend[trend.length - 2];
    if (!prev) return undefined;
    return ((trend[trend.length - 1] - prev) / prev) * 100;
  }, [trend]);

  const name = user?.email?.split('@')[0] || 'there';
  const isEmpty = !isLoading && subs.length === 0;

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
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.indigo} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>{greeting()}</Text>
          <Text style={t.heading} numberOfLines={1}>{name}'s overview</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            hitSlop={10}
            onPress={() => router.push('/account')}
            accessibilityRole="button"
            accessibilityLabel="Open settings and Pro plans"
          >
            <Logo name={user?.email || '?'} size={36} />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <SkeletonList count={5} />
      ) : (
        <>
          <SpendingHero
            monthly={monthly}
            yearly={yearly}
            currency={currency}
            activeCount={subs.length}
            deltaPercent={deltaPercent}
          />

          {isError ? <Text style={styles.error}>Couldn't refresh — showing the last data.</Text> : null}

          <SectionHeader
            label="Coming up"
            trailing={
              <Pressable onPress={() => router.push('/subscriptions')} hitSlop={8}>
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

          <View style={styles.spendingHeader}>
            <Text style={t.section}>Spending</Text>
            <View style={styles.segmented}>
              {RANGES.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRange(r)}
                  style={[styles.segment, range === r && styles.segmentActive]}
                >
                  <Text style={[styles.segmentText, range === r && styles.segmentTextActive]}>
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          {subs.length > 0 ? (
            <SpendingTrendChart
              trend={trend}
              variant={chartVariant}
              onVariantChange={setChartVariant}
            />
          ) : (
            <Text style={t.caption}>Add a subscription to see your trend.</Text>
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
      marginBottom: space.xl,
    },
    headerText: {
      flex: 1,
      marginRight: space.md,
    },
    subtitle: {
      ...t.caption,
      marginTop: 4,
    },
    eyebrow: { ...t.label, color: colors.indigo, marginBottom: 5 },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
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
    spendingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: space.xl,
    },
    segmented: {
      flexDirection: 'row',
      backgroundColor: colors.isDark ? 'rgba(255,255,255,0.06)' : colors.paper2,
      borderRadius: 10,
      padding: 2,
    },
    segment: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    segmentActive: {
      backgroundColor: colors.indigo,
    },
    segmentText: {
      fontSize: 11,
      color: colors.muted,
    },
    segmentTextActive: {
      color: colors.white,
    },
  });
