import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, tabular, type Palette, type TextStyles } from '@/src/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  /** Amounts get mono tabular figures; prose does not. */
  numeric?: boolean;
}

export function TextField({ label, error, numeric = false, style, ...inputProps }: TextFieldProps) {
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);

  return (
    <View style={styles.container}>
      <Text style={t.label}>{label}</Text>
      <TextInput
        style={[styles.input, numeric && styles.numeric, error && styles.inputError, style]}
        placeholderTextColor={colors.muted}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    container: {
      marginBottom: space.lg,
      gap: space.sm,
    },
    input: {
      height: 52,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
      paddingHorizontal: space.lg,
      fontFamily: font.sans,
      fontSize: 15,
      color: colors.ink,
    },
    numeric: {
      fontFamily: font.mono,
      ...tabular,
    },
    inputError: {
      borderColor: colors.debit,
    },
    error: {
      ...t.caption,
      color: colors.debit,
    },
  });
