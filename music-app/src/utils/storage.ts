import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

const KEYS = {
  FAVORITES: 'favorites',
  RECENTLY_PLAYED: 'recently_played',
  PLAYLISTS: 'playlists',
  LIBRARY_CACHE: 'library_cache',
};

export function getItem<T>(key: string): T | null {
  try {
    const value = storage.getString(key);
    if (value) return JSON.parse(value) as T;
    return null;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    storage.set(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage set error:', e);
  }
}

export function removeItem(key: string): void {
  try {
    storage.remove(key);
  } catch (e) {
    console.error('Storage remove error:', e);
  }
}

export function getFavorites(): string[] {
  return getItem<string[]>(KEYS.FAVORITES) || [];
}

export function setFavorites(ids: string[]): void {
  setItem(KEYS.FAVORITES, ids);
}

export function getRecentlyPlayed(): string[] {
  return getItem<string[]>(KEYS.RECENTLY_PLAYED) || [];
}

export function setRecentlyPlayed(ids: string[]): void {
  setItem(KEYS.RECENTLY_PLAYED, ids);
}


