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
import type { Song } from '../../types';

export default function FolderSongsScreen() {
  const { name: folderName } = useLocalSearchParams<{ name: string }>();
  const { colors } = useThemeContext();
  const { getSongsByFolder } = useLibrary();
  const { playQueue, currentTrack } = usePlayerStore();
  const { favoriteIds, toggleFavorite } = useFavoritesStore();
  const songs = useMemo(() => getSongsByFolder(folderName || ''), [folderName, getSongsByFolder]);
  const handlePress = useCallback((song: Song) => { playQueue(songs, songs.indexOf(song)); }, [songs, playQueue]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.folderIcon}>📁</Text>
            <Text style={[styles.folderName, { color: colors.text }]}>{folderName}</Text>
            <Text style={[styles.songCount, { color: colors.textSecondary }]}>{songs.length} songs</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <SongListItem song={item} index={index} onPress={handlePress} colors={colors}
            isFavorite={favoriteIds.includes(item.id)} isCurrentTrack={currentTrack?.id === item.id} onFavoritePress={toggleFavorite} showIndex showArtwork={false} />
        )}
        ListEmptyComponent={<EmptyState title="No songs found" icon="📁" colors={colors} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: 120 },
  header: { alignItems: 'center', paddingVertical: SIZES.paddingLarge },
  folderIcon: { fontSize: 48, marginBottom: SIZES.paddingSmall },
  folderName: { fontSize: SIZES.fontXXLarge, fontWeight: '700', marginBottom: 4 },
  songCount: { fontSize: SIZES.fontMedium },
});
