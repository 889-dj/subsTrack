import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              style={({ pressed }) => [
                styles.item,
                focused && styles.itemActive,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={focused ? icon.active : icon.inactive}
                size={22}
                color={focused ? colors.accent : colors.textMuted}
              />
              <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  itemActive: {
    backgroundColor: colors.accentMuted,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.accent,
  },
});
