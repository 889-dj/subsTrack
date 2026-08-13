import React from 'react';
import { Easing } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { StatementTabBar } from '@/src/components/StatementTabBar';
import { color, font } from '@/src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <StatementTabBar {...props} />}
      // Defaults to true on Android, which detaches a tab's native views when it
      // blurs and re-attaches them on the way back — that work lands on the UI
      // thread on the first frames of the transition and shows up as a stutter
      // before the slide gets going. Two light screens are cheap to keep
      // attached.
      detachInactiveScreens={false}
      screenOptions={{
        headerStyle: { backgroundColor: color.paper },
        headerShadowVisible: false,
        headerTintColor: color.ink,
        headerTitleStyle: { color: color.ink, fontFamily: font.sansSemi },
        sceneStyle: { backgroundColor: color.paper },
        // Mount both tabs up front. Lazy mounting pushes a screen's first
        // render into the frame the transition starts on, which is the other
        // half of the stutter.
        lazy: false,
        freezeOnBlur: false,
        // Tabs default to no animation, which reads as a hard cut.
        animation: 'shift',
        // Deliberately transform-only, no opacity. Android composites a view
        // whose opacity is animated into an alpha layer, which is worth
        // avoiding on a screen made almost entirely of hairlines.
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
      <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false }} />
      <Tabs.Screen name="account" options={{ title: 'Settings', headerShown: false }} />
    </Tabs>
  );
}
