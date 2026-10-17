import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { PressableScale } from '@/src/components/PressableScale';
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
          <PressableScale
            key={opt}
            onPress={() => onChange(opt)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            pressedScale={0.95}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.text, selected && styles.textSelected]}>{opt}</Text>
          </PressableScale>
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
