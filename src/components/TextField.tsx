import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Icon } from '@/src/components/Icon';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, tabular, type Palette, type TextStyles } from '@/src/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  /** Amounts get mono tabular figures; prose does not. */
  numeric?: boolean;
}

export function TextField({
  label,
  error,
  numeric = false,
  style,
  onFocus,
  onBlur,
  secureTextEntry,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);

  return (
    <View style={styles.container}>
      <Text style={t.label}>{label}</Text>
      <View>
        <TextInput
          style={[
            styles.input,
            numeric && styles.numeric,
            focused && styles.inputFocused,
            error && styles.inputError,
            secureTextEntry && styles.inputWithToggle,
            style,
          ]}
          placeholderTextColor={colors.muted}
          secureTextEntry={secureTextEntry && !revealed}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...inputProps}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setRevealed((value) => !value)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            style={styles.toggle}
          >
            <Icon name={revealed ? 'eye-off' : 'eye'} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
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
    inputWithToggle: {
      paddingRight: 52,
    },
    toggle: {
      position: 'absolute',
      right: 0,
      top: 0,
      height: 52,
      width: 52,
      alignItems: 'center',
      justifyContent: 'center',
    },
    numeric: {
      fontFamily: font.mono,
      ...tabular,
    },
    inputFocused: {
      borderColor: colors.indigo,
      // Web draws its own focus outline on top; the indigo border is the indicator.
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
    },
    inputError: {
      borderColor: colors.debit,
    },
    error: {
      ...t.caption,
      color: colors.debit,
    },
  });
