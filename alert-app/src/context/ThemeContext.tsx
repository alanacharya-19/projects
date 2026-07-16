import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, DarkColors } from '@/constants/theme';
import { STORAGE_KEYS } from '@/constants/config';
import type { ThemeMode, ThemeColors } from '@/types';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.THEME).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'auto') {
        setModeState(stored);
      }
      setIsLoaded(true);
    });
  }, []);

  const resolvedMode: 'light' | 'dark' = useMemo(() => {
    if (mode === 'auto') return systemScheme ?? 'light';
    return mode;
  }, [mode, systemScheme]);

  const colors: ThemeColors = resolvedMode === 'dark'
    ? { ...DarkColors, transparent: 'transparent' }
    : { ...Colors, transparent: 'transparent' };

  const setTheme = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEYS.THEME, newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light');
  }, [mode, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolvedMode, colors, toggleTheme, setTheme }),
    [mode, resolvedMode, colors, toggleTheme, setTheme]
  );

  if (!isLoaded) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
