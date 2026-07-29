import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  ImageSourcePropType,
  type ImageStyle,
} from "react-native";
import MapView, { Marker, UrlTile, type Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { useLocation } from "@/hooks/useLocation";
import { Shadows } from "@/constants/theme";

const LAYERS = [
  { key: "earthquake", label: "EQ", color: "#EA580C", iconSource: require("../assets/icons/earthquake.png") },
  { key: "flood", label: "Flood", color: "#2563EB", iconSource: require("../assets/icons/flood.png") },
  { key: "wildfire", label: "Fire", color: "#DC2626", iconSource: require("../assets/icons/wildfire.png") },
  { key: "storm", label: "Storm", color: "#7C3AED", iconSource: require("../assets/icons/storms.png") },
  { key: "heatwave", label: "Heat", color: "#F59E0B", iconSource: require("../assets/icons/heatwaves.png") },
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
  latitude: 28.6139, longitude: 77.209, latitudeDelta: 0.12, longitudeDelta: 0.12,
};

export default function MapScreen() {
  const { colors, resolvedMode } = useTheme();
  const { location } = useLocation();
  const router = useRouter();
  const [activeLayers, setActiveLayers] = useState<string[]>(["earthquake", "flood", "wildfire"]);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [showLayers, setShowLayers] = useState(true);

  const region = useMemo((): Region => {
    if (location) {
      return { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.12, longitudeDelta: 0.12 };
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

  const getMarkerIconSource = useCallback((color: string): ImageSourcePropType => {
    if (color === "#EA580C") return require("../assets/icons/earthquake.png");
    if (color === "#2563EB") return require("../assets/icons/flood.png");
    if (color === "#DC2626") return require("../assets/icons/wildfire.png");
    if (color === "#7C3AED") return require("../assets/icons/storms.png");
    return require("../assets/icons/heatwaves.png");
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        mapType="none"
      >
        <UrlTile urlTemplate="https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png" maximumZ={20} />
        {filteredMarkers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.lat, longitude: marker.lon }}
            onPress={() => setSelectedMarker(selectedMarker === marker.id ? null : marker.id)}
          >
            <View style={[styles.markerPin, { backgroundColor: marker.color, borderColor: selectedMarker === marker.id ? "#FFFFFF" : marker.color }]}>
              <Image source={getMarkerIconSource(marker.color)} style={{ width: 14, height: 14, resizeMode: "contain" } as ImageStyle} />
            </View>
          </Marker>
        ))}
      </MapView>

      <LinearGradient
        colors={resolvedMode === "dark"
          ? (["rgba(15,23,42,0.92)", "rgba(15,23,42,0.6)", "transparent"] as const)
          : (["rgba(255,255,255,0.92)", "rgba(255,255,255,0.5)", "transparent"] as const)}
        style={styles.topBar}
      >
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-down" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.searchField, { backgroundColor: resolvedMode === "dark" ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.85)", borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search location..."
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <TouchableOpacity style={styles.circleBtn} onPress={() => setShowLayers((p) => !p)} activeOpacity={0.7}>
            <Ionicons name="layers" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {showLayers && (
        <View style={styles.layersWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.layersScroll}>
            {LAYERS.map((layer) => {
              const isActive = activeLayers.includes(layer.key);
              return (
                <TouchableOpacity
                  key={layer.key}
                  style={[styles.layerPill, {
                    backgroundColor: isActive ? layer.color : (resolvedMode === "dark" ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.85)"),
                    borderColor: isActive ? layer.color : colors.border,
                  }]}
                  onPress={() => toggleLayer(layer.key)}
                  activeOpacity={0.7}
                >
                  <Image source={layer.iconSource} style={{ width: 14, height: 14, resizeMode: "contain", tintColor: isActive ? "#FFF" : undefined } as ImageStyle} />
                  <Text style={[styles.layerLabel, { color: isActive ? "#FFF" : colors.textSecondary }]}>{layer.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={[styles.alertBadge, { backgroundColor: resolvedMode === "dark" ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.9)" }]}>
        <Ionicons name="pulse" size={14} color="#F59E0B" />
        <Text style={[styles.alertBadgeText, { color: colors.text }]}>{filteredMarkers.length} active</Text>
      </View>

      {selected && (
        <View style={[styles.bottomSheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <View style={styles.sheetRow}>
            <View style={[styles.sheetIconBox, { backgroundColor: selected.color + "15" }]}>
              <Image source={getMarkerIconSource(selected.color)} style={{ width: 26, height: 26, resizeMode: "contain" } as ImageStyle} />
            </View>
            <View style={styles.sheetInfo}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{selected.title}</Text>
              <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>{selected.subtitle}</Text>
            </View>
            <TouchableOpacity style={[styles.sheetCloseBtn, { backgroundColor: colors.surfaceVariant }]} onPress={() => setSelectedMarker(null)}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.sheetActions}>
            <TouchableOpacity style={[styles.sheetAction, { backgroundColor: colors.primary + "12" }]}>
              <Ionicons name="navigate" size={16} color={colors.primary} />
              <Text style={[styles.sheetActionText, { color: colors.primary }]}>Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sheetAction, { backgroundColor: colors.primary + "12" }]}>
              <Ionicons name="share-social" size={16} color={colors.primary} />
              <Text style={[styles.sheetActionText, { color: colors.primary }]}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sheetAction, { backgroundColor: colors.primary + "12" }]}>
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
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.md,
  },
  searchField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    ...Shadows.sm,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "500" },
  layersWrap: {
    position: "absolute",
    top: 108,
    left: 0,
    right: 0,
  },
  layersScroll: { paddingHorizontal: 16, gap: 8 },
  layerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    ...Shadows.sm,
  },
  layerLabel: { fontSize: 12, fontWeight: "600" },
  alertBadge: {
    position: "absolute",
    top: 110,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    ...Shadows.sm,
  },
  alertBadgeText: { fontSize: 11, fontWeight: "700" },
  markerPin: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, ...Shadows.md,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 24, left: 16, right: 16,
    borderRadius: 24,
    paddingBottom: 16,
    ...Shadows.xl,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: "center", marginTop: 10, marginBottom: 12,
  },
  sheetRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, gap: 12,
  },
  sheetIconBox: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  sheetInfo: { flex: 1 },
  sheetTitle: { fontSize: 16, fontWeight: "700" },
  sheetSub: { fontSize: 12, marginTop: 2 },
  sheetCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  sheetActions: {
    flexDirection: "row", paddingHorizontal: 16, marginTop: 14, gap: 8,
  },
  sheetAction: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 11, borderRadius: 14,
  },
  sheetActionText: { fontSize: 12, fontWeight: "700" },
});
