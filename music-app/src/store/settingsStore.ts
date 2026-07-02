import { create } from 'zustand';
import type { ThemeMode } from '../types';
import { storage } from '../utils/storage';

interface SettingsStore {
  theme: ThemeMode;
  sleepTimer: number | null;
  setTheme: (theme: ThemeMode) => void;
  setSleepTimer: (minutes: number | null) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: (storage.getString('theme') as ThemeMode) || 'dark',
  sleepTimer: null,

  setTheme: (theme) => {
    storage.set('theme', theme);
    set({ theme });
  },

  setSleepTimer: (minutes) => {
    if (minutes) {
      storage.set('sleep_timer', String(minutes));
    } else {
      storage.remove('sleep_timer');
    }
    set({ sleepTimer: minutes });
  },
}));
