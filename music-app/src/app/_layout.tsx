import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import TrackPlayer, { Event, RepeatMode } from 'react-native-track-player';
import { ThemeProvider, useThemeContext } from '../context/ThemeProvider';
import { setupPlayer, registerPlaybackService } from '../services/trackPlayerService';
import { usePlaylistStore } from '../store/playlistStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { useRecentlyPlayedStore } from '../store/recentlyPlayedStore';
import { usePlayerStore } from '../store/playerStore';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const { colors, themeMode } = useThemeContext();
  const loadPlaylists = usePlaylistStore((s) => s.loadPlaylists);
  const loadFavorites = useFavoritesStore((s) => s.loadFavorites);
  const loadRecentlyPlayed = useRecentlyPlayedStore((s) => s.loadRecentlyPlayed);

  useEffect(() => {
    async function init() {
      await registerPlaybackService();
      await setupPlayer();
      await TrackPlayer.setRepeatMode(RepeatMode.Queue);
      loadPlaylists();
      loadFavorites();
      loadRecentlyPlayed();
      await SplashScreen.hideAsync();
    }
    init();
  }, []);

  useEffect(() => {
    const sub = TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, (event) => {
      const track = event?.track;
      if (!track?.id) return;
      const { queue, setCurrentTrack } = usePlayerStore.getState();
      const song = queue.find((s) => s.id === track.id);
      if (song) setCurrentTrack(song);
    });
    return () => sub.remove();
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="library/albums" />
        <Stack.Screen name="library/artists" />
        <Stack.Screen name="library/favorites" />
        <Stack.Screen name="library/playlists" />
        <Stack.Screen name="albums" />
        <Stack.Screen name="artists" />
        <Stack.Screen name="folders" />
        <Stack.Screen name="genres" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="playlists" />
        <Stack.Screen name="now-playing" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="queue" />
        <Stack.Screen name="create-playlist" />
        <Stack.Screen name="album/[id]" />
        <Stack.Screen name="artist/[id]" />
        <Stack.Screen name="genre/[id]" />
        <Stack.Screen name="folder/[id]" />
        <Stack.Screen name="playlist/[id]" />
      </Stack>
      <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <RootLayoutInner />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
