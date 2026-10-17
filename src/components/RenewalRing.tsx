import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/src/hooks/useTheme';
import { font, type Palette } from '@/src/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RenewalRingProps {
  /** Whole days until the next charge. */
  days: number;
  /** Length of the billing period in days — the ring fills as the date nears. */
  cycleDays: number;
  size?: number;
  paused?: boolean;
}

const STROKE = 7;

/** Progress ring toward the next charge. Fills over 700ms on mount (instant under reduce-motion). */
export function RenewalRing({ days, cycleDays, size = 88, paused = false }: RenewalRingProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reduced = useReducedMotion();

  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = paused ? 0 : Math.min(1, Math.max(0, 1 - days / cycleDays));
  const progress = useSharedValue(reduced ? target : 0);

  useEffect(() => {
    progress.value = reduced
      ? target
      : withTiming(target, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [target, reduced, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const soon = !paused && days >= 0 && days <= 3;
  const arc = soon ? colors.warning : colors.indigo;

  return (
    <View style={{ width: size, height: size }} aria-hidden>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.hairline}
          strokeWidth={STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={arc}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.days}>{paused ? '—' : Math.max(0, days)}</Text>
        <Text style={styles.unit}>{paused ? 'PAUSED' : days === 1 ? 'DAY' : 'DAYS'}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    // Start the arc at 12 o'clock. Rotating the Svg (not the circle) works on native and web.
    svg: { position: 'absolute', transform: [{ rotate: '-90deg' }] },
    center: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    days: { fontFamily: font.monoMed, fontSize: 24, lineHeight: 28, color: colors.ink },
    unit: { fontFamily: font.mono, fontSize: 9.5, letterSpacing: 0.8, color: colors.muted },
  });
