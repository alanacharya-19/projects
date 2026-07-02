import { create } from 'zustand';
import type { Song, Album, Artist, Folder, Genre } from '../types';
import {
  scanAudioFiles,
  groupByAlbum,
  groupByArtist,
  groupByFolder,
  groupByGenre,
} from '../services/musicScanner';
import { storage } from '../utils/storage';

interface LibraryStore {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  folders: Folder[];
  genres: Genre[];
  loading: boolean;
  scanned: boolean;
  error: string | null;

  scanLibrary: (onProgress?: (current: number, total: number) => void) => Promise<void>;
  refreshLibrary: () => Promise<void>;
  setSongs: (songs: Song[]) => void;
}

const CACHE_KEY = 'library_songs';

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  songs: [],
  albums: [],
  artists: [],
  folders: [],
  genres: [],
  loading: false,
  scanned: false,
  error: null,

  scanLibrary: async (onProgress) => {
    set({ loading: true, error: null });
    try {
      const cached = storage.getString(CACHE_KEY);
      if (cached) {
        const songs: Song[] = JSON.parse(cached);
        set({
          songs,
          albums: groupByAlbum(songs),
          artists: groupByArtist(songs),
          folders: groupByFolder(songs),
          genres: groupByGenre(songs),
          loading: false,
          scanned: true,
        });
      }

      const songs = await scanAudioFiles(onProgress);
      storage.set(CACHE_KEY, JSON.stringify(songs));

      set({
        songs,
        albums: groupByAlbum(songs),
        artists: groupByArtist(songs),
        folders: groupByFolder(songs),
        genres: groupByGenre(songs),
        loading: false,
        scanned: true,
        error: null,
      });
    } catch (err: any) {
      set({
        loading: false,
        error: err.message || 'Failed to scan library',
      });
    }
  },

  refreshLibrary: async () => {
    storage.remove(CACHE_KEY);
    await get().scanLibrary();
  },

  setSongs: (songs) => {
    set({
      songs,
      albums: groupByAlbum(songs),
      artists: groupByArtist(songs),
      folders: groupByFolder(songs),
      genres: groupByGenre(songs),
    });
  },
}));
