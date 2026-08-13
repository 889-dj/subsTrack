import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { font } from '@/src/theme';

/**
 * Dark mode borrows the brand-tile look from the reference set (Netflix red,
 * Spotify green, distinct colour per service) since there's no logo asset to
 * fall back on — a hashed, curated palette stands in for it. Light mode
 * keeps the ledger's indigo-only discipline; colour there is reserved for
 * debit/saved, never decoration.
 */
const DARK_TILES: { bg: string; fg: string }[] = [
  { bg: '#3A1F1F', fg: '#E88A7D' },
  { bg: '#1F3A28', fg: '#7ED9A0' },
  { bg: '#1F2A3A', fg: '#7DAEE8' },
  { bg: '#3A2F1F', fg: '#E8B77D' },
  { bg: '#2A1F3A', fg: '#B47DE8' },
  { bg: '#1F3A3A', fg: '#7DE8D8' },
];

function hashTile(name: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return DARK_TILES[hash % DARK_TILES.length];
}

/**
 * A monogram stands in for the merchant logo — square with a small radius so
 * it reads as part of the list rather than a floating app icon.
 */
export function Logo({ name, size = 28 }: { name: string; size?: number }) {
  const { colors } = useTheme();
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  const tile = useMemo(
    () => (colors.isDark ? hashTile(name) : { bg: colors.indigoBg, fg: colors.indigo }),
    [colors, name]
  );

  return (
    <View
      style={[
        styles.box,
        { width: size, height: size, borderRadius: Math.round(size / 4.5), backgroundColor: tile.bg },
      ]}
    >
      <Text style={[styles.initial, { fontSize: Math.round(size * 0.45), color: tile.fg }]}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: font.monoMed,
  },
});
