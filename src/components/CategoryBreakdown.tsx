import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { PieChart } from 'panelui-native';
import { currencySymbol } from '@/src/components/AmountText';
import { space } from '@/src/theme';

interface CategoryBreakdownProps {
  entries: { category: string; amount: number }[];
  currency: string;
}

/**
 * Category share of spend as a donut with the total in the hole and a
 * wrapping legend underneath — one chart in one place, instead of the same
 * progress-bar list repeated on both Overview and Insights.
 */
export function CategoryBreakdown({ entries, currency }: CategoryBreakdownProps) {
  const symbol = currencySymbol(currency);

  const data = useMemo(
    () => entries.map((e) => ({ label: e.category, value: e.amount })),
    [entries]
  );

  return (
    <View style={styles.wrap}>
      <PieChart data={data} innerRadius={0.62} size={148} style={styles.chart}>
        <PieChart.Center
          defaultLabel="Total"
          formatValue={(value) => `${symbol}${Math.round(value).toLocaleString('en-IN')}`}
        />
        <PieChart.Slices />
        <PieChart.Legend showValue />
      </PieChart>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  chart: {
    alignSelf: 'center',
  },
});
