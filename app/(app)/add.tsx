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
import { PickerField } from '@/src/components/PickerField';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { TextField } from '@/src/components/TextField';
import { CATEGORIES, CURRENCIES, PAYMENT_APPS } from '@/src/types';
import { color, font, gutter, radius, space, text as t } from '@/src/theme';
import {
  useAddSubscription,
  useSubscription,
  useUpdateSubscription,
} from '@/src/hooks/useSubscriptions';
import type { BillingCycle } from '@/src/types';

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const CURRENCY_OPTIONS = CURRENCIES.map((c) => ({
  value: c.code,
  label: c.code,
  meta: c.name,
}));

const CURRENCY_SYMBOL_BY_CODE = Object.fromEntries(CURRENCIES.map((c) => [c.code, c.symbol]));

/**
 * "Other" on a category or payment-app chip group needs the user to say what
 * they actually mean — this centralises the toggle + inline field so both
 * groups behave identically.
 */
function isOther(value: string): boolean {
  return value === 'Other';
}

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
  const [categoryOther, setCategoryOther] = useState('');
  const [source, setSource] = useState('');
  const [sourceOther, setSourceOther] = useState('');
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [costError, setCostError] = useState<string | null>(null);
  const [categoryOtherError, setCategoryOtherError] = useState<string | null>(null);
  const [sourceOtherError, setSourceOtherError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setCost(String(existing.cost));
      setCurrency(existing.currency);
      setBillingCycle(existing.billingCycle);
      setNextRenewalDate(new Date(existing.nextRenewalDate));

      const existingCategory = existing.category ?? '';
      if (existingCategory && !CATEGORIES.includes(existingCategory as (typeof CATEGORIES)[number])) {
        setCategory('Other');
        setCategoryOther(existingCategory);
      } else {
        setCategory(existingCategory);
      }

      const existingSource = existing.source ?? '';
      if (existingSource && !PAYMENT_APPS.includes(existingSource as (typeof PAYMENT_APPS)[number])) {
        setSource('Other');
        setSourceOther(existingSource);
      } else {
        setSource(existingSource);
      }

      setNote(existing.note ?? '');
    }
  }, [existing]);

  const isSaving = addMutation.isPending || updateMutation.isPending;

  function validate(): boolean {
    let valid = true;
    setNameError(null);
    setCostError(null);
    setCategoryOtherError(null);
    setSourceOtherError(null);

    if (!name.trim()) {
      setNameError('Give it a name.');
      valid = false;
    }
    const numericCost = Number(cost);
    if (!cost.trim() || Number.isNaN(numericCost) || numericCost <= 0) {
      setCostError('Enter what it charges.');
      valid = false;
    }
    if (isOther(category) && !categoryOther.trim()) {
      setCategoryOtherError('Tell us what category this is.');
      valid = false;
    }
    if (isOther(source) && !sourceOther.trim()) {
      setSourceOtherError('Tell us which app or platform.');
      valid = false;
    }
    return valid;
  }

  async function handleSave() {
    setError(null);
    if (!validate()) return;

    const resolvedCategory = isOther(category) ? categoryOther.trim() : category;
    const resolvedSource = isOther(source) ? sourceOther.trim() : source;

    const input = {
      name: name.trim(),
      cost: Number(cost),
      currency,
      billingCycle,
      nextRenewalDate: nextRenewalDate.toISOString(),
      category: resolvedCategory || undefined,
      source: resolvedSource || undefined,
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
      setError(e?.response?.data?.message ?? "Couldn't save that. Try again.");
    }
  }

  if (isEdit && isLoadingExisting) return null;

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ScreenHeader
              title={isEdit ? 'Edit mandate' : 'Add a mandate'}
              dismiss="close"
              caption={isEdit ? undefined : 'What is charging you, and how much.'}
            />

            <TextField
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Netflix"
              autoFocus={!isEdit}
              error={nameError ?? undefined}
            />

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <TextField
                  label="Amount"
                  value={cost}
                  onChangeText={setCost}
                  placeholder="499"
                  keyboardType="decimal-pad"
                  numeric
                  error={costError ?? undefined}
                />
              </View>
              <View style={styles.currencyItem}>
                <PickerField
                  label="Currency"
                  value={currency}
                  options={CURRENCY_OPTIONS}
                  onChange={setCurrency}
                  renderValue={(opt) =>
                    opt ? `${CURRENCY_SYMBOL_BY_CODE[opt.value]} ${opt.value}` : currency
                  }
                />
              </View>
            </View>

            <Text style={t.label}>Every</Text>
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

            <Text style={t.label}>Next debit</Text>
            <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateButtonText}>
                {nextRenewalDate.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
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

            <Text style={t.label}>Category</Text>
            <View style={styles.categoryGroup}>
              {CATEGORIES.map((c) => {
                const selected = category === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => {
                      setCategory(selected ? '' : c);
                      if (selected) setCategoryOther('');
                    }}
                    style={[styles.categoryChip, selected && styles.categoryChipActive]}
                  >
                    <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {isOther(category) ? (
              <TextField
                label="What category is this?"
                value={categoryOther}
                onChangeText={setCategoryOther}
                placeholder="Productivity"
                autoFocus
                error={categoryOtherError ?? undefined}
              />
            ) : null}

            <Text style={t.label}>Paid via</Text>
            <View style={styles.categoryGroup}>
              {PAYMENT_APPS.map((app) => {
                const selected = source === app;
                return (
                  <Pressable
                    key={app}
                    onPress={() => {
                      setSource(selected ? '' : app);
                      if (selected) setSourceOther('');
                    }}
                    style={[styles.categoryChip, selected && styles.categoryChipActive]}
                  >
                    <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>
                      {app}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {isOther(source) ? (
              <TextField
                label="Which app or platform?"
                value={sourceOther}
                onChangeText={setSourceOther}
                placeholder="Amazon Pay"
                autoFocus
                error={sourceOtherError ?? undefined}
              />
            ) : null}

            <TextField
              label="Note (optional)"
              value={note}
              onChangeText={setNote}
              placeholder="Shared with family"
              multiline
              style={styles.noteInput}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              label={isEdit ? 'Save changes' : 'Add mandate'}
              onPress={handleSave}
              loading={isSaving}
            />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: gutter,
    paddingBottom: space.huge,
  },
  row: {
    flexDirection: 'row',
    gap: space.md,
  },
  rowItem: {
    flex: 1,
  },
  currencyItem: {
    width: 130,
  },
  segmentGroup: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: color.hairline,
    borderRadius: radius.card,
    backgroundColor: color.surface,
    overflow: 'hidden',
    marginTop: space.sm,
    marginBottom: space.lg,
  },
  segment: {
    flex: 1,
    paddingVertical: space.md + 2,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: color.indigoBg,
  },
  segmentText: {
    ...t.body,
    color: color.muted,
  },
  segmentTextActive: {
    color: color.indigo,
    fontFamily: font.sansMed,
  },
  dateButton: {
    height: 52,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.hairline,
    backgroundColor: color.surface,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    marginTop: space.sm,
    marginBottom: space.lg,
  },
  dateButtonText: {
    ...t.amount,
  },
  categoryGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.sm,
    marginBottom: space.lg,
  },
  categoryChip: {
    paddingHorizontal: space.md,
    paddingVertical: 7,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: color.hairline,
  },
  categoryChipActive: {
    backgroundColor: color.indigoBg,
    borderColor: color.indigoBg,
  },
  categoryText: {
    fontFamily: font.mono,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: color.muted,
  },
  categoryTextActive: {
    color: color.indigo,
  },
  noteInput: {
    height: 88,
    paddingTop: space.md,
    textAlignVertical: 'top',
  },
  error: {
    ...t.caption,
    color: color.debit,
    marginBottom: space.md,
  },
});
