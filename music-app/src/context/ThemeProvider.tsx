import React, { createContext, useContext, ReactNode } from 'react';
import { useTheme } from '../hooks/useTheme';
import { COLORS } from '../constants/theme';
import type { ThemeMode } from '../types';

interface ThemeContextType {
  colors: typeof COLORS.dark;
  isDark: boolean;
  themeMode: ThemeMode;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: COLORS.dark,
  isDark: true,
  themeMode: 'dark',
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
