import 'react-native-gesture-handler';
import React from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Geist_400Regular, Geist_500Medium, Geist_600SemiBold } from '@expo-google-fonts/geist';
import { GeistMono_400Regular, GeistMono_500Medium } from '@expo-google-fonts/geist-mono';
import { setupMockApi } from '@/src/api/mock';
import { AuthProvider } from '@/src/hooks/useAuth';
import { PurchasesProvider } from '@/src/hooks/usePurchases';
import { color } from '@/src/theme';

setupMockApi();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    GeistMono_400Regular,
    GeistMono_500Medium,
  });

  const ready = fontsLoaded || fontError !== null;

  // Holding on paper until the fonts resolve avoids a frame of system-font
  // text — the whole layout is set on mono figures, so a fallback reflows
  // every amount in the app.
  if (!ready) return <View style={{ flex: 1, backgroundColor: color.paper }} />;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PurchasesProvider>
            <StatusBar style="dark" />
            <Slot />
          </PurchasesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
