import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AmountText } from '@/src/components/AmountText';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, type Palette, type TextStyles } from '@/src/theme';

interface CategoryBreakdownProps {
  entries: { category: string; amount: number }[];
  currency: string;
  /** Label above the total, e.g. "MONTHLY TOTAL" or "ANNUAL TOTAL". */
  periodLabel?: string;
}

/**
 * Category split as one segmented bar (length encodes share — NN/g advises bars
 * over donuts for dashboards) with tappable rows that highlight their segment.
 */
export function CategoryBreakdown({ entries, currency, periodLabel = 'ANNUAL TOTAL' }: CategoryBreakdownProps) {
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const periodWord = periodLabel.startsWith('MONTHLY') ? 'per month' : 'per year';
  const total = useMemo(() => entries.reduce((sum, entry) => sum + entry.amount, 0), [entries]);
  const accents = [colors.indigo, colors.cyan, colors.pink, colors.warning, colors.saved];
  return (
    <View style={styles.card}>
      <View style={styles.totalRow}>
        <View>
          <Text style={styles.totalLabel}>{periodLabel}</Text>
          <Text style={styles.totalHint}>{entries.length} spending categories</Text>
        </View>
        <AmountText value={total} currency={currency} size={22} />
      </View>

      <View
        style={styles.bar}
        accessibilityRole="image"
        accessibilityLabel={`Subscription spending by category, ${periodWord}`}
      >
        {entries.map((entry, index) => (
          <View
            key={entry.category}
            style={{
              flex: Math.max(entry.amount, 0.0001),
              backgroundColor: accents[index % accents.length],
              opacity: activeIndex === -1 || activeIndex === index ? 1 : 0.3,
            }}
          />
        ))}
      </View>

      <View style={styles.list} accessibilityRole="list">
        {entries.map((entry, index) => {
          const percent = total > 0 ? Math.round((entry.amount / total) * 100) : 0;
          const selected = activeIndex === index;
          return (
            <Pressable
              key={entry.category}
              style={({ pressed }) => [
                styles.row,
                selected && styles.rowSelected,
                pressed && styles.rowPressed,
              ]}
              onPress={() => setActiveIndex(selected ? -1 : index)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${entry.category}, ${percent} percent, ${Math.round(entry.amount)} ${currency} ${periodWord}`}
            >
              <View style={[styles.swatch, { backgroundColor: accents[index % accents.length] }]} />
              <Text style={styles.category} numberOfLines={1}>{entry.category}</Text>
              <Text style={styles.percent}>{percent}%</Text>
              <AmountText value={entry.amount} currency={currency} size={13} />
            </Pressable>
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
    bar: {
      flexDirection: 'row',
      height: 14,
      gap: 2,
      marginVertical: space.lg,
      borderRadius: 7,
      overflow: 'hidden',
    },
    list: { gap: space.xs },
    row: {
      minHeight: 44,
      borderRadius: radius.cardSm,
      paddingHorizontal: space.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
    },
    rowSelected: { backgroundColor: colors.indigoBg },
    rowPressed: { opacity: 0.72 },
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
