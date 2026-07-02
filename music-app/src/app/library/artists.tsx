import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { useThemeContext } from '../../context/ThemeProvider';
import { useLibrary } from '../../hooks/useLibrary';
import { EmptyState } from '../../components/EmptyState';
import { LoadingScreen } from '../../components/LoadingScreen';

export default function ArtistsScreen() {
  const router = useRouter();
  const { colors } = useThemeContext();
  const { artists, loading, scanned } = useLibrary();
  const sorted = useMemo(() => [...artists].sort((a, b) => a.name.localeCompare(b.name)), [artists]);

  if (loading && !scanned) return <LoadingScreen message="Loading artists..." colors={colors} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Artists</Text>
      </View>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.artistItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push({ pathname: '/artist/[id]', params: { id: item.id, name: item.name } } as any)} activeOpacity={0.6}>
            <View style={[styles.avatar, { backgroundColor: colors.surfaceLight }]}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.detail, { color: colors.textSecondary }]}>{item.songCount} songs · {item.albumCount} albums</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState title="No artists found" message="Add music files to see artists" icon="👤" colors={colors} />}
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
  artistItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.padding, paddingVertical: SIZES.paddingSmall, borderBottomWidth: StyleSheet.hairlineWidth },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginRight: SIZES.paddingSmall },
  avatarText: { fontSize: 22, fontWeight: '600', color: '#888' },
  info: { flex: 1 },
  name: { fontSize: SIZES.fontLarge, fontWeight: '600', marginBottom: 2 },
  detail: { fontSize: SIZES.fontSmall },
});
