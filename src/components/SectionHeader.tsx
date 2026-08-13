import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, space, text as t } from '@/src/theme';

interface SectionHeaderProps {
  label: string;
  /** Optional right-hand value — a count or a subtotal. */
  trailing?: React.ReactNode;
}

/** Mono uppercase label sitting on a hairline. Used for category groups. */
export function SectionHeader({ label, trailing }: SectionHeaderProps) {
  return (
    <View style={styles.wrap}>
      <Text style={t.label}>{label}</Text>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: space.sm,
    marginTop: space.xl,
    borderBottomWidth: 1,
    borderBottomColor: color.ink,
  },
});
