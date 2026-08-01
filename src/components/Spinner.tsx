import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '@/src/theme';

export function Spinner() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
