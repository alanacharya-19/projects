import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { COLORS, SIZES } from '../../constants/theme';
import { useThemeContext } from '../../context/ThemeProvider';
import { useLibrary } from '../../hooks/useLibrary';
import { usePlayerStore } from '../../store/playerStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import { SongListItem } from '../../components/SongListItem';
import { EmptyState } from '../../components/EmptyState';
import { formatDuration } from '../../utils/format';
import type { Song, Artist } from '../../types';

export default function ArtistSongsScreen() {
  const { name: artistName } = useLocalSearchParams<{ name: string }>();
  const { colors } = useThemeContext();
  const { getSongsByArtist, artists } = useLibrary();
  const { playQueue, currentTrack } = usePlayerStore();
  const { favoriteIds, toggleFavorite } = useFavoritesStore();

  const songs = useMemo(() => getSongsByArtist(artistName || ''), [artistName, getSongsByArtist]);
  const artist = useMemo(() => artists.find((a: Artist) => a.name === artistName), [artistName, artists]);
  const totalDuration = useMemo(() => songs.reduce((acc: number, s: Song) => acc + s.duration, 0), [songs]);
  const handlePress = useCallback((song: Song) => { playQueue(songs, songs.indexOf(song)); }, [songs, playQueue]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.avatar, { backgroundColor: colors.surfaceLight }]}>
              <Text style={styles.avatarText}>{artistName?.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={[styles.artistName, { color: colors.text }]}>{artistName}</Text>
            <Text style={[styles.artistInfo, { color: colors.textSecondary }]}>{songs.length} songs · {formatDuration(totalDuration)}</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <SongListItem song={item} index={index} onPress={handlePress} colors={colors}
            isFavorite={favoriteIds.includes(item.id)} isCurrentTrack={currentTrack?.id === item.id} onFavoritePress={toggleFavorite} showIndex showArtwork={false} />
        )}
        ListEmptyComponent={<EmptyState title="No songs found" icon="👤" colors={colors} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 30 },
  list: { paddingBottom: 120 },
  header: { alignItems: 'center', paddingVertical: SIZES.paddingLarge },
  avatar: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: SIZES.padding },
  avatarText: { fontSize: 40, fontWeight: '700', color: '#888' },
  artistName: { fontSize: SIZES.fontXXLarge, fontWeight: '700', marginBottom: 4 },
  artistInfo: { fontSize: SIZES.fontMedium },
});
