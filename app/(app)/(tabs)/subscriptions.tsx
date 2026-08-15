import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { TAB_BAR_CLEARANCE } from '@/src/components/BottomNav';
import { EmptyState } from '@/src/components/EmptyState';
import { FilterChips } from '@/src/components/FilterChips';
import { SearchBar } from '@/src/components/SearchBar';
import { SkeletonList } from '@/src/components/SkeletonRow';
import { SubscriptionCard } from '@/src/components/SubscriptionCard';
import { useSubscriptions } from '@/src/hooks/useSubscriptions';
import { useTabBarScroll } from '@/src/hooks/useTabBarScroll';
import { useTheme } from '@/src/hooks/useTheme';
import { gutter, space, type Palette, type TextStyles } from '@/src/theme';
import { monthlyTotal } from '@/src/utils/money';

export default function SubscriptionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const { data, isLoading, refetch, isRefetching } = useSubscriptions();
  const { onScroll } = useTabBarScroll();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const subs = useMemo(() => data ?? [], [data]);
  const monthly = useMemo(() => monthlyTotal(subs), [subs]);
  const currency = subs[0]?.currency ?? 'INR';

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
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.indigo} />
        }
      >
        <View style={styles.header}>
          <Text style={t.heading}>Subscriptions</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>{subs.length} active</Text>
          <Text style={styles.statDot}>·</Text>
          <Text style={styles.statText}>
            {currency} {Math.round(monthly).toLocaleString('en-IN')}/month
          </Text>
        </View>

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
          <View style={styles.list}>
            {filtered.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                subscription={sub}
                onPress={() => router.push(`/${sub.id}`)}
              />
            ))}
          </View>
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
    searchRow: {
      marginBottom: space.md,
    },
    filterRow: {
      marginBottom: space.lg,
    },
    list: {
      marginTop: space.xs,
    },
  });
