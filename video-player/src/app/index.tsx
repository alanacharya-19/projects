import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import VideoListItem from "@/src/components/VideoListItem";
import type { VideoAsset } from "@/src/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_GAP = 12;
const HORIZONTAL_PADDING = 16;
const COLUMN_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / 2;

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <View style={{ width: COLUMN_WIDTH, marginBottom: 16 }}>
      <Animated.View
        style={[
          {
            width: "100%",
            aspectRatio: 16 / 9,
            borderRadius: 12,
            backgroundColor: "#1c1c1e",
            opacity,
          },
        ]}
      />
      <View style={{ paddingTop: 8, gap: 6, paddingHorizontal: 2 }}>
        <Animated.View
          style={{
            height: 12,
            borderRadius: 4,
            backgroundColor: "#1c1c1e",
            opacity,
            width: "90%",
          }}
        />
        <Animated.View
          style={{
            height: 10,
            borderRadius: 4,
            backgroundColor: "#1c1c1e",
            opacity,
            width: "50%",
          }}
        />
      </View>
    </View>
  );
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export default function LibraryScreen() {
  const router = useRouter();
  const [assets, setAssets] = useState<VideoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [hasMore, setHasMore] = useState(true);
  const [endCursor, setEndCursor] = useState<string | undefined>();

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
      return {
        assets: mapped,
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

  if (!permissionResponse) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!permissionResponse.granted) {
    return (
      <View style={styles.center}>
        <View style={styles.lockIconWrap}>
          <Ionicons name="videocam-outline" size={32} color="#fff" />
        </View>
        <Text style={styles.permissionTitle}>Video Access</Text>
        <Text style={styles.permissionText}>
          Allow access to your photo library to browse and play videos.
        </Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Access</Text>
        </Pressable>
      </View>
    );
  }

  const rows = chunkArray(assets, 2);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Library</Text>
          <Text style={styles.headerSubtitle}>
            {assets.length} video{assets.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <Pressable style={styles.searchBtn}>
          <Ionicons name="search" size={22} color="#fff" />
        </Pressable>
      </View>

      {loading && assets.length === 0 ? (
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item: row }) => (
            <View style={styles.row}>
              {row.map((asset) => (
                <View key={asset.id} style={{ width: COLUMN_WIDTH }}>
                  <VideoListItem asset={asset} onPress={handlePress} />
                </View>
              ))}
              {row.length === 1 && <View style={{ width: COLUMN_WIDTH }} />}
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
              progressBackgroundColor="#1c1c1e"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={3}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="film-outline" size={40} color="#fff" />
              </View>
              <Text style={styles.emptyTitle}>No videos yet</Text>
              <Text style={styles.emptySubtext}>
                Videos from your library will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: Platform.OS === "ios" ? 60 : 48,
    paddingBottom: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: "#666",
    fontSize: 14,
    marginTop: 2,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1c1c1e",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: COLUMN_GAP,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 24,
  },
  row: {
    flexDirection: "row",
    gap: COLUMN_GAP,
    marginBottom: 0,
  },
  lockIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1c1c1e",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  permissionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  permissionText: {
    color: "#888",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  permissionBtn: {
    marginTop: 28,
    backgroundColor: "#fff",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1c1c1e",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptySubtext: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
