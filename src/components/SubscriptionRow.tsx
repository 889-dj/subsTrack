import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { colors, spacing, typography } from '@/src/theme';
import { formatMoney } from '@/src/utils/money';
import type { Subscription } from '@/src/types';

interface SubscriptionRowProps {
  subscription: Subscription;
  onPress: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function SubscriptionRow({ subscription, onPress }: SubscriptionRowProps) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.left}>
          <Text style={styles.name} numberOfLines={1}>
            {subscription.name}
          </Text>
          <Text style={styles.meta}>
            {subscription.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} · renews{' '}
            {formatDate(subscription.nextRenewalDate)}
          </Text>
        </View>
        <Text style={styles.cost}>{formatMoney(subscription.cost, subscription.currency)}</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  left: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    ...typography.subheading,
    marginBottom: 2,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  cost: {
    ...typography.subheading,
    color: colors.accent,
  },
});
