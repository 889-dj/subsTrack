import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AreaChart, BarChart, LineChart } from 'panelui-native';
import { Icon, type IconName } from '@/src/components/Icon';
import { useTheme } from '@/src/hooks/useTheme';
import { radius, space, type Palette } from '@/src/theme';

export type ChartVariant = 'bar' | 'area' | 'line';

const VARIANTS: { value: ChartVariant; icon: IconName }[] = [
  { value: 'area', icon: 'trending-up' },
  { value: 'bar', icon: 'chart' },
  { value: 'line', icon: 'chart' },
];

interface SpendingTrendChartProps {
  trend: number[];
  variant: ChartVariant;
  onVariantChange: (variant: ChartVariant) => void;
}

/**
 * One trend, three readings of it. Bar/area/line all read off the same
 * `panelui-native` chart primitives so switching between them is a genuine
 * re-plot, not three different libraries pretending to agree.
 */
export function SpendingTrendChart({ trend, variant, onVariantChange }: SpendingTrendChartProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const data = useMemo(
    () => trend.map((amount, i) => ({ x: String(i + 1), amount })),
    [trend]
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.switcher}>
        {VARIANTS.map((v) => (
          <Pressable
            key={v.value}
            onPress={() => onVariantChange(v.value)}
            style={[styles.switchItem, variant === v.value && styles.switchItemActive]}
          >
            <Icon
              name={v.value === 'line' ? 'trending-up' : v.icon}
              size={13}
              color={variant === v.value ? colors.indigo : colors.muted}
            />
          </Pressable>
        ))}
      </View>

      {variant === 'bar' ? (
        <BarChart data={data} xDataKey="x" aspectRatio={2.3} compact animationDuration={420}>
          <BarChart.Bar dataKey="amount" colorIndex={1} cornerRadius={4} />
        </BarChart>
      ) : variant === 'area' ? (
        <AreaChart data={data} xDataKey="x" aspectRatio={2.3} compact animationDuration={420}>
          <AreaChart.Area dataKey="amount" colorIndex={1} showLine strokeWidth={2} />
        </AreaChart>
      ) : (
        <LineChart data={data} xDataKey="x" aspectRatio={2.3} compact animationDuration={420}>
          <LineChart.Area dataKey="amount" colorIndex={1} />
          <LineChart.Line dataKey="amount" colorIndex={1} />
        </LineChart>
      )}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: space.md,
    },
    switcher: {
      flexDirection: 'row',
      alignSelf: 'flex-end',
      gap: 2,
      backgroundColor: colors.isDark ? 'rgba(255,255,255,0.06)' : colors.paper2,
      borderRadius: 10,
      padding: 2,
      marginBottom: space.sm,
    },
    switchItem: {
      width: 28,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
    },
    switchItemActive: {
      backgroundColor: colors.indigoBg,
    },
  });
