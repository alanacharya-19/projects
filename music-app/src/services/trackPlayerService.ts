import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
  State,
} from 'react-native-track-player';
import type { Song } from '../types';
import { storage } from '../utils/storage';
import { generatePlaceholderArtwork } from '../utils/generatePlaceholderArtwork';

export async function setupPlayer(): Promise<boolean> {
  try {
    const isSetup = await TrackPlayer.isServiceRunning();
    if (isSetup) return true;
    await TrackPlayer.setupPlayer({
      waitForBuffer: true,
    });
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
        Capability.SetRating,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
    });
    return true;
  } catch (error) {
    console.error('Failed to setup TrackPlayer:', error);
    return false;
  }
}

export async function addTracks(songs: Song[], index?: number): Promise<void> {
  const tracks = await Promise.all(songs.map(async (song) => {
    let artwork: string | undefined = song.artwork
      ? song.artwork.startsWith('file://')
        ? song.artwork
        : `file://${song.artwork}`
      : undefined;

    if (!artwork) {
      const seed = [song.title, song.artist, song.album].filter(Boolean).join(' - ') || song.id;
      try {
        artwork = await generatePlaceholderArtwork(seed);
      } catch (e) {
        console.warn('Failed to generate placeholder artwork:', e);
      }
    }

    return {
      id: song.id,
      url: song.url.startsWith('file://') ? song.url : `file://${song.url}`,
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration: song.duration,
      artwork,
    };
  }));

  await TrackPlayer.add(tracks, index);
}

export async function playTrack(song: Song): Promise<void> {
  await TrackPlayer.reset();
  await addTracks([song]);
  await TrackPlayer.play();
}

export async function playQueue(
  songs: Song[],
  startIndex: number = 0
): Promise<void> {
  await TrackPlayer.reset();
  await addTracks(songs);
  if (startIndex > 0) {
    await TrackPlayer.skip(startIndex);
  }
  await TrackPlayer.play();
}

export async function togglePlayPause(): Promise<void> {
  const state = await TrackPlayer.getPlaybackState();
  if (state.state === State.Playing) {
    await TrackPlayer.pause();
  } else {
    await TrackPlayer.play();
  }
}

export async function skipToNext(): Promise<void> {
  await TrackPlayer.skipToNext();
}

export async function skipToPrevious(): Promise<void> {
  await TrackPlayer.skipToPrevious();
}

export async function skipToIndex(index: number): Promise<void> {
  await TrackPlayer.skip(index);
}

export async function play(): Promise<void> {
  await TrackPlayer.play();
}

export async function seekTo(position: number): Promise<void> {
  await TrackPlayer.seekTo(position);
}

export async function setVolume(volume: number): Promise<void> {
  await TrackPlayer.setVolume(volume);
}

export async function setRate(rate: number): Promise<void> {
  await TrackPlayer.setRate(rate);
}

export async function setRepeatModeTrackPlayer(
  mode: 'off' | 'one' | 'all'
): Promise<void> {
  const repeatMap = {
    off: RepeatMode.Off,
    one: RepeatMode.Track,
    all: RepeatMode.Queue,
  };
  await TrackPlayer.setRepeatMode(repeatMap[mode]);
}

export async function setShuffleTrackPlayer(enabled: boolean): Promise<void> {
}

export async function getPosition(): Promise<number> {
  const position = await TrackPlayer.getProgress();
  return position.position;
}

export async function getDuration(): Promise<number> {
  const progress = await TrackPlayer.getProgress();
  return progress.duration;
}

export async function clearQueue(): Promise<void> {
  await TrackPlayer.reset();
}

export async function removeTrack(index: number): Promise<void> {
  const queue = await TrackPlayer.getQueue();
  if (queue[index]) {
    await TrackPlayer.remove(queue[index].id);
  }
}

export async function getCurrentTrackId(): Promise<string | undefined> {
  const track = await TrackPlayer.getActiveTrack();
  return track?.id;
}

export async function startSleepTimer(minutes: number): Promise<void> {
  const ms = minutes * 60 * 1000;
  storage.set('sleep_timer_end', String(Date.now() + ms));
}

export async function cancelSleepTimer(): Promise<void> {
  storage.remove('sleep_timer_end');
}

export async function isSleepTimerActive(): Promise<boolean> {
  const end = storage.getString('sleep_timer_end');
  if (!end) return false;
  const remaining = parseInt(end, 10) - Date.now();
  if (remaining <= 0) {
    cancelSleepTimer();
    return false;
  }
  return true;
}

export async function getSleepTimerRemaining(): Promise<number> {
  const end = storage.getString('sleep_timer_end');
  if (!end) return 0;
  return Math.max(0, parseInt(end, 10) - Date.now());
}

import playbackService from './playbackService';

let registered = false;

export async function registerPlaybackService(): Promise<void> {
  if (registered) return;
  registered = true;
  try {
    TrackPlayer.registerPlaybackService(() => playbackService);
  } catch (error) {
    console.error('Failed to register playback service:', error);
  }
}
