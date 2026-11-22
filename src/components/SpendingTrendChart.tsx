import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Menu } from 'panelui-native';
import { ForecastBars, type ForecastColumn } from '@/src/components/ForecastBars';
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

/** Categories drawn individually; everything smaller is folded into "Other". */
const MAX_SERIES = 4;

/** "Nov 2026" / "November" → "Nov", so every column label fits without truncation. */
function monthShort(label: string): string {
  return label.trim().split(/[\s']/)[0].slice(0, 3);
}

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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Which categories get their own colour: the biggest across the visible months.
  const accents = [colors.indigo, colors.cyan, colors.pink, colors.warning, colors.saved];
  const series = useMemo(() => {
    const totals = new Map<string, number>();
    for (const point of points) {
      for (const item of point.byCategory) {
        totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount);
      }
    }
    const ranked = [...totals.entries()].sort(([, a], [, b]) => b - a).map(([name]) => name);
    const named = ranked.filter((name) => name !== 'Other').slice(0, MAX_SERIES);
    const hasRest = ranked.some((name) => !named.includes(name));
    return hasRest ? [...named, 'Other'] : named;
  }, [points]);

  // One stacked column per month; categories folded into "Other" sum into its slot.
  const columns = useMemo<ForecastColumn[]>(
    () =>
      points.map((point) => {
        const values = series.map(() => 0);
        for (const item of point.byCategory) {
          const slot = series.indexOf(item.category);
          values[slot === -1 ? series.indexOf('Other') : slot] += item.amount;
        }
        return { label: monthShort(point.label), values };
      }),
    [points, series],
  );
  const data = points;
  const active = activeIndex === null ? null : (points[activeIndex] ?? null);
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
                setActiveIndex(null);
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

      <View
        accessible
        accessibilityLabel={`Renewal forecast for the next ${months} months`}
        accessibilityHint={points.map((p) => `${p.label}, ${formatMoney(p.amount, currency)}, ${p.count} renewals`).join('. ')}
      >
        <ForecastBars
          columns={columns}
          colors={series.map((_, index) => accents[index % accents.length])}
          selectedIndex={activeIndex}
          onSelect={setActiveIndex}
          formatAxis={formatAxis}
        />
      </View>

      <View style={styles.legend}>
        {series.map((name, index) => (
          <View key={name} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: accents[index % accents.length] }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>
              {name}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.footnote}>Tap or drag across the bars to inspect a month.</Text>
    </View>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.md },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendSwatch: { width: 9, height: 9, borderRadius: 3 },
    legendLabel: { ...t.caption, fontSize: 12 },
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
