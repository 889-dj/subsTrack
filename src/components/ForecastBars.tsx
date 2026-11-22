import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { ClipPath, Circle, Defs, Line, Rect } from 'react-native-svg';
import { useTheme } from '@/src/hooks/useTheme';
import { font, type Palette } from '@/src/theme';

export interface ForecastColumn {
  /** Short x-axis label, e.g. "Nov". */
  label: string;
  /** Stacked segment values, bottom to top, aligned with `colors`. */
  values: number[];
}

interface ForecastBarsProps {
  columns: ForecastColumn[];
  colors: string[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  formatAxis: (value: number) => string;
  height?: number;
}

const AXIS_WIDTH = 44;
const GRID_ROWS = 3;

/** Rounds a maximum up to a tidy 1/2/2.5/5 × 10^n so the gridlines read cleanly. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (value <= step * magnitude) return step * magnitude;
  }
  return 10 * magnitude;
}

/**
 * Pill-shaped stacked columns with a dashed grid. Drawn with react-native-svg
 * instead of a chart library so corners and labels render the same on iOS and
 * Android. Tap or drag across the plot to inspect a column.
 */
export function ForecastBars({
  columns,
  colors: seriesColors,
  selectedIndex,
  onSelect,
  formatAxis,
  height = 168,
}: ForecastBarsProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [plotWidth, setPlotWidth] = useState(0);

  const totals = columns.map((column) => column.values.reduce((sum, value) => sum + value, 0));
  const max = niceMax(Math.max(0, ...totals));
  const count = columns.length;
  const colWidth = count > 0 ? plotWidth / count : 0;
  const barWidth = Math.min(colWidth * 0.6, 22);

  // PanResponder is created once, so it reads the live geometry through a ref.
  const geometry = useRef({ colWidth, count, onSelect });
  geometry.current = { colWidth, count, onSelect };
  const pick = (x: number) => {
    const { colWidth: w, count: n, onSelect: select } = geometry.current;
    if (w <= 0 || n === 0) return;
    select(Math.max(0, Math.min(n - 1, Math.floor(x / w))));
  };
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: (e) => pick(e.nativeEvent.locationX),
        onPanResponderMove: (e) => pick(e.nativeEvent.locationX),
        onPanResponderTerminationRequest: () => true,
      }),
    [],
  );

  const gridValues = Array.from({ length: GRID_ROWS + 1 }, (_, i) => (max / GRID_ROWS) * i);
  const hasSelection = selectedIndex !== null;

  return (
    <View>
      <View style={[styles.plotRow, { height }]}>
        <View style={[styles.axis, { height }]}>
          {gridValues.map((value) => (
            <Text
              key={value}
              style={[styles.axisLabel, { top: (1 - value / max) * height - 7 }]}
              numberOfLines={1}
            >
              {formatAxis(value)}
            </Text>
          ))}
        </View>

        <View
          style={styles.plot}
          onLayout={(event: LayoutChangeEvent) => setPlotWidth(event.nativeEvent.layout.width)}
          {...responder.panHandlers}
        >
          {plotWidth > 0 ? (
            <Svg width={plotWidth} height={height} pointerEvents="none">
              <Defs>
                {columns.map((_, index) => {
                  const x = index * colWidth + (colWidth - barWidth) / 2;
                  return (
                    <ClipPath key={index} id={`col${index}`}>
                      <Rect x={x} y={0} width={barWidth} height={height} rx={barWidth / 2} />
                    </ClipPath>
                  );
                })}
              </Defs>
              {gridValues.map((value) => {
                const y = Math.min(height - 0.5, Math.max(0.5, (1 - value / max) * height));
                return (
                  <Line
                    key={value}
                    x1={0}
                    x2={plotWidth}
                    y1={y}
                    y2={y}
                    stroke={colors.hairline}
                    strokeWidth={1}
                    strokeDasharray={value === 0 ? undefined : '3,6'}
                  />
                );
              })}
              {columns.map((column, index) => {
                const x = index * colWidth + (colWidth - barWidth) / 2;
                const total = totals[index];
                const dimmed = hasSelection && selectedIndex !== index;
                const opacity = dimmed ? 0.32 : 1;
                if (total <= 0) {
                  return (
                    <Circle
                      key={index}
                      cx={x + barWidth / 2}
                      cy={height - 3}
                      r={2}
                      fill={colors.faint}
                      opacity={opacity}
                    />
                  );
                }
                // Keep tiny months visible as a stub at least one bar-width tall.
                const barHeight = Math.max((total / max) * height, barWidth);
                const scale = barHeight / total;
                let top = height;
                return (
                  <React.Fragment key={index}>
                    {column.values.map((value, segment) => {
                      if (value <= 0) return null;
                      const segmentHeight = value * scale;
                      top -= segmentHeight;
                      return (
                        <Rect
                          key={segment}
                          x={x}
                          y={top}
                          width={barWidth}
                          height={segmentHeight}
                          fill={seriesColors[segment % seriesColors.length]}
                          opacity={opacity}
                          clipPath={`url(#col${index})`}
                        />
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </Svg>
          ) : null}
        </View>
      </View>

      <View style={styles.labelRow}>
        <View style={{ width: AXIS_WIDTH }} />
        <View style={styles.labels}>
          {columns.map((column, index) => (
            <Text
              key={index}
              style={[styles.xLabel, selectedIndex === index && styles.xLabelActive]}
              numberOfLines={1}
            >
              {column.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    plotRow: { flexDirection: 'row' },
    axis: { width: AXIS_WIDTH },
    axisLabel: {
      position: 'absolute',
      left: 0,
      right: 6,
      fontFamily: font.mono,
      fontSize: 10,
      lineHeight: 14,
      color: colors.faint,
    },
    plot: { flex: 1 },
    labelRow: { flexDirection: 'row', marginTop: 8 },
    labels: { flex: 1, flexDirection: 'row' },
    xLabel: {
      flex: 1,
      textAlign: 'center',
      fontFamily: font.mono,
      fontSize: 10,
      color: colors.faint,
    },
    xLabelActive: { color: colors.ink, fontFamily: font.monoMed },
  });
