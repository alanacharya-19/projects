import { useEffect, useCallback, useMemo } from 'react';
import { useLibraryStore } from '../store/libraryStore';
import type { Song } from '../types';

export function useLibrary() {
  const store = useLibraryStore();

  useEffect(() => {
    if (!store.scanned && !store.loading) {
      store.scanLibrary();
    }
  }, []);

  const recentlyAdded = useMemo(() => {
    return [...store.songs]
      .sort((a, b) => b.dateAdded - a.dateAdded)
      .slice(0, 50);
  }, [store.songs]);

  const getSongsByAlbum = useCallback(
    (albumTitle: string): Song[] => {
      return store.songs.filter((s) => s.album === albumTitle);
    },
    [store.songs]
  );

  const getSongsByArtist = useCallback(
    (artistName: string): Song[] => {
      return store.songs.filter((s) => s.artist === artistName);
    },
    [store.songs]
  );

  const getSongsByGenre = useCallback(
    (genreName: string): Song[] => {
      return store.songs.filter((s) => s.genre === genreName);
    },
    [store.songs]
  );

  const getSongsByFolder = useCallback(
    (folderPath: string): Song[] => {
      return store.songs.filter((s) => s.folder === folderPath);
    },
    [store.songs]
  );

  const searchSongs = useCallback(
    (query: string): Song[] => {
      const q = query.toLowerCase();
      return store.songs.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.album.toLowerCase().includes(q) ||
          s.folder.toLowerCase().includes(q)
      );
    },
    [store.songs]
  );

  return {
    songs: store.songs,
    albums: store.albums,
    artists: store.artists,
    folders: store.folders,
    genres: store.genres,
    loading: store.loading,
    scanned: store.scanned,
    error: store.error,
    recentlyAdded,
    refreshLibrary: store.refreshLibrary,
    getSongsByAlbum,
    getSongsByArtist,
    getSongsByGenre,
    getSongsByFolder,
    searchSongs,
  };
}
