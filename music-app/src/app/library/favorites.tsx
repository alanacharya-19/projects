import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { useThemeContext } from '../../context/ThemeProvider';
import { useLibrary } from '../../hooks/useLibrary';
import { usePlayerStore } from '../../store/playerStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import { SongListItem } from '../../components/SongListItem';
import { EmptyState } from '../../components/EmptyState';
import type { Song } from '../../types';

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useThemeContext();
  const { songs } = useLibrary();
  const { playQueue, currentTrack } = usePlayerStore();
  const { favoriteIds, toggleFavorite } = useFavoritesStore();
  const favoriteSongs = useMemo(() => favoriteIds.map((id) => songs.find((s) => s.id === id)).filter(Boolean) as Song[], [favoriteIds, songs]);
  const handlePress = useCallback((song: Song) => { playQueue(favoriteSongs, favoriteSongs.indexOf(song)); }, [favoriteSongs, playQueue]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Favorites</Text>
      </View>
      <FlatList
        data={favoriteSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <SongListItem song={item} index={index} onPress={handlePress} colors={colors} isFavorite onFavoritePress={toggleFavorite} showIndex showArtwork isCurrentTrack={currentTrack?.id === item.id} />}
        ListEmptyComponent={<EmptyState title="No favorites yet" message="Tap the heart icon on any song" icon="♡" colors={colors} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 30 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.padding, paddingBottom: 12 },
  backBtn: { marginRight: 8 },
  headerTitle: { fontSize: 30, fontWeight: '700' },
  list: { paddingBottom: 120 },
});
