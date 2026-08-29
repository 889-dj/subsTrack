import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BarChart, Menu, type BarChartDatum } from 'panelui-native';
import { AmountText } from '@/src/components/AmountText';
import { Icon } from '@/src/components/Icon';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, type Palette, type TextStyles } from '@/src/theme';
import { CURRENCIES } from '@/src/types';
import { formatMoney } from '@/src/utils/money';
import type { RenewalForecastPoint } from '@/src/utils/subscriptions';

export type ForecastRange = 3 | 6 | 12;

interface SpendingTrendChartProps {
  /** Server-computed forecast points — see GET /v1/analytics/spend-trend. */
  data: RenewalForecastPoint[];
  currency: string;
  months: ForecastRange;
  onMonthsChange: (months: ForecastRange) => void;
}

type ForecastDatum = RenewalForecastPoint & BarChartDatum;

const RANGE_OPTIONS: { value: ForecastRange; label: string }[] = [
  { value: 3, label: 'Next 3 months' },
  { value: 6, label: 'Next 6 months' },
  { value: 12, label: 'Next 12 months' },
];

/** Future renewal charges by calendar month, from the backend's spend-trend series. */
export function SpendingTrendChart({
  data: points,
  currency,
  months,
  onMonthsChange,
}: SpendingTrendChartProps) {
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const [active, setActive] = useState<ForecastDatum | null>(null);
  const data = points as ForecastDatum[];
  const periodTotal = data.reduce((sum, point) => sum + point.amount, 0);
  const renewalCount = data.reduce((sum, point) => sum + point.count, 0);
  const selectedRange = RANGE_OPTIONS.find((option) => option.value === months) ?? RANGE_OPTIONS[1];
  const currencySymbol = CURRENCIES.find((option) => option.code === currency)?.symbol ?? currency;

  const formatAxis = (value: number) => {
    if (value >= 1000) {
      const compact = value >= 10_000 ? Math.round(value / 1000) : (value / 1000).toFixed(1);
      return `${currencySymbol}${compact}k`;
    }
    return `${currencySymbol}${Math.round(value)}`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>RENEWAL FORECAST</Text>
          <Text style={styles.caption}>Charges expected by month</Text>
        </View>
        <Menu>
          <Menu.Trigger>
            <Pressable
              style={({ pressed }) => [styles.rangeButton, pressed && styles.rangeButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Change timeframe, ${selectedRange.label}`}
            >
              <Text style={styles.rangeButtonText}>{months}M</Text>
              <Icon name="chevron-down" size={15} color={colors.muted} />
            </Pressable>
          </Menu.Trigger>
          <Menu.Content align="end">
            <Menu.Label>Forecast timeframe</Menu.Label>
            <Menu.RadioGroup
              value={String(months)}
              onValueChange={(value) => {
                setActive(null);
                onMonthsChange(Number(value) as ForecastRange);
              }}
            >
              {RANGE_OPTIONS.map((option) => (
                <Menu.RadioItem key={option.value} value={String(option.value)}>
                  {option.label}
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Content>
        </Menu>
      </View>

      <View style={styles.readout}>
        <View style={styles.readoutCopy}>
          <Text style={styles.readoutLabel}>{active ? active.label : 'Selected period'}</Text>
          <Text style={styles.readoutHint}>
            {active
              ? `${active.count} renewal${active.count === 1 ? '' : 's'}`
              : `${renewalCount} renewals forecast`}
          </Text>
        </View>
        <AmountText
          value={active ? active.amount : periodTotal}
          currency={currency}
          size={20}
        />
      </View>

      <BarChart
        data={data}
        xDataKey="label"
        aspectRatio={1.72}
        barGap={months === 12 ? 0.32 : 0.42}
        animationDuration={520}
        fadedOpacity={0.28}
        onActiveIndexChange={(_index, datum) => setActive(datum as ForecastDatum | null)}
        accessibilityLabel={`Renewal forecast for the next ${months} months`}
        accessibilityHint="Swipe through the chart to hear each month's projected charges."
        accessibilityLabelForDatum={(datum) =>
          `${datum.label}, ${formatMoney(Number(datum.amount), currency)}, ${datum.count} renewals`
        }
      >
        <BarChart.Grid rows={3} color={colors.hairline} dashArray="3,6" />
        <BarChart.Bar dataKey="amount" color={colors.indigo} cornerRadius={6} />
        <BarChart.XAxis ticks={months > 6 ? 6 : months} />
        <BarChart.YAxis ticks={3} format={formatAxis} />
        <BarChart.Tooltip
          formatX={(datum) => String(datum.label)}
          formatValue={(value) => formatMoney(value, currency)}
        />
      </BarChart>

      <Text style={styles.footnote}>Drag across the bars to inspect a month.</Text>
    </View>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: space.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: space.sm,
      marginBottom: space.lg,
    },
    headerCopy: { flex: 1, paddingBottom: 2 },
    kicker: {
      fontFamily: font.monoMed,
      fontSize: 10,
      letterSpacing: 1,
      color: colors.muted,
    },
    caption: { ...t.caption, marginTop: 3 },
    rangeButton: {
      minWidth: 74,
      minHeight: 40,
      paddingHorizontal: space.md,
      borderRadius: radius.cardSm,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.paper2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.xs,
    },
    rangeButtonPressed: { opacity: 0.7 },
    rangeButtonText: { ...t.amount, fontSize: 13 },
    readout: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.md,
      paddingBottom: space.sm,
    },
    readoutCopy: { flex: 1 },
    readoutLabel: { ...t.section },
    readoutHint: { ...t.caption, marginTop: 2 },
    footnote: {
      ...t.caption,
      fontSize: 11,
      textAlign: 'center',
      marginTop: space.xs,
    },
  });
