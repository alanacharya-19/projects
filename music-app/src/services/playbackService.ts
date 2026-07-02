import TrackPlayer, { Event } from 'react-native-track-player';
import { storage } from '../utils/storage';
import { generatePlaceholderArtwork } from '../utils/generatePlaceholderArtwork';

async function resolveArtwork(track: { title?: string; artist?: string; album?: string; artwork?: string | null }): Promise<string | undefined> {
  if (track.artwork) return track.artwork;
  const seed = [track.title, track.artist, track.album].filter(Boolean).join(' - ') || 'Music';
  try {
    return await generatePlaceholderArtwork(seed);
  } catch {
    return undefined;
  }
}

export default async function playbackService(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    TrackPlayer.stop();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    TrackPlayer.skipToNext();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    TrackPlayer.skipToPrevious();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    TrackPlayer.seekTo(event.position);
  });

  TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
    if (event.permanent) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.setVolume(event.paused ? 0.5 : 1);
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async () => {
    const track = await TrackPlayer.getActiveTrack();
    if (track) {
      const recentlyPlayed = storage.getString('recently_played');
      const list: string[] = recentlyPlayed
        ? JSON.parse(recentlyPlayed)
        : [];
      const updated = [
        track.id,
        ...list.filter((id) => id !== track.id),
      ].slice(0, 200);
      storage.set('recently_played', JSON.stringify(updated));
      await TrackPlayer.updateNowPlayingMetadata({
        title: track.title ?? '',
        artist: track.artist ?? '',
        album: track.album ?? '',
        artwork: await resolveArtwork(track),
      });
    }
  });

  TrackPlayer.addEventListener(
    Event.PlaybackQueueEnded,
    async (event) => {
      const repeatMode = await TrackPlayer.getRepeatMode();
      if (repeatMode === 1) {
        const track = await TrackPlayer.getActiveTrack();
        if (track) {
          await TrackPlayer.seekTo(0);
          await TrackPlayer.play();
        }
      }
    }
  );

  TrackPlayer.addEventListener(Event.PlaybackError, (event) => {
    console.error('Playback error:', event);
  });

  TrackPlayer.addEventListener(
    Event.PlaybackMetadataReceived,
    async (event) => {
      const track = await TrackPlayer.getActiveTrack();
      if (track) {
        await TrackPlayer.updateNowPlayingMetadata({
          title: track.title,
          artist: track.artist,
          album: track.album,
          artwork: await resolveArtwork(track),
        });
      }
    }
  );
}
