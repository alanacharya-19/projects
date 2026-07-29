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
import { MOCK_FEED, type FeedItem } from "@/constants/mockData";
import { getSeverityColor, getDisasterEmoji, formatDate } from "@/utils/helpers";

const LAYERS = [
  { key: "earthquake", label: "EQ", color: "#EA580C", iconSource: require("../assets/icons/earthquake.png") },
  { key: "flood", label: "Flood", color: "#2563EB", iconSource: require("../assets/icons/flood.png") },
  { key: "wildfire", label: "Fire", color: "#DC2626", iconSource: require("../assets/icons/wildfire.png") },
  { key: "cyclone", label: "Storm", color: "#7C3AED", iconSource: require("../assets/icons/storms.png") },
  { key: "heatwave", label: "Heat", color: "#F59E0B", iconSource: require("../assets/icons/heatwaves.png") },
  { key: "tsunami", label: "Tsunami", color: "#0EA5E9", iconSource: require("../assets/icons/flood.png") },
  { key: "landslide", label: "Slide", color: "#A855F7", iconSource: require("../assets/icons/earthquake.png") },
];

const DEFAULT_REGION: Region = {
  latitude: 20, longitude: 0, latitudeDelta: 100, longitudeDelta: 100,
};

const ICON_MAP: Record<string, ImageSourcePropType> = {
  earthquake: require("../assets/icons/earthquake.png"),
  flood: require("../assets/icons/flood.png"),
  wildfire: require("../assets/icons/wildfire.png"),
  cyclone: require("../assets/icons/storms.png"),
  heatwave: require("../assets/icons/heatwaves.png"),
  tsunami: require("../assets/icons/flood.png"),
  landslide: require("../assets/icons/landslide.png"),
};

function getMarkerIcon(type: string): ImageSourcePropType {
  return ICON_MAP[type] || require("../assets/icons/alerts.png");
}

const DISASTER_COLORS_MAP: Record<string, string> = {
  earthquake: "#EA580C", flood: "#2563EB", wildfire: "#DC2626",
  cyclone: "#7C3AED", heatwave: "#F59E0B", tsunami: "#0EA5E9", landslide: "#A855F7",
};

export default function MapScreen() {
  const { colors, resolvedMode } = useTheme();
  const { location } = useLocation();
  const router = useRouter();
  const [activeLayers, setActiveLayers] = useState<string[]>(["earthquake", "flood", "wildfire", "cyclone", "heatwave", "tsunami", "landslide"]);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [showLayers, setShowLayers] = useState(true);
  const [showDisasters, setShowDisasters] = useState(true);

  const region = useMemo((): Region => {
    if (location) {
      return { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.12, longitudeDelta: 0.12 };
    }
    return DEFAULT_REGION;
  }, [location]);

  const filteredFeed = useMemo(() => {
    return MOCK_FEED.filter((item) => activeLayers.includes(item.type));
  }, [activeLayers]);

  const selected = useMemo(() => MOCK_FEED.find((m) => m.id === selectedMarker) ?? null, [selectedMarker]);

  const toggleLayer = useCallback((key: string) => {
    setActiveLayers((prev) => prev.includes(key) ? prev.filter((l) => l !== key) : [...prev, key]);
  }, []);

  const groupedByType = useMemo(() => {
    const groups: Record<string, FeedItem[]> = {};
    filteredFeed.forEach((item) => {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
    });
    return groups;
  }, [filteredFeed]);

  const isDark = resolvedMode === "dark";

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        mapType="none"
      >
        <UrlTile urlTemplate="https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png" maximumZ={20} />
        {location && (
          <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} anchor={{ x: 0.5, y: 0.5 }}>
            <Image source={require("../assets/icons/your-locations.png")} style={{ width: 32, height: 32 } as ImageStyle} />
          </Marker>
        )}
        {MOCK_FEED.map((item) => (
          <Marker
            key={item.id}
            coordinate={{ latitude: item.coordinates.latitude, longitude: item.coordinates.longitude }}
            onPress={() => setSelectedMarker(selectedMarker === item.id ? null : item.id)}
          >
            <Image source={getMarkerIcon(item.type)} style={{ width: 28, height: 28 } as ImageStyle} />
          </Marker>
        ))}
      </MapView>

      <LinearGradient
        colors={isDark
          ? (["rgba(15,23,42,0.92)", "rgba(15,23,42,0.6)", "transparent"] as const)
          : (["rgba(255,255,255,0.92)", "rgba(255,255,255,0.5)", "transparent"] as const)}
        style={styles.topBar}
      >
        <View style={styles.topRow}>
          <TouchableOpacity style={[styles.circleBtn, { backgroundColor: isDark ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.85)" }]} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-down" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.searchField, { backgroundColor: isDark ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.85)", borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search location..."
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <TouchableOpacity style={[styles.circleBtn, { backgroundColor: isDark ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.85)" }]} onPress={() => setShowLayers((p) => !p)} activeOpacity={0.7}>
            <Ionicons name="layers" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={[styles.alertBadge, { backgroundColor: isDark ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.9)" }]}>
        <Ionicons name="pulse" size={14} color="#F59E0B" />
        <Text style={[styles.alertBadgeText, { color: colors.text }]}>{filteredFeed.length} active</Text>
      </View>

      {showLayers && (
        <View style={[styles.bottomPanel, { backgroundColor: isDark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.92)" }]}>
          <View style={styles.bottomContent}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bottomScroll}>
              {LAYERS.map((layer) => {
                const isActive = activeLayers.includes(layer.key);
                return (
                  <TouchableOpacity
                    key={layer.key}
                    style={[styles.layerPill, {
                      backgroundColor: isActive ? layer.color : (isDark ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.85)"),
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

            <TouchableOpacity
              style={[styles.disastersToggle, { borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}
              onPress={() => setShowDisasters((p) => !p)}
              activeOpacity={0.8}
            >
              <Ionicons name="list" size={16} color={colors.primary} />
              <Text style={[styles.disastersToggleText, { color: colors.text }]}>Disasters</Text>
              <Ionicons name={showDisasters ? "chevron-down" : "chevron-up"} size={16} color={colors.textMuted} />
            </TouchableOpacity>

            {showDisasters && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.disastersScroll}
              >
                {Object.entries(groupedByType).map(([type, items]) => {
                  const color = DISASTER_COLORS_MAP[type] || "#6B7280";
                  return (
                    <TouchableOpacity key={type} style={[styles.disasterGroupCard, { borderLeftColor: color }]} activeOpacity={0.7}>
                      <View style={styles.disasterGroupHeader}>
                        <Text style={styles.disasterGroupEmoji}>{getDisasterEmoji(type as any)}</Text>
                        <Text style={[styles.disasterGroupType, { color: colors.text }]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                        <View style={[styles.disasterCount, { backgroundColor: color + "20" }]}>
                          <Text style={[styles.disasterCountText, { color }]}>{items.length}</Text>
                        </View>
                      </View>
                      <Text style={[styles.disasterGroupLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                        {items.map((i) => i.location.split(",")[0]).join(", ")}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      )}

      {selected && (
        <View style={[styles.bottomSheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <View style={styles.sheetRow}>
            <View style={[styles.sheetIconBox, { backgroundColor: (DISASTER_COLORS_MAP[selected.type] || "#6B7280") + "15" }]}>
              <Text style={styles.sheetEmoji}>{getDisasterEmoji(selected.type as any)}</Text>
            </View>
            <View style={styles.sheetInfo}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{selected.title}</Text>
              <Text style={[styles.sheetLocation, { color: colors.textSecondary }]}>{selected.location}</Text>
            </View>
            <TouchableOpacity style={[styles.sheetCloseBtn, { backgroundColor: colors.surfaceVariant }]} onPress={() => setSelectedMarker(null)}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.sheetDescription, { color: colors.textSecondary }]} numberOfLines={2}>{selected.description}</Text>
          <View style={styles.sheetMeta}>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(selected.severity) + "18" }]}>
              <Text style={[styles.severityText, { color: getSeverityColor(selected.severity) }]}>{selected.severity}</Text>
            </View>
            <Text style={[styles.sheetTime, { color: colors.textMuted }]}>{formatDate(selected.timestamp, "relative")}</Text>
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

  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Shadows.xl,
  },
  bottomContent: {
    paddingBottom: 24,
  },
  bottomScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingTop: 14,
    paddingBottom: 10,
  },
  disastersToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  disastersToggleText: { flex: 1, fontSize: 14, fontWeight: "700" },
  disastersScroll: { gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  disasterGroupCard: {
    width: 140,
    borderLeftWidth: 3,
    paddingLeft: 10,
  },
  disasterGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  disasterGroupEmoji: { fontSize: 18 },
  disasterGroupType: { fontSize: 13, fontWeight: "700", flex: 1 },
  disasterCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  disasterCountText: { fontSize: 11, fontWeight: "700" },
  disasterGroupLocation: { fontSize: 11, marginTop: 4 },
  bottomSheet: {
    position: "absolute",
    bottom: 180, left: 16, right: 16,
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
  sheetEmoji: { fontSize: 26 },
  sheetInfo: { flex: 1 },
  sheetTitle: { fontSize: 16, fontWeight: "700" },
  sheetLocation: { fontSize: 12, marginTop: 2 },
  sheetCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  sheetDescription: { fontSize: 13, paddingHorizontal: 16, marginTop: 8 },
  sheetMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  severityText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  sheetTime: { fontSize: 12, fontWeight: "500" },
  sheetActions: {
    flexDirection: "row", paddingHorizontal: 16, marginTop: 14, gap: 8,
  },
  sheetAction: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 11, borderRadius: 14,
  },
  sheetActionText: { fontSize: 12, fontWeight: "700" },
});
