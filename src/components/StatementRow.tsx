import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AmountText } from '@/src/components/AmountText';
import { Logo } from '@/src/components/Logo';
import { color, font, space, text as t } from '@/src/theme';

export type StatementRowVariant = 'default' | 'upcoming' | 'cancelled';

interface StatementRowProps {
  name: string;
  amount: number;
  currency: string;
  /** Cycle, category, source — whatever the row needs said about it. */
  sublabel?: string;
  /** `upcoming` puts the day here, e.g. "THU". */
  day?: string;
  approx?: boolean;
  variant?: StatementRowVariant;
  onPress?: () => void;
  /** Last row in a group drops its rule so it doesn't double up on the header. */
  last?: boolean;
  right?: React.ReactNode;
}

/**
 * The core primitive: mono descriptor left, tabular amount right, hairline
 * under. Every list in the app is made of these, and the reveal screen is
 * this same line blown up until it fills the screen.
 */
export function StatementRow({
  name,
  amount,
  currency,
  sublabel,
  day,
  approx = false,
  variant = 'default',
  onPress,
  last = false,
  right,
}: StatementRowProps) {
  const cancelled = variant === 'cancelled';

  const body = (
    <View style={[styles.row, last && styles.noRule]}>
      <Logo name={name} size={28} />

      <View style={styles.copy}>
        <Text
          style={[styles.name, cancelled && styles.cancelledText]}
          numberOfLines={1}
        >
          {name}
        </Text>
        {sublabel ? (
          <Text style={styles.sublabel} numberOfLines={1}>
            {sublabel}
          </Text>
        ) : null}
      </View>

      {variant === 'upcoming' && day ? <Text style={styles.day}>{day}</Text> : null}

      {right ?? (
        <AmountText
          value={amount}
          currency={currency}
          approx={approx}
          tone={cancelled ? 'muted' : 'ink'}
          style={cancelled ? styles.cancelledText : undefined}
        />
      )}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
  },
  noRule: {
    borderBottomWidth: 0,
  },
  copy: {
    flex: 1,
  },
  name: {
    fontFamily: font.monoMed,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: color.ink,
    textTransform: 'uppercase',
  },
  sublabel: {
    ...t.caption,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  day: {
    ...t.label,
    marginRight: space.xs,
  },
  cancelledText: {
    color: color.muted,
    textDecorationLine: 'line-through',
  },
  pressed: {
    backgroundColor: color.indigoBg,
  },
});
