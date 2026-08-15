import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AmountText } from '@/src/components/AmountText';
import { SubscriptionIcon } from '@/src/components/SubscriptionIcon';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, type Palette, type TextStyles } from '@/src/theme';
import type { Subscription } from '@/src/types';
import { relativeDateLabel } from '@/src/utils/subscriptions';

interface UpcomingPaymentProps {
  /** All subscriptions renewing on this day — 1 for a normal card, 2+ for a stacked one. */
  subs: Subscription[];
  onPress?: () => void;
}

const CARD_WIDTH = 148;

/**
 * A single card for one renewal day, sized for a horizontal carousel. When
 * more than one subscription shares the date it shows stacked icons with a
 * "+N" badge and a combined total instead of trying to fit every name.
 */
export function UpcomingPayment({ subs, onPress }: UpcomingPaymentProps) {
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);

  if (subs.length === 0) return null;
  const primary = subs[0];
  const isGroup = subs.length > 1;
  const total = subs.reduce((sum, s) => sum + s.cost, 0);
  const currency = primary.currency;
  const dateLabel = relativeDateLabel(primary.nextRenewalDate);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {isGroup ? (
        <View style={styles.stack}>
          {subs.slice(0, 2).map((s, i) => (
            <View key={s.id} style={[styles.stackItem, { left: i * 18, zIndex: 2 - i }]}>
              <SubscriptionIcon name={s.name} size={38} />
            </View>
          ))}
          {subs.length > 2 ? (
            <View style={[styles.stackItem, styles.badge, { left: 36 }]}>
              <Text style={styles.badgeText}>+{subs.length - 2}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <SubscriptionIcon name={primary.name} size={44} />
      )}

      <Text style={styles.name} numberOfLines={1}>
        {isGroup ? `${subs.length} subscriptions` : primary.name}
      </Text>
      <Text style={styles.sublabel} numberOfLines={1}>
        {dateLabel}
      </Text>

      <View style={styles.amountRow}>
        <AmountText value={total} currency={currency} tone="ink" size={15} />
      </View>
    </Pressable>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: space.md,
      gap: 4,
    },
    pressed: {
      opacity: 0.85,
    },
    stack: {
      width: 44 + 18,
      height: 44,
      marginBottom: space.xs,
    },
    stackItem: {
      position: 'absolute',
    },
    badge: {
      width: 34,
      height: 34,
      borderRadius: 11,
      backgroundColor: colors.indigoBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    badgeText: {
      ...t.label,
      color: colors.indigo,
      marginBottom: 0,
    },
    name: {
      ...t.body,
      fontFamily: font.sansMed,
      fontSize: 13.5,
      marginTop: space.xs,
    },
    sublabel: {
      ...t.caption,
      fontSize: 11.5,
    },
    amountRow: {
      marginTop: space.sm,
      paddingTop: space.sm,
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
    },
  });

export { CARD_WIDTH as UPCOMING_CARD_WIDTH };
