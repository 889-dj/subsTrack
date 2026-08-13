import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { space, type Palette, type TextStyles } from '@/src/theme';

interface KeyValueRowProps {
  label: string;
  value?: string;
  children?: React.ReactNode;
  last?: boolean;
}

/** Statement-style key/value: mono label left, value right, hairline between. */
export function KeyValueRow({ label, value, children, last = false }: KeyValueRowProps) {
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);

  return (
    <View style={[styles.row, last && styles.noRule]}>
      <Text style={t.label}>{label}</Text>
      {children ?? <Text style={styles.value}>{value}</Text>}
    </View>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.md,
      paddingVertical: space.md + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    noRule: {
      borderBottomWidth: 0,
    },
    value: {
      ...t.amount,
      textAlign: 'right',
      flexShrink: 1,
    },
  });
