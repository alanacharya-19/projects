import { create } from 'zustand';
import { getFavorites, setFavorites } from '../utils/storage';

interface FavoritesStore {
  favoriteIds: string[];
  loadFavorites: () => void;
  toggleFavorite: (songId: string) => void;
  isFavorite: (songId: string) => boolean;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favoriteIds: [],

  loadFavorites: () => {
    const ids = getFavorites();
    set({ favoriteIds: ids });
  },

  toggleFavorite: (songId) => {
    const { favoriteIds } = get();
    const updated = favoriteIds.includes(songId)
      ? favoriteIds.filter((id) => id !== songId)
      : [...favoriteIds, songId];
    set({ favoriteIds: updated });
    setFavorites(updated);
  },

  isFavorite: (songId) => {
    return get().favoriteIds.includes(songId);
  },

  clearFavorites: () => {
    set({ favoriteIds: [] });
    setFavorites([]);
  },
}));
