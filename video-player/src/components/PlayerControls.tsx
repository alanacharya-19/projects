import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius } from "../theme";

const AUTO_HIDE_DELAY = 4000;

interface PlayerControlsProps {
  player: any;
  onBack: () => void;
  title: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onTogglePip: () => void;
  onShare: () => void;
  safeTop: number;
}

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function PlayerControls({
  player,
  onBack,
  title,
  isFullscreen,
  onToggleFullscreen,
  onTogglePip,
  onShare,
  safeTop,
}: PlayerControlsProps) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [progressBarWidth, setProgressBarWidth] = useState(0);

  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (isPlaying) {
      hideTimer.current = setTimeout(() => {
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setControlsVisible(false));
      }, AUTO_HIDE_DELAY);
    }
  }, [isPlaying, controlsOpacity]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    controlsOpacity.setValue(1);
    resetHideTimer();
  }, [controlsOpacity, resetHideTimer]);

  useEffect(() => {
    if (!player) return;
    const unsubStatus = player.addListener("statusChange", (e: any) => {
      if (e.status === "readyToPlay") {
        setDuration(player.duration);
      }
    });
    const unsubTime = player.addListener("timeUpdate", () => {
      setCurrentTime(player.currentTime);
    });
    const unsubPlaying = player.addListener("playingChange", (e: any) => {
      setIsPlaying(e.isPlaying);
    });
    return () => {
      unsubStatus.remove();
      unsubTime.remove();
      unsubPlaying.remove();
    };
  }, [player]);

  // Sync buffered position
  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      setBuffered(player.bufferedPosition);
    }, 500);
    return () => clearInterval(interval);
  }, [player]);

  // Auto-hide
  useEffect(() => {
    if (isPlaying) resetHideTimer();
    else {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      showControls();
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [isPlaying, resetHideTimer, showControls]);

  const togglePlay = useCallback(() => {
    if (isPlaying) player.pause();
    else player.play();
    showControls();
  }, [player, isPlaying, showControls]);

  const seekBy = useCallback(
    (seconds: number) => {
      player.seekBy(seconds);
      showControls();
    },
    [player, showControls]
  );

  const cycleSpeed = useCallback(() => {
    const idx = SPEED_OPTIONS.indexOf(playbackSpeed);
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    setPlaybackSpeed(next);
    player.playbackRate = next;
    showControls();
  }, [playbackSpeed, player, showControls]);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => {
      player.muted = !m;
      return !m;
    });
    showControls();
  }, [player, showControls]);

  const handleFullscreen = useCallback(() => {
    onToggleFullscreen();
    showControls();
  }, [onToggleFullscreen, showControls]);

  const handleProgressPress = useCallback(
    (evt: any) => {
      if (!duration || !progressBarWidth) return;
      const { locationX } = evt.nativeEvent;
      const ratio = Math.max(0, Math.min(1, locationX / progressBarWidth));
      player.currentTime = ratio * duration;
      showControls();
    },
    [duration, player, showControls, progressBarWidth]
  );

  const onProgressLayout = useCallback((e: LayoutChangeEvent) => {
    setProgressBarWidth(e.nativeEvent.layout.width);
  }, []);

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? currentTime / duration : 0;
  const bufferedProgress = duration > 0 ? buffered / duration : 0;

  return (
    <Animated.View
      style={[styles.container, { opacity: controlsOpacity }]}
      pointerEvents={controlsVisible ? "auto" : "none"}
    >
      {/* Touch to show overlay */}
      <Pressable style={StyleSheet.absoluteFill} onPress={showControls} />

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: safeTop + spacing.sm }]}>
        <Pressable onPress={onBack} style={styles.topBtn}>
          <Ionicons name="chevron-down" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title.replace(/\.[^/.]+$/, "")}
        </Text>
        <View style={styles.topRight}>
          <Pressable onPress={onTogglePip} style={styles.topBtn} hitSlop={8}>
            <Ionicons name="tv-outline" size={18} color={colors.text.primary} />
          </Pressable>
          <Pressable onPress={onShare} style={styles.topBtn} hitSlop={8}>
            <Ionicons name="share-outline" size={18} color={colors.text.primary} />
          </Pressable>
        </View>
      </View>

      {/* Center Controls */}
      <View style={styles.center}>
        <Pressable onPress={() => seekBy(-15)} style={styles.centerBtn} hitSlop={16}>
          <Ionicons name="play-back" size={28} color={colors.text.primary} />
          <Text style={styles.seekLabel}>15</Text>
        </Pressable>
        <Pressable onPress={togglePlay} style={styles.playBtn}>
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={36}
            color={colors.text.primary}
            style={isPlaying ? undefined : { marginLeft: 3 }}
          />
        </Pressable>
        <Pressable onPress={() => seekBy(15)} style={styles.centerBtn} hitSlop={16}>
          <Ionicons name="play-forward" size={28} color={colors.text.primary} />
          <Text style={styles.seekLabel}>15</Text>
        </Pressable>
      </View>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        {/* Progress Bar */}
        <Pressable onLayout={onProgressLayout} onPress={handleProgressPress} style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBuffered, { width: `${bufferedProgress * 100}%` }]} />
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            <View style={[styles.progressThumb, { left: `${progress * 100}%` }]} />
          </View>
        </Pressable>

        {/* Transport */}
        <View style={styles.transport}>
          <Text style={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>

          <View style={styles.transportRight}>
            <Pressable onPress={cycleSpeed} style={styles.transportBtn}>
              <Text style={styles.speedText}>{playbackSpeed}x</Text>
            </Pressable>
            <Pressable onPress={toggleMute} style={styles.transportBtn}>
              <Ionicons
                name={isMuted ? "volume-mute" : "volume-high"}
                size={18}
                color={colors.text.primary}
              />
            </Pressable>
            <Pressable onPress={handleFullscreen} style={styles.transportBtn}>
              <Ionicons
                name={isFullscreen ? "contract-outline" : "expand-outline"}
                size={18}
                color={colors.text.primary}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 10,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  topBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  topRight: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  // Center
  center: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing["4xl"],
  },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  seekLabel: {
    position: "absolute",
    bottom: 6,
    color: colors.text.secondary,
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Bottom
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["4xl"],
    gap: spacing.md,
  },
  progressContainer: {
    height: 32,
    justifyContent: "center",
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    position: "relative",
    overflow: "visible",
  },
  progressBuffered: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.accent.primary,
    borderRadius: 2,
  },
  progressThumb: {
    position: "absolute",
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent.primary,
    marginLeft: -6,
  },
  transport: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  transportRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  transportBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  speedText: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});
