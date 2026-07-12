import { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface ThemeColors {
  background: string;
  card: string;
  primary: string;
  primaryLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  categoryBg: string;
  skeleton: string;
  iconBg: string;
  statusBar: string;
  overlay: string;
}

const light: ThemeColors = {
  background: '#f5f6f8',
  card: 'white',
  primary: '#c62828',
  primaryLight: '#fef0f0',
  text: '#1a1a2e',
  textSecondary: '#555',
  textMuted: '#bbb',
  border: '#f0f0f0',
  categoryBg: '#fef0f0',
  skeleton: '#e0e0e0',
  iconBg: '#f5f5f5',
  statusBar: '#c62828',
  overlay: 'rgba(0,0,0,0.25)',
};

const dark: ThemeColors = {
  background: '#121212',
  card: '#1e1e1e',
  primary: '#b71c1c',
  primaryLight: '#2a1515',
  text: '#f5f5f5',
  textSecondary: '#aaa',
  textMuted: '#666',
  border: '#333',
  categoryBg: '#2a1515',
  skeleton: '#2a2a2a',
  iconBg: '#2a2a2a',
  statusBar: '#121212',
  overlay: 'rgba(0,0,0,0.4)',
};

interface ThemeContextType {
  theme: 'light' | 'dark';
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo(
    () => ({ theme, colors: theme === 'light' ? light : dark, toggleTheme }),
    [theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
