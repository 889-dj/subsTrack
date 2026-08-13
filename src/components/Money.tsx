import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Text, TextStyle } from 'react-native';
import { color, text as t } from '@/src/theme';
import { currencySymbol } from '@/src/components/AmountText';

interface MoneyProps {
  value: number;
  currency: string;
  size?: 'hero' | 'total';
  /** Count up from zero on mount. Ignored when reduce-motion is on. */
  animate?: boolean;
  duration?: number;
  tone?: 'ink' | 'saved';
  style?: TextStyle;
}

/** Cubic ease-out — the number decelerates into its final value. */
function easeOutCubic(p: number): number {
  return 1 - Math.pow(1 - p, 3);
}

/**
 * The big number. Counts 0 → value on a rAF loop rather than a driver-backed
 * animation, because the thing being animated is text content, not a style —
 * there is nothing for the native driver to do here.
 */
export function Money({
  value,
  currency,
  size = 'total',
  animate = false,
  duration = 1200,
  tone = 'ink',
  style,
}: MoneyProps) {
  const [shown, setShown] = useState(animate ? 0 : value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!animate) {
      setShown(value);
      return;
    }

    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced) {
        setShown(value);
        return;
      }

      const start = Date.now();
      const tick = () => {
        const elapsed = Date.now() - start;
        const p = Math.min(1, elapsed / duration);
        setShown(value * easeOutCubic(p));
        if (p < 1) frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    });

    return () => {
      cancelled = true;
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [animate, duration, value]);

  const base = size === 'hero' ? t.hero : t.total;
  const symbolSize = Math.round(base.fontSize * 0.65);

  return (
    <Text
      style={[base, tone === 'saved' && { color: color.saved }, style]}
      accessibilityLabel={`${currencySymbol(currency)}${Math.round(value)}`}
    >
      <Text style={{ fontSize: symbolSize, color: color.muted }}>{currencySymbol(currency)}</Text>
      {Math.round(shown).toLocaleString('en-IN')}
    </Text>
  );
}
