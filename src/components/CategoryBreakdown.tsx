import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PieChart, type PieDatum } from 'panelui-native';
import { AmountText } from '@/src/components/AmountText';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, type Palette, type TextStyles } from '@/src/theme';

interface CategoryBreakdownProps {
  entries: { category: string; amount: number }[];
  currency: string;
}

/** Compact interactive category donut; the rows carry the precise values. */
export function CategoryBreakdown({ entries, currency }: CategoryBreakdownProps) {
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const total = useMemo(() => entries.reduce((sum, entry) => sum + entry.amount, 0), [entries]);
  const accents = [colors.indigo, colors.cyan, colors.pink, colors.warning, colors.saved];
  const data = useMemo<PieDatum[]>(
    () =>
      entries.map((entry, index) => ({
        label: entry.category,
        value: entry.amount,
        color: accents[index % accents.length],
      })),
    [entries, accents],
  );
  return (
    <View style={styles.card}>
      <View style={styles.totalRow}>
        <View>
          <Text style={styles.totalLabel}>ANNUAL TOTAL</Text>
          <Text style={styles.totalHint}>{entries.length} spending categories</Text>
        </View>
        <AmountText value={total} currency={currency} size={22} />
      </View>

      <View style={styles.chartRow}>
        <PieChart
          data={data}
          size={142}
          innerRadius={0.62}
          padAngle={2}
          minAngle={2}
          animationDuration={560}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
          accessibilityLabel="Annual subscription spending by category"
        >
          <PieChart.Slices cornerRadius={4} popOut={5} dimOpacity={0.3} />
        </PieChart>
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
              accessibilityLabel={`${entry.category}, ${percent} percent, ${Math.round(entry.amount)} ${currency} per year`}
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
    chartRow: {
      minHeight: 154,
      marginVertical: space.md,
      alignItems: 'center',
      justifyContent: 'center',
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
