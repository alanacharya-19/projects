import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SIZES } from '../constants/theme';
import { useThemeContext } from '../context/ThemeProvider';
import { usePlaylistStore } from '../store/playlistStore';
import { EmptyState } from '../components/EmptyState';

export default function PlaylistsScreen() {
  const router = useRouter();
  const { colors } = useThemeContext();
  const { playlists, createPlaylist, deletePlaylist, renamePlaylist } = usePlaylistStore();
  const sorted = [...playlists].sort((a, b) => b.modifiedAt - a.modifiedAt);
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleLongPress = useCallback((playlist: any) => {
    Alert.alert(playlist.name, undefined, [
      {
        text: 'Rename', onPress: () => {
          setRenameTarget(playlist);
          setRenameValue(playlist.name);
          setRenameVisible(true);
        },
      },
      { text: 'Delete', style: 'destructive', onPress: () => { deletePlaylist(playlist.id); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [deletePlaylist]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/create-playlist')}>
        <Text style={styles.createIcon}>+</Text>
        <Text style={styles.createText}>New Playlist</Text>
      </TouchableOpacity>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.playlistItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push({ pathname: '/playlist/[id]', params: { id: item.id } } as any)}
            onLongPress={() => handleLongPress(item)} activeOpacity={0.6}>
            <View style={[styles.playlistIcon, { backgroundColor: colors.surfaceLight }]}><Text style={styles.playlistIconText}>♫</Text></View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.detail, { color: colors.textSecondary }]}>{item.songs.length} songs</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState title="No playlists yet" message="Create a playlist to organize your music" icon="📋" colors={colors} />}
        contentContainerStyle={styles.list}
      />

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
                if (renameTarget && renameValue.trim()) {
                  renamePlaylist(renameTarget.id, renameValue.trim());
                }
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
  container: { flex: 1 },
  list: { paddingBottom: 120 },
  createButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: SIZES.padding, marginVertical: SIZES.paddingSmall, paddingVertical: 14, borderRadius: SIZES.radius, gap: 8 },
  createIcon: { fontSize: 22, color: '#000', fontWeight: '700' },
  createText: { fontSize: SIZES.fontLarge, color: '#000', fontWeight: '700' },
  playlistItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.padding, paddingVertical: SIZES.paddingSmall, borderBottomWidth: StyleSheet.hairlineWidth },
  playlistIcon: { width: 52, height: 52, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: SIZES.paddingSmall },
  playlistIconText: { fontSize: 24, color: '#888' },
  info: { flex: 1 },
  name: { fontSize: SIZES.fontLarge, fontWeight: '500', marginBottom: 2 },
  detail: { fontSize: SIZES.fontSmall },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', borderRadius: SIZES.radius, padding: SIZES.paddingLarge },
  modalTitle: { fontSize: SIZES.fontXLarge, fontWeight: '700', marginBottom: SIZES.padding, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderRadius: SIZES.radius, paddingHorizontal: SIZES.padding, paddingVertical: 12, fontSize: SIZES.fontLarge, marginBottom: SIZES.padding },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SIZES.paddingSmall },
  modalButton: { paddingVertical: 10, paddingHorizontal: SIZES.padding },
  modalButtonText: { fontSize: SIZES.fontLarge, fontWeight: '600' },
});
