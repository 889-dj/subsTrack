import 'react-native-gesture-handler';
import React from 'react';
import { useColorScheme, View } from 'react-native';
import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Geist_400Regular, Geist_500Medium, Geist_600SemiBold } from '@expo-google-fonts/geist';
import { GeistMono_400Regular, GeistMono_500Medium } from '@expo-google-fonts/geist-mono';
import { setupMockApi } from '@/src/api/mock';
import { AuthProvider } from '@/src/hooks/useAuth';
import { PurchasesProvider } from '@/src/hooks/usePurchases';
import { ThemeProvider, useTheme } from '@/src/hooks/useTheme';
import { palettes } from '@/src/theme';

setupMockApi();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
  },
});

export default function RootLayout() {
  const systemScheme = useColorScheme();
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
  // every amount in the app. The stored theme preference hasn't loaded yet
  // at this point, so this guesses from the OS setting only.
  if (!ready) {
    const guess = systemScheme === 'dark' ? palettes.dark : palettes.light;
    return <View style={{ flex: 1, backgroundColor: guess.paper }} />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <PurchasesProvider>
              <AppShell />
            </PurchasesProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppShell() {
  const { resolvedMode } = useTheme();
  return (
    <>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      <Slot />
    </>
  );
}
