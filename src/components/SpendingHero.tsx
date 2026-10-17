import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Money } from '@/src/components/Money';
import { formatCompactMoney } from '@/src/utils/money';
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
  /** Total charging in the next 7 days, in `currency`. */
  dueAmount?: number;
  dueCount?: number;
}

/**
 * The one big surface on Overview: the monthly commitment, how it moved, and
 * what is about to be charged. A gradient with two soft glows gives it depth
 * without competing with the number.
 */
export function SpendingHero({
  monthly,
  yearly,
  currency,
  activeCount,
  scopeNote,
  deltaPercent,
  dueAmount = 0,
  dueCount = 0,
}: SpendingHeroProps) {
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);

  const deltaLabel =
    deltaPercent === undefined || deltaPercent === null
      ? null
      : Math.abs(deltaPercent) < 0.05
        ? 'No change vs last month'
        : `${deltaPercent > 0 ? '▲' : '▼'} ${Math.abs(deltaPercent).toFixed(1)}% vs last month`;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={colors.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, styles.orbTop]} pointerEvents="none" />
      <View style={[styles.orb, styles.orbBottom]} pointerEvents="none" />

      <View style={styles.kickerRow}>
        <Text style={styles.kicker}>MONTHLY COMMITMENT</Text>
        <Text style={styles.currency}>{currency}</Text>
      </View>

      <View style={styles.numberRow}>
        <Money value={monthly} currency={currency} size="hero" tone="hero" animate />
        {deltaLabel ? (
          <View style={styles.deltaPill}>
            <Text style={styles.deltaText}>{deltaLabel}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.subline} numberOfLines={1} ellipsizeMode="clip">
        {formatCompactMoney(Math.round(yearly), currency)} a year · {activeCount} active
      </Text>

      <View style={styles.duePanel}>
        <View style={styles.dueDot} />
        <View style={styles.dueCopy}>
          <Text style={styles.dueLabel}>NEXT 7 DAYS</Text>
          <Text style={styles.dueValue} numberOfLines={1} ellipsizeMode="clip">
            {dueCount > 0
              ? `${formatCompactMoney(dueAmount, currency)} · ${dueCount} charge${dueCount === 1 ? '' : 's'}`
              : 'Nothing due'}
          </Text>
        </View>
      </View>

      {scopeNote ? <Text style={styles.scopeNote}>{scopeNote}</Text> : null}
    </View>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.heroSurface,
      borderRadius: radius.card + 6,
      padding: space.xl,
      overflow: 'hidden',
    },
    orb: {
      position: 'absolute',
      borderRadius: 999,
    },
    orbTop: {
      width: 220,
      height: 220,
      top: -90,
      right: -70,
      backgroundColor: 'rgba(255,255,255,0.10)',
    },
    orbBottom: {
      width: 180,
      height: 180,
      bottom: -90,
      left: -60,
      backgroundColor: `${colors.cyan}26`,
    },
    kickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    kicker: { ...t.label, color: colors.heroMuted, letterSpacing: 1.2 },
    currency: {
      fontFamily: font.monoMed,
      fontSize: 11,
      color: colors.heroMuted,
      letterSpacing: 1,
    },
    numberRow: {
      marginTop: space.lg,
      gap: space.sm,
      alignItems: 'flex-start',
    },
    deltaPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.chip,
      backgroundColor: 'rgba(255,255,255,0.16)',
    },
    deltaText: { fontFamily: font.sansMed, fontSize: 12, lineHeight: 16, color: colors.heroInk },
    subline: {
      marginTop: space.md,
      fontFamily: font.mono,
      fontSize: 12.5,
      lineHeight: 18,
      color: colors.heroMuted,
    },
    duePanel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      marginTop: space.xl,
      paddingHorizontal: space.lg,
      paddingVertical: space.md,
      borderRadius: radius.card,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
    },
    dueDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.heroInk,
    },
    dueCopy: { flex: 1, minWidth: 0, gap: 2 },
    dueLabel: { fontFamily: font.mono, fontSize: 10.5, letterSpacing: 0.8, color: colors.heroMuted },
    dueValue: { fontFamily: font.monoMed, fontSize: 16, lineHeight: 22, color: colors.heroInk },
    scopeNote: {
      marginTop: space.md,
      fontFamily: font.sans,
      fontSize: 12,
      lineHeight: 16,
      color: colors.heroMuted,
    },
  });
