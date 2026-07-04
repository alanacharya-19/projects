import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { VideoAsset } from "@/src/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GAP = 10;
const PAD = 16;
const CARD_W = (SCREEN_WIDTH - PAD * 2 - GAP) / 2;
const SWIPE_THRESHOLD = -60;

const loadedThumbs = new Map<string, boolean>();

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
  const date = new Date(timestamp * 1000);
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
  onDelete?: (asset: VideoAsset) => void;
}

export default function VideoListItem({ asset, onPress, onDelete }: Props) {
  const [color1, color2] = getGradient(asset.id);
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const [state, setState] = useState<"loading" | "ok" | "fail">(
    loadedThumbs.has(asset.id) ? "ok" : "loading"
  );
  const mounted = useRef(true);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
      onPanResponderMove: (_, gs) => {
        if (gs.dx < 0) {
          translateX.setValue(Math.max(gs.dx, -80));
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < SWIPE_THRESHOLD && onDelete) {
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: true,
            stiffness: 300,
            damping: 30,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            stiffness: 300,
            damping: 30,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleLoad = useCallback(() => {
    if (!mounted.current) return;
    loadedThumbs.set(asset.id, true);
    setState("ok");
  }, [asset.id]);

  const handleError = useCallback(() => {
    if (!mounted.current) return;
    setState("fail");
  }, []);

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

  const confirmDelete = useCallback(() => {
    Alert.alert("Delete Video", `Delete "${asset.filename}"?`, [
      { text: "Cancel", style: "cancel", onPress: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, stiffness: 300, damping: 30 }).start();
      }},
      { text: "Delete", style: "destructive", onPress: () => {
        onDelete?.(asset);
      }},
    ]);
  }, [asset, onDelete, translateX]);

  return (
    <View style={{ width: CARD_W, position: "relative" }}>
      {onDelete && (
        <Pressable onPress={confirmDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.deleteLabel}>Delete</Text>
        </Pressable>
      )}
      <Animated.View style={{ transform: [{ translateX }] }} {...pan.panHandlers}>
        <Pressable
          onPress={() => onPress(asset)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
            <View style={[styles.thumb, { backgroundColor: color1 }]}>
              <Image
                source={{ uri: asset.uri, cacheKey: asset.id }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={300}
                onLoad={handleLoad}
                onError={handleError}
                cachePolicy="disk"
              />
              {state !== "ok" && (
                <View style={[styles.gradientOverlay, { backgroundColor: color2, opacity: 0.55 }]} />
              )}
              <View style={styles.playCircle}>
                <Ionicons name="play" size={20} color="#fff" />
              </View>
              <View style={styles.durationBadge}>
                <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.7)" style={{ marginRight: 2 }} />
                <Text style={styles.duration}>{formatDuration(asset.duration)}</Text>
              </View>
            </View>
            <View style={styles.body}>
              <Text style={styles.title} numberOfLines={1}>
                {asset.filename.replace(/\.[^/.]+$/, "")}
              </Text>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={10} color="#555" style={{ marginRight: 3 }} />
                <Text style={styles.meta}>{formatDate(asset.creationTime)}</Text>
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
    overflow: "hidden",
  },
  gradientOverlay: { ...StyleSheet.absoluteFillObject },
  playCircle: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center", alignItems: "center", borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)", zIndex: 2,
  },
  durationBadge: {
    flexDirection: "row", alignItems: "center", position: "absolute",
    bottom: 5, right: 5, backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, zIndex: 2,
  },
  duration: { color: "#fff", fontSize: 10, fontWeight: "600", fontVariant: ["tabular-nums"] },
  body: { padding: 10 },
  title: { color: "#fff", fontSize: 12, fontWeight: "600", lineHeight: 16, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center" },
  meta: { color: "#555", fontSize: 10, fontWeight: "500" },
  deleteBtn: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "#ff3b30",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  deleteLabel: { color: "#fff", fontSize: 10, fontWeight: "600", marginTop: 2 },
});
