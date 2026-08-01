import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/src/theme';
import type { StatementStatus } from '@/src/types';

const STEPS: { status: StatementStatus; label: string; detail: string }[] = [
  { status: 'parsing', label: 'Reading your statement', detail: 'Extracting transactions' },
  { status: 'analyzing', label: 'Finding recurring charges', detail: 'Grouping and categorising' },
  { status: 'ready', label: 'Ready to review', detail: 'Check what we found' },
];

const ORDER: StatementStatus[] = ['uploading', 'parsing', 'analyzing', 'ready'];

interface AnalysisProgressProps {
  status: StatementStatus;
  progress: number;
  transactionCount: number;
}

export function AnalysisProgress({
  status,
  progress,
  transactionCount,
}: AnalysisProgressProps) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress, width]);

  const currentIndex = ORDER.indexOf(status);

  return (
    <View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: width.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <View style={styles.steps}>
        {STEPS.map((step) => {
          const stepIndex = ORDER.indexOf(step.status);
          const done = currentIndex > stepIndex || status === 'ready';
          const active = currentIndex === stepIndex && status !== 'ready';

          return (
            <View key={step.status} style={styles.step}>
              <View
                style={[
                  styles.bullet,
                  done && styles.bulletDone,
                  active && styles.bulletActive,
                ]}
              >
                {done ? <Ionicons name="checkmark" size={13} color={colors.white} /> : null}
              </View>
              <View style={styles.stepText}>
                <Text
                  style={[
                    styles.stepLabel,
                    (done || active) && styles.stepLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
                <Text style={styles.stepDetail}>
                  {step.status === 'parsing' && transactionCount > 0
                    ? `${transactionCount} transactions found`
                    : step.detail}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accentMuted,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  steps: {
    gap: spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bullet: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bulletActive: {
    borderColor: colors.accent,
  },
  bulletDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  stepText: {
    flex: 1,
  },
  stepLabel: {
    ...typography.body,
    color: colors.textFaint,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: colors.text,
  },
  stepDetail: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
