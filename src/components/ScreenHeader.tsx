import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/src/components/Icon';
import { useTheme } from '@/src/hooks/useTheme';
import { space, type Palette, type TextStyles } from '@/src/theme';

interface ScreenHeaderProps {
  title?: string;
  /** Shown under the title — one line of direction, never a paragraph. */
  caption?: string;
  /** `close` for modals, `back` for pushed screens. */
  dismiss?: 'back' | 'close' | 'none';
  onDismiss?: () => void;
  right?: React.ReactNode;
}

export function ScreenHeader({
  title,
  caption,
  dismiss = 'back',
  onDismiss,
  right,
}: ScreenHeaderProps) {
  const router = useRouter();
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const goBack = onDismiss ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        {dismiss !== 'none' ? (
          <Pressable
            onPress={goBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={dismiss === 'close' ? 'Close' : 'Back'}
            style={({ pressed }) => [styles.dismissButton, pressed && styles.pressed]}
          >
            <Icon
              name={dismiss === 'close' ? 'close' : 'arrow-back'}
              size={22}
              color={colors.ink}
            />
          </Pressable>
        ) : null}

        {title ? (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View style={styles.spacer} />
        )}

        {right}
      </View>

      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    wrap: {
      paddingTop: space.md,
      paddingBottom: space.lg,
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
    },
    title: {
      ...t.title,
      flex: 1,
    },
    spacer: {
      flex: 1,
    },
    dismissButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -space.sm,
    },
    caption: {
      ...t.caption,
      marginTop: space.xs,
    },
    pressed: {
      opacity: 0.5,
    },
  });
