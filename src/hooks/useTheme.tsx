import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createHairlineBorder,
  createTextStyles,
  palettes,
  type Palette,
  type TextStyles,
  type ThemeMode,
} from '@/src/theme';

const STORAGE_KEY = 'theme-mode-preference';

type ModePreference = ThemeMode | 'system';
export type ThemeModePreference = ModePreference;

interface ThemeContextValue {
  /** What the user picked — may be 'system'. */
  mode: ModePreference;
  /** What's actually on screen right now — always 'light' or 'dark'. */
  resolvedMode: ThemeMode;
  colors: Palette;
  text: TextStyles;
  hairlineBorder: ReturnType<typeof createHairlineBorder>;
  setMode: (mode: ModePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ModePreference>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
      setLoaded(true);
    });
  }, []);

  function setMode(next: ModePreference) {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Preference just won't survive a restart — not worth surfacing.
    });
  }

  const resolvedMode: ThemeMode = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const colors = palettes[resolvedMode];

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedMode,
      colors,
      text: createTextStyles(colors),
      hairlineBorder: createHairlineBorder(colors),
      setMode,
    }),
    [mode, resolvedMode, colors]
  );

  // Render nothing until the stored preference resolves, so the app never
  // flashes system-default and then snaps to a saved override.
  if (!loaded) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
