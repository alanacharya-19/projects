import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";
import { Shadows, Gradients } from "@/constants/theme";
import GradientBackground from "@/components/GradientBackground";

const LAYERS = [
  { key: "earthquake", label: "Earthquakes", color: "#EA580C" },
  { key: "flood", label: "Floods", color: "#2563EB" },
  { key: "wildfire", label: "Wildfires", color: "#DC2626" },
  { key: "storm", label: "Storms", color: "#7C3AED" },
  { key: "heatwave", label: "Heatwaves", color: "#F59E0B" },
];

const MARKERS = [
  { id: "1", x: 0.25, y: 0.35, color: "#EA580C", size: 12 },
  { id: "2", x: 0.65, y: 0.55, color: "#2563EB", size: 16 },
  { id: "3", x: 0.45, y: 0.25, color: "#DC2626", size: 10 },
  { id: "4", x: 0.8, y: 0.4, color: "#F59E0B", size: 14 },
  { id: "5", x: 0.15, y: 0.7, color: "#7C3AED", size: 8 },
  { id: "6", x: 0.55, y: 0.75, color: "#EA580C", size: 11 },
  { id: "7", x: 0.35, y: 0.6, color: "#2563EB", size: 9 },
];

const LEGEND_ITEMS = [
  { label: "Earthquake", color: "#EA580C" },
  { label: "Flood", color: "#2563EB" },
  { label: "Wildfire", color: "#DC2626" },
  { label: "Storm", color: "#7C3AED" },
];

export default function MapScreen() {
  const { colors, resolvedMode } = useTheme();
  const [activeLayers, setActiveLayers] = useState<string[]>(["earthquake", "flood", "wildfire"]);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  const gradientColors = useMemo((): readonly [string, string, ...string[]] => {
    return resolvedMode === "dark" ? Gradients.homeDark : Gradients.home;
  }, [resolvedMode]);

  const toggleLayer = (key: string) => {
    setActiveLayers((prev) =>
      prev.includes(key) ? prev.filter((l) => l !== key) : [...prev, key]
    );
  };

  return (
    <GradientBackground colors={gradientColors}>
      {/* Map Area */}
      <View style={styles.mapContainer}>
        <LinearGradient
          colors={
            resolvedMode === "dark"
              ? (["#0F172A", "#1E293B", "#0F172A", "#1E3A5F"] as const)
              : (["#1a3a4a", "#2d5a5e", "#1a4a3a", "#2a4a5a"] as const)
          }
          style={styles.mapGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Grid lines */}
          <View style={styles.gridOverlay}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View
                key={`h-${i}`}
                style={[styles.gridLineH, { top: `${(i + 1) * 12.5}%` }]}
              />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <View
                key={`v-${i}`}
                style={[styles.gridLineV, { left: `${(i + 1) * 16.6}%` }]}
              />
            ))}
          </View>

          {/* Disaster Markers */}
          {MARKERS.filter((m) => activeLayers.some((l) => {
            if (l === "earthquake") return m.color === "#EA580C";
            if (l === "flood") return m.color === "#2563EB";
            if (l === "wildfire") return m.color === "#DC2626";
            if (l === "storm") return m.color === "#7C3AED";
            if (l === "heatwave") return m.color === "#F59E0B";
            return false;
          })).map((marker) => (
            <TouchableOpacity
              key={marker.id}
              style={[
                styles.marker,
                {
                  left: `${marker.x * 100}%`,
                  top: `${marker.y * 100}%`,
                  width: marker.size,
                  height: marker.size,
                  borderRadius: marker.size / 2,
                  backgroundColor: marker.color,
                  borderColor: selectedMarker === marker.id ? "#FFFFFF" : "transparent",
                  borderWidth: selectedMarker === marker.id ? 3 : 0,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => setSelectedMarker(selectedMarker === marker.id ? null : marker.id)}
            />
          ))}

          {/* Current Location Pulse */}
          <View style={styles.locationIndicator}>
            <View style={[styles.locationPulse, { backgroundColor: colors.primary + "30" }]} />
            <View style={[styles.locationDot, { backgroundColor: colors.primary }]} />
          </View>

          {/* Legend */}
          <View style={[styles.legend, { backgroundColor: resolvedMode === "dark" ? "rgba(17,24,39,0.8)" : "rgba(0,0,0,0.55)" }]}>
            {LEGEND_ITEMS.map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Stats Bar */}
          <View style={[styles.statsBar, { backgroundColor: resolvedMode === "dark" ? "rgba(17,24,39,0.8)" : "rgba(0,0,0,0.55)" }]}>
            <Ionicons name="warning" size={14} color="#F59E0B" />
            <Text style={styles.statsText}>{MARKERS.length} active alerts</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Floating Search Bar */}
      <LinearGradient
        colors={
          resolvedMode === "dark"
            ? (["rgba(31,41,55,0.85)", "rgba(17,24,39,0.75)"] as const)
            : (["rgba(255,255,255,0.85)", "rgba(255,255,255,0.55)"] as const)
        }
        style={styles.searchBar}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search location..."
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity style={[styles.searchMic, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons name="mic" size={18} color={colors.primary} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Layer Toggles */}
      <View style={styles.layersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.layersScroll}
        >
          {LAYERS.map((layer) => {
            const isActive = activeLayers.includes(layer.key);
            return (
              <TouchableOpacity
                key={layer.key}
                style={[
                  styles.layerChip,
                  {
                    backgroundColor: isActive
                      ? (resolvedMode === "dark" ? layer.color + "25" : layer.color + "18")
                      : (resolvedMode === "dark" ? "rgba(31,41,55,0.7)" : "rgba(255,255,255,0.7)"),
                    borderColor: isActive ? layer.color : (resolvedMode === "dark" ? "rgba(31,41,55,0.5)" : colors.border),
                  },
                ]}
                onPress={() => toggleLayer(layer.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.layerDot, { backgroundColor: layer.color, opacity: isActive ? 1 : 0.4 }]} />
                <Text style={[styles.layerText, { color: isActive ? layer.color : colors.textMuted }]}>
                  {layer.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Bottom Sheet */}
      {selectedMarker && (
        <View style={[styles.bottomSheet, { backgroundColor: colors.surface, ...Shadows.xl }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <View style={styles.sheetContent}>
            <LinearGradient
              colors={["#EA580C", "#F97316"] as const}
              style={styles.sheetIcon}
            >
              <Ionicons name="earth" size={22} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.sheetInfo}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Seismic Activity Detected</Text>
              <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>4.2 magnitude · 32 km depth</Text>
            </View>
            <TouchableOpacity
              style={[styles.sheetClose, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => setSelectedMarker(null)}
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 24,
    overflow: "hidden",
    ...Shadows.lg,
  },
  mapGradient: {
    flex: 1,
    position: "relative",
  },
  gridOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  marker: {
    position: "absolute",
    opacity: 0.9,
  },
  locationIndicator: {
    position: "absolute",
    bottom: "45%",
    left: "50%",
    marginLeft: -12,
    marginTop: -12,
  },
  locationPulse: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    top: -6,
    left: -6,
  },
  locationDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  legend: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, fontWeight: "600", color: "#FFFFFF" },
  statsBar: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statsText: { fontSize: 12, fontWeight: "600", color: "#FFFFFF" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: -26,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    gap: 10,
    zIndex: 10,
    ...Shadows.md,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "500" },
  searchMic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  layersContainer: { marginTop: 16 },
  layersScroll: { paddingHorizontal: 20, gap: 10 },
  layerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  layerDot: { width: 8, height: 8, borderRadius: 4 },
  layerText: { fontSize: 13, fontWeight: "600" },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 14,
  },
  sheetContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
  },
  sheetIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetInfo: { flex: 1 },
  sheetTitle: { fontSize: 15, fontWeight: "700" },
  sheetSubtitle: { fontSize: 12, marginTop: 3 },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
