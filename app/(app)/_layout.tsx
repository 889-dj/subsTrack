import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { Spinner } from '@/src/components/Spinner';
import { color, font } from '@/src/theme';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: color.paper },
        headerShadowVisible: false,
        headerTintColor: color.ink,
        headerTitleStyle: { color: color.ink, fontFamily: font.sansSemi, fontSize: 17 },
        contentStyle: { backgroundColor: color.paper },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="paywall" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}
