import React, { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Icon } from '@/src/components/Icon';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, type Palette } from '@/src/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

/** Client-side name filter for the Subscriptions list. */
export function SearchBar({ value, onChangeText, placeholder = 'Search subscriptions' }: SearchBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <Icon name="search" size={17} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      height: 46,
      borderRadius: radius.cardSm,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
      paddingHorizontal: space.md,
    },
    input: {
      flex: 1,
      fontFamily: font.sans,
      fontSize: 14.5,
      color: colors.ink,
      height: '100%',
    },
  });
