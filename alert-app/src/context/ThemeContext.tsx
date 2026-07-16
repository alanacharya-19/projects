import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode, ThemeColors } from '@/types';

const THEME_STORAGE_KEY = '@app_theme_mode';

const lightColors: ThemeColors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceVariant: '#EEF1F5',
  card: '#FFFFFF',
  text: '#1A1D23',
  textSecondary: '#6B7280',
  textInverse: '#FFFFFF',
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  secondary: '#7C3AED',
  accent: '#06B6D4',
  border: '#E5E7EB',
  divider: '#F3F4F6',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  success: '#16A34A',
  successLight: '#DCFCE7',
  info: '#2563EB',
  infoLight: '#DBEAFE',
  blue: '#2563EB',
  blueLight: '#DBEAFE',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  orange: '#EA580C',
  orangeLight: '#FFF7ED',
  red: '#DC2626',
  redLight: '#FEE2E2',
  overlay: 'rgba(0,0,0,0.5)',
  shadow: '#000000',
  white: '#FFFFFF',
};

const darkColors: ThemeColors = {
  background: '#0F1419',
  surface: '#1A2027',
  surfaceVariant: '#242D36',
  card: '#1A2027',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textInverse: '#0F1419',
  primary: '#60A5FA',
  primaryLight: '#1E3A5F',
  secondary: '#A78BFA',
  accent: '#22D3EE',
  border: '#2D3A45',
  divider: '#242D36',
  error: '#F87171',
  errorLight: '#3B1A1A',
  warning: '#FBBF24',
  warningLight: '#3B2F0A',
  success: '#4ADE80',
  successLight: '#0A3B1F',
  info: '#60A5FA',
  infoLight: '#1E3A5F',
  blue: '#60A5FA',
  blueLight: '#1E3A5F',
  green: '#4ADE80',
  greenLight: '#0A3B1F',
  orange: '#FB923C',
  orangeLight: '#3B2209',
  red: '#F87171',
  redLight: '#3B1A1A',
  overlay: 'rgba(0,0,0,0.7)',
  shadow: '#000000',
  white: '#FFFFFF',
};

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
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
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

  const colors = resolvedMode === 'dark' ? darkColors : lightColors;

  const setTheme = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
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
