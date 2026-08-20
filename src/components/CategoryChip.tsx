import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, type Palette } from '@/src/theme';

interface CategoryChipProps {
  label: string;
  selected?: boolean;
  /** Omit to render a static, non-interactive chip. */
  onPress?: () => void;
}

/** Compact sentence-case label on an indigo tint. */
export function CategoryChip({ label, selected = false, onPress }: CategoryChipProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const body = <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>;

  if (!onPress) {
    return <View style={[styles.chip, selected && styles.chipSelected]}>{body}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
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

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    chip: {
      paddingHorizontal: space.md,
      paddingVertical: 7,
      borderRadius: radius.chip,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: 'transparent',
      alignSelf: 'flex-start',
    },
    chipSelected: {
      backgroundColor: colors.indigoBg,
      borderColor: colors.indigoBg,
    },
    text: {
      fontFamily: font.sansMed,
      fontSize: 12,
      lineHeight: 16,
      color: colors.muted,
    },
    textSelected: {
      color: colors.indigo,
    },
    pressed: {
      opacity: 0.6,
    },
  });
