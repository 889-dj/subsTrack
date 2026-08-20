import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AmountText } from '@/src/components/AmountText';
import { BottomSheetModal } from '@/src/components/BottomSheetModal';
import { Icon } from '@/src/components/Icon';
import { SubscriptionIcon } from '@/src/components/SubscriptionIcon';
import { useTheme } from '@/src/hooks/useTheme';
import { space, type Palette, type TextStyles } from '@/src/theme';
import type { Subscription } from '@/src/types';
import { longDate } from '@/src/utils/subscriptions';

interface MultiRenewalSheetProps {
  visible: boolean;
  onClose: () => void;
  date: Date | null;
  subs: Subscription[];
}

/**
 * Slide-up modal listing every subscription renewing on a given day. Shared
 * by the Overview "coming up" list and the Calendar day panel — both just
 * hand it a date and the matching subscriptions.
 */
export function MultiRenewalSheet({ visible, onClose, date, subs }: MultiRenewalSheetProps) {
  const router = useRouter();
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const total = subs.reduce((sum, s) => sum + s.cost, 0);
  const currency = subs[0]?.currency ?? 'INR';
  const hasMixedCurrencies = new Set(subs.map((sub) => sub.currency)).size > 1;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      maxHeight="75%"
      accessibilityLabel="renewals"
    >
      <View style={styles.header}>
        <View>
          <Text style={t.section}>{date ? longDate(date.toISOString()) : 'Renewals'}</Text>
          <Text style={styles.subtitle}>
            {subs.length} subscription{subs.length === 1 ? '' : 's'} ·{' '}
            {hasMixedCurrencies ? (
              'multiple currencies'
            ) : (
              <AmountText value={total} currency={currency} size={13} tone="muted" />
            )}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close renewals"
          style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
        >
          <Icon name="close" size={20} color={colors.muted} />
        </Pressable>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {subs.map((sub) => (
          <Pressable
            key={sub.id}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => {
              onClose();
              router.push(`/${sub.id}`);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Open ${sub.name}, ${sub.cost} ${sub.currency}`}
          >
            <SubscriptionIcon name={sub.name} size={40} />
            <View style={styles.copy}>
              <Text style={t.body} numberOfLines={1}>
                {sub.name}
              </Text>
              <Text style={styles.sublabel} numberOfLines={1}>
                {sub.category ?? 'Other'}
              </Text>
            </View>
            <AmountText value={sub.cost} currency={sub.currency} tone="ink" />
          </Pressable>
        ))}
      </ScrollView>
    </BottomSheetModal>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: space.lg,
    },
    subtitle: {
      ...t.caption,
      marginTop: 4,
    },
    close: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -space.sm,
      marginRight: -space.sm,
    },
    closePressed: { opacity: 0.55 },
    list: {
      flexGrow: 0,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      paddingVertical: space.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    rowPressed: {
      opacity: 0.7,
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    sublabel: {
      ...t.caption,
    },
  });
