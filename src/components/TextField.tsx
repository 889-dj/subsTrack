import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { color, font, radius, space, tabular, text as t } from '@/src/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  /** Amounts get mono tabular figures; prose does not. */
  numeric?: boolean;
}

export function TextField({ label, error, numeric = false, style, ...inputProps }: TextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={t.label}>{label}</Text>
      <TextInput
        style={[styles.input, numeric && styles.numeric, error && styles.inputError, style]}
        placeholderTextColor={color.muted}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: space.lg,
    gap: space.sm,
  },
  input: {
    height: 52,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.hairline,
    backgroundColor: color.surface,
    paddingHorizontal: space.lg,
    fontFamily: font.sans,
    fontSize: 15,
    color: color.ink,
  },
  numeric: {
    fontFamily: font.mono,
    ...tabular,
  },
  inputError: {
    borderColor: color.debit,
  },
  error: {
    ...t.caption,
    color: color.debit,
  },
});
