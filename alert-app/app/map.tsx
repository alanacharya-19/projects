import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import MapView, { Marker, UrlTile, type Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";
import { useLocation } from "@/hooks/useLocation";
import { Shadows } from "@/constants/theme";


const LAYERS = [
  { key: "earthquake", label: "Earthquakes", color: "#EA580C", icon: "earth" as const },
  { key: "flood", label: "Floods", color: "#2563EB", icon: "water" as const },
  { key: "wildfire", label: "Wildfires", color: "#DC2626", icon: "flame" as const },
  { key: "storm", label: "Storms", color: "#7C3AED", icon: "thunderstorm" as const },
  { key: "heatwave", label: "Heatwaves", color: "#F59E0B", icon: "sunny" as const },
];

const MOCK_MARKERS = [
  { id: "1", lat: 28.62, lon: 77.21, color: "#EA580C", title: "Seismic Activity", subtitle: "M4.2 · 32km depth" },
  { id: "2", lat: 28.58, lon: 77.25, color: "#2563EB", title: "Flood Warning", subtitle: "River Yamuna rising" },
  { id: "3", lat: 28.70, lon: 77.15, color: "#DC2626", title: "Fire Hotspot", subtitle: "FRP: 45 MW" },
  { id: "4", lat: 28.55, lon: 77.30, color: "#F59E0B", title: "Heatwave Alert", subtitle: "Temp: 42°C" },
  { id: "5", lat: 28.65, lon: 77.18, color: "#7C3AED", title: "Storm Warning", subtitle: "Severe thunderstorm" },
  { id: "6", lat: 28.50, lon: 77.22, color: "#EA580C", title: "Tremor Detected", subtitle: "M3.1 · Shallow" },
  { id: "7", lat: 28.68, lon: 77.28, color: "#2563EB", title: "Flood Watch", subtitle: "Moderate risk" },
];

const DEFAULT_REGION: Region = {
  latitude: 28.6139,
  longitude: 77.209,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

export default function MapScreen() {
  const { colors, resolvedMode } = useTheme();
  const { location } = useLocation();
  const [activeLayers, setActiveLayers] = useState<string[]>(["earthquake", "flood", "wildfire"]);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  const region = useMemo((): Region => {
    if (location) {
      return { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.15, longitudeDelta: 0.15 };
    }
    return DEFAULT_REGION;
  }, [location]);

  const filteredMarkers = useMemo(() => {
    return MOCK_MARKERS.filter((m) => {
      if (activeLayers.includes("earthquake") && m.color === "#EA580C") return true;
      if (activeLayers.includes("flood") && m.color === "#2563EB") return true;
      if (activeLayers.includes("wildfire") && m.color === "#DC2626") return true;
      if (activeLayers.includes("storm") && m.color === "#7C3AED") return true;
      if (activeLayers.includes("heatwave") && m.color === "#F59E0B") return true;
      return false;
    });
  }, [activeLayers]);

  const selected = useMemo(() => MOCK_MARKERS.find((m) => m.id === selectedMarker) ?? null, [selectedMarker]);

  const toggleLayer = useCallback((key: string) => {
    setActiveLayers((prev) => prev.includes(key) ? prev.filter((l) => l !== key) : [...prev, key]);
  }, []);

  const getMarkerIcon = useCallback((color: string): keyof typeof Ionicons.glyphMap => {
    if (color === "#EA580C") return "earth";
    if (color === "#2563EB") return "water";
    if (color === "#DC2626") return "flame";
    if (color === "#7C3AED") return "thunderstorm";
    return "sunny";
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView
        style={styles.map}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        mapType="none"
      >
        <UrlTile
          urlTemplate="https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png"
          maximumZ={20}
        />
        {filteredMarkers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.lat, longitude: marker.lon }}
            onPress={() => setSelectedMarker(selectedMarker === marker.id ? null : marker.id)}
          >
            <View style={[styles.markerPin, { backgroundColor: marker.color, borderColor: selectedMarker === marker.id ? "#FFFFFF" : marker.color }]}>
              <Ionicons name={getMarkerIcon(marker.color)} size={14} color="#FFFFFF" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Floating Layer Chips */}
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
                      : (resolvedMode === "dark" ? "rgba(31,41,55,0.85)" : "rgba(255,255,255,0.85)"),
                    borderColor: isActive ? layer.color : (resolvedMode === "dark" ? "rgba(55,65,81,0.5)" : colors.border),
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

      {/* Floating Search Bar */}
      <LinearGradient
        colors={
          resolvedMode === "dark"
            ? (["rgba(31,41,55,0.9)", "rgba(17,24,39,0.8)"] as const)
            : (["rgba(255,255,255,0.9)", "rgba(255,255,255,0.6)"] as const)
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

      {/* Alert Count Badge */}
      <View style={[styles.alertBadge, { backgroundColor: resolvedMode === "dark" ? "rgba(17,24,39,0.85)" : "rgba(255,255,255,0.9)" }]}>
        <Ionicons name="warning" size={14} color="#F59E0B" />
        <Text style={[styles.alertBadgeText, { color: colors.text }]}>{filteredMarkers.length} active</Text>
      </View>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: resolvedMode === "dark" ? "rgba(17,24,39,0.85)" : "rgba(255,255,255,0.9)" }]}>
        {LAYERS.filter((l) => activeLayers.includes(l.key)).map((item) => (
          <View key={item.key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendLabel, { color: colors.text }]}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Bottom Sheet for Selected Marker */}
      {selected && (
        <View style={[styles.bottomSheet, { backgroundColor: colors.surface, ...Shadows.xl }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <View style={styles.sheetContent}>
            <View style={[styles.sheetIcon, { backgroundColor: selected.color + "15" }]}>
              <Ionicons name={getMarkerIcon(selected.color)} size={24} color={selected.color} />
            </View>
            <View style={styles.sheetInfo}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{selected.title}</Text>
              <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>{selected.subtitle}</Text>
            </View>
            <TouchableOpacity
              style={[styles.sheetClose, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => setSelectedMarker(null)}
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.sheetActions}>
            <TouchableOpacity style={[styles.sheetActionBtn, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="navigate" size={16} color={colors.primary} />
              <Text style={[styles.sheetActionText, { color: colors.primary }]}>Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sheetActionBtn, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="share-social" size={16} color={colors.primary} />
              <Text style={[styles.sheetActionText, { color: colors.primary }]}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sheetActionBtn, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="information-circle" size={16} color={colors.primary} />
              <Text style={[styles.sheetActionText, { color: colors.primary }]}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
  layersContainer: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
  },
  layersScroll: { paddingHorizontal: 16, gap: 8 },
  layerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    ...Shadows.sm,
  },
  layerDot: { width: 8, height: 8, borderRadius: 4 },
  layerText: { fontSize: 13, fontWeight: "600" },
  searchBar: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 10,
    ...Shadows.md,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "500" },
  searchMic: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  alertBadge: {
    position: "absolute",
    top: 60,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    ...Shadows.sm,
  },
  alertBadgeText: { fontSize: 12, fontWeight: "700" },
  legend: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    ...Shadows.sm,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, fontWeight: "600" },
  markerPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    ...Shadows.md,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    borderRadius: 20,
    paddingBottom: 16,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  sheetContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  sheetIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
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
  sheetActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  sheetActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sheetActionText: { fontSize: 12, fontWeight: "600" },
});
