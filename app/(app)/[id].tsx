import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AmountText } from '@/src/components/AmountText';
import { Button } from '@/src/components/Button';
import { CategoryChip } from '@/src/components/CategoryChip';
import { KeyValueRow } from '@/src/components/KeyValueRow';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SkeletonList } from '@/src/components/SkeletonRow';
import { SubscriptionIcon } from '@/src/components/SubscriptionIcon';
import {
  useDeleteSubscription,
  usePauseSubscription,
  useResumeSubscription,
  useSubscription,
} from '@/src/hooks/useSubscriptions';
import { useTheme } from '@/src/hooks/useTheme';
import { gutter, space, type Palette, type TextStyles } from '@/src/theme';
import { longDate } from '@/src/utils/subscriptions';

const formatDate = longDate;

export default function DetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const router = useRouter();
  const { data: subscription, isLoading, isError } = useSubscription(id);
  const deleteMutation = useDeleteSubscription();
  const pauseMutation = usePauseSubscription();
  const resumeMutation = useResumeSubscription();
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
          Couldn't load this subscription. Go back and pull the list down to retry.
        </Text>
      </Screen>
    );
  }

  function handleDelete() {
    Alert.alert(
      'Remove from SubsTrack?',
      `${subscription!.name} will no longer be tracked here. This does not cancel billing with the provider.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteMutation.mutateAsync(subscription!.id);
            if (router.canGoBack()) router.back();
            else router.replace('/');
          },
        },
      ]
    );
  }

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
          <SubscriptionIcon name={subscription.name} logoUrl={subscription.logoUrl} size={64} />
          <Text style={styles.name} numberOfLines={2}>
            {subscription.name}
          </Text>
          <View style={styles.chips}>
            <CategoryChip label={subscription.category ?? 'Other'} />
            {subscription.plan ? <CategoryChip label={subscription.plan} /> : null}
            {subscription.source ? <CategoryChip label={subscription.source} /> : null}
            {subscription.status === 'paused' ? <CategoryChip label="Paused" /> : null}
          </View>
        </View>

        <View style={styles.details}>
          <KeyValueRow label="Amount">
            <AmountText
              value={subscription.cost}
              currency={subscription.currency}
              round={false}
              tone="ink"
            />
          </KeyValueRow>
          <KeyValueRow
            label="Billing cycle"
            value={subscription.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
          />
          <KeyValueRow label="Next renewal" value={formatDate(subscription.nextRenewalDate)} />
          {subscription.source ? (
            <KeyValueRow label="Payment method" value={subscription.source} />
          ) : null}
          <KeyValueRow
            label="Added on"
            value={formatDate(subscription.createdAt)}
            last={!subscription.note}
          />
          {subscription.note ? <KeyValueRow label="Note" value={subscription.note} last /> : null}
        </View>

        <View style={styles.actions}>
          <Button
            label={subscription.status === 'paused' ? 'Resume tracking' : 'Pause tracking'}
            variant="secondary"
            onPress={() => {
              const mutation = subscription.status === 'paused' ? resumeMutation : pauseMutation;
              mutation.mutate(subscription.id, {
                onError: () => {
                  Alert.alert(
                    'Could not update tracking',
                    'Please check your connection and try again.',
                  );
                },
              });
            }}
            loading={pauseMutation.isPending || resumeMutation.isPending}
          />
          <Button
            label="Remove from SubsTrack"
            variant="danger"
            onPress={handleDelete}
            loading={deleteMutation.isPending}
            style={styles.cancelButton}
          />
          <Text style={styles.honesty}>
            Pausing only removes this item from totals and forecasts. To stop future charges,
            cancel directly with {subscription.name} or wherever you subscribed.
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
    details: {
      marginTop: space.md,
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
