import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { VideoAsset } from "@/src/types";

function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const GRADIENTS = [
  ["#4A00E0", "#8E2DE2"],
  ["#1CB5E0", "#000046"],
  ["#E55D87", "#5B2C6F"],
  ["#FF416C", "#FF4B2B"],
  ["#00B4DB", "#0083B0"],
  ["#11998E", "#38EF7D"],
  ["#FC4445", "#3FADA8"],
  ["#EB3349", "#F45C43"],
  ["#2C3E50", "#3498DB"],
  ["#800080", "#FF6347"],
  ["#0F2027", "#203A43"],
  ["#0B8793", "#360033"],
  ["#1A2980", "#26D0CE"],
  ["#02AAB0", "#00CDAC"],
  ["#DA22FF", "#9733EE"],
  ["#1488CC", "#2B32B2"],
  ["#00467F", "#A5CC82"],
  ["#E44D26", "#F16529"],
  ["#667db6", "#0082c8"],
  ["#4568DC", "#B06AB3"],
];

function getGradient(id: string): [string, string] {
  return GRADIENTS[hashId(id) % GRADIENTS.length];
}

function getReadableColor(bg: string): string {
  const hex = bg.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000" : "#fff";
}

interface Props {
  asset: VideoAsset;
  onPress: (asset: VideoAsset) => void;
}

export default function VideoListItem({ asset, onPress }: Props) {
  const [color1, color2] = getGradient(asset.id);

  return (
    <Pressable style={styles.container} onPress={() => onPress(asset)}>
      <View style={[styles.thumbnail, { backgroundColor: color1 }]}>
        <View
          style={[
            styles.gradientOverlay,
            { backgroundColor: color2, opacity: 0.6 },
          ]}
        />
        <Ionicons name="play-circle" size={28} color="rgba(255,255,255,0.7)" />
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>
            {formatDuration(asset.duration)}
          </Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {asset.filename}
        </Text>
        <Text style={styles.meta}>{formatDate(asset.creationTime)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 16,
  },
  thumbnail: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  durationBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  info: {
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  title: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    marginBottom: 2,
  },
  meta: {
    color: "#777",
    fontSize: 11,
  },
});
