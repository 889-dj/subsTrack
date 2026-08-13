import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, font } from '@/src/theme';

/**
 * A monogram stands in for the merchant logo. Stamped, not branded — mono
 * initial on an indigo tint, square with a small radius so it reads as part
 * of the ledger rather than an app icon.
 */
export function Logo({ name, size = 28 }: { name: string; size?: number }) {
  const initial = (name.trim()[0] ?? '?').toUpperCase();

  return (
    <View
      style={[
        styles.box,
        { width: size, height: size, borderRadius: Math.round(size / 4.5) },
      ]}
    >
      <Text style={[styles.initial, { fontSize: Math.round(size * 0.45) }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: color.indigoBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: font.monoMed,
    color: color.indigo,
  },
});
