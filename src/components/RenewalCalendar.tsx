import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, type Palette, type TextStyles } from '@/src/theme';
import type { RenewalGroup } from '@/src/utils/subscriptions';
import { dayKey } from '@/src/utils/subscriptions';

interface RenewalCalendarProps {
  /** First-of-month anchor — only year/month are read. */
  month: Date;
  groups: RenewalGroup[];
  selectedKey: string | null;
  onSelectDay: (date: Date) => void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function buildCells(month: Date): (Date | null)[] {
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const cells: (Date | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, m, d));
  return cells;
}

/** Minimal month grid — a dot (or "●●+N") on days with renewals, tap to select. */
export function RenewalCalendar({ month, groups, selectedKey, onSelectDay }: RenewalCalendarProps) {
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const cells = useMemo(() => buildCells(month), [month]);
  const groupByKey = useMemo(() => new Map(groups.map((g) => [g.dateKey, g])), [groups]);
  const todayKey = dayKey(new Date());

  return (
    <View>
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={`${w}${i}`} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((date, i) => {
          if (!date) return <View key={i} style={styles.cell} />;
          const key = dayKey(date);
          const group = groupByKey.get(key);
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;

          return (
            <Pressable
              key={i}
              style={styles.cell}
              onPress={() => onSelectDay(date)}
              disabled={!group}
            >
              <View
                style={[
                  styles.dayBox,
                  isToday && styles.dayBoxToday,
                  isSelected && styles.dayBoxSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isToday && styles.dayTextToday,
                    isSelected && styles.dayTextSelected,
                  ]}
                >
                  {date.getDate()}
                </Text>
                {group ? (
                  <View style={styles.dotRow}>
                    {group.subs.slice(0, 2).map((s) => (
                      <View
                        key={s.id}
                        style={[styles.dot, isSelected && { backgroundColor: colors.white }]}
                      />
                    ))}
                    {group.subs.length > 2 ? (
                      <Text
                        style={[styles.dotExtra, isSelected && { color: colors.white }]}
                      >
                        +{group.subs.length - 2}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const CELL = `${100 / 7}%` as const;

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    weekdayRow: {
      flexDirection: 'row',
      marginBottom: space.xs,
    },
    weekday: {
      width: CELL,
      textAlign: 'center',
      ...t.label,
      marginBottom: 0,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    cell: {
      width: CELL,
      alignItems: 'center',
      paddingVertical: 3,
    },
    dayBox: {
      width: 36,
      height: 36,
      borderRadius: radius.cardSm,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    dayBoxToday: {
      borderWidth: 1,
      borderColor: colors.indigo,
    },
    dayBoxSelected: {
      backgroundColor: colors.indigo,
    },
    dayText: {
      fontFamily: font.mono,
      fontSize: 12.5,
      color: colors.ink,
    },
    dayTextToday: {
      color: colors.indigo,
      fontFamily: font.monoMed,
    },
    dayTextSelected: {
      color: colors.white,
    },
    dotRow: {
      flexDirection: 'row',
      gap: 2,
      alignItems: 'center',
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.indigo,
    },
    dotExtra: {
      fontSize: 8,
      fontFamily: font.monoMed,
      color: colors.muted,
    },
  });
