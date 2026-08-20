import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Text, TextStyle } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { currencySymbol } from '@/src/components/AmountText';

interface MoneyProps {
  value: number;
  currency: string;
  size?: 'hero' | 'total';
  /** Count up from zero on mount. Ignored when reduce-motion is on. */
  animate?: boolean;
  duration?: number;
  tone?: 'ink' | 'saved' | 'hero';
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
  const { colors, text: t } = useTheme();
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
  const color = tone === 'saved' ? colors.saved : tone === 'hero' ? colors.heroInk : colors.ink;
  const symbolColor = tone === 'hero' ? colors.heroMuted : colors.muted;

  return (
    <Text
      style={[base, { color }, style]}
      accessibilityLabel={`${currencySymbol(currency)}${Math.round(value)}`}
    >
      <Text style={{ fontSize: symbolSize, color: symbolColor }}>{currencySymbol(currency)}</Text>
      {Math.round(shown).toLocaleString('en-IN')}
    </Text>
  );
}
