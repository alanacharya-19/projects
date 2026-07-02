import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SIZES } from '../constants/theme';
import { useThemeContext } from '../context/ThemeProvider';
import { useLibrary } from '../hooks/useLibrary';
import { EmptyState } from '../components/EmptyState';
import { LoadingScreen } from '../components/LoadingScreen';

export default function GenresScreen() {
  const router = useRouter();
  const { colors } = useThemeContext();
  const { genres, loading, scanned } = useLibrary();
  const sorted = useMemo(() => [...genres].sort((a, b) => a.name.localeCompare(b.name)), [genres]);

  if (loading && !scanned) return <LoadingScreen message="Loading genres..." colors={colors} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.genreItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push({ pathname: '/genre/[id]', params: { id: item.id, name: item.name } } as any)} activeOpacity={0.6}>
            <Text style={styles.genreIcon}>🎵</Text>
            <View style={styles.info}>
              <Text style={[styles.genreName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.songCount, { color: colors.textSecondary }]}>{item.songCount} songs</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState title="No genres found" message="Add music files to see genres" icon="🎵" colors={colors} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: 120 },
  genreItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.padding, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  genreIcon: { fontSize: 28, marginRight: SIZES.paddingSmall },
  info: { flex: 1 },
  genreName: { fontSize: SIZES.fontLarge, fontWeight: '500', marginBottom: 2 },
  songCount: { fontSize: SIZES.fontSmall },
});
