import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SIZES } from '../../constants/theme';
import { useThemeContext } from '../../context/ThemeProvider';
import { useLibrary } from '../../hooks/useLibrary';
import { usePlayerStore } from '../../store/playerStore';
import { usePlaylistStore } from '../../store/playlistStore';
import { SongListItem } from '../../components/SongListItem';
import { EmptyState } from '../../components/EmptyState';
import { SearchBar } from '../../components/SearchBar';
import type { Song, Playlist } from '../../types';

export default function PlaylistDetailScreen() {
  const { id: playlistId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useThemeContext();
  const { songs } = useLibrary();
  const { playQueue, currentTrack } = usePlayerStore();
  const { playlists, removeSongFromPlaylist, renamePlaylist, deletePlaylist, addSongToPlaylist } = usePlaylistStore();
  const [showOptions, setShowOptions] = useState(false);
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [addSearch, setAddSearch] = useState('');

  const playlist = useMemo(() => playlists.find((p: Playlist) => p.id === playlistId), [playlists, playlistId]);
  const playlistSongs = useMemo(() => {
    if (!playlist) return [];
    return playlist.songs.map((id: string) => songs.find((s: Song) => s.id === id)).filter(Boolean) as Song[];
  }, [playlist, songs]);

  const songsToAdd = useMemo(() => {
    if (!playlist) return [];
    const existingIds = new Set(playlist.songs);
    let available = songs.filter((s) => !existingIds.has(s.id));
    if (addSearch) {
      const q = addSearch.toLowerCase();
      available = available.filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
    }
    return available;
  }, [songs, playlist, addSearch]);

  const handlePress = useCallback((song: Song) => { playQueue(playlistSongs, playlistSongs.indexOf(song)); }, [playlistSongs, playQueue]);
  const handleRemove = useCallback((song: Song) => { if (playlistId) removeSongFromPlaylist(playlistId, song.id); }, [playlistId, removeSongFromPlaylist]);
  const handleAddSong = useCallback((song: Song) => { if (playlistId) { addSongToPlaylist(playlistId, song.id); } }, [playlistId, addSongToPlaylist]);

  const handleOptionsOpen = useCallback(() => setShowOptions(true), []);
  const handlePlay = useCallback(() => { setShowOptions(false); playQueue(playlistSongs, 0); }, [playlistSongs, playQueue]);
  const handleAddSongsOpen = useCallback(() => { setShowOptions(false); setShowAddSongs(true); }, []);
  const handleRenameOpen = useCallback(() => {
    setShowOptions(false);
    if (playlist) { setRenameValue(playlist.name); setRenameVisible(true); }
  }, [playlist]);
  const handleDelete = useCallback(() => {
    setShowOptions(false);
    if (playlist) { deletePlaylist(playlist.id); router.back(); }
  }, [playlist, deletePlaylist, router]);

  if (!playlist) return <View style={[styles.container, { backgroundColor: colors.background }]}>
    <EmptyState title="Playlist not found" message="This playlist may have been deleted" icon="📋" colors={colors} />
  </View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: colors.text }]}>{playlist.name}</Text>
          <Text style={[styles.count, { color: colors.textSecondary }]}>{playlist.songs.length} songs</Text>
        </View>
        <TouchableOpacity onPress={handleOptionsOpen} style={styles.optionsButton}>
          <Text style={[styles.optionsIcon, { color: colors.text }]}>{'\u22EE'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={playlistSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.songRow}>
            <SongListItem song={item} index={index} onPress={handlePress} colors={colors} showIndex showArtwork isCurrentTrack={currentTrack?.id === item.id} />
            <TouchableOpacity style={styles.removeButton} onPress={() => handleRemove(item)}>
              <Text style={[styles.removeIcon, { color: colors.textTertiary }]}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<EmptyState title="Empty playlist" message="Add songs using the options menu" icon="📋" colors={colors} />}
        contentContainerStyle={styles.list}
      />

      {/* Options Modal */}
      <Modal visible={showOptions} transparent animationType="fade" onRequestClose={() => setShowOptions(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOptions(false)}>
          <View style={[styles.optionsContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.optionsTitle, { color: colors.text }]}>{playlist.name}</Text>
            <TouchableOpacity style={[styles.optionRow, { borderBottomColor: colors.border }]} onPress={handlePlay}>
              <Text style={styles.optionIcon}>▶</Text>
              <Text style={[styles.optionText, { color: colors.text }]}>Play</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.optionRow, { borderBottomColor: colors.border }]} onPress={handleAddSongsOpen}>
              <Text style={styles.optionIcon}>+</Text>
              <Text style={[styles.optionText, { color: colors.text }]}>Add Songs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.optionRow, { borderBottomColor: colors.border }]} onPress={handleRenameOpen}>
              <Text style={styles.optionIcon}>✎</Text>
              <Text style={[styles.optionText, { color: colors.text }]}>Rename</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionRow} onPress={handleDelete}>
              <Text style={styles.optionIcon}>🗑</Text>
              <Text style={[styles.optionText, { color: colors.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Songs Modal */}
      <Modal visible={showAddSongs} transparent animationType="slide" onRequestClose={() => setShowAddSongs(false)}>
        <View style={[styles.addSongsContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.addSongsHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowAddSongs(false)}>
              <Text style={[styles.addSongsCancel, { color: colors.textSecondary }]}>Done</Text>
            </TouchableOpacity>
            <Text style={[styles.addSongsTitle, { color: colors.text }]}>Add Songs</Text>
            <View style={{ width: 50 }} />
          </View>
          <SearchBar value={addSearch} onChangeText={setAddSearch} colors={colors} placeholder="Search songs..." />
          <FlatList
            data={songsToAdd}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.addSongRow, { borderBottomColor: colors.border }]} onPress={() => handleAddSong(item)}>
                <SongListItem song={item} onPress={() => handleAddSong(item)} colors={colors} showArtwork isCurrentTrack={currentTrack?.id === item.id} />
                <Text style={[styles.addIcon, { color: colors.primary }]}>+</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<EmptyState title="No songs to add" message="All songs are already in this playlist" icon="♫" colors={colors} />}
          />
        </View>
      </Modal>

      {/* Rename Modal */}
      <Modal visible={renameVisible} transparent animationType="fade" onRequestClose={() => setRenameVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Rename Playlist</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
              value={renameValue} onChangeText={setRenameValue} autoFocus placeholderTextColor={colors.textTertiary}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setRenameVisible(false)}>
                <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => {
                if (renameValue.trim()) { renamePlaylist(playlist.id, renameValue.trim()); }
                setRenameVisible(false);
              }}>
                <Text style={[styles.modalButtonText, { color: colors.primary }]}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.padding, paddingVertical: SIZES.padding },
  headerInfo: { flex: 1 },
  title: { fontSize: SIZES.fontXLarge, fontWeight: '700', marginBottom: 4 },
  count: { fontSize: SIZES.fontSmall },
  optionsButton: { padding: 8 },
  optionsIcon: { fontSize: 24, fontWeight: '700' },
  songRow: { flexDirection: 'row', alignItems: 'center' },
  removeButton: { padding: SIZES.padding },
  removeIcon: { fontSize: 14 },
  list: { paddingBottom: 120 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', borderRadius: SIZES.radius, padding: SIZES.paddingLarge },
  modalTitle: { fontSize: SIZES.fontXLarge, fontWeight: '700', marginBottom: SIZES.padding, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderRadius: SIZES.radius, paddingHorizontal: SIZES.padding, paddingVertical: 12, fontSize: SIZES.fontLarge, marginBottom: SIZES.padding },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SIZES.paddingSmall },
  modalButton: { paddingVertical: 10, paddingHorizontal: SIZES.padding },
  modalButtonText: { fontSize: SIZES.fontLarge, fontWeight: '600' },
  optionsContent: { width: '80%', borderRadius: SIZES.radius, padding: SIZES.padding },
  optionsTitle: { fontSize: SIZES.fontLarge, fontWeight: '700', marginBottom: SIZES.paddingSmall, textAlign: 'center' },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  optionIcon: { fontSize: 18, width: 32, textAlign: 'center' },
  optionText: { fontSize: SIZES.fontLarge, marginLeft: 8 },
  addSongsContainer: { flex: 1, paddingTop: 50 },
  addSongsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.padding, paddingVertical: SIZES.padding, borderBottomWidth: StyleSheet.hairlineWidth },
  addSongsCancel: { fontSize: SIZES.fontLarge },
  addSongsTitle: { fontSize: SIZES.fontXLarge, fontWeight: '700' },
  addSongRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  addIcon: { fontSize: 22, fontWeight: '700', paddingRight: SIZES.padding },
});
