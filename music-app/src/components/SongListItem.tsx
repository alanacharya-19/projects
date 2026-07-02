import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { formatDuration } from '../utils/format';
import { SongThumbnail } from './SongThumbnail';
import type { Song } from '../types';

interface SongListItemProps {
  song: Song;
  index?: number;
  isFavorite?: boolean;
  isCurrentTrack?: boolean;
  onPress: (song: Song) => void;
  onFavoritePress?: (songId: string) => void;
  onOptionsPress?: (song: Song) => void;
  colors: typeof COLORS.dark;
  showIndex?: boolean;
  showArtwork?: boolean;
}

function SongListItemComponent({
  song,
  index,
  isFavorite,
  isCurrentTrack,
  onPress,
  onFavoritePress,
  onOptionsPress,
  colors,
  showIndex = false,
  showArtwork = true,
}: SongListItemProps) {
  const handlePress = useCallback(() => onPress(song), [song, onPress]);
  const handleFavorite = useCallback(
    () => onFavoritePress?.(song.id),
    [song.id, onFavoritePress]
  );
  const handleOptions = useCallback(
    () => onOptionsPress?.(song),
    [song, onOptionsPress]
  );

  return (
    <TouchableOpacity
      style={[styles.container, isCurrentTrack && { backgroundColor: colors.surfaceLight }, { borderBottomColor: colors.border }]}
      onPress={handlePress}
      activeOpacity={0.6}
    >
      {showIndex && index !== undefined && (
        <Text style={[styles.index, isCurrentTrack && { color: colors.activeTab }]}>
          {isCurrentTrack ? '♪' : index + 1}
        </Text>
      )}

      {showArtwork && (
        <View style={styles.artworkContainer}>
          {isCurrentTrack ? (
            <Image source={require('../../assets/gif/music.gif')} style={styles.artwork} />
          ) : song.artwork ? (
            <Image source={{ uri: song.artwork }} style={styles.artwork} />
          ) : (
            <SongThumbnail seed={song.title} size={44} />
          )}
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, isCurrentTrack && { color: colors.activeTab }, { color: colors.text }]}
            numberOfLines={1}
          >
            {song.title}
          </Text>
        </View>
        <Text
          style={[styles.artist, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {song.artist} · {song.album}
        </Text>
      </View>

      <View style={styles.actions}>
        {onFavoritePress && (
          <TouchableOpacity onPress={handleFavorite} style={styles.actionButton}>
            <Text
              style={[
                styles.favoriteIcon,
                {
                  color: isFavorite
                    ? colors.heartActive
                    : colors.textTertiary,
                },
              ]}
            >
              {isFavorite ? '\u2665' : '\u2661'}
            </Text>
          </TouchableOpacity>
        )}

        {onOptionsPress && (
          <TouchableOpacity onPress={handleOptions} style={styles.actionButton}>
            <Text style={[styles.optionsIcon, { color: colors.textTertiary }]}>
              {'\u22EE'}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.duration, { color: colors.textTertiary }]}>
          {formatDuration(song.duration)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  index: {
    width: 28,
    fontSize: SIZES.fontSmall,
    textAlign: 'center',
    marginRight: SIZES.paddingSmall,
  },
  artworkContainer: {
    marginRight: SIZES.paddingSmall,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  info: {
    flex: 1,
    marginRight: SIZES.paddingSmall,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playingIndicator: {
    fontSize: 14,
    marginRight: 4,
  },
  title: {
    fontSize: SIZES.fontMedium,
    fontWeight: '500',
    marginBottom: 2,
  },
  artist: {
    fontSize: SIZES.fontSmall,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 6,
  },
  favoriteIcon: {
    fontSize: 18,
  },
  optionsIcon: {
    fontSize: 20,
    fontWeight: '700',
  },
  duration: {
    fontSize: SIZES.fontSmall,
    marginLeft: 4,
    minWidth: 40,
    textAlign: 'right',
  },
});

export const SongListItem = memo(SongListItemComponent);
