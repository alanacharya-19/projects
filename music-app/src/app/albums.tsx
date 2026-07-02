import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SIZES } from '../constants/theme';
import { useThemeContext } from '../context/ThemeProvider';
import { useLibrary } from '../hooks/useLibrary';
import { EmptyState } from '../components/EmptyState';
import { LoadingScreen } from '../components/LoadingScreen';

export default function AlbumsScreen() {
  const router = useRouter();
  const { colors } = useThemeContext();
  const { albums, loading, scanned } = useLibrary();
  const sorted = useMemo(() => [...albums].sort((a, b) => a.title.localeCompare(b.title)), [albums]);

  if (loading && !scanned) return <LoadingScreen message="Loading albums..." colors={colors} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.albumItem} onPress={() => router.push({ pathname: '/album/[id]', params: { id: item.id, title: item.title } } as any)} activeOpacity={0.7}>
            {item.artwork ? <Image source={{ uri: item.artwork }} style={styles.artwork} />
              : <View style={[styles.artworkPlaceholder, { backgroundColor: colors.surfaceLight }]}><Text style={styles.placeholderIcon}>◼</Text></View>}
            <Text style={[styles.albumTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.albumSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{item.artist} · {item.songCount} songs</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState title="No albums found" message="Add music files to see albums" icon="◼" colors={colors} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: SIZES.padding, paddingBottom: 120 },
  albumItem: { width: '48%', margin: '1%', marginBottom: SIZES.padding },
  artwork: { width: '100%', aspectRatio: 1, borderRadius: SIZES.radius, backgroundColor: '#333' },
  artworkPlaceholder: { width: '100%', aspectRatio: 1, borderRadius: SIZES.radius, justifyContent: 'center', alignItems: 'center' },
  placeholderIcon: { fontSize: 48, color: '#555' },
  albumTitle: { fontSize: SIZES.fontMedium, fontWeight: '600', marginTop: 6 },
  albumSubtitle: { fontSize: SIZES.fontSmall, marginTop: 2 },
});
