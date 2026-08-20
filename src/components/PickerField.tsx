import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheetModal } from '@/src/components/BottomSheetModal';
import { Icon } from '@/src/components/Icon';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, type Palette, type TextStyles } from '@/src/theme';

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
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View>
      <Text style={t.label}>{label}</Text>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={styles.fieldValue}>
          {renderValue ? renderValue(selected) : (selected?.label ?? value)}
        </Text>
        <Icon name="chevron-down" size={16} color={colors.muted} />
      </Pressable>

      <BottomSheetModal
        visible={open}
        onClose={() => setOpen(false)}
        maxHeight="70%"
        accessibilityLabel={`${label} options`}
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <Pressable
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={`Close ${label} options`}
            style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
          >
            <Icon name="close" size={20} color={colors.muted} />
          </Pressable>
        </View>
        <FlatList
          data={options}
          keyExtractor={(o) => o.value}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = item.value === value;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
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
                  <Icon name="checkmark" size={16} color={colors.indigo} />
                ) : null}
              </Pressable>
            );
          }}
        />
      </BottomSheetModal>
    </View>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    field: {
      height: 52,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
      paddingHorizontal: space.lg,
      marginTop: space.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    fieldValue: {
      ...t.amount,
    },
    sheetHeader: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    sheetTitle: {
      ...t.label,
      paddingTop: space.xs,
    },
    close: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -space.sm,
      marginRight: -space.sm,
    },
    closePressed: {
      opacity: 0.55,
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
      borderBottomColor: colors.hairline,
    },
    rowPressed: {
      backgroundColor: colors.indigoBg,
    },
    rowLabel: {
      ...t.body,
      flex: 1,
    },
    rowLabelSelected: {
      fontFamily: font.sansSemi,
      color: colors.indigo,
    },
    rowMeta: {
      ...t.caption,
    },
  });
