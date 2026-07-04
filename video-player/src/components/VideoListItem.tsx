import { useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { VideoAsset } from "@/src/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GAP = 10;
const PAD = 16;
const CARD_W = (SCREEN_WIDTH - PAD * 2 - GAP) / 2;

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

const GRADIENTS: [string, string][] = [
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
  ["#02AAB0", "#00CDAC"],
  ["#1A2980", "#26D0CE"],
  ["#DA22FF", "#9733EE"],
  ["#1488CC", "#2B32B2"],
  ["#00467F", "#A5CC82"],
  ["#667db6", "#0082c8"],
  ["#4568DC", "#B06AB3"],
];

function getGradient(id: string): [string, string] {
  return GRADIENTS[hashId(id) % GRADIENTS.length];
}

interface Props {
  asset: VideoAsset;
  onPress: (asset: VideoAsset) => void;
}

export default function VideoListItem({ asset, onPress }: Props) {
  const [color1, color2] = getGradient(asset.id);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      stiffness: 300,
      damping: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      stiffness: 300,
      damping: 20,
    }).start();
  };

  return (
    <Pressable
      onPress={() => onPress(asset)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <View style={[styles.thumb, { backgroundColor: color1 }]}>
          <View
            style={[
              styles.thumbOverlay,
              { backgroundColor: color2, opacity: 0.55 },
            ]}
          />
          <View style={styles.playCircle}>
            <Ionicons name="play" size={20} color="#fff" />
          </View>
          <View style={styles.durationBadge}>
            <Ionicons
              name="time-outline"
              size={10}
              color="rgba(255,255,255,0.7)"
              style={{ marginRight: 2 }}
            />
            <Text style={styles.duration}>{formatDuration(asset.duration)}</Text>
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {asset.filename.replace(/\.[^/.]+$/, "")}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons
              name="calendar-outline"
              size={10}
              color="#555"
              style={{ marginRight: 3 }}
            />
            <Text style={styles.meta}>{formatDate(asset.creationTime)}</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    borderRadius: 14,
    backgroundColor: "#111",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.06)",
  },
  thumb: {
    width: "100%",
    aspectRatio: 16 / 9,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  playCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  duration: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  body: {
    padding: 10,
  },
  title: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  meta: {
    color: "#555",
    fontSize: 10,
    fontWeight: "500",
  },
});
