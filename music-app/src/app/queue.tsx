import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { useThemeContext } from '../context/ThemeProvider';
import { usePlayerStore } from '../store/playerStore';
import { SongListItem } from '../components/SongListItem';
import { EmptyState } from '../components/EmptyState';

export default function QueueScreen() {
  const router = useRouter();
  const { colors } = useThemeContext();
  const { queue, currentTrack, removeFromQueue, clearQueue, play, reorderQueue } = usePlayerStore();
  const [editing, setEditing] = useState(false);

  const handleClear = useCallback(() => {
    Alert.alert('Clear Queue', 'Remove all songs?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearQueue },
    ]);
  }, [clearQueue]);

  const handleMove = useCallback((index: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? index - 1 : index + 1;
    if (toIndex < 0 || toIndex >= queue.length) return;
    reorderQueue(index, toIndex);
  }, [queue.length, reorderQueue]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Queue</Text>
        {queue.length > 0 && (
          editing ? (
            <TouchableOpacity onPress={() => setEditing(false)}>
              <Text style={[styles.clearText, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleClear}>
              <Text style={[styles.clearText, { color: colors.error }]}>Clear</Text>
            </TouchableOpacity>
          )
        )}
      </View>
      <FlatList
        data={queue}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => queue.length > 1 && setEditing(true)}
          >
            <View style={styles.queueItem}>
              {currentTrack?.id === item.id && <View style={[styles.playingIndicator, { backgroundColor: colors.primary }]} />}
              {editing && (
                <View style={styles.moveButtons}>
                  <TouchableOpacity
                    style={[styles.moveBtn, index === 0 && { opacity: 0.3 }]}
                    onPress={() => handleMove(index, 'up')}
                    disabled={index === 0}
                  >
                    <Ionicons name="chevron-up" size={18} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.moveBtn, index === queue.length - 1 && { opacity: 0.3 }]}
                    onPress={() => handleMove(index, 'down')}
                    disabled={index === queue.length - 1}
                  >
                    <Ionicons name="chevron-down" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>
              )}
              <SongListItem song={item} index={index} onPress={play} colors={colors} showIndex showArtwork={false} isCurrentTrack={currentTrack?.id === item.id} />
              {!editing && (
                <TouchableOpacity style={styles.removeButton} onPress={() => removeFromQueue(index)}>
                  <Text style={[styles.removeIcon, { color: colors.textTertiary }]}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState title="Queue is empty" message="Add songs to start listening" icon="♫" colors={colors} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.padding, paddingVertical: SIZES.paddingSmall, paddingTop: 30 },
  backBtn: { padding: 4, marginRight: 4 },
  title: { fontSize: SIZES.fontTitle, fontWeight: '700', flex: 1 },
  clearText: { fontSize: SIZES.fontMedium, fontWeight: '600' },
  queueItem: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  playingIndicator: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, zIndex: 1 },
  moveButtons: { flexDirection: 'column', paddingLeft: SIZES.paddingSmall, gap: 2 },
  moveBtn: { padding: 4 },
  removeButton: { padding: SIZES.padding },
  removeIcon: { fontSize: 14 },
  list: { paddingBottom: 120 },
});
