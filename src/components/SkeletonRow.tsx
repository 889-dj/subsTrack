import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { space, type Palette } from '@/src/theme';

/**
 * Loading is skeleton statement rows, never a spinner — the page keeps its
 * shape and only the ink is missing.
 */
export function SkeletonRow() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.5,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.row, { opacity: pulse }]}>
      <View style={styles.logo} />
      <View style={styles.copy}>
        <View style={[styles.block, { width: '55%' }]} />
        <View style={[styles.block, styles.blockSmall, { width: '32%' }]} />
      </View>
      <View style={[styles.block, { width: 56 }]} />
    </Animated.View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      paddingVertical: space.md + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    logo: {
      width: 28,
      height: 28,
      borderRadius: 6,
      backgroundColor: colors.hairline,
    },
    copy: {
      flex: 1,
      gap: 6,
    },
    block: {
      height: 10,
      borderRadius: 3,
      backgroundColor: colors.hairline,
    },
    blockSmall: {
      height: 8,
    },
  });
