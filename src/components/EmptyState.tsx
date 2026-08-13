import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { font, space, type Palette, type TextStyles } from '@/src/theme';

interface EmptyStateProps {
  /** One line of direction. Not an apology, not a shrug. */
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ title, subtitle, icon = 'reader-outline', action }: EmptyStateProps) {
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={22} color={colors.muted} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {action ? (
        <Pressable
          onPress={action.onPress}
          hitSlop={8}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionLabel}>{action.label} →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.xl,
      paddingVertical: space.xxl,
      gap: space.sm,
    },
    title: {
      ...t.body,
      textAlign: 'center',
    },
    subtitle: {
      ...t.caption,
      textAlign: 'center',
    },
    action: {
      marginTop: space.sm,
    },
    actionLabel: {
      fontFamily: font.monoMed,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.indigo,
    },
    pressed: {
      opacity: 0.6,
    },
  });
