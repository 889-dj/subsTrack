import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
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
  { bg: 'rgba(139,92,246,0.16)', fg: '#B49CF8' },
  { bg: 'rgba(94,231,255,0.14)', fg: '#7FDFEF' },
  { bg: 'rgba(255,92,170,0.14)', fg: '#F090B8' },
  { bg: 'rgba(94,230,168,0.14)', fg: '#7FE0B6' },
  { bg: 'rgba(255,202,112,0.16)', fg: '#E8C084' },
  { bg: 'rgba(255,107,122,0.14)', fg: '#EF95A0' },
];

export function hashTile(name: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return DARK_TILES[hash % DARK_TILES.length];
}

/**
 * A monogram stands in for the merchant logo — square with a small radius so
 * it reads as part of the list rather than a floating app icon.
 */
export function Logo({
  name,
  size = 28,
  imageUri,
}: {
  name: string;
  size?: number;
  /** Uploaded profile photo, if any — falls back to the initial tile on a missing URL or load error. */
  imageUri?: string;
}) {
  const { colors } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [imageUri]);
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  const tile = useMemo(
    () => (colors.isDark ? hashTile(name) : { bg: colors.indigoBg, fg: colors.indigo }),
    [colors, name]
  );
  const radius = Math.round(size / 4.5);

  if (imageUri && !imageFailed) {
    return (
      <Image
        source={{ uri: imageUri }}
        onError={() => setImageFailed(true)}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }

  return (
    <View
      style={[
        styles.box,
        { width: size, height: size, borderRadius: radius, backgroundColor: tile.bg },
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
