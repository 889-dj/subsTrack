import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { Spinner } from '@/src/components/Spinner';
import { useTheme } from '@/src/hooks/useTheme';
import { font } from '@/src/theme';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerTitleStyle: { color: colors.ink, fontFamily: font.sansSemi, fontSize: 17 },
        contentStyle: { backgroundColor: colors.paper },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="account" options={{ headerShown: false }} />
      <Stack.Screen name="paywall" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
    </Stack>
  );
}
