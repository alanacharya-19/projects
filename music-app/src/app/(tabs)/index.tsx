import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, Dimensions, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import TrackPlayer from 'react-native-track-player';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { useThemeContext } from '../../context/ThemeProvider';
import { useLibrary } from '../../hooks/useLibrary';
import { usePermissions } from '../../hooks/usePermissions';
import { usePlayerStore } from '../../store/playerStore';
import { useRecentlyPlayedStore } from '../../store/recentlyPlayedStore';
import { useLibraryStore } from '../../store/libraryStore';
import { EmptyState } from '../../components/EmptyState';
import { LoadingScreen } from '../../components/LoadingScreen';
import { SongThumbnail } from '../../components/SongThumbnail';
import type { Song } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - SIZES.padding * 3) / 2;

const QUICK_ACTIONS = [
  { id: 'albums', label: 'Albums', icon: require('../../../assets/icons/albums.png'), href: '/library/albums' },
  { id: 'artists', label: 'Artists', icon: require('../../../assets/icons/Artists.png'), href: '/library/artists' },
  { id: 'favorites', label: 'Favorites', icon: require('../../../assets/icons/favourite.png'), href: '/library/favorites' },
  { id: 'playlists', label: 'Playlists', icon: require('../../../assets/icons/playlists.png'), href: '/library/playlists' },
];

const ALL_SONGS = { id: 'allsongs', label: 'All Songs', icon: require('../../../assets/icons/allsongs.png'), href: '/(tabs)/songs' as const };

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function SongCard({ song, onPress, colors, isCurrentTrack }: {
  song: Song; onPress: (s: Song) => void; colors: any; isCurrentTrack: boolean;
}) {
  return (
    <TouchableOpacity style={styles.songCard} onPress={() => onPress(song)} activeOpacity={0.7}>
      <View style={[styles.cardArtwork, { backgroundColor: colors.surfaceLight }]}>
        {song.artwork ? (
          <Image source={{ uri: song.artwork }} style={styles.cardArtImage} />
        ) : (
          <SongThumbnail seed={song.title} size={CARD_WIDTH} style={{ borderRadius: 14 }} />
        )}
        <View style={[styles.cardPlayOverlay, { backgroundColor: isCurrentTrack ? colors.primary + 'CC' : 'rgba(0,0,0,0.3)' }]}>
          <Ionicons name={isCurrentTrack ? "volume-high" : "play"} size={18} color="#fff" />
        </View>
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{song.title}</Text>
        <Text style={[styles.cardArtist, { color: colors.textSecondary }]} numberOfLines={1}>{song.artist}</Text>
      </View>
    </TouchableOpacity>
  );
}

function QuickActionTile({ action, colors, router, fullWidth }: {
  action: typeof QUICK_ACTIONS[0]; colors: any; router: any; fullWidth?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[fullWidth ? styles.actionFull : styles.actionItem, { backgroundColor: colors.surface }]}
      onPress={() => router.push(action.href as any)}
      activeOpacity={0.7}
    >
      <Image source={action.icon} style={fullWidth ? styles.actionFullIcon : styles.actionIconImg} />
      <Text style={[styles.actionLabel, { color: colors.text }]}>{action.label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useThemeContext();
  const { hasPermission, loading: permLoading, requestPermission } = usePermissions();
  const { songs, recentlyAdded, loading, scanned, error, refreshLibrary } = useLibrary();
  const { playQueue, currentTrack, isPlaying } = usePlayerStore();
  const recentlyPlayedIds = useRecentlyPlayedStore((s) => s.songIds);
  const [refreshing, setRefreshing] = useState(false);
  const [heroProgress, setHeroProgress] = useState(0);

  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      try {
        const pos = await TrackPlayer.getProgress();
        if (mounted) {
          setHeroProgress(pos.duration > 0 ? pos.position / pos.duration : 0);
        }
      } catch { /* not ready */ }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const recentlyPlayedSongs = useMemo(
    () => recentlyPlayedIds.map((id) => songs.find((s) => s.id === id)).filter(Boolean) as Song[],
    [recentlyPlayedIds, songs]
  );

  const uniqueArtists = useMemo(() => new Set(songs.map((s) => s.artist)).size, [songs]);
  const uniqueAlbums = useMemo(() => new Set(songs.map((s) => s.album)).size, [songs]);

  const handleSongPress = useCallback(
    (song: Song) => { playQueue(songs, songs.indexOf(song)); },
    [songs, playQueue]
  );

  const handleShuffleAll = useCallback(() => {
    if (songs.length === 0) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    playQueue(shuffled, 0);
  }, [songs, playQueue]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshLibrary();
    setRefreshing(false);
  }, [refreshLibrary]);

  if (loading && !scanned) return <LoadingScreen message="Scanning your music library..." colors={colors} />;

  if (hasPermission === false) {
    // permission UI before error — scan may have failed due to missing permission
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContainer}>
          <View style={styles.permissionContent}>
            <Image source={require('../../../assets/images/icon.png')} style={{ width: 80, height: 80, marginBottom: 16 }} />
            <Text style={[styles.permissionTitle, { color: colors.text }]}>Access Your Music</Text>
            <Text style={[styles.permissionMessage, { color: colors.textSecondary }]}>
              Grant audio permission to scan and play your local music files.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.primary }]}
            onPress={async () => {
              const granted = await requestPermission();
              if (granted) {
                useLibraryStore.getState().scanLibrary();
              } else {
                Alert.alert('Permission Required', 'Audio access is needed to play music.');
              }
            }}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (error) return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EmptyState title="Error loading library" message={error} icon="⚠" colors={colors} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()}</Text>
            <Text style={[styles.title, { color: colors.text }]}>Your Library</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Now Playing Hero */}
        {currentTrack && (
          <>
            <TouchableOpacity
              style={[styles.heroCard, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/now-playing')}
              activeOpacity={0.8}
            >
            <View style={[styles.heroArtwork, { backgroundColor: colors.surfaceLight }]}>
              {currentTrack.artwork ? (
                <Image source={{ uri: currentTrack.artwork }} style={styles.heroArtImage} />
              ) : (
                <SongThumbnail seed={currentTrack.title} size={56} style={{ borderRadius: 12 }} />
              )}
            </View>
              <View style={styles.heroInfo}>
                <Text style={[styles.heroLabel, { color: colors.primary }]}>NOW PLAYING</Text>
                <Text style={[styles.heroTitle, { color: colors.text }]} numberOfLines={1}>{currentTrack.title}</Text>
                <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{currentTrack.artist}</Text>
              </View>
              <View style={[styles.heroPlaying, { borderLeftColor: colors.primary }]}>
                <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={36} color={colors.primary} />
              </View>
            </TouchableOpacity>
            <View style={[styles.heroProgressTrack, { backgroundColor: colors.progressBackground }]}>
              <View style={[styles.heroProgressFill, { width: `${heroProgress * 100}%`, backgroundColor: colors.progressFill }]} />
            </View>
          </>
        )}

        {/* Shuffle All + Stats Row */}
        {songs.length > 0 && (
          <View style={styles.shuffleRow}>
            <TouchableOpacity style={[styles.shuffleBtn, { backgroundColor: colors.primary }]} onPress={handleShuffleAll} activeOpacity={0.8}>
              <Ionicons name="shuffle" size={18} color="#000" />
              <Text style={styles.shuffleText}>Shuffle All</Text>
            </TouchableOpacity>
            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <Text style={[styles.statPillValue, { color: colors.text }]}>{songs.length}</Text>
                <Text style={[styles.statPillLabel, { color: colors.textTertiary }]}>songs</Text>
              </View>
              <View style={[styles.statPillDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statPill}>
                <Text style={[styles.statPillValue, { color: colors.text }]}>{uniqueAlbums}</Text>
                <Text style={[styles.statPillLabel, { color: colors.textTertiary }]}>albums</Text>
              </View>
              <View style={[styles.statPillDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statPill}>
                <Text style={[styles.statPillValue, { color: colors.text }]}>{uniqueArtists}</Text>
                <Text style={[styles.statPillLabel, { color: colors.textTertiary }]}>artists</Text>
              </View>
            </View>
          </View>
        )}

        {/* Browse Grid */}
        {songs.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BROWSE</Text>
            <View style={styles.browseSection}>
              <QuickActionTile action={ALL_SONGS} colors={colors} router={router} fullWidth />
              <View style={styles.actionsGrid}>
                {QUICK_ACTIONS.map((action) => (
                  <QuickActionTile key={action.id} action={action} colors={colors} router={router} />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Recently Played */}
        {recentlyPlayedSongs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECENTLY PLAYED</Text>
              <TouchableOpacity onPress={() => router.push('/queue')}>
                <Text style={[styles.seeAll, { color: colors.textTertiary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recentlyPlayedSongs.slice(0, 6)}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <SongCard
                  song={item}
                  onPress={handleSongPress}
                  colors={colors}
                  isCurrentTrack={currentTrack?.id === item.id}
                />
              )}
            />
          </View>
        )}

        {/* Recently Added */}
        {recentlyAdded.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECENTLY ADDED</Text>
              <TouchableOpacity onPress={() => router.push('/queue')}>
                <Text style={[styles.seeAll, { color: colors.textTertiary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recentlyAdded.slice(0, 6)}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <SongCard
                  song={item}
                  onPress={handleSongPress}
                  colors={colors}
                  isCurrentTrack={currentTrack?.id === item.id}
                />
              )}
            />
          </View>
        )}

        {songs.length === 0 && !loading && (
          <EmptyState title="No songs found" message="Grant storage permission or add music files" icon="♪" colors={colors} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  permissionContainer: { flex: 1, justifyContent: 'center', padding: SIZES.paddingLarge },
  permissionContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  permissionTitle: { fontSize: SIZES.fontTitle, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  permissionMessage: { fontSize: SIZES.fontLarge, textAlign: 'center', lineHeight: 24, paddingHorizontal: SIZES.padding },
  permissionButton: { paddingVertical: 16, borderRadius: SIZES.radius, alignItems: 'center', marginBottom: 40 },
  permissionButtonText: { color: '#000', fontSize: SIZES.fontLarge, fontWeight: '700' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 140 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: SIZES.padding * 2, paddingHorizontal: SIZES.padding, marginBottom: SIZES.padding },
  greeting: { fontSize: SIZES.fontMedium, marginBottom: 2 },
  title: { fontSize: 28, fontWeight: '800' },
  settingsBtn: { padding: 8 },

  heroCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: SIZES.padding, borderRadius: 16, padding: SIZES.paddingSmall, marginBottom: SIZES.padding },
  heroArtwork: { width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  heroArtImage: { width: '100%', height: '100%' },
  heroInfo: { flex: 1, marginLeft: SIZES.paddingSmall },
  heroLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 2 },
  heroTitle: { fontSize: SIZES.fontLarge, fontWeight: '600' },
  heroSubtitle: { fontSize: SIZES.fontSmall, marginTop: 1 },
  heroPlaying: { paddingLeft: SIZES.paddingSmall, borderLeftWidth: 2 },

  heroProgressTrack: { height: 3, marginHorizontal: SIZES.padding, marginTop: -SIZES.paddingSmall / 2, marginBottom: SIZES.paddingSmall, borderRadius: 1.5, overflow: 'hidden' },
  heroProgressFill: { height: '100%', borderRadius: 1.5 },

  shuffleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.padding, marginBottom: SIZES.paddingLarge, gap: SIZES.paddingSmall },
  shuffleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  shuffleText: { fontSize: SIZES.fontMedium, fontWeight: '700', color: '#000' },
  statsRow: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'space-around', backgroundColor: 'transparent' },
  statPill: { alignItems: 'center' },
  statPillValue: { fontSize: SIZES.fontLarge, fontWeight: '700' },
  statPillLabel: { fontSize: 10 },
  statPillDivider: { width: 1, height: 24 },

  section: { marginBottom: SIZES.paddingLarge + 4 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: SIZES.padding },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.2, paddingHorizontal: SIZES.padding, marginBottom: SIZES.paddingSmall },
  seeAll: { fontSize: SIZES.fontSmall, fontWeight: '500' },

  browseSection: { paddingHorizontal: SIZES.padding, gap: SIZES.paddingSmall },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.paddingSmall },
  actionItem: { width: (SCREEN_WIDTH - SIZES.padding * 2 - SIZES.paddingSmall) / 2, flexDirection: 'row', alignItems: 'center', gap: 10, padding: SIZES.paddingSmall, borderRadius: 14 },
  actionFull: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: SIZES.padding, borderRadius: 14 },
  actionIconImg: { width: 32, height: 32 },
  actionFullIcon: { width: 36, height: 36 },
  actionLabel: { fontSize: SIZES.fontMedium, fontWeight: '600' },

  horizontalList: { paddingHorizontal: SIZES.padding, gap: SIZES.paddingSmall },
  songCard: { width: CARD_WIDTH, borderRadius: 14, overflow: 'hidden', backgroundColor: 'transparent' },
  cardArtwork: { width: '100%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  cardArtImage: { width: '100%', height: '100%' },
  cardPlayOverlay: { position: 'absolute', bottom: 6, right: 6, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { paddingTop: 6, paddingHorizontal: 2 },
  cardTitle: { fontSize: SIZES.fontMedium, fontWeight: '600', marginBottom: 2 },
  cardArtist: { fontSize: SIZES.fontSmall },
});
