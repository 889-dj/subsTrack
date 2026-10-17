import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PressableScale } from '@/src/components/PressableScale';
import { AmountText } from '@/src/components/AmountText';
import { SubscriptionIcon } from '@/src/components/SubscriptionIcon';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, type Palette, type TextStyles } from '@/src/theme';
import type { Subscription } from '@/src/types';
import { daysUntil, relativeDateLabel, shortDate } from '@/src/utils/subscriptions';

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
  const days = daysUntil(subscription.nextRenewalDate);
  const isPaused = subscription.status === 'paused';
  const dueSoon = !isPaused && days >= 0 && days <= 3;
  const dateLabel = isPaused ? 'Paused' : days >= 0 && days < 7 ? relativeDateLabel(subscription.nextRenewalDate) : shortDate(subscription.nextRenewalDate);

  return (
    <PressableScale
      onPress={onPress}
      style={[styles.card, variant === 'card' && styles.cardBoxed]}
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
        <View style={[styles.dateChip, dueSoon && styles.dateChipSoon]}>
          <Text style={[styles.date, dueSoon && styles.dateSoon]}>{dateLabel}</Text>
        </View>
      </View>
    </PressableScale>
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
    dateChip: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.chip,
    },
    dateChipSoon: {
      backgroundColor: `${colors.warning}24`,
    },
    date: {
      ...t.caption,
      fontSize: 12,
    },
    dateSoon: {
      color: colors.warning,
      fontFamily: font.sansMed,
    },
  });
