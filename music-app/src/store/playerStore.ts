import { create } from 'zustand';
import type { Song, RepeatMode, PlaybackSpeed } from '../types';
import { storage } from '../utils/storage';
import * as trackPlayerService from '../services/trackPlayerService';

interface PlayerStore {
  currentTrack: Song | null;
  queue: Song[];
  originalQueue: Song[];
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  playbackSpeed: PlaybackSpeed;
  volume: number;
  position: number;
  duration: number;

  setCurrentTrack: (track: Song | null) => void;
  setQueue: (queue: Song[], originalQueue?: Song[]) => void;
  setIsPlaying: (playing: boolean) => void;
  setShuffle: (shuffle: boolean) => void;
  setRepeat: (repeat: RepeatMode) => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  setVolume: (volume: number) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;

  play: (song: Song) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  toggleShuffle: () => Promise<void>;
  toggleRepeat: () => Promise<void>;
  changeSpeed: (speed: PlaybackSpeed) => Promise<void>;
  playQueue: (songs: Song[], startIndex?: number) => Promise<void>;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => Promise<void>;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  playNextInQueue: (song: Song) => void;
  togglePlayPause: () => Promise<void>;
  fastForward: (seconds?: number) => Promise<void>;
  rewind: (seconds?: number) => Promise<void>;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  queue: [],
  originalQueue: [],
  isPlaying: false,
  shuffle: false,
  repeat: 'all',
  playbackSpeed: 1,
  volume: 1,
  position: 0,
  duration: 0,

  setCurrentTrack: (track) => set({ currentTrack: track }),
  setQueue: (queue, originalQueue) =>
    set({ queue, originalQueue: originalQueue || queue }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setShuffle: (shuffle) => set({ shuffle }),
  setRepeat: (repeat) => set({ repeat }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setVolume: (volume) => set({ volume }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),

  play: async (song) => {
    await trackPlayerService.playTrack(song);
    set({ currentTrack: song, isPlaying: true });
  },

  pause: async () => {
    await trackPlayerService.togglePlayPause();
    set({ isPlaying: false });
  },

  resume: async () => {
    await trackPlayerService.togglePlayPause();
    set({ isPlaying: true });
  },

  stop: async () => {
    await trackPlayerService.clearQueue();
    set({ currentTrack: null, isPlaying: false, queue: [], position: 0 });
  },

  playNext: async () => {
    const { queue } = get();
    await trackPlayerService.skipToNext();
    const activeId = await trackPlayerService.getCurrentTrackId();
    if (activeId) {
      const song = queue.find((s) => s.id === activeId);
      if (song) set({ currentTrack: song, isPlaying: true });
    }
  },

  playPrevious: async () => {
    const { queue } = get();
    await trackPlayerService.skipToPrevious();
    const activeId = await trackPlayerService.getCurrentTrackId();
    if (activeId) {
      const song = queue.find((s) => s.id === activeId);
      if (song) set({ currentTrack: song, isPlaying: true });
    }
  },

  seekTo: async (position) => {
    await trackPlayerService.seekTo(position);
    set({ position });
  },

  toggleShuffle: async () => {
    const { shuffle, originalQueue, queue, currentTrack } = get();
    const newShuffle = !shuffle;
    if (newShuffle) {
      const shuffled = [...originalQueue].sort(() => Math.random() - 0.5);
      set({ shuffle: true, queue: shuffled });
    } else {
      set({ shuffle: false, queue: originalQueue });
    }
    await trackPlayerService.setShuffleTrackPlayer(newShuffle);
  },

  toggleRepeat: async () => {
    const { repeat } = get();
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeat);
    const newMode = modes[(currentIndex + 1) % modes.length];
    set({ repeat: newMode });
    await trackPlayerService.setRepeatModeTrackPlayer(newMode);
  },

  changeSpeed: async (speed) => {
    set({ playbackSpeed: speed });
    await trackPlayerService.setRate(speed);
  },

  playQueue: async (songs, startIndex = 0) => {
    const { queue } = get();
    const same = songs.length === queue.length && songs.every((s, i) => s.id === queue[i]?.id);
    set({
      queue: songs,
      originalQueue: songs,
      currentTrack: songs[startIndex] || null,
      isPlaying: true,
    });
    if (same) {
      await trackPlayerService.skipToIndex(startIndex);
      await trackPlayerService.play();
    } else {
      await trackPlayerService.playQueue(songs, startIndex);
    }
  },

  addToQueue: (song) => {
    const { queue } = get();
    set({ queue: [...queue, song] });
    trackPlayerService.addTracks([song]);
  },

  removeFromQueue: (index) => {
    const { queue } = get();
    const newQueue = queue.filter((_, i) => i !== index);
    set({ queue: newQueue });
    trackPlayerService.removeTrack(index);
  },

  clearQueue: async () => {
    await trackPlayerService.clearQueue();
    set({ queue: [], currentTrack: null, isPlaying: false });
  },

  reorderQueue: (fromIndex, toIndex) => {
    const { queue } = get();
    const newQueue = [...queue];
    const [moved] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, moved);
    set({ queue: newQueue });
  },

  playNextInQueue: (song) => {
    const { queue, currentTrack } = get();
    const currentIndex = queue.findIndex(
      (s) => s.id === currentTrack?.id
    );
    const insertIndex = currentIndex >= 0 ? currentIndex + 1 : queue.length;
    const newQueue = [...queue];
    newQueue.splice(insertIndex, 0, song);
    set({ queue: newQueue });
  },

  togglePlayPause: async () => {
    const { isPlaying } = get();
    await trackPlayerService.togglePlayPause();
    set({ isPlaying: !isPlaying });
  },

  fastForward: async (seconds = 10) => {
    const { position, duration } = get();
    const newPos = Math.min(position + seconds, duration);
    await trackPlayerService.seekTo(newPos);
    set({ position: newPos });
  },

  rewind: async (seconds = 10) => {
    const { position } = get();
    const newPos = Math.max(position - seconds, 0);
    await trackPlayerService.seekTo(newPos);
    set({ position: newPos });
  },
}));
