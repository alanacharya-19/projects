import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  PanResponder,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  lockToLandscape,
  lockToPortrait,
  addOrientationListener,
} from "@/src/utils/orientation";
import PlayerControls from "@/src/components/PlayerControls";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function PlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { uri, title } = useLocalSearchParams<{
    uri: string;
    title: string;
  }>();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<VideoView>(null);

  const player = useVideoPlayer(uri ?? "", (player) => {
    player.loop = false;
    player.staysActiveInBackground = false;
    player.showNowPlayingNotification = false;
  });

  // Double-tap detection
  const lastTap = useRef({ x: 0, time: 0 });
  const [showSeekHint, setShowSeekHint] = useState<string | null>(null);
  const seekHintTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flashSeekHint = useCallback((dir: "forward" | "back") => {
    setShowSeekHint(dir);
    if (seekHintTimer.current) clearTimeout(seekHintTimer.current);
    seekHintTimer.current = setTimeout(() => setShowSeekHint(null), 600);
  }, []);

  const handleVideoPress = useCallback(
    (evt: any) => {
      const { locationX } = evt.nativeEvent;
      const now = Date.now();
      const { x: lastX, time: lastTime } = lastTap.current;

      if (now - lastTime < 300) {
        // Double tap detected
        if (locationX < SCREEN_WIDTH / 2) {
          player.seekBy(-10);
          flashSeekHint("back");
        } else {
          player.seekBy(10);
          flashSeekHint("forward");
        }
        lastTap.current = { x: 0, time: 0 };
      } else {
        lastTap.current = { x: locationX, time: now };
      }
    },
    [player, flashSeekHint]
  );

  // Volume gesture (right side vertical swipe)
  const [volumeGesture, setVolumeGesture] = useState(false);
  const lastVolY = useRef(0);

  const volPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        if (evt.nativeEvent.locationX > SCREEN_WIDTH / 2) {
          setVolumeGesture(true);
          lastVolY.current = evt.nativeEvent.pageY;
          return true;
        }
        return false;
      },
      onMoveShouldSetPanResponder: (evt) => {
        if (evt.nativeEvent.locationX > SCREEN_WIDTH / 2) {
          return true;
        }
        return false;
      },
      onPanResponderMove: (evt) => {
        const dy = lastVolY.current - evt.nativeEvent.pageY;
        lastVolY.current = evt.nativeEvent.pageY;
        if (dy !== 0) {
          const step = dy / 200;
          player.volume = Math.max(0, Math.min(1, player.volume + step));
        }
      },
      onPanResponderRelease: () => {
        setVolumeGesture(false);
      },
    })
  ).current;

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
    if (isFullscreen) {
      lockToPortrait();
    }
    router.back();
  }, [player, router, isFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await lockToPortrait();
      setIsFullscreen(false);
    } else {
      await lockToLandscape();
      setIsFullscreen(true);
    }
  }, [isFullscreen]);

  useEffect(() => {
    lockToPortrait();
  }, []);

  useEffect(() => {
    const unsub = addOrientationListener((isPortrait) => {
      if (isPortrait && isFullscreen) {
        setIsFullscreen(false);
      }
    });
    return unsub;
  }, [isFullscreen]);

  if (!uri) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No video specified</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={isFullscreen} />

      <View style={styles.videoWrapper} {...volPan.panHandlers}>
        <VideoView
          ref={videoRef}
          player={player}
          style={styles.video}
          nativeControls={false}
          contentFit={isFullscreen ? "cover" : "contain"}
        />

        <View
          style={StyleSheet.absoluteFill}
          onTouchEnd={handleVideoPress}
        />

        {showSeekHint && (
          <View
            style={[
              styles.seekHint,
              showSeekHint === "back" ? styles.seekLeft : styles.seekRight,
            ]}
          >
            <Text style={styles.seekHintIcon}>
              {showSeekHint === "back" ? "⟲" : "⟳"}
            </Text>
            <Text style={styles.seekHintText}>10s</Text>
          </View>
        )}

        {volumeGesture && (
          <View style={styles.volBadge}>
            <Text style={styles.volText}>
              {Math.round(player.volume * 100)}%
            </Text>
          </View>
        )}
      </View>

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

      <PlayerControls
        player={player}
        onBack={handleBack}
        title={title ?? "Video"}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        safeTop={isFullscreen ? 0 : insets.top}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  videoWrapper: { flex: 1, position: "relative" },
  video: { flex: 1, width: "100%", height: "100%" },
  seekHint: {
    position: "absolute",
    top: "40%",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  seekLeft: { left: 24 },
  seekRight: { right: 24 },
  seekHintIcon: { color: "#fff", fontSize: 28, fontWeight: "700" },
  seekHintText: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600", marginTop: 2 },
  volBadge: {
    position: "absolute",
    right: 16,
    top: "30%",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  volText: { color: "#fff", fontSize: 13, fontWeight: "600" },
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
  errorText: { color: "#ff4444", fontSize: 16, textAlign: "center" },
});
