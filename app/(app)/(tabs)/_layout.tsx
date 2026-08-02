import React from 'react';
import { Easing } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { FloatingTabBar } from '@/src/components/FloatingTabBar';
import { colors } from '@/src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      // Defaults to true on Android, which detaches a tab's native views when it
      // blurs and re-attaches them on the way back — that work lands on the UI
      // thread on the first frames of the transition and shows up as a stutter
      // before the slide gets going. Three light screens are cheap to keep
      // attached.
      detachInactiveScreens={false}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        sceneStyle: { backgroundColor: colors.background },
        // Mount all three tabs up front. Lazy mounting pushes a screen's first
        // render into the frame the transition starts on, which is the other
        // half of the stutter.
        lazy: false,
        freezeOnBlur: false,
        // Tabs default to no animation, which reads as a hard cut.
        animation: 'shift',
        // Deliberately transform-only, no opacity. Android composites a view
        // whose opacity is animated into an alpha layer, and `elevation`
        // shadows inside that layer are drawn as solid grey rectangles — the
        // cards turn into grey blocks for the length of the transition. Sliding
        // opaque screens sidesteps it; the incoming screen is stacked on top,
        // so it covers the outgoing one on its way in.
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
      <Tabs.Screen name="index" options={{ title: 'Subscriptions', headerShown: false }} />
      <Tabs.Screen name="upload" options={{ title: 'Scan', headerShown: false }} />
      <Tabs.Screen name="account" options={{ title: 'Account', headerShown: false }} />
    </Tabs>
  );
}
