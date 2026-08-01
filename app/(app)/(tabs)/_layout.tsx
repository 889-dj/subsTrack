import React from 'react';
import { Tabs } from 'expo-router/js-tabs';
import { FloatingTabBar } from '@/src/components/FloatingTabBar';
import { colors } from '@/src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Subscriptions', headerShown: false }} />
      <Tabs.Screen name="upload" options={{ title: 'Scan', headerShown: false }} />
      <Tabs.Screen name="account" options={{ title: 'Account', headerShown: false }} />
    </Tabs>
  );
}
