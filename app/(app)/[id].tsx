import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AmountText } from '@/src/components/AmountText';
import { Button } from '@/src/components/Button';
import { CategoryChip } from '@/src/components/CategoryChip';
import { KeyValueRow } from '@/src/components/KeyValueRow';
import { Logo } from '@/src/components/Logo';
import { Money } from '@/src/components/Money';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SectionHeader } from '@/src/components/SectionHeader';
import { SkeletonList } from '@/src/components/SkeletonRow';
import { useDeleteSubscription, useSubscription } from '@/src/hooks/useSubscriptions';
import { useTheme } from '@/src/hooks/useTheme';
import { gutter, space, type Palette, type TextStyles } from '@/src/theme';
import { monthlyCost } from '@/src/utils/money';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function DetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const router = useRouter();
  const { data: subscription, isLoading, isError } = useSubscription(id);
  const deleteMutation = useDeleteSubscription();
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);

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

  const yearly = monthlyCost(subscription) * 12;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader />

        <View style={styles.identity}>
          <Logo name={subscription.name} size={48} />
          <View style={styles.identityText}>
            <Text style={t.title} numberOfLines={2}>
              {subscription.name}
            </Text>
            <View style={styles.chips}>
              <CategoryChip label={subscription.category ?? 'Uncategorised'} />
              {subscription.source ? <CategoryChip label={subscription.source} /> : null}
            </View>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={t.label}>Committed annually</Text>
          <Money value={yearly} currency={subscription.currency} size="total" style={styles.heroNumber} />
        </View>

        <SectionHeader label="The mandate" />
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
        <KeyValueRow label="Next debit" value={formatDate(subscription.nextRenewalDate)} />
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

        <View style={styles.actions}>
          <Button
            label="Edit"
            variant="secondary"
            onPress={() => router.push(`/add?id=${subscription.id}`)}
          />
          <Button
            label="Cancel this"
            variant="danger"
            onPress={handleDelete}
            loading={deleteMutation.isPending}
            style={styles.cancelButton}
          />
          <Text style={styles.honesty}>
            {subscription.source
              ? `We can't cancel this for you — it can only be stopped in ${subscription.source}.`
              : "We can't cancel this for you — a UPI mandate can only be stopped in the app that created it."}
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
    identity: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
    },
    identityText: {
      flex: 1,
      gap: space.sm,
    },
    chips: {
      flexDirection: 'row',
      gap: space.sm,
      flexWrap: 'wrap',
    },
    hero: {
      marginTop: space.xl,
      paddingTop: space.lg,
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
    },
    heroNumber: {
      marginTop: space.sm,
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
