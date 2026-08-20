import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AmountText } from '@/src/components/AmountText';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, type Palette, type TextStyles } from '@/src/theme';

interface CategoryBreakdownProps {
  entries: { category: string; amount: number }[];
  currency: string;
}

/**
 * Theme-aware category ledger. Exact values remain readable with large text
 * and in dark mode; the proportional rail preserves the at-a-glance view.
 */
export function CategoryBreakdown({ entries, currency }: CategoryBreakdownProps) {
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const total = useMemo(() => entries.reduce((sum, entry) => sum + entry.amount, 0), [entries]);
  const accents = [colors.indigo, colors.cyan, colors.pink, colors.warning, colors.saved];

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.totalRow}>
        <View>
          <Text style={styles.totalLabel}>ANNUAL TOTAL</Text>
          <Text style={styles.totalHint}>{entries.length} spending categories</Text>
        </View>
        <AmountText value={total} currency={currency} size={22} />
      </View>

      <View style={styles.track} accessibilityElementsHidden>
        {entries.map((entry, index) => {
          const percent = total > 0 ? (entry.amount / total) * 100 : 0;
          return (
            <View
              key={entry.category}
              style={[
                styles.segment,
                { flex: Math.max(percent, 2), backgroundColor: accents[index % accents.length] },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.list}>
        {entries.map((entry, index) => {
          const percent = total > 0 ? Math.round((entry.amount / total) * 100) : 0;
          return (
            <View
              key={entry.category}
              style={styles.row}
              accessible
              accessibilityLabel={`${entry.category}, ${percent} percent, ${Math.round(entry.amount)} ${currency} per year`}
            >
              <View style={[styles.swatch, { backgroundColor: accents[index % accents.length] }]} />
              <Text style={styles.category} numberOfLines={1}>{entry.category}</Text>
              <Text style={styles.percent}>{percent}%</Text>
              <AmountText value={entry.amount} currency={currency} size={13} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.card,
      padding: space.lg,
    },
    totalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.md,
    },
    totalLabel: {
      fontFamily: font.monoMed,
      fontSize: 10,
      letterSpacing: 1,
      color: colors.muted,
    },
    totalHint: { ...t.caption, marginTop: 3 },
    track: {
      flexDirection: 'row',
      height: 10,
      borderRadius: radius.chip,
      overflow: 'hidden',
      gap: 2,
      marginVertical: space.lg,
      backgroundColor: colors.paper2,
    },
    segment: { height: '100%' },
    list: { gap: space.md },
    row: {
      minHeight: 28,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
    },
    swatch: { width: 9, height: 9, borderRadius: 3 },
    category: { ...t.body, flex: 1, fontSize: 14 },
    percent: {
      fontFamily: font.monoMed,
      fontSize: 12,
      color: colors.muted,
      minWidth: 34,
      textAlign: 'right',
    },
  });
