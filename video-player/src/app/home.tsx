import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { colors, typography, spacing, borderRadius, shadows } from "../theme";
import { SectionHeader } from "../components/ui/SectionHeader";
import { Badge } from "../components/ui/Badge";
import { HeroSkeleton, SectionSkeleton } from "../components/ui/Skeleton";
import { useIsLandscape } from "../hooks/useOrientation";
import { SCREEN_WIDTH, CARD_WIDTH, HERO_HEIGHT, IS_TABLET } from "../constants/layout";

const { width } = Dimensions.get("window");

interface HomeVideo {
  id: string;
  uri: string;
  filename: string;
  duration: number;
  width: number;
  height: number;
  creationTime: number;
  album?: string;
}

type SectionType = {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  data: HomeVideo[];
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isLandscape = useIsLandscape();
  const [videos, setVideos] = useState<HomeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  const loadVideos = useCallback(async () => {
    try {
      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: "video",
        first: 100,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });
      return assets.map((a) => ({
        id: a.id,
        uri: a.uri,
        filename: a.filename,
        duration: a.duration,
        width: a.width,
        height: a.height,
        creationTime: a.creationTime,
      }));
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    if (!permissionResponse) return;
    if (!permissionResponse.granted) {
      requestPermission();
      return;
    }
    loadVideos().then((v) => {
      setVideos(v);
      setLoading(false);
    });
  }, [permissionResponse, requestPermission, loadVideos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const v = await loadVideos();
    setVideos(v);
    setRefreshing(false);
  }, [loadVideos]);

  const heroVideo = useMemo(() => {
    if (videos.length === 0) return null;
    return videos.reduce((best, v) => (v.duration > best.duration ? v : best), videos[0]);
  }, [videos]);

  const sections = useMemo<SectionType[]>(() => {
    if (videos.length === 0) return [];
    const sorted = [...videos].sort((a, b) => b.creationTime - a.creationTime);
    const byDuration = [...videos].sort((a, b) => b.duration - a.duration);
    const now = Date.now();
    const weekAgo = now - 7 * 86400000;
    const recent = sorted.filter((v) => v.creationTime * 1000 > weekAgo);

    const sectionsArr: SectionType[] = [];

    if (recent.length > 0) {
      sectionsArr.push({
        id: "continue",
        title: "Continue Watching",
        subtitle: "Pick up where you left off",
        icon: "time-outline",
        data: recent.slice(0, 10),
      });
    }

    sectionsArr.push({
      id: "trending",
      title: "Trending",
      subtitle: "Most watched this week",
      icon: "flame-outline",
      data: byDuration.slice(0, 10),
    });

    sectionsArr.push({
      id: "all",
      title: "All Videos",
      subtitle: `${videos.length} videos`,
      icon: "videocam-outline",
      data: sorted.slice(0, 20),
    });

    if (byDuration.length > 4) {
      sectionsArr.push({
        id: "longest",
        title: "Movies",
        subtitle: "Longer form content",
        icon: "film-outline",
        data: byDuration.filter((v) => v.duration > 600).slice(0, 10),
      });
    }

    return sectionsArr;
  }, [videos]);

  const handlePlay = useCallback(
    (video: HomeVideo) => {
      router.push({
        pathname: "/player",
        params: { uri: video.uri, title: video.filename },
      });
    },
    [router]
  );

  const formatDuration = (s: number) => {
    if (!s) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const getResolution = (w: number, h: number) => {
    if (w >= 3840) return { label: "4K", variant: "4k" as const };
    if (w >= 1920) return { label: "HD", variant: "hd" as const };
    if (w >= 1280) return { label: "720p", variant: "hd" as const };
    return null;
  };

  const renderCard = useCallback(
    (item: HomeVideo, index: number) => {
      const res = getResolution(item.width, item.height);
      return (
        <Animated.View
          entering={FadeInUp.delay(100 * (index % 10)).springify()}
        >
          <Pressable
            onPress={() => handlePlay(item)}
            style={({ pressed }) => [
              styles.card,
              pressed && { transform: [{ scale: 0.96 }] },
            ]}
          >
            <View style={styles.cardThumb}>
              <View
                style={[
                  styles.cardThumbBg,
                  {
                    backgroundColor: `hsl(${
                      (item.id.charCodeAt(0) * 50 + item.id.length * 30) % 360
                    }, 40%, 20%)`,
                  },
                ]}
              />
              <View style={styles.cardBadges}>
                <Badge label={formatDuration(item.duration)} size="sm" />
                {res && <Badge label={res.label} variant={res.variant} size="sm" />}
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.filename.replace(/\.[^/.]+$/, "")}
              </Text>
              <Text style={styles.cardMeta}>
                {new Date(item.creationTime * 1000).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      );
    },
    [handlePlay, formatDuration, getResolution]
  );

  const renderSection = useCallback(
    ({ item: section }: { item: SectionType }) => (
      <View style={styles.section}>
        <SectionHeader
          title={section.title}
          subtitle={section.subtitle}
          onSeeAll={() =>
            router.push({
              pathname: "/library",
              params: { filter: section.id },
            })
          }
        />
        <FlatList
          data={section.data}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectionContent}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => renderCard(item, index)}
          snapToInterval={CARD_WIDTH + 12}
          decelerationRate="fast"
        />
      </View>
    ),
    [renderCard, router]
  );

  if (!permissionResponse) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.skeletonContainer}>
          <HeroSkeleton />
          {[1, 2, 3, 4].map((i) => (
            <SectionSkeleton key={i} />
          ))}
        </View>
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
          CineFlow needs access to your photo library to browse and play your videos.
        </Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Enable Access</Text>
        </Pressable>
      </View>
    );
  }

  const sectionsList = useMemo(() => sections, [sections]);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.lg },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.primary}
            progressBackgroundColor={colors.bg.card}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>CineFlow</Text>
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push("/search")}
              style={styles.headerBtn}
              hitSlop={8}
            >
              <Ionicons name="search" size={20} color={colors.text.primary} />
            </Pressable>
            <Pressable
              onPress={() => router.push("/settings")}
              style={styles.headerBtn}
              hitSlop={8}
            >
              <Ionicons name="settings-outline" size={20} color={colors.text.primary} />
            </Pressable>
          </View>
        </View>

        {/* Hero Banner */}
        {heroVideo && !loading && (
          <Animated.View
            entering={FadeInDown.springify()}
            style={styles.heroContainer}
          >
            <Pressable
              onPress={() => handlePlay(heroVideo)}
              style={({ pressed }) => [
                styles.hero,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <View
                style={[
                  styles.heroBg,
                  {
                    backgroundColor: `hsl(${
                      (heroVideo.id.charCodeAt(0) * 50) % 360
                    }, 40%, 15%)`,
                  },
                ]}
              >
                <View style={styles.heroOverlay} />
                <View style={styles.heroGradient} />
              </View>
              <View style={styles.heroContent}>
                <View style={styles.heroBadges}>
                  <Badge
                    label={formatDuration(heroVideo.duration)}
                    size="md"
                    icon={
                      <Ionicons
                        name="play"
                        size={10}
                        color={colors.text.primary}
                        style={{ marginRight: 4 }}
                      />
                    }
                  />
                  {getResolution(heroVideo.width, heroVideo.height) && (
                    <Badge
                      label={
                        getResolution(heroVideo.width, heroVideo.height)!.label
                      }
                      variant={
                        getResolution(heroVideo.width, heroVideo.height)!.variant
                      }
                      size="md"
                    />
                  )}
                  <Badge label="Featured" variant="hdr" size="md" />
                </View>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {heroVideo.filename.replace(/\.[^/.]+$/, "")}
                </Text>
                <View style={styles.heroMeta}>
                  <Text style={styles.heroMetaText}>
                    {new Date(heroVideo.creationTime * 1000).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "short", day: "numeric" }
                    )}
                  </Text>
                  <Text style={styles.heroMetaDot}>{"\u00B7"}</Text>
                  <Text style={styles.heroMetaText}>
                    {heroVideo.width}x{heroVideo.height}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handlePlay(heroVideo)}
                  style={styles.heroPlayBtn}
                >
                  <View style={styles.heroPlayIcon}>
                    <Ionicons name="play" size={16} color={colors.text.inverse} />
                  </View>
                  <Text style={styles.heroPlayText}>Play</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.skeletonContainer}>
            <HeroSkeleton />
            {[1, 2, 3, 4].map((i) => (
              <SectionSkeleton key={i} />
            ))}
          </View>
        )}

        {/* Sections */}
        {!loading && (
          <FlatList
            data={sectionsList}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            renderItem={renderSection}
            contentContainerStyle={styles.sectionsList}
          />
        )}

        {/* Bottom nav spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + spacing.sm }]}>
        {navItems.map((item) => (
          <Pressable
            key={item.path}
            onPress={() => router.push(item.path as any)}
            style={styles.navItem}
          >
            <Ionicons name={item.icon} size={22} color={colors.text.tertiary} />
            <Text style={styles.navLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const navItems = [
  { label: "Home", icon: "home" as const, path: "/home" },
  { label: "Library", icon: "layers-outline" as const, path: "/library" },
  { label: "Search", icon: "search" as const, path: "/search" },
  { label: "Settings", icon: "settings-outline" as const, path: "/settings" },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  centerScreen: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing["4xl"],
  },
  loadingScreen: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { paddingBottom: spacing["4xl"] },
  skeletonContainer: { padding: spacing.xl },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["2xl"],
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.black,
    letterSpacing: -0.5,
  },
  headerDate: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginTop: spacing.xxs,
  },
  headerActions: { flexDirection: "row", gap: spacing.md },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bg.glass,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.bg.glassBorder,
  },

  // Hero
  heroContainer: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing["3xl"],
  },
  hero: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  heroBg: {
    width: "100%",
    height: SCREEN_WIDTH * 0.5,
    maxHeight: 280,
    justifyContent: "flex-end",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  heroContent: {
    padding: spacing["2xl"],
    gap: spacing.sm,
  },
  heroBadges: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
    letterSpacing: -0.5,
    maxWidth: "85%",
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  heroMetaText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  heroMetaDot: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
  },
  heroPlayBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  heroPlayIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text.inverse,
    justifyContent: "center",
    alignItems: "center",
  },
  heroPlayText: {
    color: colors.text.inverse,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },

  // Sections
  sectionsList: {},
  section: {
    marginBottom: spacing["3xl"],
  },
  sectionContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },

  // Card
  card: {
    width: CARD_WIDTH,
  },
  cardThumb: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.625,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    position: "relative",
  },
  cardThumbBg: {
    ...StyleSheet.absoluteFillObject,
  },
  cardBadges: {
    position: "absolute",
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    gap: spacing.xs,
  },
  cardBody: {
    marginTop: spacing.sm,
    gap: spacing.xxs,
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  cardMeta: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },

  // Permission
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius["2xl"],
    backgroundColor: colors.bg.glass,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing["2xl"],
    borderWidth: 1,
    borderColor: colors.bg.glassBorder,
  },
  permissionTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  permissionDesc: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.md,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  permissionBtn: {
    marginTop: spacing["3xl"],
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing["4xl"],
    paddingVertical: spacing.xl,
    borderRadius: borderRadius.full,
  },
  permissionBtnText: {
    color: colors.text.inverse,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },

  // Bottom Nav
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: spacing.sm,
    backgroundColor: "rgba(10,10,15,0.95)",
    borderTopWidth: 1,
    borderTopColor: colors.bg.glassBorder,
  },
  navItem: {
    alignItems: "center",
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  navLabel: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
});
