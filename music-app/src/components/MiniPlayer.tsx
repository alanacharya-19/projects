import React, { memo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import TrackPlayer from 'react-native-track-player';
import type { Song } from '../types';

interface MiniPlayerProps {
  currentTrack: Song | null;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  onNext: () => void;
  colors: typeof COLORS.dark;
}

const PROGRESS_BAR_HEIGHT = 3;

function PlayButton({ isPlaying, onPress, colors }: {
  isPlaying: boolean; onPress: () => void; colors: typeof COLORS.dark;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.playBtn}>
      <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={colors.text} />
    </TouchableOpacity>
  );
}

function MiniPlayerComponent({
  currentTrack,
  isPlaying,
  onTogglePlayPause,
  onNext,
  colors,
}: MiniPlayerProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      try {
        const pos = await TrackPlayer.getProgress();
        if (!mounted) return;
        const pct = pos.duration > 0 ? pos.position / pos.duration : 0;
        setProgress(Math.min(pct, 1));
      } catch (_) {}
    };
    const iv = setInterval(tick, 1000);
    tick();
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  if (!currentTrack) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: '#000' }]}>
      <TouchableOpacity
        style={styles.content}
        onPress={() => router.push('/now-playing')}
        activeOpacity={0.8}
      >
        <View style={styles.artworkContainer}>
          <Image source={require('../../assets/gif/runningavatar.gif')} style={styles.avatarArtwork} />
        </View>

        <View style={styles.rightSection}>
          <View style={styles.topRow}>
            <View style={styles.info}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{currentTrack.title}</Text>
              <Text
                style={[styles.artist, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {currentTrack.artist}
              </Text>
            </View>

            <View style={styles.controls}>
              <PlayButton isPlaying={isPlaying} onPress={onTogglePlayPause} colors={colors} />
              <TouchableOpacity onPress={onNext} style={styles.controlButton}>
                <Ionicons name="play-skip-forward" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 50,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    height: SIZES.miniPlayerHeight,
  },
  artworkContainer: {
    marginLeft: -SIZES.padding,
    marginRight: SIZES.paddingSmall,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  avatarArtwork: {
    width: SIZES.miniPlayerHeight,
    height: SIZES.miniPlayerHeight,
    borderRadius: SIZES.miniPlayerHeight / 2,
  },
  rightSection: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  info: {
    flex: 1,
    marginRight: SIZES.paddingSmall,
  },
  title: {
    fontSize: SIZES.fontMedium,
    fontWeight: '600',
    marginBottom: 2,
  },
  artist: {
    fontSize: SIZES.fontSmall,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: SIZES.paddingSmall,
  },
  playBtn: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTrack: {
    height: PROGRESS_BAR_HEIGHT,
    borderRadius: 1.5,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
});

export const MiniPlayer = memo(MiniPlayerComponent);
