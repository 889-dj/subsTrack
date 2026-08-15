import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Icon, type IconName } from '@/src/components/Icon';
import { useTabBarScroll } from '@/src/hooks/useTabBarScroll';
import { useTheme } from '@/src/hooks/useTheme';
import { radius, space, type Palette } from '@/src/theme';

/** Height of the floating pill itself, so screens can clear it. */
export const TAB_BAR_HEIGHT = 60;
/** What a scrolling screen must pad its content by to clear the bar. */
export const TAB_BAR_CLEARANCE = TAB_BAR_HEIGHT + space.xl + space.md;

const ICONS: Record<string, IconName> = {
  index: 'home',
  calendar: 'calendar',
  subscriptions: 'wallet',
  insights: 'chart',
};

/**
 * Five slots in one floating, fully-rounded pill: four real tab destinations
 * with the "+" add action fused into the center slot rather than living as
 * its own floating button elsewhere. No text labels — the icon set is small
 * and specific enough to read on its own; active state is colour + a soft
 * pill behind the glyph. The whole bar scales down slightly while a screen
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
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={options.title ?? route.name}
        style={({ pressed }) => [styles.item, pressed && styles.pressed]}
      >
        <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
          <Icon name={iconName} size={20} color={focused ? colors.indigo : colors.muted} />
        </View>
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
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
        >
          <Icon name="add" size={22} color={colors.white} />
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
      borderRadius: radius.sheet,
      backgroundColor: colors.isDark ? 'rgba(18,21,27,0.94)' : colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
      paddingHorizontal: space.sm,
      gap: 2,
      shadowColor: '#000',
      shadowOpacity: colors.isDark ? 0.4 : 0.08,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    item: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.chip,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapActive: {
      backgroundColor: colors.indigoBg,
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.indigo,
      marginHorizontal: 2,
    },
    addButtonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.95 }],
    },
    pressed: {
      opacity: 0.7,
    },
  });
