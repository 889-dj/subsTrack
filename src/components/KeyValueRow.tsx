import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, space, text as t } from '@/src/theme';

interface KeyValueRowProps {
  label: string;
  value?: string;
  children?: React.ReactNode;
  last?: boolean;
}

/** Statement-style key/value: mono label left, value right, hairline between. */
export function KeyValueRow({ label, value, children, last = false }: KeyValueRowProps) {
  return (
    <View style={[styles.row, last && styles.noRule]}>
      <Text style={t.label}>{label}</Text>
      {children ?? <Text style={styles.value}>{value}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingVertical: space.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
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
