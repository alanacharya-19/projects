import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { COLORS } from '../constants/theme';
import type { ThemeMode } from '../types';

export function useTheme() {
  const systemScheme = useColorScheme();
  const { theme: themeMode } = useSettingsStore();

  const colors = useMemo(() => {
    switch (themeMode) {
      case 'dark':
        return COLORS.dark;
      case 'light':
        return COLORS.light;
      case 'dynamic':
        return systemScheme === 'light' ? COLORS.light : COLORS.dark;
      default:
        return COLORS.dark;
    }
  }, [themeMode, systemScheme]);

  const isDark = useMemo(() => {
    if (themeMode === 'dynamic') return systemScheme !== 'light';
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  return { colors, isDark, themeMode };
}
