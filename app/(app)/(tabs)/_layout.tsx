import React from 'react';
import { Easing } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { BottomNav } from '@/src/components/BottomNav';
import { TabBarScrollProvider } from '@/src/hooks/useTabBarScroll';
import { useTheme } from '@/src/hooks/useTheme';
import { font } from '@/src/theme';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <TabBarScrollProvider>
      <TabsInner colors={colors} />
    </TabBarScrollProvider>
  );
}

function TabsInner({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      // Defaults to true on Android, which detaches a tab's native views when it
      // blurs and re-attaches them on the way back — that work lands on the UI
      // thread on the first frames of the transition and shows up as a stutter
      // before the slide gets going.
      detachInactiveScreens={false}
      screenOptions={{
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerTitleStyle: { color: colors.ink, fontFamily: font.sansSemi },
        sceneStyle: { backgroundColor: colors.paper },
        // Mount tabs up front. Lazy mounting pushes a screen's first render
        // into the frame the transition starts on, which is the other half
        // of the stutter.
        lazy: false,
        // Freeze (pause React updates on) a tab the moment it isn't focused —
        // this fires both when swiping to another tab and when a Stack screen
        // like Settings/paywall/detail is pushed on top of the whole tab
        // navigator. Without it, every mounted-but-hidden tab (four gradient-
        // and chart-heavy screens) fully re-renders on any theme change, which
        // is what made toggling Appearance from Settings feel slow. Freezing
        // only pauses JS re-renders, it doesn't detach native views the way
        // `detachInactiveScreens` does, so it doesn't reintroduce the mount
        // stutter that setting guards against.
        freezeOnBlur: true,
        animation: 'shift',
        sceneStyleInterpolator: ({ current }) => ({
          sceneStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [-32, 0, 32],
                }),
              },
            ],
          },
        }),
        transitionSpec: {
          animation: 'timing',
          config: { duration: 220, easing: Easing.out(Easing.quad) },
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Overview', headerShown: false }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar', headerShown: false }} />
      <Tabs.Screen name="subscriptions" options={{ title: 'Subscriptions', headerShown: false }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', headerShown: false }} />
    </Tabs>
  );
}
