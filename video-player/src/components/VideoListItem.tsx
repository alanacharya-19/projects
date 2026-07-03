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

interface Props {
  asset: VideoAsset;
  onPress: (asset: VideoAsset) => void;
}

export default function VideoListItem({ asset, onPress }: Props) {
  return (
    <Pressable style={styles.container} onPress={() => onPress(asset)}>
      <View style={styles.thumbnail}>
        <Ionicons name="film-outline" size={32} color="#666" />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {asset.filename}
        </Text>
        <Text style={styles.duration}>{formatDuration(asset.duration)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#555" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  thumbnail: {
    width: 64,
    height: 48,
    borderRadius: 6,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
  },
  duration: {
    color: "#999",
    fontSize: 13,
  },
});
