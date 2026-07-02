import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import TrackPlayer from 'react-native-track-player';
import { COLORS, SIZES } from '../constants/theme';
import { useThemeContext } from '../context/ThemeProvider';
import { usePlayerStore } from '../store/playerStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { AlbumArt } from '../components/AlbumArt';
import { ProgressBar } from '../components/ProgressBar';
import { PlayerControls } from '../components/PlayerControls';
import { formatDuration } from '../utils/format';

const { width } = Dimensions.get('window');

export default function NowPlayingScreen() {
  const router = useRouter();
  const { colors } = useThemeContext();
  const {
    currentTrack, isPlaying, position, duration, shuffle, repeat,
    togglePlayPause, playNext, playPrevious, toggleShuffle, toggleRepeat,
    seekTo, fastForward, rewind,
  } = usePlayerStore();
  const { favoriteIds, toggleFavorite } = useFavoritesStore();
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [pollPosition, setPollPosition] = useState(0);
  const [pollDuration, setPollDuration] = useState(0);

  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      try {
        const p = await TrackPlayer.getProgress();
        if (mounted) {
          setPollPosition(p.position);
          setPollDuration(p.duration);
        }
      } catch { /* not ready */ }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const isFavorite = currentTrack ? favoriteIds.includes(currentTrack.id) : false;
  const displayPos = pollPosition || position;
  const displayDur = pollDuration || duration;
  const handleSeek = useCallback((value: number) => {
    if (displayDur > 0) seekTo(value * displayDur);
  }, [displayDur, seekTo]);

  if (!currentTrack) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.noTrack, { color: colors.textSecondary }]}>No track playing</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)'); }} style={styles.headerBtn}>
          <Ionicons name="chevron-down" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.nowPlayingText, { color: colors.textSecondary }]}>Now Playing</Text>
        <TouchableOpacity onPress={() => setShowOptionsModal(true)} style={styles.headerBtn}>
          <Ionicons name="ellipsis-vertical" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Artwork */}
      <View style={styles.artworkContainer}>
        <AlbumArt uri={currentTrack.artwork} size={width * 0.8} rotation isPlaying={isPlaying} seed={currentTrack.title} />
      </View>

      {/* Track Info */}
      <View style={styles.infoContainer}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{currentTrack.title}</Text>
        <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>{currentTrack.artist}</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.timeRow}>
          <Text style={[styles.time, { color: colors.textTertiary }]}>{formatDuration(displayPos)}</Text>
          <Text style={[styles.time, { color: colors.textTertiary }]}>{formatDuration(displayDur)}</Text>
        </View>
        <ProgressBar position={displayPos} duration={displayDur} onSeek={handleSeek} colors={colors} />
      </View>

      {/* Controls */}
      <PlayerControls
        isPlaying={isPlaying}
        onTogglePlayPause={togglePlayPause}
        onNext={playNext}
        onPrevious={playPrevious}
        onFastForward={fastForward}
        onRewind={rewind}
        colors={colors}
        size="large"
      />

      {/* Bottom Row */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.bottomRow}>
        <TouchableOpacity onPress={toggleShuffle} style={styles.bottomButton}>
          <Ionicons name="shuffle" size={22} color={shuffle ? colors.shuffleActive : colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => currentTrack && toggleFavorite(currentTrack.id)} style={styles.bottomButton}>
          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? colors.heartActive : colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/queue')} style={styles.bottomButton}>
          <Ionicons name="list" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleRepeat} style={styles.bottomButton}>
          {repeat === 'one' ? (
            <MaterialCommunityIcons name="repeat-once" size={24} color={colors.repeatActive} />
          ) : (
            <Ionicons name="repeat" size={22} color={repeat !== 'off' ? colors.repeatActive : colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Options Floating Card */}
      <Modal visible={showOptionsModal} transparent animationType="none" onRequestClose={() => setShowOptionsModal(false)}>
        <TouchableOpacity style={styles.optionsOverlay} activeOpacity={1} onPress={() => setShowOptionsModal(false)}>
          <View style={[styles.optionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.optionRow} activeOpacity={0.6}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.optionLabel, { color: colors.text }]}>Track Info</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.padding, paddingVertical: SIZES.paddingSmall, paddingTop: 50 },
  headerBtn: { padding: 4 },
  nowPlayingText: { fontSize: SIZES.fontSmall, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  artworkContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: SIZES.padding },
  infoContainer: { paddingHorizontal: SIZES.paddingLarge, marginBottom: SIZES.padding },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  artist: { fontSize: SIZES.fontLarge, textAlign: 'center' },
  progressContainer: { paddingHorizontal: SIZES.paddingLarge, marginBottom: SIZES.padding },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  time: { fontSize: SIZES.fontSmall },
  optionsOverlay: { flex: 1 },
  optionsCard: { position: 'absolute', top: 90, right: SIZES.padding, borderRadius: SIZES.radius, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 4, minWidth: 180, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: SIZES.padding },
  optionLabel: { fontSize: SIZES.fontMedium, fontWeight: '500', flex: 1 },
  optionHint: { fontSize: SIZES.fontSmall, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: SIZES.paddingLarge },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingVertical: SIZES.paddingSmall, paddingBottom: 40, paddingTop: SIZES.paddingSmall },
  bottomButton: { padding: SIZES.paddingSmall },
  noTrack: { fontSize: SIZES.fontLarge, textAlign: 'center', marginTop: 100 },
});
