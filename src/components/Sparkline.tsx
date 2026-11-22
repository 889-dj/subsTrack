import React, { useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface SparklineProps {
  values: number[];
  color: string;
  height?: number;
}

/**
 * A small area line drawn with react-native-svg. Renders nothing for a flat or
 * single-point series, so callers never reserve space for an empty chart.
 */
export function Sparkline({ values, color, height = 40 }: SparklineProps) {
  const [width, setWidth] = useState(0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const drawable = values.length > 1 && max > min;

  const { line, area } = useMemo(() => {
    if (!drawable || width === 0) return { line: '', area: '' };
    const pad = 3;
    const step = width / (values.length - 1);
    const points = values.map((value, index) => ({
      x: index * step,
      y: pad + (1 - (value - min) / (max - min)) * (height - pad * 2),
    }));
    // Quadratic midpoints keep the line soft without overshooting the data.
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const mid = { x: (points[i - 1].x + points[i].x) / 2, y: (points[i - 1].y + points[i].y) / 2 };
      d += ` Q ${points[i - 1].x} ${points[i - 1].y} ${mid.x} ${mid.y}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return { line: d, area: `${d} L ${width} ${height} L 0 ${height} Z` };
  }, [drawable, width, values, min, max, height]);

  if (!drawable) return null;

  return (
    <View
      style={{ height }}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      aria-hidden
    >
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.32} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={area} fill="url(#sparkFill)" />
          <Path d={line} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ) : null}
    </View>
  );
}
