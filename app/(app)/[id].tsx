import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AmountText } from '@/src/components/AmountText';
import { Button } from '@/src/components/Button';
import { CategoryChip } from '@/src/components/CategoryChip';
import { KeyValueRow } from '@/src/components/KeyValueRow';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SectionHeader } from '@/src/components/SectionHeader';
import { SkeletonList } from '@/src/components/SkeletonRow';
import { SubscriptionIcon } from '@/src/components/SubscriptionIcon';
import { useDeleteSubscription, useSubscription } from '@/src/hooks/useSubscriptions';
import { useTheme } from '@/src/hooks/useTheme';
import { font, gutter, radius, space, type Palette, type TextStyles } from '@/src/theme';
import { longDate, synthesizePaymentHistory } from '@/src/utils/subscriptions';

const formatDate = longDate;

type Tab = 'details' | 'history';

export default function DetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const router = useRouter();
  const { data: subscription, isLoading, isError } = useSubscription(id);
  const deleteMutation = useDeleteSubscription();
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const [tab, setTab] = useState<Tab>('details');

  if (isLoading) {
    return (
      <Screen>
        <ScreenHeader />
        <SkeletonList count={4} />
      </Screen>
    );
  }

  if (isError || !subscription) {
    return (
      <Screen>
        <ScreenHeader />
        <Text style={styles.error}>
          Couldn't load this mandate. Go back and pull the list down to retry.
        </Text>
      </Screen>
    );
  }

  function handleDelete() {
    Alert.alert(
      'Remove this mandate?',
      `${subscription!.name} comes off your list. It does not cancel the mandate with your bank — only the app that created it can do that.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteMutation.mutateAsync(subscription!.id);
            router.back();
          },
        },
      ]
    );
  }

  const history = synthesizePaymentHistory(subscription);

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          right={
            <Button
              label="Edit"
              variant="ghost"
              onPress={() => router.push(`/add?id=${subscription.id}`)}
              style={styles.editButton}
            />
          }
        />

        <View style={styles.hero}>
          <SubscriptionIcon name={subscription.name} size={64} />
          <Text style={styles.name} numberOfLines={2}>
            {subscription.name}
          </Text>
          <View style={styles.chips}>
            <CategoryChip label={subscription.category ?? 'Other'} />
            {subscription.plan ? <CategoryChip label={subscription.plan} /> : null}
            {subscription.source ? <CategoryChip label={subscription.source} /> : null}
          </View>
        </View>

        <View style={styles.tabSwitch}>
          <Pressable
            onPress={() => setTab('details')}
            style={[styles.tabItem, tab === 'details' && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, tab === 'details' && styles.tabTextActive]}>Details</Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('history')}
            style={[styles.tabItem, tab === 'history' && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>History</Text>
          </Pressable>
        </View>

        {tab === 'details' ? (
          <>
            <KeyValueRow label="Amount">
              <AmountText
                value={subscription.cost}
                currency={subscription.currency}
                round={false}
                tone="debit"
              />
            </KeyValueRow>
            <KeyValueRow
              label="Cycle"
              value={subscription.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
            />
            <KeyValueRow label="Next renewal" value={formatDate(subscription.nextRenewalDate)} />
            {subscription.source ? (
              <KeyValueRow label="Paid via" value={subscription.source} />
            ) : null}
            <KeyValueRow
              label="Added on"
              value={formatDate(subscription.createdAt)}
              last={!subscription.note}
            />
            {subscription.note ? (
              <KeyValueRow label="Note" value={subscription.note} last />
            ) : null}
          </>
        ) : history.length > 0 ? (
          history.map((h, i) => (
            <KeyValueRow key={h.date} label={formatDate(h.date)} last={i === history.length - 1}>
              <AmountText value={h.amount} currency={subscription.currency} tone="muted" />
            </KeyValueRow>
          ))
        ) : (
          <Text style={t.caption}>No payment history yet.</Text>
        )}

        <View style={styles.actions}>
          <Button
            label="Pause"
            variant="secondary"
            onPress={() => Alert.alert('Coming soon', 'Pausing a subscription isn’t wired up yet.')}
          />
          <Button
            label="Cancel subscription"
            variant="ghost"
            onPress={handleDelete}
            loading={deleteMutation.isPending}
            style={styles.cancelButton}
          />
          <Text style={styles.honesty}>
            {subscription.source
              ? `We can't cancel this for you — it can only be stopped in ${subscription.source}.`
              : "We can't cancel this for you — it can only be stopped in the app that created it."}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: gutter,
      paddingBottom: space.huge,
    },
    error: {
      ...t.body,
      color: colors.debit,
    },
    editButton: {
      height: 36,
      paddingHorizontal: space.sm,
    },
    hero: {
      alignItems: 'center',
      gap: space.sm,
      marginTop: space.sm,
      marginBottom: space.lg,
    },
    name: {
      ...t.title,
      textAlign: 'center',
    },
    chips: {
      flexDirection: 'row',
      gap: space.sm,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    tabSwitch: {
      flexDirection: 'row',
      backgroundColor: colors.isDark ? 'rgba(255,255,255,0.06)' : colors.paper2,
      borderRadius: radius.cardSm,
      padding: 3,
      marginTop: space.md,
      marginBottom: space.sm,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: space.sm,
      borderRadius: radius.cardSm - 3,
    },
    tabItemActive: {
      backgroundColor: colors.surface,
    },
    tabText: {
      ...t.caption,
      fontSize: 13,
      color: colors.muted,
    },
    tabTextActive: {
      color: colors.ink,
      fontFamily: font.sansMed,
    },
    actions: {
      marginTop: space.xxl,
      gap: space.md,
    },
    cancelButton: {
      marginTop: 0,
    },
    honesty: {
      ...t.caption,
      textAlign: 'center',
      marginTop: space.xs,
    },
  });
