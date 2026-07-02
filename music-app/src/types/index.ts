export interface Song {
  id: string;
  url: string;
  title: string;
  artist: string;
  album: string;
  albumArtist: string;
  genre: string;
  duration: number;
  bitrate: number;
  sampleRate: number;
  size: number;
  path: string;
  dateAdded: number;
  artwork: string | null;
  folder: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artwork: string | null;
  songCount: number;
  duration: number;
  year: number;
}

export interface Artist {
  id: string;
  name: string;
  songCount: number;
  albumCount: number;
  artwork: string | null;
}

export interface Folder {
  id: string;
  name: string;
  path: string;
  songCount: number;
}

export interface Genre {
  id: string;
  name: string;
  songCount: number;
}

export interface Playlist {
  id: string;
  name: string;
  songs: string[];
  createdAt: number;
  modifiedAt: number;
}

export type RepeatMode = 'off' | 'one' | 'all';

export type PlaybackSpeed = 0.5 | 1 | 1.25 | 1.5 | 2;

export type ThemeMode = 'dark' | 'light' | 'dynamic';

export interface FavoritesState {
  favoriteIds: string[];
}

export interface RecentlyPlayedState {
  songIds: string[];
}
