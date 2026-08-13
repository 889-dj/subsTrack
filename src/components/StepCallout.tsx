import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { font, space, type Palette, type TextStyles } from '@/src/theme';

interface StepCalloutProps {
  /** 1-based. Rendered zero-padded: 01, 02, 03. */
  step: number;
  children: string;
}

/**
 * Numbered instruction line. Only used where the user is following a real
 * sequence in another app — numbering appears nowhere else.
 */
export function StepCallout({ step, children }: StepCalloutProps) {
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);

  return (
    <View style={styles.row}>
      <Text style={styles.number}>{String(step).padStart(2, '0')}</Text>
      <Text style={styles.copy}>{children}</Text>
    </View>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: space.md,
      paddingVertical: space.sm,
    },
    number: {
      fontFamily: font.monoMed,
      fontSize: 13,
      lineHeight: 22,
      color: colors.indigo,
    },
    copy: {
      ...t.body,
      flex: 1,
    },
  });
