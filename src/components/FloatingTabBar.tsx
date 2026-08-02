import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { colors, radius, spacing } from '@/src/theme';

/** Height of the bar plus its offset, so screens can clear it. */
export const FLOATING_TAB_BAR_HEIGHT = 76;

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'albums', inactive: 'albums-outline' },
  upload: { active: 'scan-circle', inactive: 'scan-circle-outline' },
  account: { active: 'person-circle', inactive: 'person-circle-outline' },
};

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, spacing.md) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          // The bar is icon-only, so the title lives on in the accessibility
          // label — it is the only name a screen reader can announce.
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : (options.title ?? route.name);
          const icon = ICONS[route.name] ?? ICONS.index;

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
            <TabItem
              key={route.key}
              icon={icon}
              focused={focused}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

/**
 * Both icons are stacked and cross-faded rather than swapped, so the outline
 * turning solid reads as one movement. Opacity and transform are the only
 * properties animated here — they can all run on the native driver.
 */
function TabItem({
  icon,
  focused,
  accessibilityLabel,
  onPress,
}: {
  icon: { active: IconName; inactive: IconName };
  focused: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: focused ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [focused, progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <Animated.View style={[styles.pill, { opacity: progress }]} />
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={icon.inactive} size={24} color={colors.textMuted} />
        <Animated.View style={[styles.iconOverlay, { opacity: progress }]}>
          <Ionicons name={icon.active} size={24} color={colors.accent} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    // Heavier than the card shadow — the bar floats above scrolling content.
    shadowColor: '#14171F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // 24px icon + 12px either side keeps the bar at FLOATING_TAB_BAR_HEIGHT.
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  pill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.accentMuted,
    borderRadius: radius.pill,
  },
  iconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
