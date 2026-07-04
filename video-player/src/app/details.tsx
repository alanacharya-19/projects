import { useCallback, useMemo } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius } from "../theme";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { SCREEN_WIDTH } from "../constants/layout";

const { width } = Dimensions.get("window");

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function DetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { uri, title, id, duration, width: vw, height: vh } =
    useLocalSearchParams<{
      uri: string;
      title: string;
      id?: string;
      duration?: string;
      width?: string;
      height?: string;
    }>();

  const videoTitle = title ?? "Untitled Video";
  const videoDuration = duration ? parseInt(duration) : 0;
  const videoWidth = vw ? parseInt(vw) : 0;
  const videoHeight = vh ? parseInt(vh) : 0;

  const formatDuration = (s: number) => {
    if (!s) return "0:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${sec}s`;
  };

  const resolution = useMemo(() => {
    if (videoWidth >= 3840) return { label: "4K", variant: "4k" as const };
    if (videoWidth >= 1920) return { label: "HD", variant: "hd" as const };
    if (videoWidth >= 1280) return { label: "720p", variant: "hd" as const };
    return null;
  }, [videoWidth]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({ url: uri ?? "", title: videoTitle });
    } catch {}
  }, [uri, videoTitle]);

  const handlePlay = useCallback(() => {
    router.push({
      pathname: "/player",
      params: { uri, title: videoTitle },
    });
  }, [router, uri, videoTitle]);

  return (
    <View style={styles.container}>
      {/* Poster */}
      <View style={[styles.posterContainer, { paddingTop: insets.top }]}>
        <View
          style={[
            styles.poster,
            {
              backgroundColor: `hsl(${
                (id ? id.charCodeAt(0) * 50 : 0) % 360
              }, 40%, 20%)`,
            },
          ]}
        >
          <View style={styles.posterOverlay} />
          <View style={styles.posterActions}>
            <Pressable onPress={() => router.back()} style={styles.posterBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color={colors.text.primary} />
            </Pressable>
            <Pressable onPress={handleShare} style={styles.posterBtn} hitSlop={8}>
              <Ionicons name="share-outline" size={20} color={colors.text.primary} />
            </Pressable>
          </View>
          <View style={styles.posterInfo}>
            <Badge
              label={formatDuration(videoDuration)}
              size="md"
              icon={<Ionicons name="play" size={10} color={colors.text.primary} style={{ marginRight: 4 }} />}
            />
            {resolution && (
              <Badge label={resolution.label} variant={resolution.variant} size="md" />
            )}
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
      >
        <Text style={styles.title}>{videoTitle.replace(/\.[^/.]+$/, "")}</Text>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button title="Play" onPress={handlePlay} size="lg" style={styles.playBtn} />
          <Pressable style={styles.actionBtn}>
            <Ionicons name="heart-outline" size={22} color={colors.text.primary} />
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <Ionicons name="download-outline" size={22} color={colors.text.primary} />
          </Pressable>
          <Pressable onPress={handleShare} style={styles.actionBtn}>
            <Ionicons name="share-outline" size={22} color={colors.text.primary} />
          </Pressable>
        </View>

        {/* Details */}
        <View style={styles.details}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsBody}>
            <DetailRow label="Duration" value={formatDuration(videoDuration)} />
            <DetailRow
              label="Resolution"
              value={
                videoWidth && videoHeight
                  ? `${videoWidth} × ${videoHeight}`
                  : "Unknown"
              }
            />
            <DetailRow label="File Name" value={title ?? "Unknown"} />
            <DetailRow
              label="Date Added"
              value={
                id
                  ? new Date(parseInt(id) * 1000 || Date.now()).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "long", day: "numeric" }
                    )
                  : "Unknown"
              }
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  posterContainer: {
    position: "relative",
  },
  poster: {
    width: width,
    height: width * 0.6,
    maxHeight: 300,
    justifyContent: "space-between",
  },
  posterOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  posterActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  posterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  posterInfo: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.xl,
    paddingBottom: spacing["2xl"],
  },
  scroll: {
    paddingHorizontal: spacing.xl,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    marginTop: spacing["2xl"],
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing["2xl"],
    marginBottom: spacing["3xl"],
  },
  playBtn: {
    flex: 1,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bg.glass,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.bg.glassBorder,
  },
  details: {},
  sectionTitle: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  detailsBody: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.bg.glassBorder,
  },
  detailLabel: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
  },
  detailValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    textAlign: "right",
    maxWidth: "55%",
  },
});
