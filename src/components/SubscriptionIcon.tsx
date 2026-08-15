import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { hashTile } from '@/src/components/Logo';
import { useTheme } from '@/src/hooks/useTheme';
import { font, type Palette } from '@/src/theme';

const LIGHT_TILES: { bg: string; fg: string }[] = [
  { bg: '#F0D9D6', fg: '#8A3A2F' },
  { bg: '#D7E9DC', fg: '#2F6B4F' },
  { bg: '#D6E1F0', fg: '#2A4F8A' },
  { bg: '#F0E3D0', fg: '#8A6A1F' },
  { bg: '#E3D6F0', fg: '#5A2F8A' },
  { bg: '#D0EAEA', fg: '#1F6B6B' },
];

function hashLight(name: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return LIGHT_TILES[hash % LIGHT_TILES.length];
}

interface SubscriptionIconProps {
  name: string;
  size?: number;
}

/**
 * The 44x44 rounded-square merchant tile used across Overview, Subscriptions,
 * Calendar and Insights — a colour-hashed initial standing in for a real
 * logo asset. Distinct from `Logo`, which is reserved for the user's own
 * avatar.
 */
export function SubscriptionIcon({ name, size = 44 }: SubscriptionIconProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  const tile = useMemo(() => (colors.isDark ? hashTile(name) : hashLight(name)), [colors, name]);

  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.32),
          backgroundColor: tile.bg,
        },
      ]}
    >
      <Text style={[styles.initial, { fontSize: Math.round(size * 0.4), color: tile.fg }]}>
        {initial}
      </Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    box: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    initial: {
      fontFamily: font.sansSemi,
    },
  });
