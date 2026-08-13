import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { color, gutter } from '@/src/theme';

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
  const inner: ViewStyle | undefined = padded ? styles.padded : undefined;

  return (
    <SafeAreaView edges={edges} style={[styles.safe, style]}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.paper,
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
