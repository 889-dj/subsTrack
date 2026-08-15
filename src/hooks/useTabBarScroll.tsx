import React, { createContext, useContext, useMemo } from 'react';
import {
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

interface TabBarScrollContextValue {
  /** 0 = full-size bar, 1 = collapsed. Animated on the UI thread. */
  collapsed: SharedValue<number>;
  /** Attach to any tab screen's ScrollView `onScroll` (with `scrollEventThrottle={16}`). */
  onScroll: ReturnType<typeof useAnimatedScrollHandler>;
}

const TabBarScrollContext = createContext<TabBarScrollContextValue | null>(null);

const COLLAPSE_AFTER = 24; // px scrolled down before the bar is allowed to shrink
const DIRECTION_THRESHOLD = 6; // px of movement needed to register a direction change

export function TabBarScrollProvider({ children }: { children: React.ReactNode }) {
  const collapsed = useSharedValue(0);
  const prevY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      const y = event.contentOffset.y;
      const delta = y - prevY.value;

      if (y <= COLLAPSE_AFTER) {
        collapsed.value = withTiming(0, { duration: 220 });
      } else if (delta > DIRECTION_THRESHOLD) {
        collapsed.value = withTiming(1, { duration: 220 });
      } else if (delta < -DIRECTION_THRESHOLD) {
        collapsed.value = withTiming(0, { duration: 220 });
      }

      prevY.value = y;
    },
  });

  const value = useMemo(() => ({ collapsed, onScroll }), [collapsed, onScroll]);

  return <TabBarScrollContext.Provider value={value}>{children}</TabBarScrollContext.Provider>;
}

export function useTabBarScroll(): TabBarScrollContextValue {
  const ctx = useContext(TabBarScrollContext);
  if (!ctx) throw new Error('useTabBarScroll must be used within a TabBarScrollProvider');
  return ctx;
}
