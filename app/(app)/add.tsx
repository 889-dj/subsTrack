import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '@/src/components/Button';
import { TextField } from '@/src/components/TextField';
import { colors, radius, spacing, typography } from '@/src/theme';
import {
  useAddSubscription,
  useSubscription,
  useUpdateSubscription,
} from '@/src/hooks/useSubscriptions';
import type { BillingCycle } from '@/src/types';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];
const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function AddEditScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const isEdit = !!id;
  const router = useRouter();

  const { data: existing, isLoading: isLoadingExisting } = useSubscription(id);
  const addMutation = useAddSubscription();
  const updateMutation = useUpdateSubscription();

  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [nextRenewalDate, setNextRenewalDate] = useState(new Date());
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [costError, setCostError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setCost(String(existing.cost));
      setCurrency(existing.currency);
      setBillingCycle(existing.billingCycle);
      setNextRenewalDate(new Date(existing.nextRenewalDate));
      setCategory(existing.category ?? '');
      setNote(existing.note ?? '');
    }
  }, [existing]);

  const isSaving = addMutation.isPending || updateMutation.isPending;

  function validate(): boolean {
    let valid = true;
    setNameError(null);
    setCostError(null);

    if (!name.trim()) {
      setNameError('Name is required.');
      valid = false;
    }
    const numericCost = Number(cost);
    if (!cost.trim() || Number.isNaN(numericCost) || numericCost <= 0) {
      setCostError('Enter a valid cost.');
      valid = false;
    }
    return valid;
  }

  async function handleSave() {
    setError(null);
    if (!validate()) return;

    const input = {
      name: name.trim(),
      cost: Number(cost),
      currency,
      billingCycle,
      nextRenewalDate: nextRenewalDate.toISOString(),
      category: category.trim() || undefined,
      note: note.trim() || undefined,
    };

    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, input });
      } else {
        await addMutation.mutateAsync(input);
      }
      router.back();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not save. Please try again.');
    }
  }

  if (isEdit && isLoadingExisting) {
    return null;
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextField label="Name" value={name} onChangeText={setName} placeholder="Netflix" error={nameError ?? undefined} />

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <TextField
                label="Cost"
                value={cost}
                onChangeText={setCost}
                placeholder="499"
                keyboardType="decimal-pad"
                error={costError ?? undefined}
              />
            </View>
            <View style={styles.rowItemSmall}>
              <Text style={styles.label}>Currency</Text>
              <View style={styles.pillGroup}>
                {CURRENCIES.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCurrency(c)}
                    style={[styles.pill, currency === c && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, currency === c && styles.pillTextActive]}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.label}>Billing cycle</Text>
          <View style={styles.segmentGroup}>
            {CYCLES.map((cycle) => (
              <Pressable
                key={cycle.value}
                onPress={() => setBillingCycle(cycle.value)}
                style={[styles.segment, billingCycle === cycle.value && styles.segmentActive]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    billingCycle === cycle.value && styles.segmentTextActive,
                  ]}
                >
                  {cycle.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Next renewal date</Text>
          <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateButtonText}>
              {nextRenewalDate.toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={nextRenewalDate}
              mode="date"
              onChange={(_event, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setNextRenewalDate(date);
              }}
            />
          )}

          <TextField
            label="Category (optional)"
            value={category}
            onChangeText={setCategory}
            placeholder="Entertainment"
          />
          <TextField
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            placeholder="Shared with family"
            multiline
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label={isEdit ? 'Save changes' : 'Add subscription'}
            onPress={handleSave}
            loading={isSaving}
            style={styles.saveButton}
          />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
  rowItemSmall: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  pillGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pill: {
    height: 52,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  pillTextActive: {
    color: colors.white,
  },
  segmentGroup: {
    flexDirection: 'row',
    backgroundColor: colors.accentMuted,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.surface,
    ...({
      shadowColor: '#14171F',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 1,
    } as object),
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.accent,
  },
  dateButton: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});
