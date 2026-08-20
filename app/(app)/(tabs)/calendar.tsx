import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { AmountText } from '@/src/components/AmountText';
import { TAB_BAR_CLEARANCE } from '@/src/components/BottomNav';
import { EmptyState } from '@/src/components/EmptyState';
import { Icon } from '@/src/components/Icon';
import { RenewalCalendar } from '@/src/components/RenewalCalendar';
import { SectionHeader } from '@/src/components/SectionHeader';
import { SkeletonList } from '@/src/components/SkeletonRow';
import { SubscriptionCard } from '@/src/components/SubscriptionCard';
import { useSubscriptions } from '@/src/hooks/useSubscriptions';
import { useTabBarScroll } from '@/src/hooks/useTabBarScroll';
import { useTheme } from '@/src/hooks/useTheme';
import { gutter, radius, space, type Palette, type TextStyles } from '@/src/theme';
import { dayKey, groupByRenewalDate, longDate } from '@/src/utils/subscriptions';

const MONTH_LABEL = (d: Date) => d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const { data, isLoading } = useSubscriptions();
  const { onScroll } = useTabBarScroll();

  const subs = useMemo(() => data ?? [], [data]);
  const groups = useMemo(() => groupByRenewalDate(subs), [subs]);
  const groupMap = useMemo(() => new Map(groups.map((g) => [g.dateKey, g])), [groups]);

  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selected, setSelected] = useState<Date | null>(null);
  const selectedKey = selected ? dayKey(selected) : null;
  const selectedGroup = selectedKey ? groupMap.get(selectedKey) : undefined;
  const monthGroups = useMemo(
    () =>
      groups.filter(
        (group) =>
          group.date.getFullYear() === month.getFullYear() &&
          group.date.getMonth() === month.getMonth(),
      ),
    [groups, month],
  );

  function shiftMonth(delta: number) {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
    setSelected(null);
  }

  return (
    <Animated.ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.md, paddingBottom: TAB_BAR_CLEARANCE + space.xxl },
      ]}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <Text style={styles.eyebrow}>RENEWAL MAP</Text>
      <Text style={t.heading}>Calendar</Text>
      <Text style={styles.subtitle}>See every renewal at a glance</Text>

      <View style={styles.monthRow}>
        <Text style={styles.monthLabel}>{MONTH_LABEL(month)}</Text>
        <View style={styles.monthControls}>
          <Pressable
            onPress={() => shiftMonth(-1)}
            style={styles.monthButton}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <Icon name="chevron-back" size={16} color={colors.ink} />
          </Pressable>
          <Pressable
            onPress={() => shiftMonth(1)}
            style={styles.monthButton}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <Icon name="chevron-forward" size={16} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : (
        <>
          <View style={styles.calendarCard}>
            <RenewalCalendar
              month={month}
              groups={groups}
              selectedKey={selectedKey}
              onSelectDay={setSelected}
            />
          </View>

          {selected && selectedGroup ? (
            <View style={styles.dayPanel}>
              <Text style={styles.dayPanelTitle}>{longDate(selected.toISOString())}</Text>
              <Text style={styles.dayPanelSubtitle}>
                {selectedGroup.subs.length} subscription{selectedGroup.subs.length === 1 ? '' : 's'} ·{' '}
                <AmountText
                  value={selectedGroup.total}
                  currency={selectedGroup.subs[0].currency}
                  size={13}
                  tone="muted"
                />
              </Text>
              {selectedGroup.subs.map((sub) => (
                <Pressable
                  key={sub.id}
                  style={({ pressed }) => [styles.dayRow, pressed && styles.dayRowPressed]}
                  onPress={() => router.push(`/${sub.id}`)}
                >
                  <Text style={t.body} numberOfLines={1}>
                    {sub.name}
                  </Text>
                  <AmountText value={sub.cost} currency={sub.currency} />
                </Pressable>
              ))}
            </View>
          ) : null}

          <SectionHeader label="Upcoming" />
          {monthGroups.length === 0 ? (
            <EmptyState
              title={`Nothing renewing in ${month.toLocaleDateString('en-IN', { month: 'long' })}.`}
              subtitle="Choose another month or add a subscription."
              icon="calendar-outline"
              action={{ label: 'Add a subscription', onPress: () => router.push('/add') }}
            />
          ) : (
            <View style={styles.upcomingList}>
              {monthGroups.flatMap((group) =>
                group.subs.map((sub) => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    variant="card"
                    onPress={() => router.push(`/${sub.id}`)}
                  />
                )),
              )}
            </View>
          )}
        </>
      )}
    </Animated.ScrollView>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.paper,
    },
    content: {
      paddingHorizontal: gutter,
      flexGrow: 1,
    },
    subtitle: {
      ...t.caption,
      marginTop: 4,
      marginBottom: space.lg,
    },
    eyebrow: { ...t.label, color: colors.indigo, marginBottom: 5 },
    monthRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: space.md,
    },
    monthLabel: {
      ...t.section,
    },
    monthControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
    },
    monthButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.isDark ? 'rgba(255,255,255,0.06)' : colors.paper2,
    },
    calendarCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: space.md,
    },
    dayPanel: {
      backgroundColor: colors.elevated,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: space.lg,
      marginTop: space.md,
    },
    dayPanelTitle: {
      ...t.body,
      fontSize: 15.5,
    },
    dayPanelSubtitle: {
      ...t.caption,
      marginTop: 2,
      marginBottom: space.sm,
    },
    dayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: space.sm,
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
    },
    dayRowPressed: {
      opacity: 0.7,
    },
    upcomingList: {
      width: '100%',
    },
  });
