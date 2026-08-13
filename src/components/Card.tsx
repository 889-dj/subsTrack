import React, { useMemo } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { radius, space, type Palette } from '@/src/theme';

/**
 * Surface on paper. No shadow anywhere in this app — separation comes from
 * the hairline and the paper-vs-surface contrast.
 */
export function Card({ style, children, ...rest }: ViewProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: space.lg,
    },
  });
