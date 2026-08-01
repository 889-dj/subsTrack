import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Spinner } from '@/src/components/Spinner';
import { useDeleteSubscription, useSubscription } from '@/src/hooks/useSubscriptions';
import { colors, spacing, typography } from '@/src/theme';
import { formatMoney, monthlyCost } from '@/src/utils/money';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const router = useRouter();
  const { data: subscription, isLoading, isError } = useSubscription(id);
  const deleteMutation = useDeleteSubscription();

  if (isLoading) return <Spinner />;

  if (isError || !subscription) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Couldn't load this subscription.</Text>
      </View>
    );
  }

  function handleDelete() {
    Alert.alert(
      'Delete subscription?',
      `This will remove ${subscription!.name} from your list. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMutation.mutateAsync(subscription!.id);
            router.back();
          },
        },
      ]
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={styles.headerCard}>
        <Text style={styles.name}>{subscription.name}</Text>
        <Text style={styles.cost}>{formatMoney(subscription.cost, subscription.currency)}</Text>
        <Text style={styles.cycle}>
          {subscription.billingCycle === 'yearly' ? 'Billed yearly' : 'Billed monthly'} ·{' '}
          {formatMoney(monthlyCost(subscription), subscription.currency)}/mo
        </Text>
      </Card>

      <Card style={styles.detailsCard}>
        <DetailRow label="Next renewal" value={formatDate(subscription.nextRenewalDate)} />
        {subscription.category ? <DetailRow label="Category" value={subscription.category} /> : null}
        {subscription.note ? <DetailRow label="Note" value={subscription.note} /> : null}
      </Card>

      <View style={styles.actions}>
        <Button
          label="Edit"
          variant="secondary"
          onPress={() => router.push(`/add?id=${subscription.id}`)}
          style={styles.actionButton}
        />
        <Button
          label="Delete"
          variant="danger"
          onPress={handleDelete}
          loading={deleteMutation.isPending}
          style={styles.actionButton}
        />
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorText: {
    ...typography.bodyMuted,
    color: colors.danger,
  },
  headerCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  name: {
    ...typography.heading,
    marginBottom: spacing.xs,
  },
  cost: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  cycle: {
    ...typography.bodyMuted,
  },
  detailsCard: {
    marginBottom: spacing.lg,
  },
  detailRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    ...typography.label,
    marginBottom: 2,
  },
  detailValue: {
    ...typography.body,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
