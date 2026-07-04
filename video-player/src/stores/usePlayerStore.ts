import { create } from "zustand";

interface PlayerState {
  currentVideo: {
    uri: string;
    title: string;
    poster?: string;
    duration?: number;
  } | null;
  isPlaying: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  playbackSpeed: number;
  volume: number;
  brightness: number;
  aspectRatio: "fill" | "fit" | "stretch" | "contain";
  controlsLocked: boolean;
  subtitleTrack: string | null;
  audioTrack: string | null;
  playNext: boolean;
  repeat: boolean;
  shuffle: boolean;

  setCurrentVideo: (video: PlayerState["currentVideo"]) => void;
  setPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  setFullscreen: (fullscreen: boolean) => void;
  toggleFullscreen: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  setBrightness: (brightness: number) => void;
  setAspectRatio: (ratio: PlayerState["aspectRatio"]) => void;
  cycleAspectRatio: () => void;
  toggleControlsLock: () => void;
  setSubtitleTrack: (track: string | null) => void;
  setAudioTrack: (track: string | null) => void;
  togglePlayNext: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
}

const aspectRatios: PlayerState["aspectRatio"][] = ["fill", "fit", "stretch", "contain"];

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentVideo: null,
  isPlaying: false,
  isMuted: false,
  isFullscreen: false,
  playbackSpeed: 1,
  volume: 1,
  brightness: 1,
  aspectRatio: "fit",
  controlsLocked: false,
  subtitleTrack: null,
  audioTrack: null,
  playNext: false,
  repeat: false,
  shuffle: false,

  setCurrentVideo: (video) => set({ currentVideo: video }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setMuted: (muted) => set({ isMuted: muted }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
  toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  setBrightness: (brightness) => set({ brightness: Math.max(0, Math.min(1, brightness)) }),
  setAspectRatio: (ratio) => set({ aspectRatio: ratio }),
  cycleAspectRatio: () => {
    const current = get().aspectRatio;
    const idx = aspectRatios.indexOf(current);
    set({ aspectRatio: aspectRatios[(idx + 1) % aspectRatios.length] });
  },
  toggleControlsLock: () => set((s) => ({ controlsLocked: !s.controlsLocked })),
  setSubtitleTrack: (track) => set({ subtitleTrack: track }),
  setAudioTrack: (track) => set({ audioTrack: track }),
  togglePlayNext: () => set((s) => ({ playNext: !s.playNext })),
  toggleRepeat: () => set((s) => ({ repeat: !s.repeat })),
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
}));
