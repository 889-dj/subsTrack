import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { Spinner } from '@/src/components/Spinner';
import { colors } from '@/src/theme';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="review" options={{ title: 'Review' }} />
      <Stack.Screen name="add" options={{ title: 'Subscription', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Details' }} />
    </Stack>
  );
}
