import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  RefreshControl,
  Alert as RNAlert,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import { useAlertContext } from "@/context/AlertContext";
import { useAlerts } from "@/hooks/useAlerts";
import { formatDistance } from "@/utils/helpers";
import type { DisasterType } from "@/types";
import { DisasterType as DT } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface FilterChip {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  type?: DisasterType | "weather" | "air_quality";
}

const TYPE_FILTERS: FilterChip[] = [
  { key: "all", label: "All", icon: "options", color: "#3B82F6" },
  { key: "earthquakes", label: "Earthquake", icon: "earth", color: "#FF3B30", type: DT.EARTHQUAKE },
  { key: "floods", label: "Flood", icon: "water", color: "#2E7DFF", type: DT.FLOOD },
  { key: "wildfires", label: "Wildfire", icon: "flame", color: "#FF9500", type: DT.WILDFIRE },
  { key: "storms", label: "Storm", icon: "thunderstorm", color: "#AF52DE", type: DT.CYCLONE },
  { key: "heat", label: "Heat", icon: "sunny", color: "#FF6B35", type: DT.HEATWAVE },
  { key: "cold", label: "Cold", icon: "snow", color: "#00C2FF", type: DT.COLD_WAVE },
];

function getAlertIcon(type: string): { icon: string; color: string } {
  const map: Record<string, { icon: string; color: string }> = {
    earthquake: { icon: "earth", color: "#FF3B30" },
    flood: { icon: "water", color: "#2E7DFF" },
    wildfire: { icon: "flame", color: "#FF9500" },
    cyclone: { icon: "thunderstorm", color: "#AF52DE" },
    tornado: { icon: "nuclear", color: "#FF6B9D" },
    heatwave: { icon: "sunny", color: "#FF6B35" },
    cold_wave: { icon: "snow", color: "#00C2FF" },
    tsunami: { icon: "water", color: "#0052CC" },
    landslide: { icon: "earth", color: "#8D6E63" },
  };
  return map[type] || { icon: "warning", color: "#6B7280" };
}

const SEVERITY_STYLES: Record<string, { color: string; bg: string }> = {
  minor: { color: "#22C55E", bg: "#F0FDF4" },
  moderate: { color: "#EAB308", bg: "#FEFCE8" },
  severe: { color: "#F97316", bg: "#FFF7ED" },
  extreme: { color: "#EF4444", bg: "#FEF2F2" },
  emergency: { color: "#DC2626", bg: "#FEF2F2" },
};

function getSeverityStyle(s: string) {
  return SEVERITY_STYLES[s] || { color: "#6B7280", bg: "#F1F5F9" };
}

function capitalizeType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

interface NotificationPanelProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ visible, onClose }: NotificationPanelProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { filteredAlerts, dismissAlert, setFilter } = useAlertContext();
  const { refresh } = useAlerts();
  const [refreshing, setRefreshing] = useState(false);
  const [activeType, setActiveType] = useState("all");

  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, damping: 26, stiffness: 280, mass: 0.8 }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateX, { toValue: SCREEN_WIDTH, useNativeDriver: true, damping: 26, stiffness: 280, mass: 0.8 }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, translateX, overlayOpacity]);

  const displayedAlerts = useMemo(() => filteredAlerts, [filteredAlerts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleTypeFilter = useCallback(
    (chip: FilterChip) => {
      setActiveType(chip.key);
      setFilter({ types: chip.key === "all" ? undefined : [chip.type!] });
    },
    [setFilter],
  );

  const handleAlertPress = useCallback(
    (id: string) => {
      onClose();
      setTimeout(() => router.push(`/alert/${id}` as Href), 200);
    },
    [router, onClose],
  );

  const handleDismiss = useCallback(
    (id: string) => {
      RNAlert.alert("Dismiss", "Remove this alert?", [
        { text: "Cancel", style: "cancel" },
        { text: "Dismiss", style: "destructive", onPress: () => dismissAlert(id) },
      ]);
    },
    [dismissAlert],
  );

  return (
    <>
      {visible && <StatusBar barStyle="dark-content" />}

      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <TouchableOpacity style={styles.overlayPress} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[styles.panel, { width: SCREEN_WIDTH, paddingTop: insets.top, paddingBottom: insets.bottom, transform: [{ translateX }] }]}
      >
        <LinearGradient
          colors={["#E8F0FE", "#F0F5FF", "#F7F9FC"]}
          locations={[0, 0.5, 1]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={22} color="#1E293B" />
              </TouchableOpacity>
              <LinearGradient colors={["#3B82F6", "#2563EB"]} style={styles.bellCircle}>
                <Ionicons name="notifications" size={18} color="#FFFFFF" />
              </LinearGradient>
              <View>
                <Text style={styles.headerTitle}>Notifications</Text>
                <Text style={styles.headerSub}>{displayedAlerts.length} active alert{displayedAlerts.length !== 1 ? "s" : ""}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {TYPE_FILTERS.map((chip) => {
              const isActive = activeType === chip.key;
              return (
                <TouchableOpacity
                  key={chip.key}
                  activeOpacity={0.7}
                  onPress={() => handleTypeFilter(chip)}
                  style={[styles.chip, isActive && { backgroundColor: chip.color, borderColor: chip.color }]}
                >
                  <Ionicons name={chip.icon} size={12} color={isActive ? "#FFF" : chip.color} />
                  <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>{chip.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </LinearGradient>

        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" colors={["#3B82F6"]} />}
        >
          {displayedAlerts.length === 0 ? (
            <View style={styles.empty}>
              <LinearGradient colors={["#ECFDF5", "#D1FAE5"]} style={styles.emptyIconWrap}>
                <Ionicons name="shield-checkmark" size={40} color="#22C55E" />
              </LinearGradient>
              <Text style={styles.emptyTitle}>All Clear</Text>
              <Text style={styles.emptySub}>No active alerts right now. Stay safe!</Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              <View style={styles.sectionLabel}>
                <View style={styles.sectionDot} />
                <Text style={styles.sectionLabelText}>Latest Alerts</Text>
              </View>
              {displayedAlerts.map((alert) => {
                const sv = getSeverityStyle(alert.severity);
                const ic = getAlertIcon(alert.type);
                return (
                  <TouchableOpacity
                    key={alert.id}
                    activeOpacity={0.7}
                    onPress={() => handleAlertPress(alert.id)}
                    onLongPress={() => handleDismiss(alert.id)}
                    delayLongPress={600}
                    style={styles.card}
                  >
                    <View style={[styles.cardAccent, { backgroundColor: sv.color }]} />
                    <View style={styles.cardBody}>
                      <View style={styles.cardTop}>
                        <View style={[styles.cardIcon, { backgroundColor: `${ic.color}15` }]}>
                          <Ionicons name={ic.icon as any} size={20} color={ic.color} />
                        </View>
                        <View style={styles.cardInfo}>
                          <View style={styles.cardTitleRow}>
                            <Text style={styles.cardType}>{capitalizeType(alert.type)}</Text>
                            <View style={[styles.cardSeverity, { backgroundColor: sv.bg }]}>
                              <View style={[styles.cardSeverityDot, { backgroundColor: sv.color }]} />
                              <Text style={[styles.cardSeverityText, { color: sv.color }]}>
                                {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.cardTitle} numberOfLines={1}>{alert.title}</Text>
                          <Text style={styles.cardDesc} numberOfLines={2}>{alert.message}</Text>
                        </View>
                      </View>
                      <View style={styles.cardFooter}>
                        <Ionicons name="time-outline" size={12} color="#94A3B8" />
                        <Text style={styles.cardMeta}>{formatTime(alert.startTime)}</Text>
                        <View style={styles.cardDot} />
                        <Ionicons name="location-outline" size={12} color="#94A3B8" />
                        <Text style={styles.cardMeta}>{formatDistance(alert.radius)}</Text>
                        <TouchableOpacity style={styles.cardDismissBtn} onPress={() => handleDismiss(alert.id)} activeOpacity={0.6}>
                          <Ionicons name="close" size={14} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: 200,
  },
  overlayPress: { flex: 1 },
  panel: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 201,
    backgroundColor: "#F7F9FC",
    shadowColor: "#1A2332",
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
  },
  headerGradient: {
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EDF2",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bellCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "600",
    marginTop: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipsContainer: {
    paddingHorizontal: 20,
    gap: 6,
    paddingVertical: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8EDF2",
    shadowColor: "#1A2332",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },
  chipLabelActive: {
    color: "#FFFFFF",
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cardList: {
    gap: 10,
    paddingTop: 16,
  },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3B82F6",
  },
  sectionLabelText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#1A2332",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardAccent: {
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardTop: {
    flexDirection: "row",
    gap: 12,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  cardType: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  cardSeverity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardSeverityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  cardSeverityText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 16,
  },
  cardDismissBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  cardDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 4,
  },
  cardMeta: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 120,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  emptySub: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },
});
