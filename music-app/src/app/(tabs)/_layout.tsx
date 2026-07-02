import React from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useThemeContext } from '../../context/ThemeProvider';
import { usePlayerStore } from '../../store/playerStore';
import { MiniPlayer } from '../../components/MiniPlayer';
import { SIZES } from '../../constants/theme';

export default function TabLayout() {
  const { colors } = useThemeContext();
  const { currentTrack, isPlaying, togglePlayPause, playNext } = usePlayerStore();

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="songs" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>
      {currentTrack && (
        <View style={styles.floatingPlayerWrapper} pointerEvents="box-none">
          <MiniPlayer
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onTogglePlayPause={togglePlayPause}
            onNext={playNext}
            colors={colors}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  floatingPlayerWrapper: {
    position: 'absolute',
    bottom: 20,
    left: SIZES.padding,
    right: SIZES.padding,
  },
});
