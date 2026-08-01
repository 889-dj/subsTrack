import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CategoryChip } from '@/src/components/CategoryChip';
import { DetectedRow } from '@/src/components/DetectedRow';
import { EmptyState } from '@/src/components/EmptyState';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Spinner } from '@/src/components/Spinner';
import { useConfirmDetections, useDetections, useStatement } from '@/src/hooks/useStatements';
import { colors, radius, spacing, typography } from '@/src/theme';
import { formatMoney, monthlyCost } from '@/src/utils/money';
import { CATEGORIES, type Category, type ReviewedDetection } from '@/src/types';

export default function ReviewScreen() {
  const params = useLocalSearchParams<{ statementId?: string }>();
  const statementId = typeof params.statementId === 'string' ? params.statementId : undefined;
  const router = useRouter();

  const { data: statement } = useStatement(statementId);
  const { data: detections, isLoading } = useDetections(statementId, statement?.status === 'ready');
  const confirmMutation = useConfirmDetections();

  // Detections the user wants to keep, and any category corrections they make.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, Category>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pre-select everything the AI is confident about and that isn't already tracked.
  useEffect(() => {
    if (!detections) return;
    setSelectedIds(
      new Set(detections.filter((d) => !d.alreadyTracked).map((d) => d.id))
    );
  }, [detections]);

  const categoryFor = (id: string, fallback: Category): Category =>
    categoryOverrides[id] ?? fallback;

  const selected = useMemo(
    () => (detections ?? []).filter((d) => selectedIds.has(d.id)),
    [detections, selectedIds]
  );

  const monthlyImpact = useMemo(
    () => selected.reduce((sum, d) => sum + monthlyCost(d), 0),
    [selected]
  );

  const currency = detections?.[0]?.currency ?? 'INR';

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConfirm() {
    if (!statementId) return;
    setError(null);

    const payload: ReviewedDetection[] = selected.map((d) => ({
      id: d.id,
      name: d.name,
      cost: d.cost,
      billingCycle: d.billingCycle,
      category: categoryFor(d.id, d.category),
    }));

    try {
      const { created, skipped } = await confirmMutation.mutateAsync({
        statementId,
        detections: payload,
      });
      if (created.length === 0) {
        setError(
          skipped > 0
            ? "Everything you picked is already in your list, so nothing was added."
            : 'Nothing was added. Please try again.'
        );
        return;
      }
      router.replace('/');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Couldn't save these. Please try again.");
    }
  }

  if (isLoading || !detections) return <Spinner />;

  const editing = detections.find((d) => d.id === editingId) ?? null;

  return (
    <View style={styles.container}>
      <FlatList
        data={detections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>
                Found in {statement?.fileName ?? 'your statement'}
              </Text>
              <Text style={styles.summaryValue}>
                {detections.length} recurring {detections.length === 1 ? 'charge' : 'charges'}
              </Text>
              <Text style={styles.summaryMeta}>
                across {statement?.transactionCount ?? 0} transactions
              </Text>
            </Card>

            <Text style={styles.instructions}>
              Uncheck anything that isn't a subscription, and tap a category to change it.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <DetectedRow
            detection={item}
            selected={selectedIds.has(item.id)}
            category={categoryFor(item.id, item.category)}
            onToggle={() => toggle(item.id)}
            onPressCategory={() => setEditingId(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No recurring charges found"
            subtitle="We couldn't spot anything that repeats in this statement. Try a longer date range."
          />
        }
      />

      <View style={styles.footer}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.footerSummary}>
          <Text style={styles.footerCount}>
            {selected.length} selected
          </Text>
          <Text style={styles.footerTotal}>
            {formatMoney(monthlyImpact, currency)}/mo
          </Text>
        </View>
        <Button
          label={selected.length > 0 ? `Add ${selected.length} to my list` : 'Select some to continue'}
          onPress={handleConfirm}
          disabled={selected.length === 0}
          loading={confirmMutation.isPending}
        />
      </View>

      <Modal
        visible={!!editing}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingId(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setEditingId(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Category for {editing?.name}</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((category) => (
                <CategoryChip
                  key={category}
                  label={category}
                  selected={
                    !!editing && categoryFor(editing.id, editing.category) === category
                  }
                  onPress={() => {
                    if (!editing) return;
                    setCategoryOverrides((prev) => ({ ...prev, [editing.id]: category }));
                    setEditingId(null);
                  }}
                />
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    flexGrow: 1,
  },
  summaryCard: {
    marginBottom: spacing.md,
  },
  summaryLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  summaryMeta: {
    ...typography.bodyMuted,
    marginTop: 2,
  },
  instructions: {
    ...typography.bodyMuted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  footerCount: {
    ...typography.bodyMuted,
  },
  footerTotal: {
    ...typography.subheading,
    color: colors.accent,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 23, 31, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalTitle: {
    ...typography.heading,
    marginBottom: spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
