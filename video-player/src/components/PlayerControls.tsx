import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { VideoPlayer } from "expo-video";

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
}

export default function PlayerControls({
  player,
  onBack,
  title,
  isFullscreen,
  onToggleFullscreen,
}: Props) {
  const [playing, setPlaying] = useState(player.playing);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(player.muted);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const playingRef = useRef(player.playing);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateControls = useCallback(
    (visible: boolean) => {
      Animated.timing(fadeAnim, {
        toValue: visible ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    },
    [fadeAnim]
  );

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    animateControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playingRef.current) {
        setShowControls(false);
        animateControls(false);
      }
    }, 4000);
  }, [animateControls]);

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
        animateControls(true);
        if (hideTimer.current) clearTimeout(hideTimer.current);
      }
    });

    setDuration(player.duration);

    return () => {
      unsubStatus.remove();
      unsubTime.remove();
      unsubPlaying.remove();
    };
  }, [player, resetHideTimer, animateControls]);

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

  const onBarPress = useCallback(
    (e: any) => {
      const x = e.nativeEvent.locationX;
      const { width } = e.nativeEvent;
      if (width > 0 && duration > 0) {
        const ratio = x / width;
        player.currentTime = ratio * duration;
      }
      resetHideTimer();
    },
    [player, duration, resetHideTimer]
  );

  const progress = duration > 0 ? currentTime / duration : 0;
  const topPad = isFullscreen ? 8 : 48;

  return (
    <View style={styles.container}>
      <View style={styles.thinBar}>
        <View style={[styles.thinFill, { width: `${progress * 100}%` }]} />
      </View>

      {!playing && !showControls && (
        <Pressable style={styles.bigPlayOverlay} onPress={togglePlay}>
          <View style={styles.bigPlayCircle}>
            <Ionicons name="play" size={52} color="#fff" />
          </View>
        </Pressable>
      )}

      <Animated.View
        style={[styles.controlsOverlay, { opacity: fadeAnim }]}
        pointerEvents={showControls ? "auto" : "none"}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "transparent"]}
          style={styles.topGradient}
          pointerEvents="none"
        />

        <Pressable style={styles.contentArea} onPress={resetHideTimer}>
          <View style={[styles.topBar, { paddingTop: topPad }]}>
            <Pressable onPress={onBack} style={styles.backBtn}>
              <Ionicons name="chevron-down-circle-outline" size={30} color="#fff" />
            </Pressable>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={styles.centerRow}>
            <Pressable
              onPress={() => handleSeek("back")}
              style={styles.skipBtn}
              hitSlop={16}
            >
              <Ionicons name="play-back" size={30} color="#fff" />
            </Pressable>
            <Pressable onPress={togglePlay} style={styles.playBtn} hitSlop={20}>
              <Ionicons
                name={playing ? "pause" : "play"}
                size={44}
                color="#fff"
              />
            </Pressable>
            <Pressable
              onPress={() => handleSeek("forward")}
              style={styles.skipBtn}
              hitSlop={16}
            >
              <Ionicons name="play-forward" size={30} color="#fff" />
            </Pressable>
          </View>
        </Pressable>

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.bottomGradient}
          pointerEvents="none"
        />

        <View style={styles.bottomBar}>
          <Text style={styles.time}>{formatTime(currentTime)}</Text>
          <Pressable style={styles.scrubberTouch} onPress={onBarPress}>
            <View style={styles.scrubberTrack}>
              <View
                style={[styles.scrubberFill, { width: `${progress * 100}%` }]}
              />
            </View>
          </Pressable>
          <Text style={styles.time}>{formatTime(duration)}</Text>
          <Pressable onPress={toggleMute} style={styles.actionBtn} hitSlop={8}>
            <Ionicons
              name={muted ? "volume-mute" : "volume-high"}
              size={22}
              color="#fff"
            />
          </Pressable>
          <Pressable
            onPress={toggleFullscreen}
            style={styles.actionBtn}
            hitSlop={8}
          >
            <Ionicons
              name={isFullscreen ? "contract-outline" : "expand-outline"}
              size={22}
              color="#fff"
            />
          </Pressable>
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
    height: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
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
    height: 160,
  },
  contentArea: {
    flex: 1,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.3,
    marginHorizontal: 8,
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 36,
    paddingBottom: 48,
  },
  playBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  skipBtn: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  scrubberTouch: {
    flex: 1,
    height: 32,
    justifyContent: "center",
  },
  scrubberTrack: {
    height: 7,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 4,
    overflow: "hidden",
  },
  scrubberFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  time: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
    minWidth: 42,
    textAlign: "center",
  },
  actionBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  bigPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 15,
  },
  bigPlayCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.25)",
  },
});
