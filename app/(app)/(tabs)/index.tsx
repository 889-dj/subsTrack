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
import {
  SpendingTrendChart,
  type ForecastRange,
} from '@/src/components/SpendingTrendChart';
import { TAB_BAR_CLEARANCE } from '@/src/components/BottomNav';
import { UpcomingPayment } from '@/src/components/UpcomingPayment';
import { useAuth } from '@/src/hooks/useAuth';
import { useTabBarScroll } from '@/src/hooks/useTabBarScroll';
import { useTheme } from '@/src/hooks/useTheme';
import { useSubscriptions } from '@/src/hooks/useSubscriptions';
import { gutter, space, type Palette, type TextStyles } from '@/src/theme';
import { monthlyTotal } from '@/src/utils/money';
import { groupByRenewalDate, type RenewalGroup } from '@/src/utils/subscriptions';

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

  const [activeGroup, setActiveGroup] = useState<RenewalGroup | null>(null);
  const [forecastRange, setForecastRange] = useState<ForecastRange>(6);

  const subs = useMemo(() => data ?? [], [data]);
  const monthly = useMemo(() => monthlyTotal(subs), [subs]);
  const yearly = monthly * 12;
  const currency = subs[0]?.currency ?? 'INR';

  const renewalGroups = useMemo(() => groupByRenewalDate(subs), [subs]);
  const upcomingGroups = useMemo(() => renewalGroups.slice(0, 5), [renewalGroups]);

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
          <Text style={t.heading} numberOfLines={1}>Your subscriptions</Text>
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

          <SectionHeader label="Renewal forecast" />
          {subs.length > 0 ? (
            <SpendingTrendChart
              subscriptions={subs}
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
  });
