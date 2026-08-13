import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, type Palette } from '@/src/theme';

/** Height of the floating pill itself, so screens can clear it. */
export const TAB_BAR_HEIGHT = 64;
/** What a scrolling screen must pad its content by to clear the bar. */
export const TAB_BAR_CLEARANCE = TAB_BAR_HEIGHT + space.xl + space.md;

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<string, IconName> = {
  index: 'reader-outline',
  account: 'person-outline',
};

const LABELS: Record<string, string> = {
  index: 'Home',
  account: 'Settings',
};

/**
 * A single floating pill — fully rounded, hairline border, no shadow — with
 * the add button stamped dead centre. Adding a mandate is not a destination,
 * so it isn't a tab; it's the one control that always sits in the middle.
 */
export function StatementTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const routes = state.routes;
  const mid = Math.ceil(routes.length / 2);
  const left = routes.slice(0, mid);
  const right = routes.slice(mid);

  function renderTab(route: (typeof routes)[number]) {
    const index = routes.indexOf(route);
    const { options } = descriptors[route.key];
    const focused = state.index === index;
    const label = LABELS[route.name] ?? options.title ?? route.name;

    function onPress() {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
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
        accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
        style={({ pressed }) => [styles.item, pressed && styles.pressed]}
      >
        <Ionicons
          name={ICONS[route.name] ?? 'ellipse-outline'}
          size={20}
          color={focused ? colors.indigo : colors.muted}
        />
        <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + space.md }]}>
      <View style={styles.bar}>
        {left.map(renderTab)}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add a mandate"
          onPress={() => router.push('/add')}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </Pressable>

        {right.map(renderTab)}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: space.xl,
      right: space.xl,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      height: TAB_BAR_HEIGHT,
      borderRadius: radius.chip,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.hairline,
      paddingHorizontal: space.sm,
    },
    item: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    label: {
      fontFamily: font.mono,
      fontSize: 10,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    labelActive: {
      fontFamily: font.monoMed,
      color: colors.indigo,
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.indigo,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: space.sm,
    },
    pressed: {
      opacity: 0.7,
    },
  });
