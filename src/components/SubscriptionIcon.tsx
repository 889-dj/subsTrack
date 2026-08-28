import React, { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
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
  logoUrl?: string;
  size?: number;
}

/**
 * The 44x44 rounded-square merchant tile used across Overview, Subscriptions,
 * Calendar and Insights. Renders the server-derived `logoUrl` when present,
 * falling back to a colour-hashed initial — on a missing URL, a load error
 * (unknown domain, offline), or while mock mode has no logo at all.
 * Distinct from `Logo`, which is reserved for the user's own avatar.
 */
export function SubscriptionIcon({ name, logoUrl, size = 44 }: SubscriptionIconProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [imageFailed, setImageFailed] = useState(false);
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  const tile = useMemo(() => (colors.isDark ? hashTile(name) : hashLight(name)), [colors, name]);
  const showImage = Boolean(logoUrl) && !imageFailed;

  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.32),
          backgroundColor: showImage ? colors.surface : tile.bg,
        },
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: logoUrl }}
          onError={() => setImageFailed(true)}
          style={{ width: size, height: size, borderRadius: Math.round(size * 0.32) }}
          resizeMode="contain"
        />
      ) : (
        <Text style={[styles.initial, { fontSize: Math.round(size * 0.4), color: tile.fg }]}>
          {initial}
        </Text>
      )}
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
