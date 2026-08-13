import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmountText } from '@/src/components/AmountText';
import { EmptyState } from '@/src/components/EmptyState';
import { Money } from '@/src/components/Money';
import { SectionHeader } from '@/src/components/SectionHeader';
import { SkeletonList } from '@/src/components/SkeletonRow';
import { StatementRow } from '@/src/components/StatementRow';
import { TAB_BAR_CLEARANCE } from '@/src/components/StatementTabBar';
import { useSubscriptions } from '@/src/hooks/useSubscriptions';
import { color, font, gutter, radius, space, text as t } from '@/src/theme';
import { monthlyCost, monthlyTotal } from '@/src/utils/money';
import type { Subscription } from '@/src/types';

const DAY = 24 * 60 * 60 * 1000;

/** Annual spend grouped by category, biggest first. */
function spendByCategory(subs: Subscription[]): { category: string; amount: number }[] {
  const totals = new Map<string, number>();
  for (const sub of subs) {
    const key = sub.category ?? 'Uncategorised';
    totals.set(key, (totals.get(key) ?? 0) + monthlyCost(sub) * 12);
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase();
}

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch, isRefetching } = useSubscriptions();

  const subs = useMemo(() => data ?? [], [data]);
  const monthly = useMemo(() => monthlyTotal(subs), [subs]);
  const annual = monthly * 12;
  const byCategory = useMemo(() => spendByCategory(subs), [subs]);
  const currency = subs[0]?.currency ?? 'INR';

  const sorted = useMemo(
    () =>
      [...subs].sort(
        (a, b) => new Date(a.nextRenewalDate).getTime() - new Date(b.nextRenewalDate).getTime()
      ),
    [subs]
  );

  const dueThisWeek = useMemo(() => {
    const cutoff = Date.now() + 7 * DAY;
    return sorted.filter((s) => new Date(s.nextRenewalDate).getTime() <= cutoff);
  }, [sorted]);

  const isEmpty = subs.length === 0;
  const maxCategory = byCategory[0]?.amount ?? 1;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.lg, paddingBottom: TAB_BAR_CLEARANCE + space.xxl },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={color.indigo} />
      }
    >
      <Text style={styles.wordmark}>SUBSTRACK</Text>

      {isLoading ? (
        <SkeletonList count={6} />
      ) : (
        <>
          <View style={styles.headerCard}>
            <Text style={t.label}>Committed annually</Text>
            <Money value={annual} currency={currency} size="total" animate style={styles.total} />
            <View style={styles.subline}>
              <AmountText value={monthly} currency={currency} tone="muted" size={13} />
              <Text style={styles.sublineText}>
                {' '}
                / month · {subs.length} active
              </Text>
            </View>
          </View>

          {isError ? (
            <Text style={styles.error}>
              Couldn't load your mandates. Pull down to try again.
            </Text>
          ) : null}

          {byCategory.length > 1 ? (
            <>
              <SectionHeader label="Where it goes" />
              <View style={styles.bars}>
                {byCategory.slice(0, 4).map((entry) => (
                  <View key={entry.category} style={styles.barRow}>
                    <Text style={styles.barLabel} numberOfLines={1}>
                      {entry.category}
                    </Text>
                    <AmountText value={entry.amount} currency={currency} size={13} />
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${Math.max(6, (entry.amount / maxCategory) * 100)}%` },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <SectionHeader label="Next 7 days" />
          {dueThisWeek.length > 0 ? (
            dueThisWeek.map((sub, i) => (
              <StatementRow
                key={sub.id}
                name={sub.name}
                amount={sub.cost}
                currency={sub.currency}
                variant="upcoming"
                day={dayLabel(sub.nextRenewalDate)}
                approx={sub.currency !== 'INR'}
                last={i === dueThisWeek.length - 1}
                onPress={() => router.push(`/${sub.id}`)}
              />
            ))
          ) : (
            <View style={styles.quiet}>
              <Text style={t.body}>Nothing due this week.</Text>
              {sorted[0] ? (
                <Text style={t.caption}>
                  Next is {sorted[0].name} on {dateLabel(sorted[0].nextRenewalDate)}.
                </Text>
              ) : null}
            </View>
          )}

          <SectionHeader label={`All mandates · ${subs.length}`} />
          {isEmpty ? (
            <EmptyState
              title="No mandates yet."
              subtitle="Add what's charging you and we'll keep the total honest."
              icon="reader-outline"
              action={{ label: 'Add a mandate', onPress: () => router.push('/add') }}
            />
          ) : (
            sorted.map((sub, i) => (
              <StatementRow
                key={sub.id}
                name={sub.name}
                amount={sub.cost}
                currency={sub.currency}
                sublabel={`${sub.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} · ${
                  sub.category ?? 'Uncategorised'
                }`}
                approx={sub.currency !== 'INR'}
                last={i === sorted.length - 1}
                onPress={() => router.push(`/${sub.id}`)}
              />
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.paper,
  },
  content: {
    paddingHorizontal: gutter,
    flexGrow: 1,
  },
  wordmark: {
    fontFamily: font.monoMed,
    fontSize: 11,
    letterSpacing: 2,
    color: color.indigo,
    marginBottom: space.lg,
  },
  headerCard: {
    backgroundColor: color.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.hairline,
    padding: space.lg,
  },
  total: {
    marginTop: space.sm,
  },
  subline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.sm,
  },
  sublineText: {
    ...t.caption,
  },
  error: {
    ...t.caption,
    color: color.debit,
    marginTop: space.md,
  },
  bars: {
    marginTop: space.md,
    gap: space.md,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  barLabel: {
    ...t.caption,
    color: color.ink,
    flex: 1,
  },
  barTrack: {
    width: 64,
    height: 8,
    backgroundColor: color.indigoBg,
  },
  barFill: {
    height: '100%',
    backgroundColor: color.indigo,
  },
  quiet: {
    paddingVertical: space.lg,
    gap: space.xs,
  },
});
