import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SectionList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { useThemeContext } from '../../context/ThemeProvider';
import { useLibrary } from '../../hooks/useLibrary';
import { usePlayerStore } from '../../store/playerStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import { SongListItem } from '../../components/SongListItem';
import { SearchBar } from '../../components/SearchBar';
import { EmptyState } from '../../components/EmptyState';
import { LoadingScreen } from '../../components/LoadingScreen';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDuration } from '../../utils/format';
import type { Song } from '../../types';

type SortMode = 'title' | 'artist' | 'album' | 'dateAdded';

interface Section {
  title: string;
  data: Song[];
}

export default function SongsScreen() {
  const router = useRouter();
  const { colors } = useThemeContext();
  const { songs, loading, scanned } = useLibrary();
  const { playQueue, currentTrack } = usePlayerStore();
  const { favoriteIds, toggleFavorite } = useFavoritesStore();
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('title');
  const debouncedSearch = useDebounce(search);
  const listRef = useRef<SectionList<Song, Section>>(null);

  const filteredSongs = useMemo(() => {
    let result = songs;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || s.album.toLowerCase().includes(q)
      );
    }
    const sorted = [...result];
    switch (sortMode) {
      case 'artist':
        sorted.sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));
        break;
      case 'album':
        sorted.sort((a, b) => a.album.localeCompare(b.album) || a.title.localeCompare(b.title));
        break;
      case 'dateAdded':
        sorted.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
        break;
      default:
        sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    return sorted;
  }, [songs, debouncedSearch, sortMode]);

  const sections = useMemo(() => {
    if (!filteredSongs.length) return [];
    const map = new Map<string, Song[]>();
    for (const song of filteredSongs) {
      let key: string;
      switch (sortMode) {
        case 'artist':
          key = song.artist || 'Unknown Artist';
          break;
        case 'album':
          key = song.album || 'Unknown Album';
          break;
        case 'dateAdded': {
          const d = song.dateAdded ? new Date(song.dateAdded) : new Date();
          const now = new Date();
          const diff = now.getTime() - d.getTime();
          if (diff < 86400000) key = 'Today';
          else if (diff < 604800000) key = 'This Week';
          else if (diff < 2592000000) key = 'This Month';
          else key = 'Older';
          break;
        }
        default: {
          const first = song.title.charAt(0).toUpperCase();
          key = /[A-Z]/.test(first) ? first : '#';
        }
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(song);
    }
    const order = sortMode === 'dateAdded'
      ? ['Today', 'This Week', 'This Month', 'Older']
      : sortMode === 'title'
        ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('')
        : undefined;
    const keys = order ? order.filter((k) => map.has(k)) : Array.from(map.keys());
    return keys.map((key) => ({ title: key, data: map.get(key)! }));
  }, [filteredSongs, sortMode]);

  const totalDuration = useMemo(() => songs.reduce((acc, s) => acc + s.duration, 0), [songs]);

  const handleItemPress = useCallback(
    (song: Song, index: number) => { playQueue(filteredSongs, index); },
    [filteredSongs, playQueue],
  );

  const scrollToSection = useCallback((title: string) => {
    const idx = sections.findIndex((s) => s.title === title);
    if (idx >= 0) listRef.current?.scrollToLocation({ sectionIndex: idx, itemIndex: 0, animated: true });
  }, [sections]);

  if (loading && !scanned) return <LoadingScreen message="Loading songs..." colors={colors} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerSection, { borderBottomColor: colors.border }]}>
        <View style={styles.searchRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <SearchBar value={search} onChangeText={setSearch} colors={colors} noMargin />
        </View>
        <View style={styles.sortRow}>
          {(['title', 'artist', 'album', 'dateAdded'] as SortMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.sortChip, { backgroundColor: sortMode === mode ? colors.primary : colors.surface }]}
              onPress={() => setSortMode(mode)}
            >
              <Text style={[styles.sortChipText, { color: sortMode === mode ? '#000' : colors.textSecondary }]}>
                {mode === 'title' ? 'Name' : mode === 'dateAdded' ? 'Date' : mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
          <Text style={[styles.count, { color: colors.textTertiary }]}>{filteredSongs.length} songs</Text>
        </View>
      </View>

      {sortMode === 'title' && sections.length > 5 && (
        <View style={[styles.alphaJumpBar, { borderBottomColor: colors.border }]}>
          {'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('').map((letter) => {
            const exists = sections.some((s) => s.title === letter);
            return (
              <TouchableOpacity key={letter} onPress={() => scrollToSection(letter)} disabled={!exists} style={styles.alphaBtn}>
                <Text style={[styles.alphaBtnText, { color: exists ? colors.text : colors.textTertiary, opacity: exists ? 1 : 0.3 }]}>
                  {letter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionHeaderText, { color: colors.textSecondary }]}>{section.title}</Text>
            <Text style={[styles.sectionHeaderCount, { color: colors.textTertiary }]}>{section.data.length}</Text>
          </View>
        )}
        renderItem={({ item, index }) => {
          const globalIndex = filteredSongs.indexOf(item);
          return (
            <SongListItem
              song={item}
              index={index}
              onPress={() => handleItemPress(item, globalIndex)}
              colors={colors}
              isFavorite={favoriteIds.includes(item.id)}
              isCurrentTrack={currentTrack?.id === item.id}
              onFavoritePress={toggleFavorite}
              showArtwork
            />
          );
        }}
        ListHeaderComponent={
          <View style={styles.statsRow}>
            <Text style={[styles.statsText, { color: colors.textTertiary }]}>
              {songs.length} total · {formatDuration(totalDuration)}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={search ? 'No results' : 'No songs found'}
            message={search ? 'Try a different search term' : 'Your music library is empty'}
            icon={search ? '🔍' : '♪'}
            colors={colors}
          />
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 30 },
  list: { paddingBottom: 80 },
  headerSection: { borderBottomWidth: StyleSheet.hairlineWidth },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingRight: SIZES.padding, paddingTop: SIZES.paddingSmall },
  backBtn: { padding: 4, marginLeft: 4, marginRight: 4 },
  sortRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.padding, paddingBottom: SIZES.paddingSmall, gap: 6 },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  sortChipText: { fontSize: SIZES.fontSmall, fontWeight: '500' },
  count: { marginLeft: 'auto', fontSize: SIZES.fontSmall },
  alphaJumpBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 4, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  alphaBtn: { padding: 2 },
  alphaBtnText: { fontSize: 10, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.padding, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  sectionHeaderText: { fontSize: SIZES.fontSmall, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  sectionHeaderCount: { fontSize: SIZES.fontSmall },
  statsRow: { paddingHorizontal: SIZES.padding, paddingVertical: 6 },
  statsText: { fontSize: SIZES.fontSmall },
});
