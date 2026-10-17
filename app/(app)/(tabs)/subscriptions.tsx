import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TAB_BAR_CLEARANCE } from '@/src/components/BottomNav';
import { EmptyState } from '@/src/components/EmptyState';
import { FilterChips } from '@/src/components/FilterChips';
import { SearchBar } from '@/src/components/SearchBar';
import { SkeletonList } from '@/src/components/SkeletonRow';
import { SubscriptionCard } from '@/src/components/SubscriptionCard';
import { SwipeableGroup, SwipeableRow } from '@/src/components/SwipeableRow';
import { useUndoableActions } from '@/src/hooks/useUndoableActions';
import { useOverview, useSpendHeadline } from '@/src/hooks/useAnalytics';
import { useSubscriptions } from '@/src/hooks/useSubscriptions';
import { useTabBarScroll } from '@/src/hooks/useTabBarScroll';
import { useTheme } from '@/src/hooks/useTheme';
import { gutter, space, type Palette, type TextStyles } from '@/src/theme';
import { formatCompactMoney } from '@/src/utils/money';
import { daysUntil } from '@/src/utils/subscriptions';
import type { Subscription } from '@/src/types';

type Bucket = 'Paused' | 'This week' | 'Later this month' | 'Later';
const BUCKET_ORDER: Bucket[] = ['This week', 'Later this month', 'Later', 'Paused'];
const ENTER_STAGGER_MS = 40;
const ENTER_MAX_STAGGERED = 8;

function bucketFor(sub: Subscription): Bucket {
  if (sub.status === 'paused') return 'Paused';
  const days = daysUntil(sub.nextRenewalDate);
  if (days <= 7) return 'This week';
  if (days <= 31) return 'Later this month';
  return 'Later';
}

export default function SubscriptionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const { data, isLoading, refetch, isRefetching } = useSubscriptions();
  const { data: overview, refetch: refetchOverview } = useOverview();
  const { onScroll } = useTabBarScroll();
  const { remove, setPaused } = useUndoableActions();

  async function handleRefresh() {
    await Promise.all([refetch(), refetchOverview()]);
  }

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const subs = useMemo(() => data ?? [], [data]);
  const activeCount = useMemo(
    () => subs.filter((subscription) => subscription.status === 'active').length,
    [subs],
  );
  const { currency, monthly, note: otherCurrenciesNote } = useSpendHeadline(overview);

  const categories = useMemo(() => {
    const set = new Set<string>();
    subs.forEach((s) => set.add(s.category ?? 'Other'));
    return ['All', ...[...set].sort()];
  }, [subs]);

  const filtered = useMemo(() => {
    return subs
      .filter((s) => (category === 'All' ? true : (s.category ?? 'Other') === category))
      .filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => new Date(a.nextRenewalDate).getTime() - new Date(b.nextRenewalDate).getTime());
  }, [subs, category, query]);

  const sections = useMemo(() => {
    const byBucket = new Map<Bucket, Subscription[]>();
    filtered.forEach((sub) => {
      const key = bucketFor(sub);
      byBucket.set(key, [...(byBucket.get(key) ?? []), sub]);
    });
    return BUCKET_ORDER.filter((key) => byBucket.has(key)).map((key) => ({
      key,
      items: byBucket.get(key)!,
    }));
  }, [filtered]);

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
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
          <Text style={styles.eyebrow}>YOUR LEDGER</Text>
          <Text style={t.heading}>Subscriptions</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>{activeCount} active</Text>
          <Text style={styles.statDot}>·</Text>
          <Text style={styles.statText}>
            {formatCompactMoney(monthly, currency)}/month
          </Text>
        </View>
        {otherCurrenciesNote ? (
          <Text style={styles.scopeHint}>Total shows {currency}; {otherCurrenciesNote}.</Text>
        ) : null}

        <View style={styles.searchRow}>
          <SearchBar value={query} onChangeText={setQuery} />
        </View>

        {categories.length > 1 ? (
          <View style={styles.filterRow}>
            <FilterChips options={categories} value={category} onChange={setCategory} />
          </View>
        ) : null}

        {isLoading ? (
          <SkeletonList count={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={subs.length === 0 ? 'No subscriptions yet.' : 'Nothing matches.'}
            subtitle={
              subs.length === 0
                ? "Add what's charging you and we'll keep the total honest."
                : 'Try a different search or filter.'
            }
            icon="reader-outline"
            action={
              subs.length === 0 ? { label: 'Add a subscription', onPress: () => router.push('/add') } : undefined
            }
          />
        ) : (
          <SwipeableGroup style={styles.list}>
            {sections.map((section, sectionIndex) => (
              <View key={section.key}>
                <View style={styles.bucketHeader}>
                  <Text style={styles.bucketLabel}>{section.key}</Text>
                  <Text style={styles.bucketCount}>{section.items.length}</Text>
                </View>
                {section.items.map((sub, index) => {
                  const order = sections
                    .slice(0, sectionIndex)
                    .reduce((n, s) => n + s.items.length, 0) + index;
                  return (
                    <Animated.View
                      key={sub.id}
                      entering={
                        order < ENTER_MAX_STAGGERED
                          ? FadeInDown.duration(280).delay(order * ENTER_STAGGER_MS)
                          : undefined
                      }
                    >
                      <SwipeableRow
                        actions={[
                          {
                            label: sub.status === 'paused' ? 'Resume' : 'Pause',
                            tone: 'primary',
                            onPress: () => setPaused(sub, sub.status !== 'paused'),
                          },
                          { label: 'Remove', tone: 'danger', onPress: () => remove(sub) },
                        ]}
                      >
                        <SubscriptionCard
                          subscription={sub}
                          onPress={() => router.push(`/${sub.id}`)}
                        />
                      </SwipeableRow>
                    </Animated.View>
                  );
                })}
              </View>
            ))}
          </SwipeableGroup>
        )}
      </Animated.ScrollView>
    </View>
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
      marginBottom: space.xs,
    },
    eyebrow: { ...t.label, color: colors.indigo, marginBottom: 5 },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      marginBottom: space.lg,
    },
    statText: {
      ...t.caption,
    },
    statDot: {
      ...t.caption,
    },
    scopeHint: {
      ...t.caption,
      marginTop: -space.sm,
      marginBottom: space.lg,
      fontSize: 12,
    },
    searchRow: {
      marginBottom: space.md,
    },
    filterRow: {
      marginBottom: space.lg,
    },
    list: {
      marginTop: space.xs,
    },
    bucketHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: space.lg,
      marginBottom: space.xs,
    },
    bucketLabel: { ...t.label, color: colors.muted },
    bucketCount: { ...t.label, color: colors.faint },
  });
