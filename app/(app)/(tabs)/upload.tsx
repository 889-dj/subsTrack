import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AnalysisProgress } from '@/src/components/AnalysisProgress';
import { FLOATING_TAB_BAR_HEIGHT } from '@/src/components/FloatingTabBar';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { useStatement, useUploadStatement } from '@/src/hooks/useStatements';
import { colors, radius, spacing, typography } from '@/src/theme';
import { pickStatementFile, type PickedFile } from '@/src/utils/filePicker';

function formatSize(bytes: number): string {
  if (bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const uploadMutation = useUploadStatement();

  const [picked, setPicked] = useState<PickedFile | null>(null);
  const [statementId, setStatementId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const { data: statement } = useStatement(statementId);

  // Hand off to review as soon as the backend finishes analyzing. Review lives
  // on the parent stack, so this pushes over the tabs rather than replacing the
  // tab itself. Local state is cleared so coming back to Scan starts fresh.
  useEffect(() => {
    if (statement?.status !== 'ready') return;
    const id = statement.id;
    setPicked(null);
    setStatementId(undefined);
    router.push(`/review?statementId=${id}`);
  }, [statement?.status, statement?.id, router]);

  async function handlePick() {
    setError(null);
    const result = await pickStatementFile();

    if (result.status === 'picked') {
      setPicked(result.file);
    } else if (result.status === 'unavailable') {
      setError(
        'File picking needs a new development build. Run `npx expo run:android` (or an EAS development build) and reopen the app.'
      );
    } else if (result.status === 'error') {
      setError("Couldn't open the file picker. Please try again.");
    }
  }

  async function handleUpload() {
    if (!picked) return;
    setError(null);
    try {
      const created = await uploadMutation.mutateAsync(picked);
      setStatementId(created.id);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Upload failed. Please try again.');
    }
  }

  const isProcessing = !!statementId && statement?.status !== 'failed';

  if (isProcessing) {
    return (
      <View style={styles.processingContainer}>
        <Card style={styles.processingCard}>
          <Text style={styles.processingTitle}>Analyzing {picked?.name}</Text>
          <Text style={styles.processingSubtitle}>
            This usually takes a few seconds. You can leave this screen — we'll keep going.
          </Text>

          <View style={styles.progressWrap}>
            <AnalysisProgress
              status={statement?.status ?? 'uploading'}
              progress={statement?.progress ?? 0.05}
              transactionCount={statement?.transactionCount ?? 0}
            />
          </View>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.lg,
          paddingBottom: FLOATING_TAB_BAR_HEIGHT + spacing.xl,
        },
      ]}
    >
      <Text style={styles.title}>Upload a bank statement</Text>
      <Text style={styles.subtitle}>
        We'll read it, pick out the charges that repeat, and sort them into categories. Nothing
        leaves your account.
      </Text>

      <Pressable onPress={handlePick} style={styles.dropzone}>
        <View style={styles.dropzoneIcon}>
          <Ionicons
            name={picked ? 'document-text' : 'cloud-upload-outline'}
            size={28}
            color={colors.accent}
          />
        </View>
        {picked ? (
          <>
            <Text style={styles.pickedName} numberOfLines={1}>
              {picked.name}
            </Text>
            <Text style={styles.dropzoneHint}>
              {formatSize(picked.size)} · tap to choose a different file
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.dropzoneTitle}>Choose a file</Text>
            <Text style={styles.dropzoneHint}>PDF or CSV, up to 12 months</Text>
          </>
        )}
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {statement?.status === 'failed' ? (
        <Text style={styles.error}>{statement.error ?? "We couldn't read that statement."}</Text>
      ) : null}

      <Button
        label="Analyze statement"
        onPress={handleUpload}
        disabled={!picked}
        loading={uploadMutation.isPending}
        style={styles.uploadButton}
      />

      <View style={styles.tips}>
        <Text style={styles.tipsTitle}>What we look for</Text>
        <Tip text="Charges from the same merchant that repeat month to month" />
        <Tip text="Annual renewals hiding in a single line item" />
        <Tip text="Price changes since your last statement" />
      </View>

      <Pressable onPress={() => router.push('/add')} style={styles.manualLink} hitSlop={8}>
        <Text style={styles.manualLinkText}>Or add a subscription manually</Text>
      </Pressable>
    </ScrollView>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <View style={styles.tipRow}>
      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMuted,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  dropzone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dropzoneIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  dropzoneTitle: {
    ...typography.subheading,
    marginBottom: 2,
  },
  pickedName: {
    ...typography.subheading,
    marginBottom: 2,
    maxWidth: '100%',
  },
  dropzoneHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  uploadButton: {
    marginTop: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  tips: {
    marginTop: spacing.xl,
  },
  tipsTitle: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipText: {
    ...typography.bodyMuted,
    flex: 1,
  },
  manualLink: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  manualLinkText: {
    ...typography.bodyMuted,
    color: colors.accent,
    fontWeight: '600',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  processingCard: {
    padding: spacing.lg,
  },
  processingTitle: {
    ...typography.heading,
    marginBottom: spacing.xs,
  },
  processingSubtitle: {
    ...typography.bodyMuted,
    lineHeight: 20,
  },
  progressWrap: {
    marginTop: spacing.lg,
  },
});
