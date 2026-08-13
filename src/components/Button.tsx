import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, type Palette } from '@/src/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * One shape at 52px tall. `primary` is indigo fill; everything else is a
 * hairline-bordered ghost — the only thing that changes is the ink.
 * `danger` is reserved for cancelling a mandate, which is an outflow the user
 * is stopping, so it earns the debit colour on the label alone.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const { styles, variantStyles, textVariantStyles } = useMemo(() => createStyles(colors), [colors]);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.indigo} />
      ) : (
        <Text style={[styles.label, textVariantStyles[variant]]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function PrimaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="primary" />;
}

export function GhostButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="secondary" />;
}

const createStyles = (colors: Palette) => {
  const styles = StyleSheet.create({
    base: {
      height: 52,
      borderRadius: radius.card,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.lg,
    },
    label: {
      fontFamily: font.sansMed,
      fontSize: 15,
      letterSpacing: 0.1,
    },
    disabled: {
      opacity: 0.4,
    },
    pressed: {
      opacity: 0.8,
    },
  });

  const variantStyles: Record<Variant, ViewStyle> = {
    primary: { backgroundColor: colors.indigo },
    secondary: { borderWidth: 1, borderColor: colors.hairline, backgroundColor: 'transparent' },
    danger: { borderWidth: 1, borderColor: colors.hairline, backgroundColor: 'transparent' },
    ghost: { backgroundColor: 'transparent' },
  };

  const textVariantStyles: Record<Variant, TextStyle> = {
    primary: { color: colors.white },
    secondary: { color: colors.ink },
    danger: { color: colors.debit },
    ghost: { color: colors.muted },
  };

  return { styles, variantStyles, textVariantStyles };
};
