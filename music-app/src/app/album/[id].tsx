import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { COLORS, SIZES } from '../../constants/theme';
import { useThemeContext } from '../../context/ThemeProvider';
import { useLibrary } from '../../hooks/useLibrary';
import { usePlayerStore } from '../../store/playerStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import { SongListItem } from '../../components/SongListItem';
import { EmptyState } from '../../components/EmptyState';
import { formatDuration } from '../../utils/format';
import type { Song, Album } from '../../types';

export default function AlbumSongsScreen() {
  const { title: albumTitle } = useLocalSearchParams<{ title: string }>();
  const { colors } = useThemeContext();
  const { getSongsByAlbum, albums } = useLibrary();
  const { playQueue, currentTrack } = usePlayerStore();
  const { favoriteIds, toggleFavorite } = useFavoritesStore();

  const songs = useMemo(() => getSongsByAlbum(albumTitle || ''), [albumTitle, getSongsByAlbum]);
  const album = useMemo(() => albums.find((a: Album) => a.title === albumTitle), [albumTitle, albums]);
  const totalDuration = useMemo(() => songs.reduce((acc: number, s: Song) => acc + s.duration, 0), [songs]);
  const handlePress = useCallback((song: Song) => { playQueue(songs, songs.indexOf(song)); }, [songs, playQueue]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            {album?.artwork ? <Image source={{ uri: album.artwork }} style={styles.artwork} />
              : <View style={[styles.artworkPlaceholder, { backgroundColor: colors.surfaceLight }]}><Text style={styles.placeholderIcon}>◼</Text></View>}
            <Text style={[styles.albumTitle, { color: colors.text }]}>{albumTitle}</Text>
            <Text style={[styles.albumInfo, { color: colors.textSecondary }]}>{album?.artist} · {songs.length} songs · {formatDuration(totalDuration)}</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <SongListItem song={item} index={index} onPress={handlePress} colors={colors}
            isFavorite={favoriteIds.includes(item.id)} isCurrentTrack={currentTrack?.id === item.id} onFavoritePress={toggleFavorite} showIndex showArtwork={false} />
        )}
        ListEmptyComponent={<EmptyState title="No songs in album" icon="◼" colors={colors} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 30 },
  list: { paddingBottom: 120 },
  header: { alignItems: 'center', paddingVertical: SIZES.paddingLarge, paddingHorizontal: SIZES.padding },
  artwork: { width: 200, height: 200, borderRadius: SIZES.radius, marginBottom: SIZES.padding },
  artworkPlaceholder: { width: 200, height: 200, borderRadius: SIZES.radius, justifyContent: 'center', alignItems: 'center', marginBottom: SIZES.padding },
  placeholderIcon: { fontSize: 64, color: '#555' },
  albumTitle: { fontSize: SIZES.fontXXLarge, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  albumInfo: { fontSize: SIZES.fontMedium, textAlign: 'center' },
});
