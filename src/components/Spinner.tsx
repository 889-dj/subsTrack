import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import type { Palette } from '@/src/theme';

/**
 * Only for whole-screen gates (auth resolution). List loading uses
 * `SkeletonList` — a spinner in a list loses the page's shape.
 */
export function Spinner() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.indigo} />
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.paper,
    },
  });
