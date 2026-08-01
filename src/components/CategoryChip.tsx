import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/src/theme';

interface CategoryChipProps {
  label: string;
  selected?: boolean;
  /** Omit to render a static, non-interactive chip. */
  onPress?: () => void;
}

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
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
  },
  chipSelected: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  textSelected: {
    color: colors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
});
