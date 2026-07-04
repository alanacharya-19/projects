import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import VideoListItem from "@/src/components/VideoListItem";
import type { VideoAsset } from "@/src/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GAP = 10;
const PAD = 16;
const CARD_W = (SCREEN_WIDTH - PAD * 2 - GAP) / 2;

type SortMode = "date" | "name" | "duration";

function Skeleton() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const Card = () => (
    <View style={{ width: CARD_W, borderRadius: 14, overflow: "hidden" }}>
      <Animated.View
        style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#1c1c1e", opacity }}
      />
      <View style={{ padding: 10, gap: 6 }}>
        <Animated.View
          style={{ height: 11, borderRadius: 3, backgroundColor: "#1c1c1e", opacity, width: "85%" }}
        />
        <Animated.View
          style={{ height: 9, borderRadius: 3, backgroundColor: "#1c1c1e", opacity, width: "45%" }}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.grid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} />
      ))}
    </View>
  );
}

const SORT_LABELS: Record<SortMode, string> = {
  date: "Date",
  name: "Name",
  duration: "Duration",
};

const SORT_ICONS: Record<SortMode, keyof typeof Ionicons.glyphMap> = {
  date: "time-outline",
  name: "text-outline",
  duration: "hourglass-outline",
};

export default function LibraryScreen() {
  const router = useRouter();
  const [assets, setAssets] = useState<VideoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [hasMore, setHasMore] = useState(true);
  const [endCursor, setEndCursor] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState<SortMode>("date");
  const searchRef = useRef<TextInput>(null);

  const loadVideos = useCallback(async (cursor?: string) => {
    try {
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: "video",
        sortBy: [MediaLibrary.SortBy.creationTime],
        first: 50,
        after: cursor,
      });
      const mapped = result.assets.map((a) => ({
        id: a.id,
        uri: a.uri,
        filename: a.filename,
        duration: a.duration,
        width: a.width,
        height: a.height,
        creationTime: a.creationTime,
      }));
      return { assets: mapped, hasMore: result.hasNextPage, endCursor: result.endCursor };
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
      setAssets(result.assets);
      setHasMore(result.hasMore);
      setEndCursor(result.endCursor);
      setLoading(false);
    })();
  }, [permissionResponse, loadVideos, requestPermission]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const result = await loadVideos();
    setAssets(result.assets);
    setHasMore(result.hasMore);
    setEndCursor(result.endCursor);
    setRefreshing(false);
  }, [loadVideos]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    const result = await loadVideos(endCursor);
    setAssets((prev) => [...prev, ...result.assets]);
    setHasMore(result.hasMore);
    setEndCursor(result.endCursor);
  }, [hasMore, loading, endCursor, loadVideos]);

  const handlePress = useCallback(
    (asset: VideoAsset) => {
      router.push({
        pathname: "/player",
        params: { uri: asset.uri, title: asset.filename },
      });
    },
    [router]
  );

  const handleDelete = useCallback(async (asset: VideoAsset) => {
    try {
      await MediaLibrary.deleteAssetsAsync([asset.id]);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    } catch {}
  }, []);

  const toggleSearch = useCallback(() => {
    setShowSearch((s) => {
      if (!s) {
        setTimeout(() => searchRef.current?.focus(), 100);
      } else {
        setSearchQuery("");
      }
      return !s;
    });
  }, []);

  const cycleSort = useCallback(() => {
    setSortBy((prev) => {
      const order: SortMode[] = ["date", "name", "duration"];
      return order[(order.indexOf(prev) + 1) % order.length];
    });
  }, []);

  const processedAssets = useMemo(() => {
    let list = [...assets];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) => a.filename.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.filename.localeCompare(b.filename);
        case "duration":
          return b.duration - a.duration;
        default:
          return b.creationTime - a.creationTime;
      }
    });
    return list;
  }, [assets, searchQuery, sortBy]);

  const sections = useMemo(() => {
    if (sortBy !== "date") {
      return [{ title: `${SORT_LABELS[sortBy]} (${processedAssets.length})`, data: processedAssets }];
    }
    const groups: Record<string, VideoAsset[]> = {};
    const now = Date.now();
    const today = new Date(now).setHours(0, 0, 0, 0);
    const yesterday = today - 86400000;

    for (const a of processedAssets) {
      const ts = a.creationTime * 1000;
      let key: string;
      if (ts >= today) key = "Today";
      else if (ts >= yesterday) key = "Yesterday";
      else if (ts >= today - 6 * 86400000) key = "This Week";
      else key = "Older";
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    }

    const order = ["Today", "Yesterday", "This Week", "Older"];
    return order.filter((k) => groups[k]).map((k) => ({ title: k, data: groups[k] }));
  }, [processedAssets, sortBy]);

  if (!permissionResponse) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!permissionResponse.granted) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.permissionIcon}>
          <Ionicons name="folder-open-outline" size={28} color="#fff" />
        </View>
        <Text style={styles.permissionTitle}>Access Your Videos</Text>
        <Text style={styles.permissionDesc}>
          We need access to your photo library to browse and play your videos.
        </Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Enable Access</Text>
        </Pressable>
      </View>
    );
  }

  if (loading && assets.length === 0) return <Skeleton />;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {showSearch ? (
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color="#555" />
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              placeholder="Search videos..."
              placeholderTextColor="#555"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            <Pressable onPress={toggleSearch} hitSlop={8}>
              <Ionicons name="close" size={18} color="#888" />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Videos</Text>
              <Text style={styles.headerCount}>
                {processedAssets.length}/{assets.length} file{assets.length !== 1 ? "s" : ""}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Pressable onPress={cycleSort} style={styles.sortBtn}>
                <Ionicons name={SORT_ICONS[sortBy]} size={18} color="#fff" />
                <Text style={styles.sortLabel}>{SORT_LABELS[sortBy]}</Text>
              </Pressable>
              <Pressable onPress={toggleSearch} style={styles.searchBtn}>
                <Ionicons name="search" size={20} color="#fff" />
              </Pressable>
            </View>
          </>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            progressBackgroundColor="#1c1c1e"
          />
        }
        onScroll={useCallback(
          ({ nativeEvent }: any) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 300) {
              loadMore();
            }
          },
          [loadMore]
        )}
        scrollEventThrottle={16}
      >
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
            <View style={styles.grid}>
              {section.data.map((asset) => (
                <VideoListItem
                  key={asset.id}
                  asset={asset}
                  onPress={handlePress}
                  onDelete={handleDelete}
                />
              ))}
            </View>
          </View>
        ))}

        {hasMore && processedAssets.length > 0 && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color="#555" />
          </View>
        )}

        {processedAssets.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="film-outline" size={28} color="#fff" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? "No matching videos" : "No videos found"}
            </Text>
            <Text style={styles.emptyDesc}>
              {searchQuery
                ? "Try a different search term."
                : "Videos saved to your device will appear here."}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  loadingScreen: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", padding: 32 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: PAD,
    paddingTop: Platform.OS === "ios" ? 60 : 48,
    paddingBottom: 14,
  },
  headerLeft: {},
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { color: "#fff", fontSize: 32, fontWeight: "700", letterSpacing: 0.5 },
  headerCount: { color: "#555", fontSize: 13, fontWeight: "500", marginTop: 1 },
  searchRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121212",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 8,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 15, padding: 0 },
  searchBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121212",
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 10,
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sortLabel: { color: "#fff", fontSize: 13, fontWeight: "500" },
  scroll: { paddingHorizontal: PAD, paddingBottom: 40, flexGrow: 1 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, paddingHorizontal: 2 },
  sectionDot: { width: 4, height: 16, borderRadius: 2, backgroundColor: "#fff", marginRight: 8 },
  sectionTitle: { color: "#fff", fontSize: 17, fontWeight: "600", letterSpacing: 0.2 },
  sectionCount: { color: "#555", fontSize: 13, fontWeight: "500", marginLeft: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  permissionIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: "#121212",
    justifyContent: "center", alignItems: "center", marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.08)",
  },
  permissionTitle: { color: "#fff", fontSize: 20, fontWeight: "600", marginBottom: 8 },
  permissionDesc: { color: "#666", fontSize: 14, textAlign: "center", lineHeight: 20, maxWidth: 280 },
  permissionBtn: { marginTop: 28, backgroundColor: "#fff", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10 },
  permissionBtnText: { color: "#000", fontSize: 15, fontWeight: "600" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: "#121212",
    justifyContent: "center", alignItems: "center", marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.08)",
  },
  emptyTitle: { color: "#fff", fontSize: 17, fontWeight: "600", marginBottom: 4 },
  emptyDesc: { color: "#555", fontSize: 13, textAlign: "center" },
  loadingMore: { paddingVertical: 20, alignItems: "center" },
});
