import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AmountText } from '@/src/components/AmountText';
import { SubscriptionIcon } from '@/src/components/SubscriptionIcon';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, type Palette, type TextStyles } from '@/src/theme';
import type { Subscription } from '@/src/types';
import { shortDate } from '@/src/utils/subscriptions';

interface SubscriptionCardProps {
  subscription: Subscription;
  onPress?: () => void;
  /** `row` is the ledger list; `card` is the full-width calendar treatment. */
  variant?: 'row' | 'card';
}

/** The primary list row on the Subscriptions tab — logo, name, cycle/category, amount + next date. */
export function SubscriptionCard({ subscription, onPress, variant = 'row' }: SubscriptionCardProps) {
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);

  const cycleLabel = subscription.billingCycle === 'yearly' ? 'Yearly' : 'Monthly';
  const subtitle = `${cycleLabel} · ${subscription.category ?? 'Other'}`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        variant === 'card' && styles.cardBoxed,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${subscription.name}, ${subscription.cost} ${subscription.currency}, renews ${shortDate(subscription.nextRenewalDate)}`}
    >
      <SubscriptionIcon name={subscription.name} logoUrl={subscription.logoUrl} size={44} />
      <View style={styles.copy}>
        <Text style={styles.name} numberOfLines={1}>
          {subscription.name}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.right}>
        <AmountText value={subscription.cost} currency={subscription.currency} tone="ink" />
        <Text style={styles.date}>{shortDate(subscription.nextRenewalDate)}</Text>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      paddingVertical: space.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    cardBoxed: {
      width: '100%',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.cardSm,
      paddingHorizontal: space.lg,
      paddingVertical: space.lg,
      marginBottom: space.sm,
    },
    pressed: {
      opacity: 0.62,
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    name: {
      ...t.body,
      fontFamily: font.sansSemi,
    },
    subtitle: {
      ...t.caption,
    },
    right: {
      alignItems: 'flex-end',
      gap: 2,
    },
    date: {
      ...t.caption,
      fontSize: 11.5,
    },
  });
