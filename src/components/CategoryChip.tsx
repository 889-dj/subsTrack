import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, font, radius, space } from '@/src/theme';

interface CategoryChipProps {
  label: string;
  selected?: boolean;
  /** Omit to render a static, non-interactive chip. */
  onPress?: () => void;
}

/** Mono label on an indigo tint. No border when selected — the fill is the state. */
export function CategoryChip({ label, selected = false, onPress }: CategoryChipProps) {
  const body = <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>;

  if (!onPress) {
    return <View style={[styles.chip, selected && styles.chipSelected]}>{body}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: 7,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: color.hairline,
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
  },
  chipSelected: {
    backgroundColor: color.indigoBg,
    borderColor: color.indigoBg,
  },
  text: {
    fontFamily: font.mono,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: color.muted,
  },
  textSelected: {
    color: color.indigo,
  },
  pressed: {
    opacity: 0.6,
  },
});
