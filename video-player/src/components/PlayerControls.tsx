import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { VideoPlayer } from "expo-video";

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "00:00";
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
}

export default function PlayerControls({ player, onBack, title }: Props) {
  const [playing, setPlaying] = useState(player.playing);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(player.muted);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 4000);
  }, []);

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
    });

    setDuration(player.duration);

    return () => {
      unsubStatus.remove();
      unsubTime.remove();
      unsubPlaying.remove();
    };
  }, [player]);

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
    resetHideTimer();
  }, [resetHideTimer]);

  const handleSeek = useCallback(
    (direction: "forward" | "back") => {
      const delta = direction === "forward" ? 10 : -10;
      player.seekBy(delta);
      resetHideTimer();
    },
    [player, resetHideTimer]
  );

  const onBarPress = useCallback(
    (e: any) => {
      const x = e.nativeEvent.locationX;
      const width = e.nativeEvent.target
        ? (e.nativeEvent as any).target.offsetWidth
        : 0;
      if (width > 0 && duration > 0) {
        const ratio = x / width;
        player.currentTime = ratio * duration;
      }
      resetHideTimer();
    },
    [player, duration, resetHideTimer]
  );

  const progress = duration > 0 ? currentTime / duration : 0;

  if (!showControls) {
    return (
      <Pressable style={styles.tapArea} onPress={resetHideTimer}>
        <View style={styles.topBar}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-down" size={28} color="#fff" />
          </Pressable>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.overlay} onPress={resetHideTimer}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-down" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.centerRow}>
        <Pressable
          onPress={() => handleSeek("back")}
          style={styles.skipBtn}
          hitSlop={16}
        >
          <Ionicons name="play-back" size={28} color="#fff" />
        </Pressable>
        <Pressable onPress={togglePlay} style={styles.playBtn} hitSlop={20}>
          <Ionicons
            name={playing ? "pause" : "play"}
            size={48}
            color="#fff"
          />
        </Pressable>
        <Pressable
          onPress={() => handleSeek("forward")}
          style={styles.skipBtn}
          hitSlop={16}
        >
          <Ionicons name="play-forward" size={28} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.bottomBar}>
        <Text style={styles.time}>{formatTime(currentTime)}</Text>
        <Pressable style={styles.progressContainer} onPress={onBarPress}>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
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
        <Pressable onPress={toggleFullscreen} style={styles.actionBtn} hitSlop={8}>
          <Ionicons name="expand-outline" size={22} color="#fff" />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tapArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "space-between",
    zIndex: 10,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginHorizontal: 8,
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  skipBtn: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 8,
  },
  progressContainer: {
    flex: 1,
    height: 32,
    justifyContent: "center",
  },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  time: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    minWidth: 40,
    textAlign: "center",
  },
  actionBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
});
