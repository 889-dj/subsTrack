import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { color, font, gutter, radius, space, text as t } from '@/src/theme';

export interface PickerOption {
  value: string;
  label: string;
  /** Right-aligned hint, e.g. a currency's full name. */
  meta?: string;
}

interface PickerFieldProps {
  label: string;
  value: string;
  options: PickerOption[];
  onChange: (value: string) => void;
  /** What shows on the closed field when nothing renders it, e.g. a symbol. */
  renderValue?: (option: PickerOption | undefined) => string;
}

/**
 * A statement-style dropdown: a hairline field that opens a bottom sheet list
 * on tap. Built generic so any future picker (not just currency) can reuse it
 * without a new one-off modal.
 */
export function PickerField({ label, value, options, onChange, renderValue }: PickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View>
      <Text style={t.label}>{label}</Text>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={styles.fieldValue}>
          {renderValue ? renderValue(selected) : (selected?.label ?? value)}
        </Text>
        <Ionicons name="chevron-down" size={16} color={color.muted} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.rowLabel, isSelected && styles.rowLabelSelected]}>
                      {item.label}
                    </Text>
                    {item.meta ? <Text style={styles.rowMeta}>{item.meta}</Text> : null}
                    {isSelected ? (
                      <Ionicons name="checkmark" size={16} color={color.indigo} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 52,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.hairline,
    backgroundColor: color.surface,
    paddingHorizontal: space.lg,
    marginTop: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    ...t.amount,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(22, 24, 26, 0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: gutter,
    paddingTop: gutter,
    paddingBottom: space.xxl,
    maxHeight: '70%',
  },
  sheetTitle: {
    ...t.label,
    marginBottom: space.sm,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
  },
  rowPressed: {
    backgroundColor: color.indigoBg,
  },
  rowLabel: {
    ...t.body,
    flex: 1,
  },
  rowLabelSelected: {
    fontFamily: font.sansSemi,
    color: color.indigo,
  },
  rowMeta: {
    ...t.caption,
  },
});
