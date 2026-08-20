import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Icon, type IconName } from '@/src/components/Icon';
import { useTabBarScroll } from '@/src/hooks/useTabBarScroll';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, type Palette } from '@/src/theme';

/** Height of the floating pill itself, so screens can clear it. */
export const TAB_BAR_HEIGHT = 68;
/** What a scrolling screen must pad its content by to clear the bar. */
export const TAB_BAR_CLEARANCE = TAB_BAR_HEIGHT + space.xl + space.md;

const ICONS: Record<string, IconName> = {
  index: 'home',
  calendar: 'calendar',
  subscriptions: 'wallet',
  insights: 'chart',
};

const LABELS: Record<string, string> = {
  index: 'Home',
  calendar: 'Calendar',
  subscriptions: 'Subs',
  insights: 'Insights',
};

/**
 * Five labelled slots in one floating pill: four real tab destinations with
 * the add action in the centre. Labels keep the less-familiar ledger and
 * insights destinations obvious without relying on icon recognition alone.
 * The whole bar scales down slightly while a screen
 * is actively being scrolled (down), and springs back on scroll-up or at
 * rest, echoing the Revolut-style shrinking dock.
 */
export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { collapsed } = useTabBarScroll();

  const barAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(collapsed.value, [0, 1], [1, 0.88]) }],
    opacity: interpolate(collapsed.value, [0, 1], [1, 0.94]),
  }));

  const half = Math.ceil(state.routes.length / 2);
  const leftRoutes = state.routes.slice(0, half);
  const rightRoutes = state.routes.slice(half);

  function renderTab(route: (typeof state.routes)[number]) {
    const index = state.routes.indexOf(route);
    const { options } = descriptors[route.key];
    const focused = state.index === index;
    const iconName = ICONS[route.name] ?? 'wallet';
    const label = LABELS[route.name] ?? options.title ?? route.name;

    function onPress() {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    }

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={label}
        accessibilityHint={`Opens the ${label} tab`}
        style={({ pressed }) => [styles.item, pressed && styles.pressed]}
      >
        <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
          <Icon name={iconName} size={19} color={focused ? colors.indigo : colors.muted} />
        </View>
        <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + space.md }]}>
      <Animated.View style={[styles.bar, barAnimatedStyle]}>
        {leftRoutes.map(renderTab)}

        <Pressable
          onPress={() => router.push('/add')}
          accessibilityRole="button"
          accessibilityLabel="Add a subscription"
          style={({ pressed }) => [styles.addSlot, pressed && styles.addButtonPressed]}
        >
          <View style={styles.addButton}>
            <Icon name="add" size={21} color={colors.white} />
          </View>
          <Text style={styles.addLabel}>Add</Text>
        </Pressable>

        {rightRoutes.map(renderTab)}
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: space.lg,
      right: space.lg,
      alignItems: 'center',
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      height: TAB_BAR_HEIGHT,
      borderRadius: radius.card,
      backgroundColor: colors.isDark ? 'rgba(18,21,27,0.94)' : colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
      paddingHorizontal: 6,
      gap: 1,
      shadowOpacity: 0,
      elevation: 0,
    },
    item: {
      flex: 1,
      minWidth: 51,
      height: TAB_BAR_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    iconWrap: {
      width: 34,
      height: 32,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapActive: {
      backgroundColor: colors.indigoBg,
    },
    tabLabel: {
      fontFamily: font.sansMed,
      fontSize: 9.5,
      lineHeight: 12,
      color: colors.muted,
    },
    tabLabelActive: {
      color: colors.indigo,
    },
    addSlot: {
      flex: 1,
      minWidth: 51,
      height: TAB_BAR_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    addButton: {
      width: 36,
      height: 34,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.indigo,
    },
    addLabel: {
      fontFamily: font.sansMed,
      fontSize: 9.5,
      lineHeight: 12,
      color: colors.indigo,
    },
    addButtonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.95 }],
    },
    pressed: {
      opacity: 0.7,
    },
  });
