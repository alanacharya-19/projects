import { create } from 'zustand';
import type { Playlist } from '../types';
import { generateId } from '../utils/format';
import { getItem, setItem } from '../utils/storage';

const PLAYLISTS_KEY = 'playlists';

interface PlaylistStore {
  playlists: Playlist[];
  loadPlaylists: () => void;
  createPlaylist: (name: string, songIds?: string[]) => void;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addSongToPlaylist: (playlistId: string, songId: string) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  reorderPlaylistSongs: (playlistId: string, fromIndex: number, toIndex: number) => void;
}

export const usePlaylistStore = create<PlaylistStore>((set, get) => ({
  playlists: [],

  loadPlaylists: () => {
    const data = getItem<Playlist[]>(PLAYLISTS_KEY);
    if (data) {
      set({ playlists: data });
    }
  },

  createPlaylist: (name, songIds?: string[]) => {
    const { playlists } = get();
    const newPlaylist: Playlist = {
      id: generateId(),
      name,
      songs: songIds ?? [],
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };
    const updated = [...playlists, newPlaylist];
    set({ playlists: updated });
    setItem(PLAYLISTS_KEY, updated);
  },

  deletePlaylist: (id) => {
    const { playlists } = get();
    const updated = playlists.filter((p) => p.id !== id);
    set({ playlists: updated });
    setItem(PLAYLISTS_KEY, updated);
  },

  renamePlaylist: (id, name) => {
    const { playlists } = get();
    const updated = playlists.map((p) =>
      p.id === id ? { ...p, name, modifiedAt: Date.now() } : p
    );
    set({ playlists: updated });
    setItem(PLAYLISTS_KEY, updated);
  },

  addSongToPlaylist: (playlistId, songId) => {
    const { playlists } = get();
    const updated = playlists.map((p) =>
      p.id === playlistId && !p.songs.includes(songId)
        ? { ...p, songs: [...p.songs, songId], modifiedAt: Date.now() }
        : p
    );
    set({ playlists: updated });
    setItem(PLAYLISTS_KEY, updated);
  },

  removeSongFromPlaylist: (playlistId, songId) => {
    const { playlists } = get();
    const updated = playlists.map((p) =>
      p.id === playlistId
        ? {
            ...p,
            songs: p.songs.filter((s) => s !== songId),
            modifiedAt: Date.now(),
          }
        : p
    );
    set({ playlists: updated });
    setItem(PLAYLISTS_KEY, updated);
  },

  reorderPlaylistSongs: (playlistId, fromIndex, toIndex) => {
    const { playlists } = get();
    const updated = playlists.map((p) => {
      if (p.id !== playlistId) return p;
      const newSongs = [...p.songs];
      const [moved] = newSongs.splice(fromIndex, 1);
      newSongs.splice(toIndex, 0, moved);
      return { ...p, songs: newSongs, modifiedAt: Date.now() };
    });
    set({ playlists: updated });
    setItem(PLAYLISTS_KEY, updated);
  },
}));
