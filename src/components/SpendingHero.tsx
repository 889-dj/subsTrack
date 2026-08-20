import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Money } from '@/src/components/Money';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, type Palette, type TextStyles } from '@/src/theme';

interface SpendingHeroProps {
  monthly: number;
  yearly: number;
  currency: string;
  activeCount: number;
  scopeNote?: string;
  /** Scheduled renewal change from last month. Null means no comparable base. */
  deltaPercent?: number | null;
}

export function SpendingHero({
  monthly,
  yearly,
  currency,
  activeCount,
  scopeNote,
  deltaPercent,
}: SpendingHeroProps) {
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const comparisonLabel =
    deltaPercent === null
      ? 'NO PRIOR TOTAL'
      : deltaPercent === undefined
        ? ''
        : Math.abs(deltaPercent) < 0.05
          ? 'NO CHANGE'
          : deltaPercent > 0
            ? 'MORE THAN LAST'
            : 'LESS THAN LAST';

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.kickerRow}>
          <Text style={styles.kicker}>MONTHLY COMMITMENT</Text>
          <Text style={styles.currency}>{currency}</Text>
        </View>
        <View style={styles.numberRow}>
          <Text style={styles.overline}>Recurring spend</Text>
          <Money value={monthly} currency={currency} size="hero" tone="hero" animate />
        </View>
        <View style={styles.ledgerRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{activeCount}</Text>
            <Text style={styles.metricLabel}>TRACKED</Text>
          </View>
          <View style={styles.rule} />
          <View style={styles.metricWide}>
            <Text style={styles.metricValue}>{currency} {Math.round(yearly).toLocaleString('en-IN')}</Text>
            <Text style={styles.metricLabel}>12-MONTH TOTAL</Text>
          </View>
          {deltaPercent !== undefined ? <>
            <View style={styles.rule} />
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {deltaPercent === null
                  ? '—'
                  : `${Math.abs(deltaPercent) < 0.05 ? '0' : Math.abs(deltaPercent).toFixed(1)}%`}
              </Text>
              <Text style={styles.metricLabel}>{comparisonLabel}</Text>
            </View>
          </> : null}
        </View>
        {scopeNote ? <Text style={styles.scopeNote}>{scopeNote}</Text> : null}
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
      backgroundColor: colors.heroSurface,
      borderRadius: radius.card,
      padding: space.xl,
      overflow: 'hidden',
    },
    kickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    kicker: { ...t.label, color: colors.heroMuted, letterSpacing: 1.2 },
    currency: {
      fontFamily: font.monoMed,
      fontSize: 10,
      color: colors.heroMuted,
      letterSpacing: 1,
    },
    overline: { ...t.caption, color: colors.heroMuted },
    numberRow: {
      marginTop: space.xl,
      gap: space.xs,
    },
    ledgerRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginTop: space.xl,
      paddingTop: space.lg,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.16)',
    },
    metric: { minWidth: 54 },
    metricWide: { flex: 1, paddingHorizontal: space.md },
    metricValue: { fontFamily: font.monoMed, fontSize: 13, color: colors.heroInk },
    metricLabel: { fontFamily: font.mono, fontSize: 8.5, color: colors.heroMuted, letterSpacing: 0.7, marginTop: 4 },
    rule: { width: 1, backgroundColor: 'rgba(255,255,255,0.16)', marginHorizontal: space.md },
    scopeNote: {
      marginTop: space.md,
      fontFamily: font.sans,
      fontSize: 11,
      lineHeight: 15,
      color: colors.heroMuted,
    },
  });
