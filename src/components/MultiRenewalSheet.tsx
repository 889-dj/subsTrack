import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AmountText } from '@/src/components/AmountText';
import { Icon } from '@/src/components/Icon';
import { SubscriptionIcon } from '@/src/components/SubscriptionIcon';
import { useTheme } from '@/src/hooks/useTheme';
import { gutter, radius, space, type Palette, type TextStyles } from '@/src/theme';
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={t.section}>{date ? longDate(date.toISOString()) : 'Renewals'}</Text>
              <Text style={styles.subtitle}>
                {subs.length} subscription{subs.length === 1 ? '' : 's'} · combined{' '}
                <AmountText value={total} currency={currency} size={13} tone="muted" />
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.elevated,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      paddingHorizontal: gutter,
      paddingTop: space.md,
      paddingBottom: space.xxl,
      maxHeight: '75%',
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.hairline,
      alignSelf: 'center',
      marginBottom: space.lg,
    },
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
      padding: 4,
    },
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
