import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Paths, File } from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import { colors, typography, spacing, borderRadius } from "../theme";
import { Badge } from "../components/ui/Badge";
import { ThumbnailImage } from "../hooks/useThumbnail";

const RECENT_FILE = new File(Paths.document, "recent_searches.json");
const MAX_RECENT = 10;

const TRENDING_KEYWORDS = [
  "4K", "HDR", "Dolby", "Movie", "Concert", "Travel", "Vlog",
  "Tutorial", "Review", "Short", "Documentary",
];

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  const persistRecent = useCallback(async (searches: string[]) => {
    try {
      RECENT_FILE.write(JSON.stringify(searches));
    } catch {}
  }, []);

  const loadRecent = useCallback(async () => {
    try {
      if (RECENT_FILE.exists) {
        const data = await RECENT_FILE.text();
        setRecentSearches(JSON.parse(data));
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadRecent();
    MediaLibrary.requestPermissionsAsync().then((res) => {
      if (res.granted) {
        MediaLibrary.getAssetsAsync({ mediaType: "video", first: 200 }).then((r) =>
          setVideos(
            r.assets.map((a) => ({
              id: a.id,
              uri: a.uri,
              filename: a.filename,
              duration: a.duration,
              width: a.width,
              height: a.height,
              creationTime: a.creationTime,
            }))
          )
        );
      }
    });
  }, [loadRecent]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return videos
      .filter((v) => v.filename.toLowerCase().includes(q))
      .sort((a: any, b: any) => b.creationTime - a.creationTime)
      .slice(0, 50);
  }, [query, videos]);

  const handleSearch = useCallback(
    (q: string) => {
      setQuery(q);
      if (q.trim()) {
        setRecentSearches((prev) => {
          const next = [q, ...prev.filter((s) => s !== q)].slice(0, MAX_RECENT);
          persistRecent(next);
          return next;
        });
      }
    },
    [persistRecent]
  );

  const clearRecent = useCallback(async () => {
    setRecentSearches([]);
    try {
      if (RECENT_FILE.exists) RECENT_FILE.delete();
    } catch {}
  }, []);

  const removeRecent = useCallback(
    (term: string) => {
      setRecentSearches((prev) => {
        const next = prev.filter((s) => s !== term);
        persistRecent(next);
        return next;
      });
    },
    [persistRecent]
  );

  const formatDuration = (s: number) => {
    if (!s) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const renderResult = useCallback(
    ({ item }: { item: any }) => (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/player",
            params: { uri: item.uri, title: item.filename },
          })
        }
        style={styles.resultItem}
      >
        <View style={styles.resultThumb}>
          <ThumbnailImage uri={item.uri} style={StyleSheet.absoluteFill} />
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Ionicons name="play" size={16} color={colors.text.primary} style={styles.playIcon} />
          </View>
        </View>
        <View style={styles.resultBody}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.filename.replace(/\.[^/.]+$/, "")}
          </Text>
          <View style={styles.resultMeta}>
            <Text style={styles.resultMetaText}>{formatDuration(item.duration)}</Text>
            <Text style={styles.resultMetaDot}>{"\u00B7"}</Text>
            {item.width >= 1920 && (
              <Badge label={item.width >= 3840 ? "4K" : "HD"} variant={item.width >= 3840 ? "4k" : "hd"} size="sm" />
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
      </Pressable>
    ),
    [router, formatDuration]
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.text.tertiary} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search videos..."
            placeholderTextColor={colors.text.tertiary}
            value={query}
            onChangeText={handleSearch}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => router.push("/home")} hitSlop={8}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      {query.trim().length > 0 ? (
        searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderResult}
            contentContainerStyle={[styles.resultsList, { paddingBottom: 120 }]}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No Results</Text>
            <Text style={styles.emptyDesc}>
              No videos match "{query}". Try a different term.
            </Text>
          </View>
        )
      ) : (
        <FlatList
          data={[1]}
          keyExtractor={() => "content"}
          renderItem={() => null}
          ListHeaderComponent={
            <View style={styles.suggestionsContainer}>
              <Text style={styles.sectionLabel}>Trending</Text>
              <View style={styles.chipsRow}>
                {TRENDING_KEYWORDS.map((kw) => (
                  <Pressable
                    key={kw}
                    onPress={() => handleSearch(kw)}
                    style={styles.chip}
                  >
                    <Ionicons name="trending-up" size={12} color={colors.text.secondary} />
                    <Text style={styles.chipLabel}>{kw}</Text>
                  </Pressable>
                ))}
              </View>

              {recentSearches.length > 0 && (
                <>
                  <View style={styles.recentHeader}>
                    <Text style={styles.sectionLabel}>Recent Searches</Text>
                    <Pressable onPress={clearRecent} hitSlop={8}>
                      <Text style={styles.clearText}>Clear</Text>
                    </Pressable>
                  </View>
                  {recentSearches.map((term) => (
                    <Pressable
                      key={term}
                      onPress={() => handleSearch(term)}
                      style={styles.recentItem}
                    >
                      <Ionicons name="time-outline" size={16} color={colors.text.tertiary} />
                      <Text style={styles.recentText} numberOfLines={1}>
                        {term}
                      </Text>
                      <Pressable
                        onPress={() => removeRecent(term)}
                        hitSlop={8}
                        style={styles.recentRemove}
                      >
                        <Ionicons name="close" size={14} color={colors.text.tertiary} />
                      </Pressable>
                    </Pressable>
                  ))}
                </>
              )}
            </View>
          }
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    height: 42,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    padding: 0,
  },
  cancelText: {
    color: colors.accent.secondary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  resultsList: { paddingHorizontal: spacing.xl },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.bg.glassBorder,
  },
  resultThumb: {
    width: 56,
    height: 40,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  playIcon: {
    position: "absolute",
    alignSelf: "center",
    top: 12,
  },
  resultBody: { flex: 1, gap: spacing.xxs },
  resultTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  resultMeta: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  resultMetaText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  resultMetaDot: { color: colors.text.tertiary, fontSize: typography.sizes.xs },
  suggestionsContainer: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  sectionLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing["3xl"],
  },
  chip: {
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
  chipLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  clearText: {
    color: colors.accent.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  recentText: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
  },
  recentRemove: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing["4xl"],
    gap: spacing.md,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  emptyDesc: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    textAlign: "center",
    lineHeight: 20,
  },
});
