import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, type Palette } from '@/src/theme';

interface FilterChipsProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

/** Horizontal single-select chip row — "All" plus one chip per category present in the data. */
export function FilterChips({ options, value, onChange }: FilterChipsProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.text, selected && styles.textSelected]}>{opt}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      gap: space.sm,
      paddingVertical: 2,
    },
    chip: {
      paddingHorizontal: space.md,
      paddingVertical: 8,
      borderRadius: radius.chip,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    chipSelected: {
      backgroundColor: colors.indigo,
      borderColor: colors.indigo,
    },
    text: {
      fontFamily: font.sansMed,
      fontSize: 12.5,
      color: colors.muted,
    },
    textSelected: {
      color: colors.white,
    },
    pressed: {
      opacity: 0.7,
    },
  });
