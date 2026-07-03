import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import PlayerControls from "@/src/components/PlayerControls";

export default function PlayerScreen() {
  const router = useRouter();
  const { uri, title } = useLocalSearchParams<{
    uri: string;
    title: string;
  }>();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const player = useVideoPlayer(uri ?? "", (player) => {
    player.loop = false;
    player.staysActiveInBackground = false;
    player.showNowPlayingNotification = false;
  });

  useEffect(() => {
    if (!uri) {
      setError("No video URI provided");
      return;
    }
    const unsubStatus = player.addListener("statusChange", (e) => {
      if (e.status === "readyToPlay") {
        setReady(true);
        setError(null);
        player.play();
      } else if (e.status === "error") {
        setError(e.error?.message ?? "Failed to load video");
        setReady(false);
      }
    });

    return () => {
      unsubStatus.remove();
    };
  }, [player, uri]);

  useEffect(() => {
    const unsubEnd = player.addListener("playToEnd", () => {
      player.currentTime = 0;
    });
    return () => unsubEnd.remove();
  }, [player]);

  const handleBack = useCallback(() => {
    player.pause();
    router.back();
  }, [player, router]);

  if (!uri) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No video specified</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
        contentFit="contain"
      />

      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!ready && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      <PlayerControls player={player} onBack={handleBack} title={title ?? "Video"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  video: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    zIndex: 15,
    padding: 32,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 16,
    textAlign: "center",
  },
});
