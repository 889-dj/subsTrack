import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const sheetOffset = useRef(new Animated.Value(28)).current;
  const total = subs.reduce((sum, s) => sum + s.cost, 0);
  const currency = subs[0]?.currency ?? 'INR';

  useEffect(() => {
    if (!visible) return;
    sheetOffset.setValue(28);
    Animated.timing(sheetOffset, {
      toValue: 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, sheetOffset]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetOffset }] }]}>
          <Pressable style={styles.sheetContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View>
                <Text style={t.section}>{date ? longDate(date.toISOString()) : 'Renewals'}</Text>
                <Text style={styles.subtitle}>
                  {subs.length} subscription{subs.length === 1 ? '' : 's'} · combined{' '}
                  <AmountText value={total} currency={currency} size={13} tone="muted" />
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
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.isDark ? 'rgba(0,0,0,0.56)' : 'rgba(15,20,35,0.34)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.elevated,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      maxHeight: '75%',
      borderTopWidth: 1,
      borderColor: colors.hairline,
      shadowColor: '#000',
      shadowOpacity: colors.isDark ? 0.32 : 0.14,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: -6 },
      elevation: 12,
    },
    sheetContent: {
      paddingHorizontal: gutter,
      paddingTop: space.md,
      paddingBottom: space.xxl,
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
