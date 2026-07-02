import * as MediaLibrary from 'expo-media-library';
import type { Song, Album, Artist, Folder, Genre } from '../types';
import { extractFolder, generateId } from '../utils/format';

const SUPPORTED_FORMATS = new Set([
  '.mp3',
  '.m4a',
  '.wav',
  '.aac',
  '.flac',
  '.ogg',
]);

function isSupportedFormat(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return SUPPORTED_FORMATS.has(ext);
}

export async function scanAudioFiles(
  onProgress?: (current: number, total: number) => void
): Promise<Song[]> {
  const songs: Song[] = [];
  let hasMore = true;
  let cursor: string | undefined;
  const pageSize = 100;

  while (hasMore) {
    const result = await MediaLibrary.getAssetsAsync({
      mediaType: 'audio',
      first: pageSize,
      after: cursor,
    });

    for (const asset of result.assets) {
      const uri = asset.uri || (asset as any).uri;
      const filename = asset.filename || (asset as any).filename;
      if (filename && isSupportedFormat(filename)) {
        songs.push({
          id: asset.id,
          url: uri,
          title: parseTitle(filename),
          artist: 'Unknown Artist',
          album: 'Unknown Album',
          albumArtist: 'Unknown Artist',
          genre: 'Unknown',
          duration: asset.duration || 0,
          bitrate: 0,
          sampleRate: 0,
          size: 0,
          path: uri,
          dateAdded: Date.now(),
          artwork: null,
          folder: extractFolder(uri),
        });
      }
    }

    if (onProgress) {
      onProgress(songs.length, result.totalCount);
    }

    hasMore = result.hasNextPage;
    cursor = result.endCursor;
  }

  return songs;
}

function parseTitle(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.substring(0, lastDot) : filename;
}

export function groupByAlbum(songs: Song[]): Album[] {
  const albumMap = new Map<string, Album>();

  for (const song of songs) {
    const key = song.album;
    const existing = albumMap.get(key);
    if (existing) {
      existing.songCount++;
      existing.duration += song.duration;
    } else {
      albumMap.set(key, {
        id: generateId(),
        title: song.album,
        artist: song.albumArtist || song.artist,
        artwork: song.artwork,
        songCount: 1,
        duration: song.duration,
        year: 0,
      });
    }
  }

  return Array.from(albumMap.values());
}

export function groupByArtist(songs: Song[]): Artist[] {
  const artistMap = new Map<string, Artist>();

  for (const song of songs) {
    const key = song.artist;
    const existing = artistMap.get(key);
    if (existing) {
      existing.songCount++;
    } else {
      artistMap.set(key, {
        id: generateId(),
        name: song.artist,
        songCount: 1,
        albumCount: 0,
        artwork: null,
      });
    }
  }

  const artists = Array.from(artistMap.values());
  for (const artist of artists) {
    const uniqueAlbums = new Set(
      songs
        .filter((s) => s.artist === artist.name)
        .map((s) => s.album)
    );
    artist.albumCount = uniqueAlbums.size;
  }

  return artists;
}

export function groupByFolder(songs: Song[]): Folder[] {
  const folderMap = new Map<string, Folder>();

  for (const song of songs) {
    const key = song.folder;
    const existing = folderMap.get(key);
    if (existing) {
      existing.songCount++;
    } else {
      folderMap.set(key, {
        id: generateId(),
        name: key,
        path: key,
        songCount: 1,
      });
    }
  }

  return Array.from(folderMap.values());
}

export function groupByGenre(songs: Song[]): Genre[] {
  const genreMap = new Map<string, Genre>();

  for (const song of songs) {
    const key = song.genre;
    const existing = genreMap.get(key);
    if (existing) {
      existing.songCount++;
    } else {
      genreMap.set(key, {
        id: generateId(),
        name: song.genre,
        songCount: 1,
      });
    }
  }

  return Array.from(genreMap.values());
}
