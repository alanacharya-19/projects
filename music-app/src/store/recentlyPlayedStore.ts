import { create } from 'zustand';
import { getRecentlyPlayed, setRecentlyPlayed } from '../utils/storage';

interface RecentlyPlayedStore {
  songIds: string[];
  loadRecentlyPlayed: () => void;
  addToRecentlyPlayed: (songId: string) => void;
  clearRecentlyPlayed: () => void;
}

export const useRecentlyPlayedStore = create<RecentlyPlayedStore>(
  (set, get) => ({
    songIds: [],

    loadRecentlyPlayed: () => {
      const ids = getRecentlyPlayed();
      set({ songIds: ids });
    },

    addToRecentlyPlayed: (songId) => {
      const { songIds } = get();
      const updated = [songId, ...songIds.filter((id) => id !== songId)].slice(
        0,
        200
      );
      set({ songIds: updated });
      setRecentlyPlayed(updated);
    },

    clearRecentlyPlayed: () => {
      set({ songIds: [] });
      setRecentlyPlayed([]);
    },
  })
);
