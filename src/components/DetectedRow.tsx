import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/src/components/Card';
import { CategoryChip } from '@/src/components/CategoryChip';
import { colors, radius, spacing, typography } from '@/src/theme';
import { formatMoney } from '@/src/utils/money';
import type { Category, DetectedSubscription } from '@/src/types';

interface DetectedRowProps {
  detection: DetectedSubscription;
  selected: boolean;
  category: Category;
  onToggle: () => void;
  onPressCategory: () => void;
}

function confidenceLabel(confidence: number): { text: string; color: string; bg: string } {
  if (confidence >= 0.9) {
    return { text: 'High confidence', color: colors.success, bg: '#E6F5EE' };
  }
  if (confidence >= 0.75) {
    return { text: 'Likely', color: '#B26B00', bg: '#FDF3E3' };
  }
  return { text: 'Needs a look', color: colors.danger, bg: colors.dangerMuted };
}

export function DetectedRow({
  detection,
  selected,
  category,
  onToggle,
  onPressCategory,
}: DetectedRowProps) {
  const confidence = confidenceLabel(detection.confidence);
  const cycleLabel = detection.billingCycle === 'yearly' ? 'Yearly' : 'Monthly';

  return (
    <Card style={[styles.card, selected && styles.cardSelected]}>
      <Pressable style={styles.topRow} onPress={onToggle} hitSlop={4}>
        <View style={[styles.checkbox, selected && styles.checkboxOn]}>
          {selected ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {detection.name}
            </Text>
            <Text style={styles.cost}>{formatMoney(detection.cost, detection.currency)}</Text>
          </View>

          <Text style={styles.descriptor} numberOfLines={1}>
            {detection.rawDescriptor}
          </Text>

          <Text style={styles.meta}>
            {cycleLabel} · seen {detection.occurrences.length}× on this statement
          </Text>
        </View>
      </Pressable>

      <View style={styles.bottomRow}>
        <CategoryChip label={category} selected onPress={onPressCategory} />

        <View style={[styles.confidenceBadge, { backgroundColor: confidence.bg }]}>
          <Text style={[styles.confidenceText, { color: confidence.color }]}>
            {confidence.text}
          </Text>
        </View>
      </View>

      {detection.alreadyTracked ? (
        <Text style={styles.trackedNote}>Already in your list — will be skipped.</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: colors.accent,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm - 2,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...typography.subheading,
    flex: 1,
    marginRight: spacing.sm,
  },
  cost: {
    ...typography.subheading,
    color: colors.accent,
  },
  descriptor: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: 2,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confidenceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trackedNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
