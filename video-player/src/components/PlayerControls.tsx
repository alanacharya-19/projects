import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import GradientOverlay from "./GradientOverlay";
import { Ionicons } from "@expo/vector-icons";
import type { VideoPlayer } from "expo-video";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

interface Props {
  player: VideoPlayer;
  onBack: () => void;
  title: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  safeTop?: number;
}

export default function PlayerControls({
  player,
  onBack,
  title,
  isFullscreen,
  onToggleFullscreen,
  safeTop = 0,
}: Props) {
  const [playing, setPlaying] = useState(player.playing);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(player.muted);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const playingRef = useRef(player.playing);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scrubberWidth = useRef(0);

  const animate = useCallback(
    (visible: boolean) => {
      Animated.timing(fadeAnim, {
        toValue: visible ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    },
    [fadeAnim]
  );

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    animate(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playingRef.current) {
        setShowControls(false);
        animate(false);
      }
    }, 4000);
  }, [animate]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [resetHideTimer]);

  useEffect(() => {
    player.timeUpdateEventInterval = 0.25;

    const unsubStatus = player.addListener("statusChange", (e) => {
      if (e.status === "readyToPlay" || e.status === "idle") {
        setDuration(player.duration);
      }
    });

    const unsubTime = player.addListener("timeUpdate", (e) => {
      setCurrentTime(e.currentTime);
    });

    const unsubPlaying = player.addListener("playingChange", (e) => {
      setPlaying(e.isPlaying);
      playingRef.current = e.isPlaying;
      if (e.isPlaying) {
        resetHideTimer();
      } else {
        setShowControls(true);
        animate(true);
        if (hideTimer.current) clearTimeout(hideTimer.current);
      }
    });

    setDuration(player.duration);

    return () => {
      unsubStatus.remove();
      unsubTime.remove();
      unsubPlaying.remove();
    };
  }, [player, resetHideTimer, animate]);

  const togglePlay = useCallback(() => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
    resetHideTimer();
  }, [player, resetHideTimer]);

  const toggleMute = useCallback(() => {
    player.muted = !player.muted;
    setMuted(player.muted);
    resetHideTimer();
  }, [player, resetHideTimer]);

  const toggleFullscreen = useCallback(() => {
    onToggleFullscreen();
    resetHideTimer();
  }, [onToggleFullscreen, resetHideTimer]);

  const handleSeek = useCallback(
    (direction: "forward" | "back") => {
      const delta = direction === "forward" ? 15 : -15;
      player.seekBy(delta);
      resetHideTimer();
    },
    [player, resetHideTimer]
  );

  const onScrubberLayout = useCallback((e: any) => {
    scrubberWidth.current = e.nativeEvent.layout.width;
  }, []);

  const onBarPress = useCallback(
    (e: any) => {
      const x = e.nativeEvent.locationX;
      const w = scrubberWidth.current || SCREEN_WIDTH;
      if (w > 0 && duration > 0) {
        player.currentTime = (x / w) * duration;
      }
      resetHideTimer();
    },
    [player, duration, resetHideTimer]
  );

  const progress = duration > 0 ? currentTime / duration : 0;
  const topPad = safeTop + (isFullscreen ? 8 : 8);

  return (
    <View style={styles.container}>
      <View style={styles.thinBar}>
        <View style={[styles.thinFill, { width: `${progress * 100}%` }]} />
      </View>

      {!playing && !showControls && (
        <Pressable style={styles.bigPlayOverlay} onPress={togglePlay}>
          <View style={styles.bigPlayCircle}>
            <Ionicons name="play" size={44} color="#fff" />
          </View>
        </Pressable>
      )}

      <Animated.View
        style={[styles.controlsOverlay, { opacity: fadeAnim }]}
        pointerEvents={showControls ? "auto" : "none"}
      >
        <GradientOverlay
          style={styles.topGradient}
          pointerEvents="none"
        />

        <Pressable style={styles.middleArea} onPress={resetHideTimer}>
          <View style={[styles.topBar, { paddingTop: topPad }]}>
            <Pressable onPress={onBack} style={styles.backBtn}>
              <View style={styles.backInner}>
                <Ionicons name="chevron-down" size={24} color="#fff" />
              </View>
            </Pressable>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.centerRow}>
            <Pressable onPress={() => handleSeek("back")} style={styles.skipWrap} hitSlop={20}>
              <Ionicons name="play-back" size={26} color="#fff" />
              <Text style={styles.skipLabel}>15</Text>
            </Pressable>
            <Pressable onPress={togglePlay} style={styles.playBtn} hitSlop={24}>
              <Ionicons name={playing ? "pause" : "play"} size={36} color="#fff" />
            </Pressable>
            <Pressable onPress={() => handleSeek("forward")} style={styles.skipWrap} hitSlop={20}>
              <Ionicons name="play-forward" size={26} color="#fff" />
              <Text style={styles.skipLabel}>15</Text>
            </Pressable>
          </View>
        </Pressable>

        <GradientOverlay
          reverse
          style={styles.bottomGradient}
          pointerEvents="none"
        />

        <View style={styles.transportBar}>
          <View style={styles.transportInner}>
            <Pressable onPress={togglePlay} style={styles.transportBtn} hitSlop={12}>
              <Ionicons name={playing ? "pause" : "play"} size={20} color="#fff" />
            </Pressable>
            <Pressable onPress={() => handleSeek("back")} style={styles.transportBtn} hitSlop={12}>
              <Ionicons name="play-back" size={18} color="#fff" />
            </Pressable>

            <Text style={styles.time}>{formatTime(currentTime)}</Text>

            <Pressable
              style={styles.scrubberTouch}
              onPress={onBarPress}
              onLayout={onScrubberLayout}
            >
              <View style={styles.scrubberTrack}>
                <View
                  style={[styles.scrubberFill, { width: `${progress * 100}%` }]}
                />
              </View>
            </Pressable>

            <Text style={styles.time}>{formatTime(duration)}</Text>

            <Pressable onPress={toggleMute} style={styles.transportBtn} hitSlop={8}>
              <Ionicons
                name={muted ? "volume-mute" : "volume-high"}
                size={18}
                color="#fff"
              />
            </Pressable>
            <Pressable onPress={toggleFullscreen} style={styles.transportBtn} hitSlop={8}>
              <Ionicons
                name={isFullscreen ? "contract-outline" : "expand-outline"}
                size={18}
                color="#fff"
              />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  thinBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    zIndex: 20,
  },
  thinFill: {
    height: "100%",
    backgroundColor: "#fff",
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  middleArea: {
    flex: 1,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
    paddingBottom: 40,
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  skipWrap: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  skipLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
  transportBar: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  transportInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  transportBtn: {
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  scrubberTouch: {
    flex: 1,
    height: 28,
    justifyContent: "center",
  },
  scrubberTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  scrubberFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 3,
  },
  time: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
    minWidth: 38,
    textAlign: "center",
  },
  bigPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 15,
  },
  bigPlayCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
});
