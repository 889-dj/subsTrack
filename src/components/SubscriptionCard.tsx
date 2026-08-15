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
}

/** The primary list row on the Subscriptions tab — logo, name, cycle/category, amount + next date. */
export function SubscriptionCard({ subscription, onPress }: SubscriptionCardProps) {
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);

  const cycleLabel = subscription.billingCycle === 'yearly' ? 'Yearly' : 'Monthly';
  const subtitle = `${cycleLabel} · ${subscription.category ?? 'Other'}`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <SubscriptionIcon name={subscription.name} size={44} />
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
      backgroundColor: colors.surface,
      borderRadius: radius.cardSm,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: space.md,
      marginBottom: space.sm,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    name: {
      ...t.body,
      fontFamily: font.sansMed,
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
