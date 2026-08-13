import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { color } from '@/src/theme';

/**
 * Only for whole-screen gates (auth resolution). List loading uses
 * `SkeletonList` — a spinner in a list loses the page's shape.
 */
export function Spinner() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={color.indigo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.paper,
  },
});
