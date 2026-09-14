import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/hooks/useTheme';
import { gutter, type Palette } from '@/src/theme';

interface ScreenProps {
  children: React.ReactNode;
  /** Wrap the content in a ScrollView. Off for screens that own a list. */
  scroll?: boolean;
  /** Drop the gutter when the screen renders edge-to-edge rules or rows. */
  padded?: boolean;
  edges?: readonly Edge[];
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

/** Paper background, safe area, gutter. Every screen wraps in this. */
export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top'],
  style,
  contentContainerStyle,
}: ScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const inner: ViewStyle | undefined = padded ? styles.padded : undefined;

  // `<SafeAreaView>` reports stale/zero insets inside `fullScreenModal`
  // native-stack screens on iOS (e.g. add.tsx) — the hook doesn't have that
  // bug, matching the pattern already used in paywall.tsx.
  const insets = useSafeAreaInsets();
  const safeStyle: ViewStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View style={[styles.safe, safeStyle, style]}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[inner, styles.scrollContent, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, inner, contentContainerStyle]}>{children}</View>
      )}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.paper,
    },
    flex: {
      flex: 1,
    },
    padded: {
      paddingHorizontal: gutter,
    },
    scrollContent: {
      flexGrow: 1,
    },
  });
