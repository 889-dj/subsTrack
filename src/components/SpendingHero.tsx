import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Money } from '@/src/components/Money';
import { StatPill } from '@/src/components/StatPill';
import { useTheme } from '@/src/hooks/useTheme';
import { radius, space, type Palette, type TextStyles } from '@/src/theme';

interface SpendingHeroProps {
  monthly: number;
  yearly: number;
  currency: string;
  activeCount: number;
  /** Illustrative month-over-month delta, e.g. 8.4. Omit to hide the pill. */
  deltaPercent?: number;
}

export function SpendingHero({
  monthly,
  yearly,
  currency,
  activeCount,
  deltaPercent,
}: SpendingHeroProps) {
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={t.label}>Monthly spending</Text>
        <View style={styles.numberRow}>
          <Money value={monthly} currency={currency} size="hero" animate />
          {typeof deltaPercent === 'number' ? (
            <StatPill
              label={`${deltaPercent >= 0 ? '+' : ''}${deltaPercent.toFixed(1)}% vs last month`}
              icon={deltaPercent >= 0 ? 'trending-up' : 'trending-down'}
              tone={deltaPercent >= 0 ? 'negative' : 'positive'}
            />
          ) : null}
        </View>

        <View style={styles.pillRow}>
          <StatPill label={`${activeCount} active subscription${activeCount === 1 ? '' : 's'}`} />
          <StatPill label={`${currency} ${Math.round(yearly).toLocaleString('en-IN')} / year`} />
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    wrap: {
      position: 'relative',
    },
    card: {
      backgroundColor: colors.elevated,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: space.xl,
    },
    numberRow: {
      marginTop: space.sm,
      gap: space.md,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.sm,
      marginTop: space.lg,
    },
  });
