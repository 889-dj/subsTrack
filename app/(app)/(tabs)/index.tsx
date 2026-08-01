import React, { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { Spinner } from '@/src/components/Spinner';
import { SubscriptionRow } from '@/src/components/SubscriptionRow';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FLOATING_TAB_BAR_HEIGHT } from '@/src/components/FloatingTabBar';
import { useSubscriptions } from '@/src/hooks/useSubscriptions';
import { colors, radius, spacing, typography } from '@/src/theme';
import { formatMoney, monthlyCost, monthlyTotal } from '@/src/utils/money';
import type { Subscription } from '@/src/types';

/** Monthly spend grouped by category, biggest first. */
function spendByCategory(subs: Subscription[]): { category: string; amount: number }[] {
  const totals = new Map<string, number>();
  for (const sub of subs) {
    const key = sub.category ?? 'Uncategorised';
    totals.set(key, (totals.get(key) ?? 0) + monthlyCost(sub));
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: subscriptions, isLoading, isError, refetch, isRefetching } = useSubscriptions();

  const subs = useMemo(() => subscriptions ?? [], [subscriptions]);
  const total = useMemo(() => monthlyTotal(subs), [subs]);
  const byCategory = useMemo(() => spendByCategory(subs), [subs]);
  const currency = subs[0]?.currency ?? 'INR';

  const nextRenewal = useMemo<Subscription | null>(() => {
    if (subs.length === 0) return null;
    return [...subs].sort(
      (a, b) => new Date(a.nextRenewalDate).getTime() - new Date(b.nextRenewalDate).getTime()
    )[0];
  }, [subs]);

  if (isLoading) return <Spinner />;

  const isEmpty = subs.length === 0;

  return (
    <View style={styles.container}>
      <FlatList
        data={subs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: FLOATING_TAB_BAR_HEIGHT + spacing.xl,
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.greeting}>Your subscriptions</Text>

            {!isEmpty ? (
              <Card style={styles.totalCard}>
                <Text style={styles.totalLabel}>Monthly total</Text>
                <Text style={styles.totalValue}>{formatMoney(total, currency)}</Text>
                {nextRenewal ? (
                  <Text style={styles.nextRenewal}>
                    Next: {nextRenewal.name} on{' '}
                    {new Date(nextRenewal.nextRenewalDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                ) : null}

                {byCategory.length > 1 ? (
                  <View style={styles.breakdown}>
                    {byCategory.slice(0, 4).map((entry) => (
                      <View key={entry.category} style={styles.breakdownRow}>
                        <View style={styles.breakdownTrack}>
                          <View
                            style={[
                              styles.breakdownBar,
                              { width: `${Math.max(4, (entry.amount / total) * 100)}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.breakdownCategory} numberOfLines={1}>
                          {entry.category}
                        </Text>
                        <Text style={styles.breakdownAmount}>
                          {formatMoney(entry.amount, currency)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Card>
            ) : null}

            <Pressable style={styles.uploadCta} onPress={() => router.push('/upload')}>
              <View style={styles.uploadIcon}>
                <Ionicons name="scan-outline" size={22} color={colors.white} />
              </View>
              <View style={styles.uploadCopy}>
                <Text style={styles.uploadTitle}>Scan a bank statement</Text>
                <Text style={styles.uploadSubtitle}>
                  We'll find the recurring charges and categorise them for you
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.white} />
            </Pressable>

            {isError ? (
              <Text style={styles.errorBanner}>Couldn't load your subscriptions. Pull to retry.</Text>
            ) : null}

            {!isEmpty ? <Text style={styles.sectionLabel}>All subscriptions</Text> : null}
          </View>
        }
        renderItem={({ item }) => (
          <SubscriptionRow subscription={item} onPress={() => router.push(`/${item.id}`)} />
        )}
        ListEmptyComponent={
          !isError ? (
            <EmptyState
              title="Nothing tracked yet"
              subtitle="Upload a statement above and we'll pull out your subscriptions automatically."
            />
          ) : null
        }
        ListFooterComponent={
          <Pressable style={styles.manualLink} onPress={() => router.push('/add')} hitSlop={8}>
            <Ionicons name="add" size={16} color={colors.accent} />
            <Text style={styles.manualLinkText}>Add one manually</Text>
          </Pressable>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    flexGrow: 1,
  },
  greeting: {
    ...typography.title,
    marginBottom: spacing.md,
  },
  totalCard: {
    marginBottom: spacing.md,
  },
  totalLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
  },
  nextRenewal: {
    ...typography.bodyMuted,
    marginTop: spacing.sm,
  },
  breakdown: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  breakdownTrack: {
    width: 56,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accentMuted,
    overflow: 'hidden',
  },
  breakdownBar: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  breakdownCategory: {
    ...typography.bodyMuted,
    flex: 1,
  },
  breakdownAmount: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  uploadCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  uploadIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCopy: {
    flex: 1,
  },
  uploadTitle: {
    ...typography.subheading,
    color: colors.white,
    marginBottom: 2,
  },
  uploadSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 17,
  },
  sectionLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  errorBanner: {
    ...typography.bodyMuted,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  manualLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  manualLinkText: {
    ...typography.bodyMuted,
    color: colors.accent,
    fontWeight: '600',
  },
});
