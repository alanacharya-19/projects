import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SIZES } from '../constants/theme';
import { useThemeContext } from '../context/ThemeProvider';
import { useLibrary } from '../hooks/useLibrary';
import { EmptyState } from '../components/EmptyState';
import { LoadingScreen } from '../components/LoadingScreen';

export default function FoldersScreen() {
  const router = useRouter();
  const { colors } = useThemeContext();
  const { folders, loading, scanned } = useLibrary();
  const sorted = useMemo(() => [...folders].sort((a, b) => a.name.localeCompare(b.name)), [folders]);

  if (loading && !scanned) return <LoadingScreen message="Loading folders..." colors={colors} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.folderItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push({ pathname: '/folder/[id]', params: { id: item.id, name: item.name } } as any)} activeOpacity={0.6}>
            <Text style={styles.folderIcon}>📁</Text>
            <View style={styles.info}>
              <Text style={[styles.folderName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.songCount, { color: colors.textSecondary }]}>{item.songCount} songs</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState title="No folders found" message="Add music files to see folders" icon="📁" colors={colors} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: 120 },
  folderItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.padding, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  folderIcon: { fontSize: 28, marginRight: SIZES.paddingSmall },
  info: { flex: 1 },
  folderName: { fontSize: SIZES.fontLarge, fontWeight: '500', marginBottom: 2 },
  songCount: { fontSize: SIZES.fontSmall },
});
