import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SIZES } from '../constants/theme';
import { useThemeContext } from '../context/ThemeProvider';
import { useLibrary } from '../hooks/useLibrary';
import { usePlayerStore } from '../store/playerStore';
import { usePlaylistStore } from '../store/playlistStore';
import { SongListItem } from '../components/SongListItem';
import { SearchBar } from '../components/SearchBar';

export default function CreatePlaylistScreen() {
  const router = useRouter();
  const { colors } = useThemeContext();
  const { songs } = useLibrary();
  const { currentTrack } = usePlayerStore();
  const { createPlaylist } = usePlaylistStore();
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!search) return songs;
    const q = search.toLowerCase();
    return songs.filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
  }, [songs, search]);

  const toggleSong = useCallback((id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);

  const handleCreate = useCallback(() => {
    if (!name.trim()) { Alert.alert('Error', 'Enter a playlist name'); return; }
    createPlaylist(name.trim(), Array.from(selectedIds));
    router.back();
  }, [name, createPlaylist, router, selectedIds]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.cancel, { color: colors.textSecondary }]}>Cancel</Text></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>New Playlist</Text>
        <TouchableOpacity onPress={handleCreate}><Text style={[styles.create, { color: name.trim() ? colors.primary : colors.textTertiary }]}>Create</Text></TouchableOpacity>
      </View>
      <TextInput style={[styles.nameInput, { color: colors.text, backgroundColor: colors.surface }]}
        placeholder="Playlist name" placeholderTextColor={colors.textTertiary} value={name} onChangeText={setName} autoFocus />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Songs ({selectedIds.size} selected)</Text>
      <SearchBar value={search} onChangeText={setSearch} colors={colors} placeholder="Filter songs..." />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.songRow, { backgroundColor: selectedIds.has(item.id) ? colors.primary + '20' : 'transparent', borderBottomColor: colors.border }]} onPress={() => toggleSong(item.id)}>
            <SongListItem song={item} onPress={() => toggleSong(item.id)} colors={colors} showArtwork isCurrentTrack={currentTrack?.id === item.id} />
            <View style={[styles.checkbox, { borderColor: colors.textTertiary, backgroundColor: selectedIds.has(item.id) ? colors.primary : 'transparent' }]}>
              {selectedIds.has(item.id) && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.padding, paddingVertical: SIZES.paddingSmall },
  cancel: { fontSize: SIZES.fontLarge },
  headerTitle: { fontSize: SIZES.fontXLarge, fontWeight: '700' },
  create: { fontSize: SIZES.fontLarge, fontWeight: '700' },
  nameInput: { marginHorizontal: SIZES.padding, paddingHorizontal: SIZES.padding, paddingVertical: 12, borderRadius: SIZES.radius, fontSize: SIZES.fontLarge, marginBottom: SIZES.padding },
  sectionTitle: { fontSize: SIZES.fontLarge, fontWeight: '600', paddingHorizontal: SIZES.padding, marginBottom: 4 },
  songRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: SIZES.padding },
  checkmark: { color: '#000', fontSize: 14, fontWeight: '700' },
  list: { paddingBottom: 120 },
});
