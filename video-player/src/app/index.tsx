import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import VideoListItem from "@/src/components/VideoListItem";
import type { VideoAsset } from "@/src/types";

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
        <Ionicons name="lock-closed" size={48} color="#888" />
        <Text style={styles.permissionText}>
          Video access is required to play local videos.
        </Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Access</Text>
        </Pressable>
      </View>
    );
  }

  if (loading && assets.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Scanning videos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Videos</Text>
        <Text style={styles.headerCount}>{assets.length} files</Text>
      </View>
      <FlatList
        data={assets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VideoListItem asset={item} onPress={handlePress} />
        )}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={loadMore}
        onEndReachedThreshold={2}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="videocam-off-outline" size={48} color="#555" />
            <Text style={styles.emptyText}>No videos found</Text>
            <Text style={styles.emptySubtext}>
              Add videos to your device to see them here.
            </Text>
          </View>
        }
        contentContainerStyle={assets.length === 0 ? { flex: 1 } : undefined}
      />
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  headerCount: {
    color: "#888",
    fontSize: 14,
  },
  loadingText: {
    color: "#888",
    marginTop: 12,
    fontSize: 15,
  },
  permissionText: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 22,
  },
  permissionBtn: {
    marginTop: 24,
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
    padding: 32,
  },
  emptyText: {
    color: "#888",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    color: "#555",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});
