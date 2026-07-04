import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  PanResponder,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import {
  lockToLandscape,
  lockToPortrait,
  addOrientationListener,
} from "@/src/utils/orientation";
import { getPosition, setPosition } from "@/src/utils/history";
import PlayerControls from "@/src/components/PlayerControls";
import { colors, typography, spacing, borderRadius } from "../theme";
import { usePlayerStore } from "../stores/usePlayerStore";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function PlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { uri, title } = useLocalSearchParams<{ uri: string; title: string }>();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [inPip, setInPip] = useState(false);
  const videoRef = useRef<VideoView>(null);
  const savedTime = useRef(0);

  // Gesture state
  const [volumeGesture, setVolumeGesture] = useState(false);
  const [brightnessGesture, setBrightnessGesture] = useState(false);
  const lastGestureY = useRef(0);
  const lastVolume = useRef(1);

  // Brightness indicator
  const brightnessValue = useSharedValue(0);
  const brightnessOpacity = useSharedValue(0);

  const brightnessStyle = useAnimatedStyle(() => ({
    opacity: brightnessOpacity.value,
  }));

  const player = useVideoPlayer(uri ?? "", (player) => {
    player.loop = false;
    player.staysActiveInBackground = true;
    player.showNowPlayingNotification = false;
  });

  // Restore position
  useEffect(() => {
    if (!uri) return;
    getPosition(uri).then((pos) => {
      if (pos > 1) savedTime.current = pos;
    });
  }, [uri]);

  const handleReady = useCallback(() => {
    setReady(true);
    setError(null);
    if (savedTime.current > 1) {
      player.currentTime = savedTime.current;
      savedTime.current = 0;
    }
    player.play();
  }, [player]);

  useEffect(() => {
    if (!uri) {
      setError("No video URI provided");
      return;
    }
    const unsubStatus = player.addListener("statusChange", (e: any) => {
      if (e.status === "readyToPlay") handleReady();
      else if (e.status === "error") {
        setError(e.error?.message ?? "Failed to load video");
        setReady(false);
      }
    });
    return () => unsubStatus.remove();
  }, [player, uri, handleReady]);

  useEffect(() => {
    const unsubEnd = player.addListener("playToEnd", () => {
      player.currentTime = 0;
    });
    return () => unsubEnd.remove();
  }, [player]);

  // Save position on unmount
  useEffect(() => {
    return () => {
      if (uri && player.currentTime > 3) {
        setPosition(uri, player.currentTime);
      }
    };
  }, [uri]);

  // Gesture PanResponder
  const gesturePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        const x = evt.nativeEvent.locationX;
        const half = SCREEN_WIDTH / 2;
        if (x < half) {
          setBrightnessGesture(true);
        } else {
          setVolumeGesture(true);
          lastVolume.current = player.volume;
        }
        lastGestureY.current = evt.nativeEvent.pageY;
        return true;
      },
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt) => {
        const dy = lastGestureY.current - evt.nativeEvent.pageY;
        lastGestureY.current = evt.nativeEvent.pageY;
        const delta = dy / 200;

        if (brightnessGesture) {
          const newVal = Math.max(0, Math.min(1, brightnessValue.value + delta));
          brightnessValue.value = newVal;
          brightnessOpacity.value = withTiming(1, { duration: 100 });
        }
        if (volumeGesture) {
          const newVol = Math.max(0, Math.min(1, lastVolume.current + delta));
          player.volume = newVol;
        }
      },
      onPanResponderRelease: () => {
        setVolumeGesture(false);
        setBrightnessGesture(false);
        brightnessOpacity.value = withTiming(0, { duration: 500 });
      },
    })
  ).current;

  // Double-tap seek
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

  const handleBack = useCallback(() => {
    if (uri) setPosition(uri, player.currentTime);
    player.pause();
    if (isFullscreen) lockToPortrait();
    router.back();
  }, [player, router, isFullscreen, uri]);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await lockToPortrait();
      setIsFullscreen(false);
    } else {
      await lockToLandscape();
      setIsFullscreen(true);
    }
  }, [isFullscreen]);

  const togglePip = useCallback(async () => {
    try {
      await videoRef.current?.startPictureInPicture?.();
      setInPip(true);
    } catch {}
  }, []);

  const handleShare = useCallback(async () => {
    if (!uri) return;
    try {
      await Share.share({ url: uri, title: title ?? "Video" });
    } catch {}
  }, [uri, title]);

  useEffect(() => {
    lockToPortrait();
  }, []);

  useEffect(() => {
    const unsub = addOrientationListener((isPortrait: boolean) => {
      if (isPortrait && isFullscreen) setIsFullscreen(false);
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
    <View style={styles.container} {...gesturePan.panHandlers}>
      <StatusBar hidden={isFullscreen || inPip} />

      {/* Video Player */}
      <VideoView
        ref={videoRef}
        player={player}
        style={styles.video}
        nativeControls={false}
        contentFit={isFullscreen ? "cover" : "contain"}
        allowsPictureInPicture
      />

      {/* Touch handler for double-tap */}
      <View style={styles.touchOverlay} onTouchEnd={handleVideoPress} />

      {/* Seek Hint */}
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

      {/* Volume Indicator */}
      {volumeGesture && (
        <View style={styles.gestureIndicator}>
          <Ionicons name="volume-high" size={20} color={colors.text.primary} />
          <View style={styles.gestureBar}>
            <View
              style={[
                styles.gestureBarFill,
                { height: `${player.volume * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.gestureText}>
            {Math.round(player.volume * 100)}%
          </Text>
        </View>
      )}

      {/* Brightness Indicator */}
      <Animated.View style={[styles.gestureIndicator, styles.brightnessIndicator, brightnessStyle]}>
        <Ionicons name="sunny" size={20} color={colors.text.primary} />
        <View style={styles.gestureBar}>
          <View
            style={[
              styles.gestureBarFill,
              { height: `${brightnessValue.value * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.gestureText}>
          {Math.round(brightnessValue.value * 100)}%
        </Text>
      </Animated.View>

      {/* Error */}
      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Loading */}
      {!ready && !error && (
        <View style={styles.loadingOverlay}>
          <View style={styles.spinner} />
        </View>
      )}

      {/* Resume badge */}
      {savedTime.current > 1 && ready && (
        <View style={styles.resumeBadge}>
          <Text style={styles.resumeText}>
            Resume from {Math.floor(savedTime.current / 60)}:
            {(savedTime.current % 60).toString().padStart(2, "0")}
          </Text>
        </View>
      )}

      {/* Controls Overlay */}
      <PlayerControls
        player={player}
        onBack={handleBack}
        title={title ?? "Video"}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onTogglePip={togglePip}
        onShare={handleShare}
        safeTop={isFullscreen ? 0 : Math.max(insets.top, 20)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  video: { flex: 1, width: "100%", height: "100%" },
  touchOverlay: StyleSheet.absoluteFillObject,
  seekHint: {
    position: "absolute",
    top: "40%",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  seekLeft: { left: 24 },
  seekRight: { right: 24 },
  seekHintIcon: { color: "#fff", fontSize: 28, fontWeight: "700" },
  seekHintText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  // Gesture indicators
  gestureIndicator: {
    position: "absolute",
    right: spacing.xl,
    top: "30%",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 48,
  },
  brightnessIndicator: {
    left: spacing.xl,
    right: undefined,
  },
  gestureBar: {
    width: 4,
    height: 80,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  gestureBarFill: {
    width: "100%",
    backgroundColor: colors.accent.primary,
    borderRadius: 2,
    position: "absolute",
    bottom: 0,
  },
  gestureText: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },

  // Resume
  resumeBadge: {
    position: "absolute",
    top: "20%",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  resumeText: {
    color: "#fff",
    fontSize: typography.sizes.sm,
    fontWeight: "500",
  },

  // States
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.bg.glassBorder,
    borderTopColor: colors.accent.primary,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    zIndex: 15,
    padding: spacing["4xl"],
  },
  errorText: { color: colors.status.error, fontSize: typography.sizes.md, textAlign: "center" },
});
