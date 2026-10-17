import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AmountText } from '@/src/components/AmountText';
import { Button } from '@/src/components/Button';
import { CategoryChip } from '@/src/components/CategoryChip';
import { KeyValueRow } from '@/src/components/KeyValueRow';
import { RenewalRing } from '@/src/components/RenewalRing';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SectionHeader } from '@/src/components/SectionHeader';
import { SkeletonList } from '@/src/components/SkeletonRow';
import { SubscriptionIcon } from '@/src/components/SubscriptionIcon';
import {
  useDeleteSubscription,
  useForecastOccurrences,
  usePauseSubscription,
  useResumeSubscription,
  useSubscription,
} from '@/src/hooks/useSubscriptions';
import { useTheme } from '@/src/hooks/useTheme';
import { useUndoableActions } from '@/src/hooks/useUndoableActions';
import { font, gutter, radius, space, type Palette, type TextStyles } from '@/src/theme';
import { formatMoney } from '@/src/utils/money';
import { daysUntil, longDate } from '@/src/utils/subscriptions';

const formatDate = longDate;

function countdownTitle(days: number): string {
  if (days < 0) return `${Math.abs(days)} day${days === -1 ? '' : 's'} overdue`;
  if (days === 0) return 'Renews today';
  if (days === 1) return 'Renews tomorrow';
  return `Renews in ${days} days`;
}

export default function DetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const router = useRouter();
  const { data: subscription, isLoading, isError } = useSubscription(id);
  const { data: occurrences } = useForecastOccurrences(id, 6);
  const deleteMutation = useDeleteSubscription();
  const pauseMutation = usePauseSubscription();
  const resumeMutation = useResumeSubscription();
  const { remove } = useUndoableActions();
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
    // Optimistic remove with an Undo snackbar — no confirm dialog (NN/g: undo
    // beats confirmation for recoverable changes). The copy still says this
    // does not cancel billing with the provider.
    remove(subscription!);
    if (router.canGoBack()) router.back();
    else router.replace('/');
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

        <View style={styles.countdown}>
          <RenewalRing
            days={daysUntil(subscription.nextRenewalDate)}
            cycleDays={subscription.billingCycle === 'yearly' ? 365 : 30}
            paused={subscription.status === 'paused'}
          />
          <View style={styles.countdownCopy}>
            <Text style={styles.countdownLabel}>
              {subscription.status === 'paused' ? 'PAUSED' : 'NEXT CHARGE'}
            </Text>
            <Text style={styles.countdownTitle} numberOfLines={1} ellipsizeMode="clip">
              {subscription.status === 'paused'
                ? 'Not in your totals'
                : countdownTitle(daysUntil(subscription.nextRenewalDate))}
            </Text>
            <Text style={styles.countdownDate}>{formatDate(subscription.nextRenewalDate)}</Text>
            <View style={styles.countdownAmount}>
              <AmountText
                value={subscription.cost}
                currency={subscription.currency}
                round={false}
                tone="ink"
                size={20}
              />
              <Text style={styles.countdownCycle}>
                /{subscription.billingCycle === 'yearly' ? 'year' : 'month'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.details}>
          <KeyValueRow
            label="Billing cycle"
            value={subscription.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
          />
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

        {occurrences && occurrences.length > 0 ? (
          <View style={styles.details}>
            <SectionHeader label="Next renewals" />
            {occurrences.slice(0, 5).map((occurrence, index, list) => (
              <KeyValueRow
                key={occurrence.date}
                label={formatDate(occurrence.date)}
                value={formatMoney(Number(occurrence.amount), occurrence.currency)}
                last={index === list.length - 1}
              />
            ))}
          </View>
        ) : null}

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
    countdown: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: space.lg,
      padding: space.lg,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    countdownCopy: { flex: 1, minWidth: 0, gap: 2 },
    countdownLabel: { ...t.label, color: colors.indigo },
    countdownTitle: { fontFamily: font.sansSemi, fontSize: 20, lineHeight: 26, color: colors.ink },
    countdownDate: { ...t.caption },
    countdownAmount: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: space.xs },
    countdownCycle: { ...t.caption },
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
