import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as MediaLibrary from "expo-media-library";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, Layout } from "react-native-reanimated";
import { FlashList } from "@shopify/flash-list";
import { colors, typography, spacing, borderRadius, shadows } from "../theme";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useIsLandscape } from "../hooks/useOrientation";
import { COLUMN_COUNT, CARD_WIDTH, CARD_HEIGHT, LIST_ITEM_HEIGHT } from "../constants/layout";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface VideoItem {
  id: string;
  uri: string;
  filename: string;
  duration: number;
  width: number;
  height: number;
  creationTime: number;
  fileSize?: number;
}

type SortMode = "date" | "name" | "duration" | "size";
type ViewMode = "grid" | "list";
type FilterChip = { key: string; label: string; icon: keyof typeof Ionicons.glyphMap };

const FILTERS: FilterChip[] = [
  { key: "all", label: "All", icon: "apps-outline" },
  { key: "recent", label: "Recent", icon: "time-outline" },
  { key: "long", label: "Long", icon: "hourglass-outline" },
  { key: "4k", label: "4K", icon: "tv-outline" },
];

const SORT_OPTIONS: { key: SortMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "date", label: "Date", icon: "time-outline" },
  { key: "name", label: "Name", icon: "text-outline" },
  { key: "duration", label: "Duration", icon: "hourglass-outline" },
  { key: "size", label: "Size", icon: "server-outline" },
];

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ filter?: string }>();
  const isLandscape = useIsLandscape();

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [hasMore, setHasMore] = useState(true);
  const [endCursor, setEndCursor] = useState<string | undefined>();

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeFilter, setActiveFilter] = useState(params.filter ?? "all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [multiSelect, setMultiSelect] = useState(false);

  const searchRef = useRef<TextInput>(null);

  const loadVideos = useCallback(async (cursor?: string) => {
    try {
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: "video",
        sortBy: [MediaLibrary.SortBy.creationTime],
        first: cursor ? 50 : 100,
        after: cursor,
      });
      return {
        assets: result.assets.map((a) => ({
          id: a.id,
          uri: a.uri,
          filename: a.filename,
          duration: a.duration,
          width: a.width,
          height: a.height,
          creationTime: a.creationTime,
          fileSize: a.fileSize ?? undefined,
        })),
        hasMore: result.hasNextPage,
        endCursor: result.endCursor,
      };
    } catch {
      return { assets: [], hasMore: false, endCursor: undefined };
    }
  }, []);

  useEffect(() => {
    if (!permissionResponse) return;
    if (!permissionResponse.granted) {
      requestPermission();
      return;
    }
    (async () => {
      setLoading(true);
      const result = await loadVideos();
      setVideos(result.assets);
      setHasMore(result.hasMore);
      setEndCursor(result.endCursor);
      setLoading(false);
    })();
  }, [permissionResponse, requestPermission, loadVideos]);

  useEffect(() => {
    if (params.filter && params.filter !== activeFilter) {
      setActiveFilter(params.filter);
    }
  }, [params.filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const result = await loadVideos();
    setVideos(result.assets);
    setHasMore(result.hasMore);
    setEndCursor(result.endCursor);
    setRefreshing(false);
  }, [loadVideos]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    const result = await loadVideos(endCursor);
    setVideos((prev) => [...prev, ...result.assets]);
    setHasMore(result.hasMore);
    setEndCursor(result.endCursor);
  }, [hasMore, loading, endCursor, loadVideos]);

  const filteredVideos = useMemo(() => {
    let result = [...videos];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((v) => v.filename.toLowerCase().includes(q));
    }

    switch (activeFilter) {
      case "recent":
        result = result.filter((v) => v.creationTime * 1000 > Date.now() - 7 * 86400000);
        break;
      case "long":
        result = result.filter((v) => v.duration > 600);
        break;
      case "4k":
        result = result.filter((v) => v.width >= 3840);
        break;
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortMode) {
        case "name":
          cmp = a.filename.localeCompare(b.filename);
          break;
        case "duration":
          cmp = a.duration - b.duration;
          break;
        case "size":
          cmp = (a.fileSize ?? 0) - (b.fileSize ?? 0);
          break;
        default:
          cmp = a.creationTime - b.creationTime;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [videos, searchQuery, activeFilter, sortMode, sortAsc]);

  const handlePlay = useCallback(
    (item: VideoItem) => {
      if (multiSelect) {
        toggleSelection(item.id);
        return;
      }
      router.push({
        pathname: "/player",
        params: { uri: item.uri, title: item.filename },
      });
    },
    [router, multiSelect]
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLongPress = (id: string) => {
    setMultiSelect(true);
    toggleSelection(id);
  };

  const handleDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      "Delete Videos",
      `Delete ${selectedIds.size} video${selectedIds.size > 1 ? "s" : ""}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await MediaLibrary.deleteAssetsAsync([...selectedIds]);
              setVideos((prev) => prev.filter((v) => !selectedIds.has(v.id)));
              setSelectedIds(new Set());
              setMultiSelect(false);
            } catch {}
          },
        },
      ]
    );
  }, [selectedIds]);

  const handleShare = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const items = videos.filter((v) => selectedIds.has(v.id));
    if (items.length > 0) {
      try {
        await Share.share({ url: items[0].uri, title: items[0].filename });
      } catch {}
    }
  }, [selectedIds, videos]);

  const formatDuration = (s: number) => {
    if (!s) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getResolution = (w: number) => {
    if (w >= 3840) return { label: "4K", variant: "4k" as const };
    if (w >= 1920) return { label: "HD", variant: "hd" as const };
    return null;
  };

  const renderGridItem = useCallback(
    ({ item, index }: { item: VideoItem; index: number }) => {
      const res = getResolution(item.width);
      const selected = selectedIds.has(item.id);
      return (
        <Animated.View
          entering={FadeIn.delay((index % 10) * 50).springify()}
          layout={Layout.springify()}
        >
          <Pressable
            onPress={() => handlePlay(item)}
            onLongPress={() => handleLongPress(item.id)}
            style={({ pressed }) => [
              styles.gridCard,
              pressed && { transform: [{ scale: 0.96 }] },
              selected && styles.gridCardSelected,
            ]}
          >
            <View style={styles.gridThumb}>
              <View
                style={[
                  styles.gridThumbBg,
                  {
                    backgroundColor: `hsl(${
                      (item.id.charCodeAt(0) * 50) % 360
                    }, 40%, 20%)`,
                  },
                ]}
              />
              <View style={styles.gridBadges}>
                <Badge label={formatDuration(item.duration)} size="sm" />
              </View>
              {selected && (
                <View style={styles.checkOverlay}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.accent.primary} />
                </View>
              )}
            </View>
            <View style={styles.gridBody}>
              <Text style={styles.gridTitle} numberOfLines={1}>
                {item.filename.replace(/\.[^/.]+$/, "")}
              </Text>
              <View style={styles.gridMeta}>
                {res && <Badge label={res.label} variant={res.variant} size="sm" />}
                <Text style={styles.gridMetaText}>
                  {new Date(item.creationTime * 1000).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      );
    },
    [selectedIds, handlePlay, formatDuration]
  );

  const renderListItem = useCallback(
    ({ item }: { item: VideoItem }) => {
      const res = getResolution(item.width);
      const selected = selectedIds.has(item.id);
      return (
        <Pressable
          onPress={() => handlePlay(item)}
          onLongPress={() => handleLongPress(item.id)}
          style={[styles.listItem, selected && styles.listItemSelected]}
        >
          <View
            style={[
              styles.listThumb,
              {
                backgroundColor: `hsl(${
                  (item.id.charCodeAt(0) * 50) % 360
                }, 40%, 20%)`,
              },
            ]}
          >
            {selected && (
              <View style={styles.checkOverlay}>
                <Ionicons name="checkmark-circle" size={22} color={colors.accent.primary} />
              </View>
            )}
          </View>
          <View style={styles.listBody}>
            <Text style={styles.listTitle} numberOfLines={1}>
              {item.filename.replace(/\.[^/.]+$/, "")}
            </Text>
            <View style={styles.listMeta}>
              <Text style={styles.listMetaText}>{formatDuration(item.duration)}</Text>
              <Text style={styles.listMetaDot}>{"\u00B7"}</Text>
              {res && (
                <>
                  <Badge label={res.label} variant={res.variant} size="sm" />
                  <Text style={styles.listMetaDot}>{"\u00B7"}</Text>
                </>
              )}
              {item.fileSize ? (
                <>
                  <Text style={styles.listMetaText}>{formatSize(item.fileSize)}</Text>
                  <Text style={styles.listMetaDot}>{"\u00B7"}</Text>
                </>
              ) : null}
              <Text style={styles.listMetaText}>
                {new Date(item.creationTime * 1000).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
        </Pressable>
      );
    },
    [selectedIds, handlePlay, formatDuration]
  );

  if (!permissionResponse) {
    return (
      <View style={styles.centerScreen}>
        <Text style={{ color: colors.text.tertiary }}>Loading...</Text>
      </View>
    );
  }

  if (!permissionResponse.granted) {
    return (
      <View style={styles.centerScreen}>
        <View style={styles.permissionIcon}>
          <Ionicons name="folder-open-outline" size={36} color={colors.accent.primary} />
        </View>
        <Text style={styles.permissionTitle}>Access Your Videos</Text>
        <Text style={styles.permissionDesc}>
          CineFlow needs access to your photo library.
        </Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Enable Access</Text>
        </Pressable>
      </View>
    );
  }

  const columns = isLandscape ? 4 : COLUMN_COUNT;

  return (
    <View style={styles.container}>
      {/* Multi-select bar */}
      {multiSelect && (
        <View style={[styles.multiSelectBar, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable
            onPress={() => {
              setMultiSelect(false);
              setSelectedIds(new Set());
            }}
            hitSlop={8}
          >
            <Ionicons name="close" size={22} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.multiSelectCount}>{selectedIds.size} selected</Text>
          <View style={styles.multiSelectActions}>
            <Pressable onPress={handleShare} hitSlop={8} disabled={selectedIds.size === 0}>
              <Ionicons
                name="share-outline"
                size={20}
                color={selectedIds.size > 0 ? colors.text.primary : colors.text.tertiary}
              />
            </Pressable>
            <Pressable onPress={handleDelete} hitSlop={8} disabled={selectedIds.size === 0}>
              <Ionicons
                name="trash-outline"
                size={20}
                color={selectedIds.size > 0 ? colors.status.error : colors.text.tertiary}
              />
            </Pressable>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: multiSelect ? spacing.sm : insets.top + spacing.lg }]}>
        {showSearch ? (
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={colors.text.tertiary} />
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              placeholder="Search videos..."
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <Pressable
              onPress={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color={colors.text.tertiary} />
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.headerTitle}>Library</Text>
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => {
                  setShowSearch(true);
                  setTimeout(() => searchRef.current?.focus(), 100);
                }}
                style={styles.headerBtn}
              >
                <Ionicons name="search" size={18} color={colors.text.primary} />
              </Pressable>
              <Pressable
                onPress={() => {
                  setViewMode(viewMode === "grid" ? "list" : "grid");
                }}
                style={styles.headerBtn}
              >
                <Ionicons
                  name={viewMode === "grid" ? "list-outline" : "grid-outline"}
                  size={18}
                  color={colors.text.primary}
                />
              </Pressable>
            </View>
          </>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          contentContainerStyle={styles.filtersContent}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setActiveFilter(item.key)}
              style={[
                styles.filterChip,
                activeFilter === item.key && styles.filterChipActive,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={14}
                color={activeFilter === item.key ? colors.text.inverse : colors.text.secondary}
              />
              <Text
                style={[
                  styles.filterChipLabel,
                  activeFilter === item.key && styles.filterChipLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />

        {/* Sort */}
        <Pressable
          onPress={() => {
            const idx = SORT_OPTIONS.findIndex((o) => o.key === sortMode);
            const next = SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length];
            if (next.key === sortMode) {
              setSortAsc(!sortAsc);
            } else {
              setSortMode(next.key);
              setSortAsc(false);
            }
          }}
          style={styles.sortBtn}
        >
          <Ionicons
            name={SORT_OPTIONS.find((o) => o.key === sortMode)?.icon ?? "time-outline"}
            size={14}
            color={colors.text.secondary}
          />
          <Ionicons
            name={sortAsc ? "arrow-up" : "arrow-down"}
            size={10}
            color={colors.text.tertiary}
          />
        </Pressable>
      </View>

      {/* Content */}
      {loading && videos.length === 0 ? (
        <View style={styles.loadingGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonThumb} />
              <View style={styles.skeletonLine} />
              <View style={[styles.skeletonLine, { width: "60%" }]} />
            </View>
          ))}
        </View>
      ) : filteredVideos.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="film-outline" size={32} color={colors.accent.primary} />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? "No Results" : "No Videos"}
          </Text>
          <Text style={styles.emptyDesc}>
            {searchQuery
              ? "Try a different search term."
              : "Videos on your device will appear here."}
          </Text>
        </View>
      ) : viewMode === "grid" ? (
        <FlashList
          data={filteredVideos}
          numColumns={columns}
          estimatedItemSize={CARD_HEIGHT}
          keyExtractor={(item) => item.id}
          renderItem={renderGridItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={[styles.gridContent, { paddingBottom: 120 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent.primary}
              progressBackgroundColor={colors.bg.card}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlashList
          data={filteredVideos}
          estimatedItemSize={LIST_ITEM_HEIGHT}
          keyExtractor={(item) => item.id}
          renderItem={renderListItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={[styles.listContent, { paddingBottom: 120 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent.primary}
              progressBackgroundColor={colors.bg.card}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bottom spacer for nav */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + spacing.sm }]}>
        {navItems.map((item) => (
          <Pressable
            key={item.path}
            onPress={() => router.push(item.path as any)}
            style={styles.navItem}
          >
            <Ionicons name={item.icon} size={22} color={item.active ? colors.accent.primary : colors.text.tertiary} />
            <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const navItems = [
  { label: "Home", icon: "home" as const, path: "/home" },
  { label: "Library", icon: "layers-outline" as const, path: "/library", active: true },
  { label: "Search", icon: "search" as const, path: "/search" },
  { label: "Settings", icon: "settings-outline" as const, path: "/settings" },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  centerScreen: {
    flex: 1, backgroundColor: colors.bg.primary,
    justifyContent: "center", alignItems: "center", padding: spacing["4xl"],
  },

  // Multi Select
  multiSelectBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    gap: spacing.lg,
    backgroundColor: colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg.glassBorder,
  },
  multiSelectCount: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  multiSelectActions: {
    flexDirection: "row",
    gap: spacing.xl,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.black,
    letterSpacing: -0.5,
  },
  headerActions: { flexDirection: "row", gap: spacing.sm },
  headerBtn: {
    width: 38, height: 38, borderRadius: borderRadius.lg,
    backgroundColor: colors.bg.glass, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: colors.bg.glassBorder,
  },
  searchRow: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: colors.bg.card, borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg, height: 40, gap: spacing.sm,
  },
  searchInput: { flex: 1, color: colors.text.primary, fontSize: typography.sizes.md, padding: 0 },

  // Filters
  filtersRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  filtersContent: { gap: spacing.sm },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bg.glass,
    borderWidth: 1,
    borderColor: colors.bg.glassBorder,
  },
  filterChipActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  filterChipLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  filterChipLabelActive: { color: colors.text.inverse },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bg.glass,
    borderWidth: 1,
    borderColor: colors.bg.glassBorder,
  },

  // Grid
  gridContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  gridCard: {
    flex: 1,
    margin: spacing.xs,
    maxWidth: CARD_WIDTH,
  },
  gridCardSelected: {
    opacity: 0.8,
  },
  gridThumb: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    position: "relative",
  },
  gridThumbBg: { ...StyleSheet.absoluteFillObject },
  gridBadges: {
    position: "absolute",
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    gap: spacing.xs,
  },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  gridBody: { marginTop: spacing.sm, gap: spacing.xxs },
  gridTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  gridMeta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  gridMetaText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },

  // List
  listContent: { paddingHorizontal: spacing.xl },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.bg.glassBorder,
    gap: spacing.lg,
  },
  listItemSelected: {
    backgroundColor: colors.bg.glass,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
  },
  listThumb: {
    width: 56,
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  listBody: { flex: 1, gap: spacing.xxs },
  listTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  listMeta: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexWrap: "wrap" },
  listMetaText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  listMetaDot: { color: colors.text.tertiary, fontSize: typography.sizes.xs },

  // Permission
  permissionIcon: {
    width: 80, height: 80, borderRadius: borderRadius["2xl"],
    backgroundColor: colors.bg.glass, justifyContent: "center", alignItems: "center",
    marginBottom: spacing["2xl"], borderWidth: 1, borderColor: colors.bg.glassBorder,
  },
  permissionTitle: {
    color: colors.text.primary, fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold, marginBottom: spacing.sm,
  },
  permissionDesc: {
    color: colors.text.tertiary, fontSize: typography.sizes.md,
    textAlign: "center", lineHeight: 22, maxWidth: 300,
  },
  permissionBtn: {
    marginTop: spacing["3xl"], backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing["4xl"], paddingVertical: spacing.xl, borderRadius: borderRadius.full,
  },
  permissionBtnText: { color: colors.text.inverse, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },

  // Empty / Loading
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: borderRadius["2xl"],
    backgroundColor: colors.bg.glass, justifyContent: "center", alignItems: "center",
    marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.bg.glassBorder,
  },
  emptyTitle: { color: colors.text.primary, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, marginBottom: spacing.xs },
  emptyDesc: { color: colors.text.tertiary, fontSize: typography.sizes.sm, textAlign: "center" },
  loadingGrid: {
    flexDirection: "row", flexWrap: "wrap", padding: spacing.xl, gap: spacing.lg,
  },
  skeletonCard: { width: CARD_WIDTH, gap: spacing.sm },
  skeletonThumb: {
    width: "100%", aspectRatio: 16 / 9, borderRadius: borderRadius.lg,
    backgroundColor: colors.bg.elevated,
  },
  skeletonLine: {
    height: 12, borderRadius: borderRadius.xs, backgroundColor: colors.bg.elevated, width: "80%",
  },

  // Bottom Nav
  bottomNav: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: spacing.sm,
    backgroundColor: "rgba(10,10,15,0.95)",
    borderTopWidth: 1,
    borderTopColor: colors.bg.glassBorder,
  },
  navItem: { alignItems: "center", gap: spacing.xxs, paddingVertical: spacing.xs, paddingHorizontal: spacing.lg },
  navLabel: { color: colors.text.tertiary, fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  navLabelActive: { color: colors.accent.primary },
});
