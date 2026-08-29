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
import { SubscriptionIcon } from '@/src/components/SubscriptionIcon';
import { useCalendarOccurrences } from '@/src/hooks/useSubscriptions';
import { useTabBarScroll } from '@/src/hooks/useTabBarScroll';
import { useTheme } from '@/src/hooks/useTheme';
import { font, gutter, radius, space, type Palette, type TextStyles } from '@/src/theme';
import type { CalendarOccurrence } from '@/src/types';
import { dayKey, longDate, shortDate } from '@/src/utils/subscriptions';

const MONTH_LABEL = (d: Date) => d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

function monthParam(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

interface DayOccurrences {
  dateKey: string;
  date: Date;
  occurrences: CalendarOccurrence[];
  total: number;
}

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const { onScroll } = useTabBarScroll();

  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const { data, isLoading } = useCalendarOccurrences(monthParam(month));

  // Every occurrence this month lands on, projected from each subscription's
  // billing cycle — not just subscriptions whose single stored renewal date
  // happens to fall here. See GET /v1/subscriptions/calendar.
  const dayGroups = useMemo(() => {
    const map = new Map<string, DayOccurrences>();
    for (const occ of data?.items ?? []) {
      const date = new Date(occ.date);
      const key = dayKey(date);
      const existing = map.get(key);
      if (existing) {
        existing.occurrences.push(occ);
        existing.total += Number(occ.cost);
      } else {
        map.set(key, { dateKey: key, date, occurrences: [occ], total: Number(occ.cost) });
      }
    }
    return [...map.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data]);
  const dayGroupMap = useMemo(() => new Map(dayGroups.map((g) => [g.dateKey, g])), [dayGroups]);
  const calendarGroups = useMemo(
    () =>
      dayGroups.map((g) => ({
        dateKey: g.dateKey,
        date: g.date,
        subs: g.occurrences.map((o) => ({ id: o.subscriptionId })),
      })),
    [dayGroups],
  );

  const [selected, setSelected] = useState<Date | null>(null);
  const selectedKey = selected ? dayKey(selected) : null;
  const selectedGroup = selectedKey ? dayGroupMap.get(selectedKey) : undefined;
  const selectedGroupHasMixedCurrencies = selectedGroup
    ? new Set(selectedGroup.occurrences.map((o) => o.currency)).size > 1
    : false;

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
              groups={calendarGroups}
              selectedKey={selectedKey}
              onSelectDay={setSelected}
            />
          </View>

          {selected && selectedGroup ? (
            <View style={styles.dayPanel}>
              <Text style={styles.dayPanelTitle}>{longDate(selected.toISOString())}</Text>
              <Text style={styles.dayPanelSubtitle}>
                {selectedGroup.occurrences.length} subscription
                {selectedGroup.occurrences.length === 1 ? '' : 's'} ·{' '}
                {selectedGroupHasMixedCurrencies ? (
                  'multiple currencies'
                ) : (
                  <AmountText
                    value={selectedGroup.total}
                    currency={selectedGroup.occurrences[0].currency}
                    size={13}
                    tone="muted"
                  />
                )}
              </Text>
              {selectedGroup.occurrences.map((occ) => (
                <Pressable
                  key={occ.subscriptionId}
                  style={({ pressed }) => [styles.dayRow, pressed && styles.dayRowPressed]}
                  onPress={() => router.push(`/${occ.subscriptionId}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${occ.name}, ${occ.cost} ${occ.currency}`}
                >
                  <Text style={t.body} numberOfLines={1}>
                    {occ.name}
                  </Text>
                  <AmountText value={Number(occ.cost)} currency={occ.currency} />
                </Pressable>
              ))}
            </View>
          ) : null}

          <SectionHeader label="Upcoming" />
          {dayGroups.length === 0 ? (
            <EmptyState
              title={`Nothing renewing in ${month.toLocaleDateString('en-IN', { month: 'long' })}.`}
              subtitle="Choose another month or add a subscription."
              icon="calendar-outline"
              action={{ label: 'Add a subscription', onPress: () => router.push('/add') }}
            />
          ) : (
            <View style={styles.upcomingList}>
              {dayGroups.flatMap((group) =>
                group.occurrences.map((occ) => (
                  <Pressable
                    key={`${occ.subscriptionId}-${occ.date}`}
                    style={({ pressed }) => [styles.upcomingRow, pressed && styles.dayRowPressed]}
                    onPress={() => router.push(`/${occ.subscriptionId}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`${occ.name}, ${occ.cost} ${occ.currency}, renews ${shortDate(occ.date)}`}
                  >
                    <SubscriptionIcon name={occ.name} logoUrl={occ.logoUrl ?? undefined} size={44} />
                    <View style={styles.upcomingCopy}>
                      <Text style={styles.upcomingName} numberOfLines={1}>
                        {occ.name}
                      </Text>
                      <Text style={styles.upcomingSubtitle}>
                        {occ.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
                      </Text>
                    </View>
                    <View style={styles.upcomingRight}>
                      <AmountText value={Number(occ.cost)} currency={occ.currency} tone="ink" />
                      <Text style={styles.upcomingDate}>{shortDate(occ.date)}</Text>
                    </View>
                  </Pressable>
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
    upcomingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      width: '100%',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.cardSm,
      paddingHorizontal: space.lg,
      paddingVertical: space.lg,
      marginBottom: space.sm,
    },
    upcomingCopy: {
      flex: 1,
      gap: 2,
    },
    upcomingName: {
      ...t.body,
      fontFamily: font.sansSemi,
    },
    upcomingSubtitle: {
      ...t.caption,
    },
    upcomingRight: {
      alignItems: 'flex-end',
      gap: 2,
    },
    upcomingDate: {
      ...t.caption,
      fontSize: 12,
    },
  });
