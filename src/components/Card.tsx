import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { color, radius, space } from '@/src/theme';

/**
 * Surface on paper. No shadow anywhere in this app — separation comes from
 * the hairline and the paper-vs-surface contrast.
 */
export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.hairline,
    padding: space.lg,
  },
});
